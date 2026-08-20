import { describe, it, expect } from 'vitest';
import { isPlatformFailure } from '../shared/index.js';
import type { Run, RunModel, StepLog, TestCaseResult } from '../store/index.js';
import { buildReportModel } from './report-model.js';

function run(overrides: Partial<Run> = {}): Run {
  return {
    run_id: 'run-1',
    app_id: 'demo',
    app_version: '1.2.0',
    device_id: 'sim-1',
    device_type: 'simulator',
    os_version: '17.5',
    started_at: '2026-08-02T10:00:00.000Z',
    ended_at: '2026-08-02T10:00:05.000Z',
    total_duration_ms: 5000,
    completion: 'completed',
    aggregate_result: 'failed',
    scope_kind: 'full_suite',
    scope_criteria: null,
    not_run_count: 0,
    stop_reason: null,
    schema_version: 1,
    ...overrides,
  };
}

function tc(overrides: Partial<TestCaseResult>): TestCaseResult {
  return {
    id: 'r0',
    run_id: 'run-1',
    app_id: 'demo',
    test_feature: 'Login',
    test_case: 'a test case',
    status: 'passed',
    started_at: '2026-08-02T10:00:00.000Z',
    duration_ms: 1000,
    screen: null,
    failure_type: null,
    error_message: null,
    evidence_missing: 0,
    ...overrides,
  };
}

function step(overrides: Partial<StepLog>): StepLog {
  return {
    id: 's0',
    test_case_result_id: 'r0',
    step_order: 1,
    step_text: 'a step',
    result: 'passed',
    duration_ms: 100,
    error_message: null,
    screenshot_path: null,
    ...overrides,
  };
}

function repo(model: RunModel | null) {
  return { getRunModel: () => model };
}

const sample: RunModel = {
  run: run(),
  results: [
    tc({ id: 'r1', test_feature: 'Login', test_case: 'valid credentials', status: 'passed', duration_ms: 1000 }),
    tc({
      id: 'r2',
      test_feature: 'Login',
      test_case: 'locked account',
      status: 'failed',
      duration_ms: 1500,
      screen: 'LoginScreen',
      failure_type: 'wrong_conclusion',
      error_message: 'expected the error banner',
    }),
    tc({ id: 'r3', test_feature: 'Checkout', test_case: 'empty cart', status: 'passed_healed', duration_ms: 800 }),
  ],
  steps: [
    step({ id: 's1', test_case_result_id: 'r1', step_order: 1, step_text: 'I log in', result: 'passed' }),
    step({ id: 's2', test_case_result_id: 'r2', step_order: 1, step_text: 'I open login', result: 'passed' }),
    step({
      id: 's3',
      test_case_result_id: 'r2',
      step_order: 2,
      step_text: 'I submit locked credentials',
      result: 'failed',
      error_message: 'assertion failed',
      screenshot_path: '/output/demo/run-1/fail-step-2.png',
    }),
  ],
  heals: [],
};

describe('buildReportModel', () => {
  it('throws a PlatformFailure when the run does not exist', () => {
    try {
      buildReportModel('missing', repo(null));
      expect.unreachable('a missing run must throw');
    } catch (error) {
      expect(isPlatformFailure(error)).toBe(true);
    }
  });

  it('builds context totals across the three statuses', () => {
    const model = buildReportModel('run-1', repo(sample));

    expect(model.context.totals).toEqual({ total: 3, passed: 1, failed: 1, passed_healed: 1 });
    expect(model.context.app_version).toBe('1.2.0');
    expect(model.context.device_type).toBe('simulator');
  });

  it('groups the summary by test feature, preserving order', () => {
    const model = buildReportModel('run-1', repo(sample));

    expect(model.features.map((f) => f.test_feature)).toEqual(['Login', 'Checkout']);
    expect(model.features[0]?.test_cases).toEqual([
      { test_case: 'valid credentials', status: 'passed', duration_ms: 1000 },
      { test_case: 'locked account', status: 'failed', duration_ms: 1500 },
    ]);
  });

  it('details only failed test cases, with the failing-step screenshot and the log', () => {
    const model = buildReportModel('run-1', repo(sample));

    expect(model.failures).toHaveLength(1);
    const failure = model.failures[0];
    expect(failure).toMatchObject({
      test_feature: 'Login',
      test_case: 'locked account',
      screen: 'LoginScreen',
      failure_type: 'wrong_conclusion',
      error_message: 'expected the error banner',
      screenshot_path: '/output/demo/run-1/fail-step-2.png',
      evidence_missing: false,
    });
    expect(failure?.steps).toHaveLength(2);
  });

  it('marks evidence as missing and leaves no screenshot when a capture failed', () => {
    const model: RunModel = {
      run: run(),
      results: [
        tc({ id: 'r9', test_case: 'flaky', status: 'failed', evidence_missing: 1, error_message: 'boom' }),
      ],
      steps: [step({ id: 's9', test_case_result_id: 'r9', step_order: 1, result: 'failed' })],
      heals: [],
    };

    const failure = buildReportModel('run-1', repo(model)).failures[0];
    expect(failure?.evidence_missing).toBe(true);
    expect(failure?.screenshot_path).toBeNull();
  });

  it('carries the incomplete-run fields into the context', () => {
    const model: RunModel = {
      run: run({ completion: 'incomplete', not_run_count: 2, stop_reason: 'device_unavailable' }),
      results: [tc({ id: 'r1', test_case: 'one', status: 'passed' })],
      steps: [],
      heals: [],
    };

    const context = buildReportModel('run-1', repo(model)).context;
    expect(context.completion).toBe('incomplete');
    expect(context.not_run_count).toBe(2);
    expect(context.stop_reason).toBe('device_unavailable');
  });
});
