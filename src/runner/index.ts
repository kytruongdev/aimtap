// Test Runner — WDIO service, Cucumber hooks, run-session state, run launch + progress (ADR-013/018).
// US-3.3: WDIO service + config. US-3.4: hooks + session. US-4.3: launchRun + progress reporter.
export { AimtapService, buildCucumberOpts, iosCapabilities, scenarioRef, stepEndRef } from './wdio-service.js';
export type {
  AimtapServiceOptions,
  CapabilityKind,
  CucumberOptions,
  IosCapability,
} from './wdio-service.js';

export { createRunSession } from './run-session.js';
export type {
  RunSession,
  RunSessionDeps,
  ProgressEvent,
  SignalSource,
} from './run-session.js';

export {
  createCucumberHooks,
  assertCapabilityEnv,
  missingCapabilityEnv,
  requiredCapabilityEnvKeys,
} from './cucumber-hooks.js';
export type {
  CucumberHooks,
  CucumberHooksDeps,
  ScenarioRef,
  StepEndRef,
} from './cucumber-hooks.js';

export {
  launchRun,
  buildRunEnv,
  scopeToLauncherArgs,
  wdioConfigPath,
  capabilityKindOf,
} from './launch-run.js';
export type { RunScope, RunOutcome, ScopeKind, LaunchRunOptions } from './launch-run.js';

export { default as ProgressReporter, ProgressTracker } from './progress-reporter.js';
