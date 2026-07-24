import { PlatformFailure, type DeviceType } from '../shared/index.js';
import type { AppConfig } from '../registry/index.js';

// Device readiness and build install (UC-05, FR-DEV-01..04, BR-015).
// Pure logic: every system call goes through DeviceDriver, which is faked in unit tests and
// implemented for real in simulator-driver.ts / real-device-driver.ts.

export interface BuildInfo {
  bundleId: string;
  version: string;
}

/** Run context captured once the device is confirmed ready (interface-spec.md, Device manager). */
export interface DeviceContext {
  device_id: string;
  device_type: DeviceType;
  os_version: string;
  app_version: string;
}

export interface DeviceDriver {
  isPresent(deviceId: string): boolean;
  osVersion(deviceId: string): string | null;
  /** Boot a simulator or confirm a real device is reachable; throws PlatformFailure on failure. */
  prepare(deviceId: string): void;
  readBuildInfo(buildPath: string): BuildInfo | null;
  installedVersion(deviceId: string, bundleId: string): string | null;
  /** Install the build; throws PlatformFailure carrying the installer reason on failure. */
  install(deviceId: string, buildPath: string): void;
}

function readBuildOrFail(appConfig: AppConfig, driver: DeviceDriver): BuildInfo {
  const build = driver.readBuildInfo(appConfig.buildPath);
  if (build === null) {
    throw new PlatformFailure(`Cannot read the build at ${appConfig.buildPath}`, {
      app_id: appConfig.appId,
      build_path: appConfig.buildPath,
    });
  }
  return build;
}

export function prepareDevice(appConfig: AppConfig, driver: DeviceDriver): void {
  driver.prepare(appConfig.deviceId);
}

/** Full operating-system level readiness check; throws PlatformFailure naming the reason (E2, E3). */
export function ensureReadyBeforeRun(appConfig: AppConfig, driver: DeviceDriver): DeviceContext {
  if (!driver.isPresent(appConfig.deviceId)) {
    throw new PlatformFailure(
      `Device ${appConfig.deviceId} is not available or not connected`,
      { app_id: appConfig.appId, device_id: appConfig.deviceId },
    );
  }

  const osVersion = driver.osVersion(appConfig.deviceId);
  if (osVersion === null) {
    throw new PlatformFailure(`Cannot read the OS version of device ${appConfig.deviceId}`, {
      app_id: appConfig.appId,
      device_id: appConfig.deviceId,
    });
  }

  if (osVersion !== appConfig.osVersion) {
    throw new PlatformFailure(
      `Device ${appConfig.deviceId} runs OS ${osVersion} but ${appConfig.appId} declares ${appConfig.osVersion}`,
      { app_id: appConfig.appId, device_os: osVersion, declared_os: appConfig.osVersion },
    );
  }

  const build = readBuildOrFail(appConfig, driver);

  return {
    device_id: appConfig.deviceId,
    device_type: appConfig.deviceType,
    os_version: osVersion,
    app_version: build.version,
  };
}

/** Install the build, skipping when the device already runs that exact version (UC-05 4a). */
export function installBuild(appConfig: AppConfig, driver: DeviceDriver): void {
  const build = readBuildOrFail(appConfig, driver);
  const installed = driver.installedVersion(appConfig.deviceId, build.bundleId);
  if (installed === build.version) return;
  driver.install(appConfig.deviceId, appConfig.buildPath);
}
