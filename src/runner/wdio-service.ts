import { getWaitPolicy, logger, type WaitPolicy } from '../shared/index.js';

// TICKET-017: WDIO service + the WebdriverIO/Cucumber config building blocks (ADR-001, ADR-007,
// ADR-013). The platform attaches to the WebdriverIO testrunner as a service; WebdriverIO/Cucumber
// own the loop over test cases and the platform reacts through lifecycle hooks (ADR-013). The Appium
// session is opened once per run by the testrunner and reused across test cases (north-star §2.2).
//
// The Cucumber lifecycle hooks (device probe, evidence events, screen-name sink) are added in US-3.4
// (cucumber-hooks.ts); this file provides the service registration and the pure config helpers so
// they can be unit-tested without a device (conventions §3.1). All identifiers are English (BC-10).

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
// identity.
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

// WDIO service: its presence lets the testrunner load the platform. A single Appium session per run
// is the testrunner default for one worker (AS-P1-01); the `before` hook marks that open. US-3.4
// extends this service with the Cucumber lifecycle hooks (probe, evidence, screen sink).
export class AimtapService {
  before(): void {
    logger.info('appium session opened for the run');
  }
}
