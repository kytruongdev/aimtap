// Device & Build Manager - environment check, device readiness, build install, run probe.
// TICKET-008: environment check. TICKET-009: device preparation and build install.
// TICKET-010: liveness probe run before each test case.
export { checkEnvironment, assertEnvironmentReady } from './environment-check.js';
export type {
  AppEnvironmentTarget,
  CheckStatus,
  EnvironmentCheckItem,
  EnvironmentProbes,
  EnvironmentReport,
} from './environment-check.js';
export { createSystemProbes } from './system-probes.js';

export { prepareDevice, ensureReadyBeforeRun, installBuild } from './device-manager.js';
export type { BuildInfo, DeviceContext, DeviceDriver } from './device-manager.js';
export { createDriver } from './create-driver.js';

export { probeDuringRun } from './run-probe.js';
export type { ProbeResult, ProbeSession } from './run-probe.js';
