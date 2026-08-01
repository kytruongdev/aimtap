import { PlatformFailure } from '../shared/index.js';
import { probeDuringRun, type ProbeResult, type ProbeSession } from '../device/index.js';
import type { EvidenceCollector, StepEvent } from '../evidence/index.js';
import { registerScreenSink as defaultRegisterScreenSink, type ScreenSink } from '../locator/index.js';
import type { CapabilityKind } from './wdio-service.js';
import type { RunSession } from './run-session.js';

// TICKET-018: the Cucumber lifecycle handlers the platform reacts through (ADR-013). WebdriverIO/
// Cucumber owns the loop over test cases; these handlers probe the device, decide skips, feed step
// and scenario events to the Evidence Collector, and inject the screen-name sink into the Locator
// Resolver at session open (ADR-014, one-way Test Runner -> Locator).

// --- Capability environment guard (open-items 2026-07-30) --------------------------------------
// The per-run capability values (`AIMTAP_*`) that iosCapabilities (TICKET-017) reads are populated by
// the CLI at run launch (US-4.3) from the AppConfig, the validated DeviceContext (FR-DEV-02) and the
// signing secrets (US-1.2). This guard only verifies they are present before the Appium session
// opens, so a missing value fails the run early with a readable PlatformFailure instead of an opaque
// Appium protocol error (ADR-009). US-3.3 keeps defaulting missing env to empty strings at its layer
// (ADR-014); this is where the absence is caught.

const BASE_CAPABILITY_KEYS = [
  'AIMTAP_DEVICE_NAME',
  'AIMTAP_PLATFORM_VERSION',
  'AIMTAP_APP_PATH',
] as const;

// A real device also needs its udid and code-signing identity (iosCapabilities device branch).
const DEVICE_ONLY_CAPABILITY_KEYS = ['AIMTAP_UDID', 'AIMTAP_XCODE_ORG_ID'] as const;

export function requiredCapabilityEnvKeys(kind: CapabilityKind): string[] {
  return kind === 'device'
    ? [...BASE_CAPABILITY_KEYS, ...DEVICE_ONLY_CAPABILITY_KEYS]
    : [...BASE_CAPABILITY_KEYS];
}

/** The required keys that are unset or blank in the given environment. */
export function missingCapabilityEnv(
  kind: CapabilityKind,
  env: NodeJS.ProcessEnv = process.env,
): string[] {
  return requiredCapabilityEnvKeys(kind).filter((key) => (env[key] ?? '').trim() === '');
}

/** Throw a PlatformFailure naming every missing capability variable, before the session opens. */
export function assertCapabilityEnv(
  kind: CapabilityKind,
  env: NodeJS.ProcessEnv = process.env,
): void {
  const missing = missingCapabilityEnv(kind, env);
  if (missing.length > 0) {
    throw new PlatformFailure(
      `Missing required run environment before opening the Appium session: ${missing.join(', ')}`,
      { capability_kind: kind, missing },
    );
  }
}

// --- Lifecycle handlers ------------------------------------------------------------------------

/** Test case identity carried by the Cucumber scenario, adapted by wdio-service. */
export interface ScenarioRef {
  test_feature: string;
  test_case: string;
}

/** A finished step, adapted from the Cucumber afterStep payload. */
export interface StepEndRef {
  order: number;
  text: string;
  result: 'passed' | 'failed';
  duration_ms: number;
  error?: unknown;
  capture?: boolean;
}

export interface CucumberHooksDeps {
  session: RunSession;
  evidence: EvidenceCollector;
  /** The live WebdriverIO session the probe runs against; injected so hooks are testable. */
  getProbeSession: () => ProbeSession;
  capabilityKind: CapabilityKind;
  env?: NodeJS.ProcessEnv;
  probe?: (session: ProbeSession) => Promise<ProbeResult>;
  registerScreenSink?: (sink: ScreenSink) => void;
  now?: () => number;
}

export interface CucumberHooks {
  /** At session open: guard the run environment and wire the screen-name sink into the Locator. */
  onSessionStart(): void;
  beforeScenario(scenario: ScenarioRef): Promise<void>;
  onStepEnd(step: StepEndRef): void;
  afterScenario(scenario: ScenarioRef): Promise<void>;
}

export function createCucumberHooks(deps: CucumberHooksDeps): CucumberHooks {
  const { session, evidence, getProbeSession, capabilityKind } = deps;
  const env = deps.env ?? process.env;
  const probe = deps.probe ?? probeDuringRun;
  const register = deps.registerScreenSink ?? defaultRegisterScreenSink;
  const now = deps.now ?? (() => Date.now());

  // Per-scenario state. When a scenario is skipped, step and scenario events are dropped so no result
  // record is produced for it (BR-012); whether Cucumber physically runs the steps is irrelevant.
  let skipped = false;
  let startedAtIso = '';
  let scenarioStartMs = 0;

  return {
    onSessionStart() {
      assertCapabilityEnv(capabilityKind, env);
      register((name) => evidence.setCurrentScreen(name));
    },

    async beforeScenario(scenario) {
      if (session.isStopped()) {
        skipped = true;
        session.testCaseSkipped(scenario.test_feature, scenario.test_case);
        return;
      }

      const result = await probe(getProbeSession());
      if (result === 'unavailable') {
        // The device is a shared resource every test case depends on: stop the run (BR-018), but a
        // failing test case never stops it (BR-002) - that decision lives in afterScenario, not here.
        session.requestStop('device_unavailable');
        skipped = true;
        session.testCaseSkipped(scenario.test_feature, scenario.test_case);
        return;
      }

      skipped = false;
      scenarioStartMs = now();
      startedAtIso = new Date(scenarioStartMs).toISOString();
      session.testCaseStarted(scenario.test_feature, scenario.test_case);
    },

    onStepEnd(step) {
      if (skipped) return;
      const event: StepEvent = {
        order: step.order,
        text: step.text,
        result: step.result,
        duration_ms: step.duration_ms,
        error: step.error,
        capture: step.capture,
      };
      evidence.onStepEnd(event);
    },

    async afterScenario(scenario) {
      if (skipped) return;
      const result = await evidence.onScenarioEnd({
        test_feature: scenario.test_feature,
        test_case: scenario.test_case,
        started_at: startedAtIso,
        duration_ms: now() - scenarioStartMs,
      });
      // A failed test case is a normal result: record it and carry on, never stop the run (BR-002).
      session.testCaseFinished(scenario.test_feature, scenario.test_case, result.status);
    },
  };
}
