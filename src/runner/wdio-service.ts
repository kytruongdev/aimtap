import { getWaitPolicy, logger, type WaitPolicy } from '../shared/index.js';
import type { CucumberHooks, ScenarioRef, StepEndRef } from './cucumber-hooks.js';

// TICKET-017: WDIO service + the WebdriverIO/Cucumber config building blocks (ADR-001, ADR-007,
// ADR-013). The platform attaches to the WebdriverIO testrunner as a service; WebdriverIO/Cucumber
// own the loop over test cases and the platform reacts through lifecycle hooks (ADR-013). The Appium
// session is opened once per run by the testrunner and reused across test cases (north-star §2.2).
//
// TICKET-018 (US-3.4) adds the Cucumber lifecycle handlers in cucumber-hooks.ts; AimtapService below
// registers them with the testrunner and adapts the raw WDIO/Cucumber payloads to the handler refs.
// The pure config helpers stay here so they can be unit-tested without a device (conventions §3.1).
// All identifiers are English (BC-10).

export type CapabilityKind = 'sim' | 'device';

export interface CucumberOptions {
  require: string[];
  /** Step timeout, taken from the shared wait policy - never hard-coded (ADR-015). */
  timeout: number;
  /** false: an undefined step stops the run with the list of missing sentences (north-star §2.3). */
  ignoreUndefinedDefinitions: boolean;
  failAmbiguousDefinitions: boolean;
  backtrace: boolean;
}

// A behaviour sentence with no step definition must stop the run and list the missing sentences,
// never be skipped silently (north-star §2.3). The step timeout comes from the shared wait policy so
// waits are configured in one place (ADR-015), not scattered across configs.
export function buildCucumberOpts(
  require: string[],
  policy: WaitPolicy = getWaitPolicy(),
): CucumberOptions {
  return {
    require,
    timeout: policy.timeoutMs,
    ignoreUndefinedDefinitions: false,
    failAmbiguousDefinitions: true,
    backtrace: true,
  };
}

// iOS/XCUITest capabilities. The fixed parts (platform, automation engine) live here; the per-run
// values (target device, app build, code signing, Appium endpoint) are injected via environment
// variables at run start, so US-3.3 carries no build-time dependency on the Device & Build Manager or
// the CLI. A simulator is addressed by name + version; a real device also needs its udid and signing
// identity. Presence of these variables is guarded before the session opens (cucumber-hooks.ts).
export interface IosCapability {
  platformName: 'iOS';
  'appium:automationName': 'XCUITest';
  'appium:deviceName': string;
  'appium:platformVersion': string;
  'appium:app': string;
  'appium:udid'?: string;
  'appium:xcodeOrgId'?: string;
  'appium:xcodeSigningId'?: string;
}

export function iosCapabilities(
  kind: CapabilityKind,
  env: NodeJS.ProcessEnv = process.env,
): IosCapability {
  const base: IosCapability = {
    platformName: 'iOS',
    'appium:automationName': 'XCUITest',
    'appium:deviceName': env.AIMTAP_DEVICE_NAME ?? '',
    'appium:platformVersion': env.AIMTAP_PLATFORM_VERSION ?? '',
    'appium:app': env.AIMTAP_APP_PATH ?? '',
  };

  if (kind === 'device') {
    return {
      ...base,
      'appium:udid': env.AIMTAP_UDID ?? '',
      'appium:xcodeOrgId': env.AIMTAP_XCODE_ORG_ID ?? '',
      'appium:xcodeSigningId': env.AIMTAP_XCODE_SIGNING_ID ?? 'iPhone Developer',
    };
  }

  return base;
}

// --- WDIO/Cucumber payload adapters ------------------------------------------------------------
// Map the raw Cucumber hook payloads to the handler refs. Field access follows the WDIO/Cucumber
// world and step shapes; the exact payload wiring is verified when the testrunner runs (ADR-013).

/** The Cucumber world exposes the running scenario (pickle) and its feature (gherkin document). */
interface CucumberWorld {
  pickle?: { name?: string };
  gherkinDocument?: { feature?: { name?: string } };
}

interface CucumberStep {
  text?: string;
}

interface StepResultPayload {
  passed?: boolean;
  duration?: number;
  error?: unknown;
}

export function scenarioRef(world: CucumberWorld): ScenarioRef {
  return {
    test_feature: world.gherkinDocument?.feature?.name ?? 'Unknown feature',
    test_case: world.pickle?.name ?? 'Unknown test case',
  };
}

export function stepEndRef(
  order: number,
  step: CucumberStep,
  result: StepResultPayload,
): StepEndRef {
  return {
    order,
    text: step.text ?? '',
    result: result.passed === true ? 'passed' : 'failed',
    duration_ms: typeof result.duration === 'number' ? result.duration : 0,
    error: result.error,
  };
}

// WDIO service: its presence lets the testrunner load the platform. A single Appium session per run
// is the testrunner default for one worker (AS-P1-01). The Cucumber lifecycle handlers are injected
// by the run assembly (US-4.3 launch wiring); the service adapts the WDIO payloads and delegates.
export class AimtapService {
  private stepOrder = 0;

  constructor(private readonly hooks?: CucumberHooks) {}

  before(): void {
    logger.info('appium session opened for the run');
    this.hooks?.onSessionStart();
  }

  async beforeScenario(world: CucumberWorld): Promise<void> {
    this.stepOrder = 0;
    await this.hooks?.beforeScenario(scenarioRef(world));
  }

  beforeStep(): void {
    this.stepOrder += 1;
  }

  afterStep(step: CucumberStep, _scenario: unknown, result: StepResultPayload): void {
    this.hooks?.onStepEnd(stepEndRef(this.stepOrder, step, result));
  }

  async afterScenario(world: CucumberWorld): Promise<void> {
    await this.hooks?.afterScenario(scenarioRef(world));
  }
}
