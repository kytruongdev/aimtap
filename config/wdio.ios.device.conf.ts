import { AimtapService, iosCapabilities } from '../src/runner/index.js';
import { config as shared } from './wdio.shared.conf.js';

// Real iOS device capabilities on top of the shared config (north-star §2.1). A real device also
// needs AIMTAP_UDID and the code-signing identity (AIMTAP_XCODE_ORG_ID / AIMTAP_XCODE_SIGNING_ID).
// AimtapService is registered with capabilityKind 'device' so onPrepare guards those keys too.
export const config = {
  ...shared,
  capabilities: [iosCapabilities('device')],
  services: [[AimtapService, { capabilityKind: 'device' }]],
};
