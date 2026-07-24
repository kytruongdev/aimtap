import { describe, it, expect } from 'vitest';
import { isPlatformFailure } from '../shared/index.js';
import {
  checkEnvironment,
  assertEnvironmentReady,
  type AppEnvironmentTarget,
  type EnvironmentProbes,
} from './environment-check.js';

function fakeProbes(overrides: Partial<EnvironmentProbes> = {}): EnvironmentProbes {
  return {
    nodeVersion: () => 'v22.13.1',
    requiredNodeRange: () => '>=22',
    xcodeVersion: () => 'Xcode 16.0',
    appiumVersion: () => '2.11.0',
    availableDeviceIds: () => ['sim-1'],
    deviceOsVersion: () => '17.0',
    fileExists: () => true,
    ...overrides,
  };
}

const target: AppEnvironmentTarget = {
  buildPath: 'builds/demo.app',
  deviceType: 'simulator',
  deviceId: 'sim-1',
  osVersion: '17.0',
};

function reasonFor(items: ReturnType<typeof checkEnvironment>['items'], name: string): string {
  return items.find((item) => item.name === name)?.reason ?? '';
}

describe('checkEnvironment', () => {
  it('reports ok when every check passes', () => {
    const report = checkEnvironment(fakeProbes(), target);
    expect(report.ok).toBe(true);
    expect(report.items.every((item) => item.status === 'ok')).toBe(true);
  });

  it('gathers every failure instead of stopping at the first one', () => {
    const report = checkEnvironment(
      fakeProbes({
        xcodeVersion: () => null,
        appiumVersion: () => null,
        fileExists: () => false,
      }),
      target,
    );

    const failedNames = report.items.filter((i) => i.status === 'failed').map((i) => i.name);
    expect(report.ok).toBe(false);
    expect(failedNames).toEqual(expect.arrayContaining(['xcode', 'appium', 'build']));
  });

  it('fails the node check when the running version is too old', () => {
    const report = checkEnvironment(fakeProbes({ nodeVersion: () => 'v18.20.0' }));
    expect(report.ok).toBe(false);
    expect(reasonFor(report.items, 'node')).toContain('v18.20.0');
  });

  it('names the build path when the build is missing', () => {
    const report = checkEnvironment(fakeProbes({ fileExists: () => false }), target);
    expect(reasonFor(report.items, 'build')).toContain('builds/demo.app');
  });

  it('names the device when it is not available', () => {
    const report = checkEnvironment(fakeProbes({ availableDeviceIds: () => ['other'] }), target);
    expect(reasonFor(report.items, 'device')).toContain('sim-1');
    expect(reasonFor(report.items, 'device')).toContain('other');
  });

  it('reports an OS mismatch as its own item', () => {
    const report = checkEnvironment(fakeProbes({ deviceOsVersion: () => '16.4' }), target);
    expect(report.ok).toBe(false);
    expect(reasonFor(report.items, 'device-os')).toContain('16.4');
    expect(reasonFor(report.items, 'device-os')).toContain('17.0');
  });

  it('skips the app checks when no target is given', () => {
    const report = checkEnvironment(fakeProbes());
    expect(report.items.map((item) => item.name)).toEqual(['node', 'xcode', 'appium']);
  });
});

describe('assertEnvironmentReady', () => {
  it('passes silently for a healthy report', () => {
    expect(() => assertEnvironmentReady(checkEnvironment(fakeProbes(), target))).not.toThrow();
  });

  it('throws a PlatformFailure listing every failed check', () => {
    const report = checkEnvironment(fakeProbes({ xcodeVersion: () => null }), target);
    try {
      assertEnvironmentReady(report);
      throw new Error('expected assertEnvironmentReady to throw');
    } catch (error) {
      expect(isPlatformFailure(error)).toBe(true);
      expect((error as Error).message).toContain('xcode');
    }
  });
});
