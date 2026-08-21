import type {
  HealEvent,
  RunRepository,
  StepLog,
  TestCaseResult,
  TestCaseStatus,
} from '../store/index.js';
import { createExecutionLog } from './execution-log.js';
import { classifyFailure, type Classification } from './failure-classifier.js';
import {
  captureScreenshot,
  type Screenshotter,
  type ScreenshotResult,
} from './screenshot-writer.js';

// Assembles the execution evidence of each test case and pushes the record to the Result Store
// (interface-spec.md §Evidence Collector, sequence-diagrams.md §2). One collector per run; its
// per-scenario state (log, pending screenshots, screen at failure, classification) resets after each
// onScenarioEnd. Evidence is auxiliary: a capture failure sets evidence_missing and never changes the
// test case status (BR-004).
//
// onStepEnd stays synchronous and only kicks off a screenshot (off the step's wait path, NFR-10);
// onScenarioEnd awaits those pending screenshots so screenshot_path is present before the one
// transaction that writes the TestCaseResult and its StepLog rows (ADR-016 async signature, approved
// in open-items).

/** A step event from the Test Runner (WDIO/Cucumber afterStep). */
export interface StepEvent {
  /** 1-based position of the step within the test case. */
  order: number;
  /** The behaviour description of the step, kept verbatim (BR-010). */
  text: string;
  result: 'passed' | 'failed';
  duration_ms: number;
  /** The original error at a failing step; classified into failure_type (BR-014). */
  error?: unknown;
  /** True for a step explicitly marked to be screenshotted even when it passes (BR-003). */
  capture?: boolean;
}

/** Test case identity and timing, known by the Test Runner at afterScenario. */
export interface ScenarioInfo {
  test_feature: string;
  test_case: string;
  started_at: string;
  duration_ms: number;
}

/**
 * What the Locator Resolver knows about a heal at find time (US-7.2 HealSignal). Declared here with
 * Evidence's own type — not imported from `locator` — so there is no cross edge; the assembly layer
 * (US-7.5) bridges `registerHealSink((s) => collector.onHeal(s))` and TypeScript's structural typing
 * keeps the two shapes in step.
 */
export interface HealSignalInput {
  screen: string;
  expectedLocator: string;
  usedLocator: string;
  occurredAt: string;
}

export interface EvidenceCollectorDeps {
  repository: Pick<RunRepository, 'saveTestCaseResult' | 'saveHealEvents' | 'transaction'>;
  /** The screenshot source; the WebdriverIO browser in a run, a fake in unit tests. */
  screenshotter: Screenshotter;
  appId: string;
  runId: string;
  /** Generates the ids stamped on TestCaseResult and StepLog rows. */
  newId: () => string;
  /** Root output dir passed through to the screenshot writer; defaults to <cwd>/output. */
  outputDir?: string;
}

export interface EvidenceCollector {
  onStepEnd(step: StepEvent): void;
  onScenarioEnd(info: ScenarioInfo): Promise<TestCaseResult>;
  setCurrentScreen(name: string): void;
  /** A self-heal happened mid-step: capture the element and buffer it until the step order is known. */
  onHeal(signal: HealSignalInput): void;
}

