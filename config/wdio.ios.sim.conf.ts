import { AimtapService, iosCapabilities } from '../src/runner/index.js';
import { config as shared } from './wdio.shared.conf.js';

// iOS simulator capabilities on top of the shared config (north-star §2.1). A simulator is addressed
// by AIMTAP_DEVICE_NAME + AIMTAP_PLATFORM_VERSION with the app at AIMTAP_APP_PATH. AimtapService is
// registered with capabilityKind 'sim' so onPrepare guards those keys before the session opens.
export const config = {
  ...shared,
  capabilities: [iosCapabilities('sim')],
  services: [[AimtapService, { capabilityKind: 'sim' }]],
};
