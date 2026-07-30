// Test Runner — WDIO service, Cucumber hooks, run-session state (reactive model, ADR-013).
// US-3.3 (TICKET-017): WDIO service + config building blocks. US-3.4 (TICKET-018/019): hooks + session.
export { AimtapService, buildCucumberOpts, iosCapabilities } from './wdio-service.js';
export type { CapabilityKind, CucumberOptions, IosCapability } from './wdio-service.js';
