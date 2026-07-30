import { describe, it, expect } from 'vitest';
import { AppFailure, PlatformFailure } from '../shared/index.js';
import { classifyFailure } from './failure-classifier.js';

describe('classifyFailure', () => {
  it('maps an assertion failure to wrong_conclusion', () => {
    const result = classifyFailure(new AppFailure('wrong text', undefined, 'assertion'));
    expect(result.failure_type).toBe('wrong_conclusion');
    expect(result.error_message).toBe('wrong text');
  });

  it('maps a step-execution app failure to step_not_executed', () => {
    const result = classifyFailure(new AppFailure('Element not found on LoginScreen'));
    expect(result.failure_type).toBe('step_not_executed');
    expect(result.error_message).toBe('Element not found on LoginScreen');
  });

  it('maps an unknown error to step_not_executed and keeps its message', () => {
    const result = classifyFailure(new Error('socket hang up'));
    expect(result.failure_type).toBe('step_not_executed');
    expect(result.error_message).toBe('socket hang up');
  });

  it('handles a non-Error thrown value', () => {
    const result = classifyFailure('boom');
    expect(result.failure_type).toBe('step_not_executed');
    expect(result.error_message).toBe('boom');
  });

  it('maps a platform failure defensively to step_not_executed', () => {
    // The caller filters PlatformFailure before writing a test case result; this only guards the
    // case where one reaches the classifier anyway.
    const result = classifyFailure(new PlatformFailure('device not ready'));
    expect(result.failure_type).toBe('step_not_executed');
  });
});
