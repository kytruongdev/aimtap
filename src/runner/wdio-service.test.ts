import { describe, it, expect } from 'vitest';
import { buildCucumberOpts, iosCapabilities } from './wdio-service.js';

describe('buildCucumberOpts', () => {
  it('takes the step timeout from the given wait policy, not a hard-coded value', () => {
    const opts = buildCucumberOpts(['apps/*/steps/**/*.steps.ts'], {
      timeoutMs: 25_000,
      intervalMs: 500,
      retries: 2,
    });

    expect(opts.timeout).toBe(25_000);
    expect(opts.require).toEqual(['apps/*/steps/**/*.steps.ts']);
  });

  it('does not skip undefined step definitions', () => {
    const opts = buildCucumberOpts([], { timeoutMs: 10_000, intervalMs: 500, retries: 2 });

    expect(opts.ignoreUndefinedDefinitions).toBe(false);
    expect(opts.failAmbiguousDefinitions).toBe(true);
  });
});

describe('iosCapabilities', () => {
  const simEnv = {
    AIMTAP_DEVICE_NAME: 'iPhone 15',
    AIMTAP_PLATFORM_VERSION: '17.5',
    AIMTAP_APP_PATH: '/builds/demo.app',
  } as NodeJS.ProcessEnv;

  it('builds simulator capabilities from name, version and app, without device-only fields', () => {
    const caps = iosCapabilities('sim', simEnv);

    expect(caps).toEqual({
      platformName: 'iOS',
      'appium:automationName': 'XCUITest',
      'appium:deviceName': 'iPhone 15',
      'appium:platformVersion': '17.5',
      'appium:app': '/builds/demo.app',
    });
    expect(caps['appium:udid']).toBeUndefined();
  });

  it('adds udid and code-signing identity for a real device', () => {
    const caps = iosCapabilities('device', {
      ...simEnv,
      AIMTAP_UDID: '00008110-000',
      AIMTAP_XCODE_ORG_ID: 'ABCDE12345',
    } as NodeJS.ProcessEnv);

    expect(caps['appium:udid']).toBe('00008110-000');
    expect(caps['appium:xcodeOrgId']).toBe('ABCDE12345');
    expect(caps['appium:xcodeSigningId']).toBe('iPhone Developer');
  });

  it('defaults missing values to empty strings so the shape is stable', () => {
    const caps = iosCapabilities('sim', {} as NodeJS.ProcessEnv);

    expect(caps['appium:deviceName']).toBe('');
    expect(caps['appium:platformVersion']).toBe('');
    expect(caps['appium:app']).toBe('');
  });
});