export function createEvidenceCollector(deps: EvidenceCollectorDeps): EvidenceCollector {
  const { repository, screenshotter, appId, runId, newId, outputDir } = deps;

  let log = createExecutionLog();
  let currentScreen: string | null = null;
  let failureScreen: string | null = null;
  let classification: Classification | null = null;
  const pending = new Map<number, Promise<ScreenshotResult>>();
  // Run-wide, never reset: keeps screenshot file names unique across scenarios in the same run dir.
  let shotSeq = 0;

  // Heals that happened during the current step, awaiting the step order (assigned at onStepEnd).
  let pendingHeals: Array<{ signal: HealSignalInput; screenshot: Promise<ScreenshotResult> }> = [];
  // Heals with a resolved step order, collected across the scenario.
  let scenarioHeals: Array<{
    signal: HealSignalInput;
    step_order: number;
    screenshot: Promise<ScreenshotResult>;
  }> = [];
  let lastStepOrder = 0;

  function reset(): void {
    log = createExecutionLog();
    currentScreen = null;
    failureScreen = null;
    classification = null;
    pending.clear();
    pendingHeals = [];
    scenarioHeals = [];
    lastStepOrder = 0;
  }

  return {
    setCurrentScreen(name) {
      currentScreen = name;
    },

    onStepEnd(step) {
      const failed = step.result === 'failed';

      if (failed) {
        classification = classifyFailure(step.error);
        failureScreen = currentScreen;
      }

      log.record({
        step_text: step.text,
        result: step.result,
        duration_ms: step.duration_ms,
        error_message: failed ? (classification?.error_message ?? null) : null,
      });

      if (failed || step.capture === true) {
        const name = `${failed ? 'fail' : 'mark'}-step-${step.order}-${shotSeq++}`;
        pending.set(step.order, captureScreenshot(screenshotter, { appId, runId, name, outputDir }));
      }

      // Heals buffered since the previous step's end happened during this step, so stamp this step's
      // order on them (the heal occurs mid-step, before onStepEnd — using "current step" would be off
      // by one). Clear the buffer for the next step.
      lastStepOrder = step.order;
      for (const heal of pendingHeals) {
        scenarioHeals.push({ signal: heal.signal, step_order: step.order, screenshot: heal.screenshot });
      }
      pendingHeals = [];
    },

    onHeal(signal) {
      // Capture the healed element off the step's wait path (NFR-10): keep the promise, do not await.
      const screenshot = captureScreenshot(screenshotter, {
        appId,
        runId,
        name: `heal-${shotSeq++}`,
        outputDir,
      });
      pendingHeals.push({ signal, screenshot });
    },

    async onScenarioEnd(info) {
      const shots = new Map<number, ScreenshotResult>();
      for (const [order, promise] of pending) shots.set(order, await promise);
      const evidenceMissing = [...shots.values()].some((shot) => shot.missing);

      const records = log.steps();
      const failed = records.some((step) => step.result === 'failed');
      const status: TestCaseStatus = failed ? 'failed' : 'passed';

      const result: TestCaseResult = {
        id: newId(),
        run_id: runId,
        app_id: appId,
        test_feature: info.test_feature,
        test_case: info.test_case,
        status,
        started_at: info.started_at,
        duration_ms: info.duration_ms,
        screen: failed ? failureScreen : null,
        failure_type: failed ? (classification?.failure_type ?? null) : null,
        error_message: failed ? (classification?.error_message ?? null) : null,
        evidence_missing: evidenceMissing ? 1 : 0,
      };

      const steps: StepLog[] = records.map((record) => ({
        id: newId(),
        test_case_result_id: result.id,
        step_order: record.step_order,
        step_text: record.step_text,
        result: record.result,
        duration_ms: record.duration_ms,
        error_message: record.error_message,
        screenshot_path: shots.get(record.step_order)?.path ?? null,
      }));

      // Any heal buffered but never stamped (defensive) is attributed to the last step seen.
      for (const heal of pendingHeals) {
        scenarioHeals.push({ signal: heal.signal, step_order: lastStepOrder, screenshot: heal.screenshot });
      }
      pendingHeals = [];

      // Enrich each HealSignal into a full HealEvent: Evidence owns step_order, test_case_result_id
      // and the element screenshot (BR-205/206). A capture failure leaves screenshot_path null and
      // never changes the outcome (BR-004).
      const healEvents: HealEvent[] = [];
      for (const heal of scenarioHeals) {
        const shot = await heal.screenshot;
        healEvents.push({
          id: newId(),
          test_case_result_id: result.id,
          step_order: heal.step_order,
          screen: heal.signal.screen,
          expected_locator: heal.signal.expectedLocator,
          used_locator: heal.signal.usedLocator,
          screenshot_path: shot.path,
          occurred_at: heal.signal.occurredAt,
        });
      }

      // One transaction: the test case, its steps and its heal events commit together (BR-207).
      repository.transaction(() => {
        repository.saveTestCaseResult(result, steps);
        if (healEvents.length > 0) repository.saveHealEvents(healEvents);
      });
      reset();
      return result;
    },
  };
}
