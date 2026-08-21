import { describe, it, expect, vi } from 'vitest';
import { wireSelfHealing } from './run-assembly.js';
import type { CodeAgent } from '../ai/index.js';
import type { HealFn } from '../locator/index.js';
import type { HealSignalInput } from '../evidence/index.js';

const fakeAgent: CodeAgent = { invoke: vi.fn(async () => null) };
const signal: HealSignalInput = {
  screen: 'LoginScreen',
  expectedLocator: 'accessibility-id(old)',
  usedLocator: 'accessibility-id(new)',
  occurredAt: '2026-08-21T00:00:00.000Z',
};

describe('wireSelfHealing', () => {
  it('injects a healer and heal sink when AI is enabled, with the app heal retries', () => {
    const setHealer = vi.fn();
    const setHealSink = vi.fn();
    const createAgent = vi.fn(() => fakeAgent);

    wireSelfHealing({
      aiEnabled: true,
      healRetries: 5,
      onHeal: vi.fn(),
      deps: { createAgent, setHealer, setHealSink },
    });

    expect(createAgent).toHaveBeenCalledOnce();
    expect(setHealer).toHaveBeenCalledOnce();
    expect(setHealer.mock.calls[0]?.[1]).toBe(5);
    expect(setHealSink).toHaveBeenCalledOnce();
  });

  it('routes the heal sink to Evidence onHeal', () => {
    let captured: ((s: HealSignalInput) => void) | undefined;
    const setHealSink = vi.fn((sink: (s: HealSignalInput) => void) => {
      captured = sink;
    });
    const onHeal = vi.fn();

    wireSelfHealing({
      aiEnabled: true,
      healRetries: 3,
      onHeal,
      deps: { createAgent: () => fakeAgent, setHealer: vi.fn(), setHealSink },
    });
    captured?.(signal);

    expect(onHeal).toHaveBeenCalledWith(signal);
  });

  it('registers a healer that calls the AI gateway', async () => {
    let captured: HealFn | undefined;
    const setHealer = vi.fn((fn: HealFn) => {
      captured = fn;
    });

    wireSelfHealing({
      aiEnabled: true,
      healRetries: 3,
      onHeal: vi.fn(),
      deps: { createAgent: () => fakeAgent, setHealer, setHealSink: vi.fn() },
    });
    await captured?.({ expectedLocator: 'x', screenName: 'LoginScreen', pageSource: '<page/>' });

    expect(fakeAgent.invoke).toHaveBeenCalledWith('heal', expect.any(String));
  });

  it('injects nothing when AI is disabled (Phase 1 behaviour)', () => {
    const setHealer = vi.fn();
    const setHealSink = vi.fn();
    const createAgent = vi.fn();

    wireSelfHealing({
      aiEnabled: false,
      healRetries: 3,
      onHeal: vi.fn(),
      deps: { createAgent, setHealer, setHealSink },
    });

    expect(createAgent).not.toHaveBeenCalled();
    expect(setHealer).not.toHaveBeenCalled();
    expect(setHealSink).not.toHaveBeenCalled();
  });
});
