import { describe, it, expect } from 'vitest';
import { assertExpectation } from './assertion.js';
import { AppFailure, PlatformFailure, isAppFailure } from './errors.js';

describe('assertExpectation', () => {
  it('passes silently when the assertion holds', async () => {
    await expect(assertExpectation(() => undefined)).resolves.toBeUndefined();
  });

  it('rethrows a failed assertion as an AppFailure tagged assertion', async () => {
    try {
      await assertExpectation(() => {
        throw new Error('expected "Welcome" but got "Hello"');
      });
      throw new Error('expected assertExpectation to throw');
    } catch (error) {
      expect(isAppFailure(error)).toBe(true);
      expect((error as AppFailure).kind).toBe('assertion');
      expect((error as Error).message).toBe('expected "Welcome" but got "Hello"');
    }
  });

  it('passes an existing AppFailure through unchanged', async () => {
    const original = new AppFailure('element not found');
    try {
      await assertExpectation(() => {
        throw original;
      });
      throw new Error('expected assertExpectation to throw');
    } catch (error) {
      expect(error).toBe(original);
      expect((error as AppFailure).kind).toBe('step_execution');
    }
  });

  it('passes a PlatformFailure through unchanged, never rewrapping it as an assertion', async () => {
    const original = new PlatformFailure('session gone');
    try {
      await assertExpectation(() => {
        throw original;
      });
      throw new Error('expected assertExpectation to throw');
    } catch (error) {
      expect(error).toBe(original);
      expect(isAppFailure(error)).toBe(false);
    }
  });
});
