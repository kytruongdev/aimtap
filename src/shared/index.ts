// Shared infrastructure surface. Other modules import the shared kernel only through here.
export {
  AppFailure,
  PlatformFailure,
  isAppFailure,
  isPlatformFailure,
} from './errors.js';
export type { FailureContext } from './errors.js';

export { logger, loggerForRun, registerSecretPaths, redactObject } from './logger.js';

export type { DeviceType, RunId } from './types.js';
