import { describe, it, expect } from 'vitest';
import path from 'node:path';
import { DEFAULT_WAIT_POLICY } from '../shared/index.js';
import { loadPlatformConfig } from './platform-config.js';

describe('loadPlatformConfig', () => {
  it('uses defaults on a bare environment: AI off, default waits, output under cwd', () => {
    const config = loadPlatformConfig({});

    expect(config.ai.enabled).toBe(false);
    expect(config.logLevel).toBe('info');
    expect(config.outputDir).toBe(path.join(process.cwd(), 'output'));
    expect(config.wait).toEqual(DEFAULT_WAIT_POLICY);
  });

  it('applies output dir, AI switch and wait overrides from the environment', () => {
    const config = loadPlatformConfig({
      AIMTAP_OUTPUT_DIR: '/tmp/aimtap-out',
      AIMTAP_AI_ENABLED: 'true',
      AIMTAP_WAIT_TIMEOUT_MS: '30000',
      AIMTAP_WAIT_INTERVAL_MS: '250',
      AIMTAP_WAIT_RETRIES: '4',
    } as NodeJS.ProcessEnv);

    expect(config.outputDir).toBe('/tmp/aimtap-out');
    expect(config.ai.enabled).toBe(true);
    expect(config.wait).toEqual({ timeoutMs: 30000, intervalMs: 250, retries: 4 });
  });

  it('keeps default wait values for the overrides that are not set', () => {
    const config = loadPlatformConfig({ AIMTAP_WAIT_RETRIES: '5' } as NodeJS.ProcessEnv);

    expect(config.wait.retries).toBe(5);
    expect(config.wait.timeoutMs).toBe(DEFAULT_WAIT_POLICY.timeoutMs);
    expect(config.wait.intervalMs).toBe(DEFAULT_WAIT_POLICY.intervalMs);
  });
});
