import { buildCucumberOpts, ProgressReporter } from '../src/runner/index.js';

// Shared WebdriverIO/Cucumber config (north-star §2.1, ADR-001/007/013). The per-platform configs
// (wdio.ios.sim.conf.ts, wdio.ios.device.conf.ts) extend this with capabilities and register
// AimtapService with the matching capabilityKind, so the onPrepare guard knows which AIMTAP_* keys
// are required. Run from the repo root, e.g. `npx wdio run config/wdio.ios.sim.conf.ts`.
//
// The Appium endpoint defaults to a local Appium 2 server; override with AIMTAP_APPIUM_HOST /
// AIMTAP_APPIUM_PORT. Per-run device and app values are injected via environment variables read in
// iosCapabilities (see src/runner/wdio-service.ts).

const appiumHost = process.env.AIMTAP_APPIUM_HOST ?? 'localhost';
const appiumPort = Number(process.env.AIMTAP_APPIUM_PORT ?? '4723');

export const config = {
  runner: 'local',

  // A single Appium server / one worker: the session opens once per run and is reused across test
  // cases (north-star §2.2, AS-P1-01).
  hostname: appiumHost,
  port: appiumPort,
  path: '/',
  maxInstances: 1,

  // Behaviour descriptions are the .feature files; step definitions are their implementation.
  specs: ['../apps/*/features/**/*.feature'],
  framework: 'cucumber',
  cucumberOpts: buildCucumberOpts(['apps/*/steps/**/*.steps.ts']),

  reporters: ['spec', [ProgressReporter, {}]],
  logLevel: 'info',
  injectGlobals: true,
};
