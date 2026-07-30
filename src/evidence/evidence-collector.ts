import type { RunRepository, StepLog, TestCaseResult, TestCaseStatus } from '../store/index.js';
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

export interface EvidenceCollectorDeps {
  repository: Pick<RunRepository, 'saveTestCaseResult'>;
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

  function reset(): void {
    log = createExecutionLog();
    currentScreen = null;
    failureScreen = null;
    classification = null;
    pending.clear();
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

      repository.saveTestCaseResult(result, steps);
      reset();
      return result;
    },
  };
}
