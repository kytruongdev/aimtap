// Shared infrastructure surface. Other modules import the shared kernel only through here.
export {
  AppFailure,
  PlatformFailure,
  isAppFailure,
  isPlatformFailure,
} from './errors.js';
export type { AppFailureKind, FailureContext } from './errors.js';

export { assertExpectation, ASSERTION_SENTINEL } from './assertion.js';

export { logger, loggerForRun, registerSecretPaths, redactObject } from './logger.js';

export {
  DEFAULT_WAIT_POLICY,
  configureWaitPolicy,
  getWaitPolicy,
  resetWaitPolicy,
  withRetries,
} from './wait-policy.js';
export type { WaitPolicy } from './wait-policy.js';

export type { DeviceType, RunId } from './types.js';
