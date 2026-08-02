import { describe, it, expect, vi } from 'vitest';
import { isPlatformFailure } from '../shared/index.js';
import type { ProbeResult, ProbeSession } from '../device/index.js';
import type { EvidenceCollector, ScenarioInfo, StepEvent } from '../evidence/index.js';
import type { TestCaseResult, TestCaseStatus } from '../store/index.js';
import type { RunSession } from './run-session.js';
import {
  assertCapabilityEnv,
  createCucumberHooks,
  missingCapabilityEnv,
  requiredCapabilityEnvKeys,
  type CucumberHooksDeps,
} from './cucumber-hooks.js';

type ProbeFn = (session: ProbeSession) => Promise<ProbeResult>;

// --- Capability environment guard --------------------------------------------------------------

describe('capability env guard', () => {
  const simEnv = {
    AIMTAP_DEVICE_NAME: 'iPhone 15',
    AIMTAP_PLATFORM_VERSION: '17.5',
    AIMTAP_APP_PATH: '/builds/demo.app',
  } as NodeJS.ProcessEnv;

  it('requires udid and signing identity only for a real device', () => {
    expect(requiredCapabilityEnvKeys('sim')).toEqual([
      'AIMTAP_DEVICE_NAME',
      'AIMTAP_PLATFORM_VERSION',
      'AIMTAP_APP_PATH',
    ]);
    expect(requiredCapabilityEnvKeys('device')).toContain('AIMTAP_UDID');
    expect(requiredCapabilityEnvKeys('device')).toContain('AIMTAP_XCODE_ORG_ID');
  });

  it('reports blank and unset variables as missing', () => {
    expect(
      missingCapabilityEnv('sim', { ...simEnv, AIMTAP_APP_PATH: '  ' } as NodeJS.ProcessEnv),
    ).toEqual(['AIMTAP_APP_PATH']);
    expect(missingCapabilityEnv('sim', {} as NodeJS.ProcessEnv)).toHaveLength(3);
  });

  it('passes when every required variable is present', () => {
    expect(() => assertCapabilityEnv('sim', simEnv)).not.toThrow();
  });

  it('throws a PlatformFailure naming every missing variable', () => {
    try {
      assertCapabilityEnv('device', simEnv);
      expect.unreachable('missing device variables must throw');
    } catch (error) {
      expect(isPlatformFailure(error)).toBe(true);
      const message = (error as Error).message;
      expect(message).toContain('AIMTAP_UDID');
      expect(message).toContain('AIMTAP_XCODE_ORG_ID');
    }
  });
});

// --- Lifecycle handlers ------------------------------------------------------------------------

function fakeSession(overrides: Partial<RunSession> = {}): RunSession & {
  stops: string[];
  skips: string[];
  starts: string[];
  finishes: Array<{ testCase: string; status: TestCaseStatus }>;
} {
  const stops: string[] = [];
  const skips: string[] = [];
  const starts: string[] = [];
  const finishes: Array<{ testCase: string; status: TestCaseStatus }> = [];
  let stopped = false;
  return {
    runId: 'run-1',
    start: vi.fn(),
    finalize: vi.fn(),
    isStopped: () => stopped,
    stopReason: () => null,
    requestStop: (reason) => {
      stopped = true;
      stops.push(reason);
    },
    testCaseStarted: (_f, tc) => starts.push(tc),
    testCaseFinished: (_f, tc, status) => finishes.push({ testCase: tc, status }),
    testCaseSkipped: (_f, tc) => skips.push(tc),
    stops,
    skips,
    starts,
    finishes,
    ...overrides,
  };
}

function fakeEvidence(status: TestCaseStatus = 'passed'): EvidenceCollector & {
  steps: StepEvent[];
  scenarios: ScenarioInfo[];
  screens: string[];
} {
  const steps: StepEvent[] = [];
  const scenarios: ScenarioInfo[] = [];
  const screens: string[] = [];
  return {
    steps,
    scenarios,
    screens,
    setCurrentScreen: (name) => screens.push(name),
    onStepEnd: (step) => steps.push(step),
    onScenarioEnd: (info) => {
      scenarios.push(info);
      return Promise.resolve({ status } as TestCaseResult);
    },
  };
}

