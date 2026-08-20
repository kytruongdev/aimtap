import { describe, it, expect, vi } from 'vitest';
import { withControlPoint, type CodeAgent } from './code-agent.js';

function agentReturning(value: string | null): CodeAgent {
  return { invoke: vi.fn(async () => value) };
}

describe('withControlPoint', () => {
  it('passes a successful result through unchanged', async () => {
    const guarded = withControlPoint(agentReturning('loc'), {
      maxCallsPerRun: 3,
      callTimeoutMs: 1000,
    });

    await expect(guarded.invoke('heal', 'prompt')).resolves.toBe('loc');
  });

  it('caps the number of calls per run and returns null beyond the limit', async () => {
    const inner = agentReturning('ok');
    const guarded = withControlPoint(inner, { maxCallsPerRun: 2, callTimeoutMs: 1000 });

    await expect(guarded.invoke('heal', 'p1')).resolves.toBe('ok');
    await expect(guarded.invoke('heal', 'p2')).resolves.toBe('ok');
    await expect(guarded.invoke('heal', 'p3')).resolves.toBeNull();

    // The inner agent is never called for the over-limit attempt.
    expect(inner.invoke).toHaveBeenCalledTimes(2);
  });

  it('returns null when a call exceeds the timeout', async () => {
    const slow: CodeAgent = {
      invoke: () => new Promise((resolve) => setTimeout(() => resolve('late'), 50)),
    };
    const guarded = withControlPoint(slow, { maxCallsPerRun: 3, callTimeoutMs: 5 });

    await expect(guarded.invoke('heal', 'prompt')).resolves.toBeNull();
  });

  it('swallows an inner error into null (never throws)', async () => {
    const throwing: CodeAgent = {
      invoke: () => Promise.reject(new Error('boom')),
    };
    const guarded = withControlPoint(throwing, { maxCallsPerRun: 3, callTimeoutMs: 1000 });

    await expect(guarded.invoke('generate', 'prompt')).resolves.toBeNull();
  });
});
