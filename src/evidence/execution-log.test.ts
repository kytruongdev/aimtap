import { describe, it, expect } from 'vitest';
import { createExecutionLog } from './execution-log.js';

describe('execution log', () => {
  it('keeps steps in order and numbers them from one', () => {
    const log = createExecutionLog();
    log.record({ step_text: 'the user opens the app', result: 'passed', duration_ms: 300 });
    log.record({ step_text: 'the user signs in', result: 'passed', duration_ms: 900 });

    expect(log.steps().map((step) => [step.step_order, step.step_text])).toEqual([
      [1, 'the user opens the app'],
      [2, 'the user signs in'],
    ]);
  });

  it('keeps the original error only on the failing step', () => {
    const log = createExecutionLog();
    log.record({ step_text: 'the user signs in', result: 'passed', duration_ms: 900 });
    log.record({
      step_text: 'the home screen is shown',
      result: 'failed',
      duration_ms: 10_000,
      error_message: 'Element not found on HomeScreen',
      screenshot_path: 'screenshots/run-1/home_step_2.png',
    });

    const [first, second] = log.steps();
    expect(first?.error_message).toBeNull();
    expect(first?.screenshot_path).toBeNull();
    expect(second?.error_message).toBe('Element not found on HomeScreen');
    expect(second?.screenshot_path).toBe('screenshots/run-1/home_step_2.png');
  });

  it('returns a copy so callers cannot mutate the log', () => {
    const log = createExecutionLog();
    log.record({ step_text: 'a step', result: 'passed', duration_ms: 1 });
    log.steps().push({
      step_order: 99,
      step_text: 'injected',
      result: 'passed',
      duration_ms: 0,
      error_message: null,
      screenshot_path: null,
    });

    expect(log.steps()).toHaveLength(1);
  });
});
