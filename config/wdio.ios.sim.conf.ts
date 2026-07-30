import { iosCapabilities } from '../src/runner/index.js';
import { config as shared } from './wdio.shared.conf.js';

// iOS simulator capabilities on top of the shared config (north-star §2.1). A simulator is addressed
// by AIMTAP_DEVICE_NAME + AIMTAP_PLATFORM_VERSION with the app at AIMTAP_APP_PATH.
export const config = {
  ...shared,
  capabilities: [iosCapabilities('sim')],
};
