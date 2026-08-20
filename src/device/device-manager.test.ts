import { describe, it, expect, vi } from 'vitest';
import { PlatformFailure, isPlatformFailure } from '../shared/index.js';
import type { AppConfig } from '../registry/index.js';
import {
  ensureReadyBeforeRun,
  installBuild,
  prepareDevice,
  type DeviceDriver,
} from './device-manager.js';

const appConfig: AppConfig = {
  appId: 'demo',
  buildPath: 'builds/demo.app',
  deviceType: 'simulator',
  deviceId: 'sim-1',
  osVersion: '17.0',
  ai: { enabled: false, healRetries: 3 },
};

function fakeDriver(overrides: Partial<DeviceDriver> = {}): DeviceDriver {
  return {
    isPresent: () => true,
    osVersion: () => '17.0',
    prepare: () => undefined,
    readBuildInfo: () => ({ bundleId: 'com.example.demo', version: '1.4.0' }),
    installedVersion: () => '1.4.0',
    install: () => undefined,
    ...overrides,
  };
}

function failureFrom(run: () => unknown): Error {
  try {
    run();
  } catch (error) {
    return error as Error;
  }
  throw new Error('expected the call to throw');
}

describe('ensureReadyBeforeRun', () => {
  it('returns the run context when the device is ready', () => {
    const context = ensureReadyBeforeRun(appConfig, fakeDriver());
    expect(context).toEqual({
      device_id: 'sim-1',
      device_type: 'simulator',
      os_version: '17.0',
      app_version: '1.4.0',
    });
  });

  it('rejects a device that is not available and names it', () => {
    const error = failureFrom(() => ensureReadyBeforeRun(appConfig, fakeDriver({ isPresent: () => false })));
    expect(isPlatformFailure(error)).toBe(true);
    expect(error.message).toContain('sim-1');
  });

  it('rejects an OS mismatch and names both versions', () => {
    const error = failureFrom(() =>
      ensureReadyBeforeRun(appConfig, fakeDriver({ osVersion: () => '16.4' })),
    );
    expect(isPlatformFailure(error)).toBe(true);
    expect(error.message).toContain('16.4');
    expect(error.message).toContain('17.0');
  });

  it('rejects an unreadable build and names the path', () => {
    const error = failureFrom(() =>
      ensureReadyBeforeRun(appConfig, fakeDriver({ readBuildInfo: () => null })),
    );
    expect(isPlatformFailure(error)).toBe(true);
    expect(error.message).toContain('builds/demo.app');
  });
});

describe('installBuild', () => {
  it('skips the install when the device already runs that build version', () => {
    const install = vi.fn();
    installBuild(appConfig, fakeDriver({ installedVersion: () => '1.4.0', install }));
    expect(install).not.toHaveBeenCalled();
  });

  it('installs when the installed version differs', () => {
    const install = vi.fn();
    installBuild(appConfig, fakeDriver({ installedVersion: () => '1.3.0', install }));
    expect(install).toHaveBeenCalledWith('sim-1', 'builds/demo.app');
  });

  it('installs when the installed version is unknown', () => {
    const install = vi.fn();
    installBuild(appConfig, fakeDriver({ installedVersion: () => null, install }));
    expect(install).toHaveBeenCalledOnce();
  });

  it('propagates the installer failure reason', () => {
    const driver = fakeDriver({
      installedVersion: () => '1.3.0',
      install: () => {
        throw new PlatformFailure('Cannot install builds/demo.app on simulator sim-1: no space');
      },
    });
    const error = failureFrom(() => installBuild(appConfig, driver));
    expect(isPlatformFailure(error)).toBe(true);
    expect(error.message).toContain('no space');
  });
});

describe('prepareDevice', () => {
  it('delegates to the driver with the declared device', () => {
    const prepare = vi.fn();
    prepareDevice(appConfig, fakeDriver({ prepare }));
    expect(prepare).toHaveBeenCalledWith('sim-1');
  });
});
