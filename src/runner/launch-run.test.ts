import { describe, it, expect, vi } from 'vitest';
import { isPlatformFailure } from '../shared/index.js';
import type { LaunchTarget } from './launch-run.js';
import type { DeviceContext } from '../device/index.js';
import {
  buildRunEnv,
  capabilityKindOf,
  launchRun,
  scopeToLauncherArgs,
  wdioConfigPath,
  type RunScope,
} from './launch-run.js';

const simApp: LaunchTarget = {
  appId: 'demo',
  buildPath: '/builds/demo.app',
  deviceType: 'simulator',
  deviceId: 'iPhone 15',
};
const device: DeviceContext = {
  device_id: 'iPhone 15',
  device_type: 'simulator',
  os_version: '17.5',
  app_version: '1.2.0',
};
const fullScope: RunScope = { kind: 'full_suite', criteria: null, specs: [], tagExpression: null, names: [] };

describe('pure helpers', () => {
  it('maps device type to capability kind', () => {
    expect(capabilityKindOf('simulator')).toBe('sim');
    expect(capabilityKindOf('real')).toBe('device');
  });

  it('selects the wdio config by device type', () => {
    expect(wdioConfigPath('simulator', '/cfg')).toBe('/cfg/wdio.ios.sim.conf.ts');
    expect(wdioConfigPath('real', '/cfg')).toBe('/cfg/wdio.ios.device.conf.ts');
  });

  it('builds the simulator capability env without device-only keys', () => {
    const env = buildRunEnv('run-1', simApp, device, '/out');
    expect(env).toMatchObject({
      AIMTAP_RUN_ID: 'run-1',
      AIMTAP_APP_ID: 'demo',
      AIMTAP_DEVICE_NAME: 'iPhone 15',
      AIMTAP_PLATFORM_VERSION: '17.5',
      AIMTAP_APP_PATH: '/builds/demo.app',
      AIMTAP_OUTPUT_DIR: '/out',
    });
    expect(env.AIMTAP_UDID).toBeUndefined();
  });

  it('adds udid and signing identity for a real device from the ambient env', () => {
    const realApp: LaunchTarget = { ...simApp, deviceType: 'real', deviceId: '00008110-000' };
    const env = buildRunEnv('run-1', realApp, device, '/out', { AIMTAP_XCODE_ORG_ID: 'ABCDE12345' });
    expect(env.AIMTAP_UDID).toBe('00008110-000');
    expect(env.AIMTAP_XCODE_ORG_ID).toBe('ABCDE12345');
  });

  it('translates scope to launcher args', () => {
    expect(scopeToLauncherArgs(fullScope)).toEqual({});
    expect(scopeToLauncherArgs({ ...fullScope, specs: ['apps/demo/features/login.feature'] })).toEqual({
      spec: ['apps/demo/features/login.feature'],
    });
    expect(scopeToLauncherArgs({ ...fullScope, tagExpression: '@smoke', names: ['valid'] })).toEqual({
      cucumberOpts: { tagExpression: '@smoke', name: ['valid'] },
    });
  });
});

describe('launchRun', () => {
  it('injects the per-run env, launches the matching config, and returns the outcome', async () => {
    const env: NodeJS.ProcessEnv = {};
    const run = vi.fn().mockResolvedValue(0);
    const makeLauncher = vi.fn().mockReturnValue({ run });

    const outcome = await launchRun({
      runId: 'run-1',
      target: simApp,
      deviceContext: device,
      scope: fullScope,
      outputDir: '/out',
      env,
      configDir: '/cfg',
      makeLauncher,
    });

    expect(outcome).toEqual({ runId: 'run-1', exitCode: 0 });
    expect(env.AIMTAP_RUN_ID).toBe('run-1');
    expect(env.AIMTAP_APP_PATH).toBe('/builds/demo.app');
    expect(env.AIMTAP_APP_VERSION).toBe('1.2.0');
    expect(makeLauncher).toHaveBeenCalledWith('/cfg/wdio.ios.sim.conf.ts', {});
    expect(run).toHaveBeenCalledOnce();
  });

  it('fails early when a required capability variable cannot be built (real device, no signing)', async () => {
    const realApp: LaunchTarget = { ...simApp, deviceType: 'real', deviceId: '00008110-000' };
    const makeLauncher = vi.fn();

    await expect(
      launchRun({
        runId: 'run-1',
        target: realApp,
        deviceContext: { ...device, device_type: 'real' },
        scope: fullScope,
        outputDir: '/out',
        env: {},
        configDir: '/cfg',
        makeLauncher,
      }),
    ).rejects.toSatisfy((error) => isPlatformFailure(error));
    expect(makeLauncher).not.toHaveBeenCalled();
  });
});
