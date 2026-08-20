import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';

vi.mock('@wdio/globals', () => ({
  $: vi.fn(),
  browser: { getPageSource: vi.fn() },
}));

import { $, browser } from '@wdio/globals';
import { isAppFailure, resetWaitPolicy, type Locator } from '../shared/index.js';
import { byAccessibilityId } from './locator.js';
import {
  clearScreenSink,
  clearHealer,
  clearHealSink,
  find,
  registerScreenSink,
  registerHealer,
  registerHealSink,
  type HealSignal,
} from './locator-resolver.js';

const findElement = $ as unknown as Mock;
const getPageSource = browser.getPageSource as unknown as Mock;

function okElement(): unknown {
  return { waitForExist: vi.fn().mockResolvedValue(true) };
}

function missingElement(): unknown {
  return { waitForExist: vi.fn().mockRejectedValue(new Error('timeout after 10000ms')) };
}

/** Route `$` by selector: selectors in `present` resolve, everything else is missing. */
function routeBySelector(present: Set<string>): void {
  findElement.mockImplementation((selector: string) =>
    Promise.resolve(present.has(selector) ? okElement() : missingElement()),
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  clearScreenSink();
  clearHealer();
  clearHealSink();
  resetWaitPolicy();
  getPageSource.mockResolvedValue('<page />');
});

describe('find', () => {
  it('queries the mapped selector and returns the element', async () => {
    findElement.mockResolvedValue(okElement());

    const element = await find(byAccessibilityId('login-button'), 'LoginScreen');

    expect(findElement).toHaveBeenCalledWith('~login-button');
    expect(element).toBeDefined();
  });

  it('pushes the screen name to the registered sink', async () => {
    findElement.mockResolvedValue(okElement());
    const sink = vi.fn();
    registerScreenSink(sink);

    await find(byAccessibilityId('login-button'), 'LoginScreen');

    expect(sink).toHaveBeenCalledWith('LoginScreen');
  });

  it('does not fail the step when the screen sink throws', async () => {
    findElement.mockResolvedValue(okElement());
    registerScreenSink(() => {
      throw new Error('evidence collector is down');
    });

    await expect(find(byAccessibilityId('login-button'), 'LoginScreen')).resolves.toBeDefined();
  });

  it('throws an AppFailure naming the screen and locator when the element never appears', async () => {
    findElement.mockResolvedValue(missingElement());

    try {
      await find(byAccessibilityId('login-button'), 'LoginScreen');
      throw new Error('expected find to throw');
    } catch (error) {
      expect(isAppFailure(error)).toBe(true);
      const message = (error as Error).message;
      expect(message).toContain('LoginScreen');
      expect(message).toContain('accessibility-id(login-button)');
      expect(message).toContain('timeout after 10000ms');
    }
  });
});

describe('find — self-healing', () => {
  const healed: Locator = { strategy: 'accessibility-id', value: 'login-btn-v2' };

  it('fails exactly as Phase 1 when no healer is registered', async () => {
    findElement.mockResolvedValue(missingElement());

    await expect(find(byAccessibilityId('login-button'), 'LoginScreen')).rejects.toThrow();
    expect(getPageSource).not.toHaveBeenCalled();
  });

  it('recovers via the healer and pushes exactly one HealSignal', async () => {
    routeBySelector(new Set(['~login-btn-v2'])); // only the healed selector exists
    const healer = vi.fn().mockResolvedValue(healed);
    const signals: HealSignal[] = [];
    registerHealer(healer);
    registerHealSink((s) => signals.push(s));

    const element = await find(byAccessibilityId('login-button'), 'LoginScreen');

    expect(element).toBeDefined();
    expect(healer).toHaveBeenCalledOnce();
    expect(healer).toHaveBeenCalledWith({
      expectedLocator: 'accessibility-id(login-button)',
      screenName: 'LoginScreen',
      pageSource: '<page />',
    });
    expect(signals).toEqual([
      {
        screen: 'LoginScreen',
        expectedLocator: 'accessibility-id(login-button)',
        usedLocator: 'accessibility-id(login-btn-v2)',
        occurredAt: expect.any(String),
      },
    ]);
  });

  it('retries up to healRetries times then throws AppFailure', async () => {
    findElement.mockResolvedValue(missingElement()); // nothing ever resolves
    const healer = vi.fn().mockResolvedValue(healed); // healed locator never locates either
    registerHealer(healer, 3);

    await expect(find(byAccessibilityId('login-button'), 'LoginScreen')).rejects.toThrow();
    expect(healer).toHaveBeenCalledTimes(3);
  });

  it('stops early and does not call the healer again once a heal succeeds', async () => {
    routeBySelector(new Set(['~login-btn-v2']));
    const healer = vi.fn().mockResolvedValue(healed);
    registerHealer(healer, 3);

    await find(byAccessibilityId('login-button'), 'LoginScreen');

    expect(healer).toHaveBeenCalledTimes(1);
  });

  it('reuses a cached fix without calling the healer again for the same locator', async () => {
    routeBySelector(new Set(['~login-btn-v2']));
    const healer = vi.fn().mockResolvedValue(healed);
    registerHealer(healer);

    await find(byAccessibilityId('login-button'), 'LoginScreen'); // heals, caches
    await find(byAccessibilityId('login-button'), 'LoginScreen'); // cache hit

    expect(healer).toHaveBeenCalledOnce();
  });

  it('records one HealSignal per reuse of a cached fix (BR-205/206: per-step, not deduped)', async () => {
    // Each step that relied on the healed locator must be recorded with its own screenshot so a
    // human can catch a healed locator that matches a wrong element on some steps (SA ruling, BR-206).
    routeBySelector(new Set(['~login-btn-v2']));
    const healer = vi.fn().mockResolvedValue(healed);
    const signals: HealSignal[] = [];
    registerHealer(healer);
    registerHealSink((s) => signals.push(s));

    await find(byAccessibilityId('login-button'), 'LoginScreen'); // AI heal + record
    await find(byAccessibilityId('login-button'), 'LoginScreen'); // cache hit + record
    await find(byAccessibilityId('login-button'), 'LoginScreen'); // cache hit + record

    expect(healer).toHaveBeenCalledOnce(); // AI consulted only once (BR-202)
    expect(signals).toHaveLength(3); // but every reliant step is recorded (BR-205)
  });

  it('does not heal when the healer returns null (AI could not infer)', async () => {
    findElement.mockResolvedValue(missingElement());
    const healer = vi.fn().mockResolvedValue(null);
    registerHealer(healer, 2);

    await expect(find(byAccessibilityId('login-button'), 'LoginScreen')).rejects.toThrow();
    expect(healer).toHaveBeenCalledTimes(2);
  });
});
