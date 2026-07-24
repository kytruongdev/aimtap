import type { DeviceType } from '../shared/index.js';
import type { DeviceDriver } from './device-manager.js';
import { createSimulatorDriver } from './simulator-driver.js';
import { createRealDeviceDriver } from './real-device-driver.js';

/** Pick the driver that matches the device type declared by the app (FR-DEV-01). */
export function createDriver(deviceType: DeviceType): DeviceDriver {
  return deviceType === 'simulator' ? createSimulatorDriver() : createRealDeviceDriver();
}
