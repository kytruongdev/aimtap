import { describe, it, expect } from 'vitest';
import os from 'node:os';
import path from 'node:path';
import { isPlatformFailure } from '../shared/index.js';
import { parseAppConfig, loadAppConfig } from './load-app-config.js';

const valid = {
  appId: 'demo',
  buildPath: 'builds/demo.app',
  deviceType: 'simulator',
  deviceId: 'sim-1',
  osVersion: '17.0',
};

function failureFrom(run: () => unknown): Error {
  try {
    run();
  } catch (error) {
    return error as Error;
  }
  throw new Error('expected the call to throw');
}

describe('parseAppConfig', () => {
  it('returns a typed config for a valid declaration', () => {
    const config = parseAppConfig(valid, 'demo');
    expect(config.appId).toBe('demo');
    expect(config.deviceType).toBe('simulator');
  });

  it('rejects a missing required field and names it', () => {
    const withoutBuildPath = {
      appId: valid.appId,
      deviceType: valid.deviceType,
      deviceId: valid.deviceId,
      osVersion: valid.osVersion,
    };
    const error = failureFrom(() => parseAppConfig(withoutBuildPath, 'demo'));

    expect(isPlatformFailure(error)).toBe(true);
    expect(error.message).toContain('buildPath');
  });

  it('rejects an unsupported device type and names the field', () => {
    const error = failureFrom(() => parseAppConfig({ ...valid, deviceType: 'android' }, 'demo'));

    expect(isPlatformFailure(error)).toBe(true);
    expect(error.message).toContain('deviceType');
  });

  it('rejects a declaration whose id does not match its folder', () => {
    const error = failureFrom(() => parseAppConfig({ ...valid, appId: 'other' }, 'demo'));

    expect(isPlatformFailure(error)).toBe(true);
    expect(error.message).toContain('other');
    expect(error.message).toContain('demo');
  });

  it('applies the AI defaults when the ai block is absent (Phase 1 config)', () => {
    const config = parseAppConfig(valid, 'demo');

    expect(config.ai).toEqual({ enabled: false, healRetries: 3 });
  });

  it('accepts an explicit ai block and keeps its values', () => {
    const config = parseAppConfig({ ...valid, ai: { enabled: true, healRetries: 5 } }, 'demo');

    expect(config.ai).toEqual({ enabled: true, healRetries: 5 });
  });

  it('rejects healRetries below 1 and names the field', () => {
    const error = failureFrom(() =>
      parseAppConfig({ ...valid, ai: { enabled: true, healRetries: 0 } }, 'demo'),
    );

    expect(isPlatformFailure(error)).toBe(true);
    expect(error.message).toContain('healRetries');
  });
});

describe('loadAppConfig', () => {
  it('rejects an app that has no declaration on disk', async () => {
    const emptyAppsDir = path.join(os.tmpdir(), 'aimtap-registry-test');

    await expect(loadAppConfig('missing-app', emptyAppsDir)).rejects.toThrow('missing-app');
  });
});
