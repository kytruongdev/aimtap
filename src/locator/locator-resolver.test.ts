import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';

vi.mock('@wdio/globals', () => ({ $: vi.fn() }));

import { $ } from '@wdio/globals';
import { isAppFailure } from '../shared/index.js';
import { byAccessibilityId } from './locator.js';
import { clearScreenSink, find, registerScreenSink } from './locator-resolver.js';
import { resetWaitPolicy } from './wait-policy.js';

const findElement = $ as unknown as Mock;

function stubElement(waitForExist: Mock): unknown {
  return { waitForExist };
}

beforeEach(() => {
  vi.clearAllMocks();
  clearScreenSink();
  resetWaitPolicy();
});

describe('find', () => {
  it('queries the mapped selector and returns the element', async () => {
    const waitForExist = vi.fn().mockResolvedValue(true);
    findElement.mockResolvedValue(stubElement(waitForExist));

    const element = await find(byAccessibilityId('login-button'), 'LoginScreen');

    expect(findElement).toHaveBeenCalledWith('~login-button');
    expect(waitForExist).toHaveBeenCalledOnce();
    expect(element).toBeDefined();
  });

  it('pushes the screen name to the registered sink', async () => {
    findElement.mockResolvedValue(stubElement(vi.fn().mockResolvedValue(true)));
    const sink = vi.fn();
    registerScreenSink(sink);

    await find(byAccessibilityId('login-button'), 'LoginScreen');

    expect(sink).toHaveBeenCalledWith('LoginScreen');
  });

  it('works when no sink has been registered', async () => {
    findElement.mockResolvedValue(stubElement(vi.fn().mockResolvedValue(true)));

    await expect(find(byAccessibilityId('login-button'), 'LoginScreen')).resolves.toBeDefined();
  });

  it('does not fail the step when the sink throws', async () => {
    findElement.mockResolvedValue(stubElement(vi.fn().mockResolvedValue(true)));
    registerScreenSink(() => {
      throw new Error('evidence collector is down');
    });

    await expect(find(byAccessibilityId('login-button'), 'LoginScreen')).resolves.toBeDefined();
  });

  it('throws an AppFailure naming the screen and locator when the element never appears', async () => {
    findElement.mockResolvedValue(
      stubElement(vi.fn().mockRejectedValue(new Error('timeout after 10000ms'))),
    );

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
