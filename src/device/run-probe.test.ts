import { describe, it, expect, vi, beforeEach } from 'vitest';
import { configureWaitPolicy, resetWaitPolicy } from '../shared/index.js';
import { probeDuringRun, type ProbeSession } from './run-probe.js';

beforeEach(() => {
  resetWaitPolicy();
});

function session(execute: ProbeSession['execute']): ProbeSession {
  return { execute };
}

describe('probeDuringRun', () => {
  it('returns ready when the session responds', async () => {
    const execute = vi.fn().mockResolvedValue({ bundleId: 'com.example.demo' });

    await expect(probeDuringRun(session(execute))).resolves.toBe('ready');
    expect(execute).toHaveBeenCalledWith('mobile: activeAppInfo');
  });

  it('returns unavailable when the session command keeps failing', async () => {
    configureWaitPolicy({ timeoutMs: 50, intervalMs: 0, retries: 1 });
    const execute = vi.fn().mockRejectedValue(new Error('socket hang up'));

    await expect(probeDuringRun(session(execute))).resolves.toBe('unavailable');
    expect(execute).toHaveBeenCalledTimes(2); // first attempt + one retry
  });

  it('recovers from a transient failure within the retry budget', async () => {
    configureWaitPolicy({ timeoutMs: 50, intervalMs: 0, retries: 2 });
    const execute = vi
      .fn()
      .mockRejectedValueOnce(new Error('flaky'))
      .mockResolvedValue({ bundleId: 'com.example.demo' });

    await expect(probeDuringRun(session(execute))).resolves.toBe('ready');
    expect(execute).toHaveBeenCalledTimes(2);
  });

  it('returns unavailable when the command hangs past the timeout', async () => {
    configureWaitPolicy({ timeoutMs: 10, intervalMs: 0, retries: 0 });
    const execute = vi.fn().mockReturnValue(new Promise<never>(() => undefined));

    await expect(probeDuringRun(session(execute))).resolves.toBe('unavailable');
  });
});
