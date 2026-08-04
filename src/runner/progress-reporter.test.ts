import { describe, it, expect } from 'vitest';
import { ProgressTracker } from './progress-reporter.js';

describe('ProgressTracker', () => {
  it('shows the running test case and the completed/total counter', () => {
    const lines: string[] = [];
    const tracker = new ProgressTracker((line) => lines.push(line), 2);

    tracker.scenarioStart('Login', 'valid credentials');
    tracker.scenarioEnd('Login', 'valid credentials', 'passed');
    tracker.scenarioStart('Login', 'locked account');
    tracker.scenarioEnd('Login', 'locked account', 'failed');

    expect(lines).toEqual([
      '→ (0/2) Login › valid credentials',
      '[PASS] (1/2) Login › valid credentials',
      '→ (1/2) Login › locked account',
      '[FAIL] (2/2) Login › locked account',
    ]);
  });

  it('shows only the completed count when the total is unknown', () => {
    const lines: string[] = [];
    const tracker = new ProgressTracker((line) => lines.push(line));

    tracker.scenarioStart('Login', 'valid credentials');
    tracker.scenarioEnd('Login', 'valid credentials', 'passed');

    expect(lines).toEqual([
      '→ (0) Login › valid credentials',
      '[PASS] (1) Login › valid credentials',
    ]);
  });
});
