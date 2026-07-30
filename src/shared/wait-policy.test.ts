import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  DEFAULT_WAIT_POLICY,
  configureWaitPolicy,
  getWaitPolicy,
  resetWaitPolicy,
  withRetries,
} from './wait-policy.js';

beforeEach(() => {
  resetWaitPolicy();
});

describe('wait policy', () => {
  it('starts from the shared defaults', () => {
    expect(getWaitPolicy()).toEqual(DEFAULT_WAIT_POLICY);
  });

  it('applies overrides without dropping the other values', () => {
    configureWaitPolicy({ timeoutMs: 20_000 });
    expect(getWaitPolicy()).toEqual({ ...DEFAULT_WAIT_POLICY, timeoutMs: 20_000 });
  });
});

describe('withRetries', () => {
  it('returns the first successful result without retrying', async () => {
    const operation = vi.fn().mockResolvedValue('ok');
    await expect(withRetries(operation)).resolves.toBe('ok');
    expect(operation).toHaveBeenCalledOnce();
  });

  it('retries up to the configured budget and then succeeds', async () => {
    const operation = vi
      .fn()
      .mockRejectedValueOnce(new Error('flaky'))
      .mockResolvedValue('ok');

    await expect(withRetries(operation, { timeoutMs: 100, intervalMs: 0, retries: 2 })).resolves.toBe(
      'ok',
    );
    expect(operation).toHaveBeenCalledTimes(2);
  });

  it('rethrows the last error when every attempt fails', async () => {
    const operation = vi.fn().mockRejectedValue(new Error('still down'));

    await expect(
      withRetries(operation, { timeoutMs: 100, intervalMs: 0, retries: 2 }),
    ).rejects.toThrow('still down');
    expect(operation).toHaveBeenCalledTimes(3);
  });
});
