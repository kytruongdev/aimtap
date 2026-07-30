import { describe, it, expect } from 'vitest';
import {
  AppFailure,
  PlatformFailure,
  isAppFailure,
  isPlatformFailure,
} from './errors.js';

describe('failure branches', () => {
  it('distinguishes AppFailure from PlatformFailure', () => {
    const app = new AppFailure('login assertion failed');
    const platform = new PlatformFailure('device not ready');

    expect(isAppFailure(app)).toBe(true);
    expect(isPlatformFailure(app)).toBe(false);
    expect(isPlatformFailure(platform)).toBe(true);
    expect(isAppFailure(platform)).toBe(false);
  });

  it('is an Error and keeps message and context', () => {
    const error = new AppFailure('boom', { step: 3 });
    expect(error).toBeInstanceOf(Error);
    expect(error.message).toBe('boom');
    expect(error.context).toEqual({ step: 3 });
  });

  it('leaves context undefined when not provided', () => {
    expect(new PlatformFailure('no context').context).toBeUndefined();
  });

  it('defaults an app failure kind to step_execution (ADR-016)', () => {
    expect(new AppFailure('element not found').kind).toBe('step_execution');
  });

  it('carries an explicit assertion kind', () => {
    expect(new AppFailure('wrong text', undefined, 'assertion').kind).toBe('assertion');
  });
});
