import { describe, it, expect } from 'vitest';
import { isPlatformFailure } from '../shared/index.js';
import type { CucumberHooks } from './cucumber-hooks.js';
import {
  AimtapService,
  buildCucumberOpts,
  iosCapabilities,
  scenarioRef,
  stepEndRef,
} from './wdio-service.js';

const simEnv = {
  AIMTAP_DEVICE_NAME: 'iPhone 15',
  AIMTAP_PLATFORM_VERSION: '17.5',
  AIMTAP_APP_PATH: '/builds/demo.app',
} as NodeJS.ProcessEnv;

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

describe('payload adapters', () => {
  it('reads the feature and test-case names from the Cucumber world', () => {
    const ref = scenarioRef({
      pickle: { name: 'valid credentials' },
      gherkinDocument: { feature: { name: 'Login' } },
    });

    expect(ref).toEqual({ test_feature: 'Login', test_case: 'valid credentials' });
  });

  it('falls back to placeholders when the world is missing names', () => {
    expect(scenarioRef({})).toEqual({
      test_feature: 'Unknown feature',
      test_case: 'Unknown test case',
    });
  });

  it('maps a failed step result, keeping the order and error', () => {
    const error = new Error('boom');
    const ref = stepEndRef(3, { text: 'I log in' }, { passed: false, duration: 42, error });

    expect(ref).toEqual({
      order: 3,
      text: 'I log in',
      result: 'failed',
      duration_ms: 42,
      error,
    });
  });

  it('maps a passing step result', () => {
    const ref = stepEndRef(1, { text: 'I open the app' }, { passed: true, duration: 10 });

    expect(ref).toMatchObject({ order: 1, result: 'passed', duration_ms: 10 });
  });
});

describe('AimtapService.onPrepare (pre-session guard)', () => {
  it('throws a PlatformFailure naming the missing capability variables', () => {
    const service = new AimtapService({ capabilityKind: 'sim', env: {} as NodeJS.ProcessEnv });

    try {
      service.onPrepare();
      expect.unreachable('onPrepare must throw when capability env is missing');
    } catch (error) {
      expect(isPlatformFailure(error)).toBe(true);
      expect((error as Error).message).toContain('AIMTAP_APP_PATH');
    }
  });

  it('passes when every required capability variable is present', () => {
    const service = new AimtapService({ capabilityKind: 'sim', env: simEnv });

    expect(() => service.onPrepare()).not.toThrow();
  });

  it('does not run the guard in before() — before() is post-session (SA review 2026-08-02)', () => {
    const service = new AimtapService({ capabilityKind: 'sim', env: {} as NodeJS.ProcessEnv });

    // Missing env, yet before() must not throw: the guard lives in onPrepare, not here.
    expect(() => service.before()).not.toThrow();
  });
});

describe('AimtapService lifecycle delegation', () => {
  function fakeHooks(): CucumberHooks & { calls: string[] } {
    const calls: string[] = [];
    return {
      calls,
      onSessionStart: () => calls.push('onSessionStart'),
      beforeScenario: (s) => {
        calls.push(`beforeScenario:${s.test_case}`);
        return Promise.resolve();
      },
      onStepEnd: (step) => calls.push(`onStepEnd:${step.order}:${step.result}`),
      afterScenario: (s) => {
        calls.push(`afterScenario:${s.test_case}`);
        return Promise.resolve();
      },
    };
  }

  const world = {
    pickle: { name: 'valid credentials' },
    gherkinDocument: { feature: { name: 'Login' } },
  };

  it('delegates the lifecycle to the hooks and numbers steps within a scenario', async () => {
    const hooks = fakeHooks();
    const service = new AimtapService({ capabilityKind: 'sim', env: simEnv, hooks });

    service.before();
    await service.beforeScenario(world);
    service.beforeStep();
    service.afterStep({ text: 'step one' }, undefined, { passed: true, duration: 5 });
    service.beforeStep();
    service.afterStep({ text: 'step two' }, undefined, { passed: false, duration: 7 });
    await service.afterScenario(world);

    expect(hooks.calls).toEqual([
      'onSessionStart',
      'beforeScenario:valid credentials',
      'onStepEnd:1:passed',
      'onStepEnd:2:failed',
      'afterScenario:valid credentials',
    ]);
  });

  it('resets the step counter at the start of each scenario', async () => {
    const hooks = fakeHooks();
    const service = new AimtapService({ capabilityKind: 'sim', env: simEnv, hooks });

    await service.beforeScenario(world);
    service.beforeStep();
    service.afterStep({ text: 'a' }, undefined, { passed: true, duration: 1 });
    await service.beforeScenario(world);
    service.beforeStep();
    service.afterStep({ text: 'b' }, undefined, { passed: true, duration: 1 });

    expect(hooks.calls.filter((c) => c.startsWith('onStepEnd'))).toEqual([
      'onStepEnd:1:passed',
      'onStepEnd:1:passed',
    ]);
  });

  it('is inert without hooks (session-open logging only)', () => {
    const service = new AimtapService({ capabilityKind: 'sim', env: simEnv });

    expect(() => service.before()).not.toThrow();
    expect(() => service.beforeStep()).not.toThrow();
  });
});