function build(deps: Partial<CucumberHooksDeps> = {}) {
  const session = deps.session ?? fakeSession();
  const evidence = deps.evidence ?? fakeEvidence();
  const probeSession: ProbeSession = { execute: vi.fn().mockResolvedValue({}) };
  const registered: Array<(name: string) => void> = [];
  const probe: ProbeFn = deps.probe ?? (() => Promise.resolve<ProbeResult>('ready'));
  const hooks = createCucumberHooks({
    session,
    evidence,
    getProbeSession: () => probeSession,
    capabilityKind: 'sim',
    env: {
      AIMTAP_DEVICE_NAME: 'iPhone 15',
      AIMTAP_PLATFORM_VERSION: '17.5',
      AIMTAP_APP_PATH: '/builds/demo.app',
    } as NodeJS.ProcessEnv,
    probe,
    registerScreenSink: (sink) => registered.push(sink),
    now: () => 1000,
    ...deps,
  });
  return { hooks, session: session as ReturnType<typeof fakeSession>, evidence, registered };
}

const scenario = { test_feature: 'Login', test_case: 'valid credentials' };

describe('onSessionStart', () => {
  it('guards the environment and wires the screen sink to the evidence collector', () => {
    const evidence = fakeEvidence();
    const { hooks, registered } = build({ evidence });

    hooks.onSessionStart();

    expect(registered).toHaveLength(1);
    const [sink] = registered;
    sink?.('Home');
    expect(evidence.screens).toEqual(['Home']);
  });

  it('throws before wiring anything when a capability variable is missing', () => {
    const { hooks, registered } = build({ env: {} as NodeJS.ProcessEnv });

    expect(() => hooks.onSessionStart()).toThrow();
    expect(registered).toHaveLength(0);
  });
});

describe('beforeScenario', () => {
  it('runs the test case when the probe is ready', async () => {
    const probe = vi.fn<ProbeFn>().mockResolvedValue('ready');
    const { hooks, session } = build({ probe });

    await hooks.beforeScenario(scenario);

    expect(probe).toHaveBeenCalledOnce();
    expect(session.starts).toEqual(['valid credentials']);
    expect(session.skips).toHaveLength(0);
  });

  it('stops the run and skips the test case when the probe is unavailable', async () => {
    const probe = vi.fn<ProbeFn>().mockResolvedValue('unavailable');
    const { hooks, session } = build({ probe });

    await hooks.beforeScenario(scenario);

    expect(session.stops).toEqual(['device_unavailable']);
    expect(session.skips).toEqual(['valid credentials']);
    expect(session.starts).toHaveLength(0);
  });

  it('skips without probing once the stop flag is set', async () => {
    const probe = vi.fn<ProbeFn>().mockResolvedValue('ready');
    const session = fakeSession();
    session.requestStop('cancelled_by_qc');
    const { hooks } = build({ session, probe });

    await hooks.beforeScenario(scenario);

    expect(probe).not.toHaveBeenCalled();
    expect(session.skips).toEqual(['valid credentials']);
  });
});

describe('onStepEnd / afterScenario', () => {
  it('forwards steps and closes the scenario with the evidence result status', async () => {
    const evidence = fakeEvidence('failed');
    const { hooks, session } = build({ evidence });

    await hooks.beforeScenario(scenario);
    hooks.onStepEnd({ order: 1, text: 'I log in', result: 'failed', duration_ms: 12 });
    await hooks.afterScenario(scenario);

    expect(evidence.steps).toHaveLength(1);
    expect(evidence.scenarios[0]).toMatchObject({
      test_feature: 'Login',
      test_case: 'valid credentials',
    });
    expect(session.finishes).toEqual([{ testCase: 'valid credentials', status: 'failed' }]);
    // A failed test case is a normal result and never stops the run (BR-002).
    expect(session.stops).toHaveLength(0);
  });

  it('drops step and scenario events for a skipped test case (no record)', async () => {
    const probe = vi.fn<ProbeFn>().mockResolvedValue('unavailable');
    const evidence = fakeEvidence();
    const { hooks, session } = build({ probe, evidence });

    await hooks.beforeScenario(scenario);
    hooks.onStepEnd({ order: 1, text: 'I log in', result: 'passed', duration_ms: 5 });
    await hooks.afterScenario(scenario);

    expect(evidence.steps).toHaveLength(0);
    expect(evidence.scenarios).toHaveLength(0);
    expect(session.finishes).toHaveLength(0);
  });
});
