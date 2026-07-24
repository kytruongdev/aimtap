import { describe, it, expect } from 'vitest';
import Database from 'better-sqlite3';
import { applyMigrations } from './database.js';
import { createRunRepository, type RunStart } from './run-repository.js';
import { SCHEMA_VERSION, type StepLog, type TestCaseResult } from './models.js';

function freshRepo() {
  const db = new Database(':memory:');
  db.pragma('foreign_keys = ON');
  applyMigrations(db);
  return createRunRepository(db);
}

const runStart: RunStart = {
  run_id: 'r1',
  app_id: 'demo',
  app_version: '1.0.0',
  device_id: 'sim-1',
  device_type: 'simulator',
  os_version: '17.0',
  started_at: '2026-07-24T10:00:00.000Z',
  scope_kind: 'full_suite',
  scope_criteria: null,
  schema_version: SCHEMA_VERSION,
};

function makeResult(overrides: Partial<TestCaseResult> = {}): TestCaseResult {
  return {
    id: 'tc-1',
    run_id: 'r1',
    app_id: 'demo',
    test_feature: 'login',
    test_case: 'valid login',
    status: 'passed',
    started_at: '2026-07-24T10:00:01.000Z',
    duration_ms: 1200,
    screen: null,
    failure_type: null,
    error_message: null,
    evidence_missing: 0,
    ...overrides,
  };
}

function makeStep(overrides: Partial<StepLog> = {}): StepLog {
  return {
    id: 'st-1',
    test_case_result_id: 'tc-1',
    step_order: 1,
    step_text: 'the user signs in with valid credentials',
    result: 'passed',
    duration_ms: 400,
    error_message: null,
    screenshot_path: null,
    ...overrides,
  };
}

describe('run repository', () => {
  it('opens a run as incomplete with no aggregate yet', () => {
    const repo = freshRepo();
    repo.saveRunStart(runStart);

    const model = repo.getRunModel('r1');
    expect(model).not.toBeNull();
    expect(model?.run.completion).toBe('incomplete');
    expect(model?.run.aggregate_result).toBeNull();
    expect(model?.results).toHaveLength(0);
  });

  it('stores a test case with its steps and reads them back in order', () => {
    const repo = freshRepo();
    repo.saveRunStart(runStart);
    repo.saveTestCaseResult(makeResult(), [
      makeStep({ id: 'st-1', step_order: 1 }),
      makeStep({ id: 'st-2', step_order: 2, step_text: 'the home screen is shown' }),
    ]);

    const model = repo.getRunModel('r1');
    expect(model?.results).toHaveLength(1);
    expect(model?.steps.map((s) => s.step_order)).toEqual([1, 2]);
  });

  it('writes a test case and its steps atomically', () => {
    const repo = freshRepo();
    repo.saveRunStart(runStart);

    const badStep = makeStep({ result: 'invalid' as unknown as StepLog['result'] });
    expect(() => repo.saveTestCaseResult(makeResult(), [badStep])).toThrow();

    // The result must have rolled back with its failing step.
    expect(repo.getRunModel('r1')?.results).toHaveLength(0);
  });

  it('finalizes aggregate_result = failed when any test case failed', () => {
    const repo = freshRepo();
    repo.saveRunStart(runStart);
    repo.saveTestCaseResult(makeResult({ id: 'tc-1', status: 'passed' }), []);
    repo.saveTestCaseResult(
      makeResult({
        id: 'tc-2',
        status: 'failed',
        screen: 'LoginScreen',
        failure_type: 'wrong_conclusion',
        error_message: 'expected home screen',
      }),
      [],
    );

    repo.finalizeRun({
      run_id: 'r1',
      ended_at: '2026-07-24T10:05:00.000Z',
      total_duration_ms: 300000,
      completion: 'completed',
      not_run_count: 0,
      stop_reason: null,
    });

    expect(repo.getRunModel('r1')?.run.aggregate_result).toBe('failed');
  });

  it('finalizes aggregate_result = passed when all test cases passed or self-healed', () => {
    const repo = freshRepo();
    repo.saveRunStart(runStart);
    repo.saveTestCaseResult(makeResult({ id: 'tc-1', status: 'passed' }), []);
    repo.saveTestCaseResult(makeResult({ id: 'tc-2', status: 'passed_healed' }), []);

    repo.finalizeRun({
      run_id: 'r1',
      ended_at: '2026-07-24T10:05:00.000Z',
      total_duration_ms: 120000,
      completion: 'completed',
      not_run_count: 0,
      stop_reason: null,
    });

    const run = repo.getRunModel('r1')?.run;
    expect(run?.aggregate_result).toBe('passed');
    expect(run?.completion).toBe('completed');
  });

  it('rejects overwriting an existing run', () => {
    const repo = freshRepo();
    repo.saveRunStart(runStart);
    expect(() => repo.saveRunStart(runStart)).toThrow();
  });
});
