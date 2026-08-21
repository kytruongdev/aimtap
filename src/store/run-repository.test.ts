import { describe, it, expect } from 'vitest';
import Database from 'better-sqlite3';
import { isPlatformFailure } from '../shared/index.js';
import { applyMigrations } from './database.js';
import { createRunRepository, type RunFinalize, type RunStart } from './run-repository.js';
import { SCHEMA_VERSION, type HealEvent, type StepLog, type TestCaseResult } from './models.js';

function freshRepo() {
  const db = new Database(':memory:');
  db.pragma('foreign_keys = ON');
  applyMigrations(db);
  return createRunRepository(db);
}

function freshDbAndRepo() {
  const db = new Database(':memory:');
  db.pragma('foreign_keys = ON');
  applyMigrations(db);
  return { db, repo: createRunRepository(db) };
}

function makeHeal(overrides: Partial<HealEvent> = {}): HealEvent {
  return {
    id: 'h-1',
    test_case_result_id: 'tc-1',
    step_order: 2,
    screen: 'LoginScreen',
    expected_locator: 'old-locator',
    used_locator: 'new-locator',
    screenshot_path: null,
    occurred_at: '2026-07-24T10:00:02.000Z',
    ...overrides,
  };
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

const finalize: RunFinalize = {
  run_id: 'r1',
  ended_at: '2026-07-24T10:05:00.000Z',
  total_duration_ms: 300000,
  completion: 'completed',
  not_run_count: 0,
  stop_reason: null,
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

    repo.finalizeRun(finalize);

    expect(repo.getRunModel('r1')?.run.aggregate_result).toBe('failed');
  });

  it('finalizes aggregate_result = passed when all test cases passed', () => {
    const repo = freshRepo();
    repo.saveRunStart(runStart);
    repo.saveTestCaseResult(makeResult({ id: 'tc-1', status: 'passed' }), []);
    repo.saveTestCaseResult(makeResult({ id: 'tc-2', status: 'passed' }), []);

    repo.finalizeRun(finalize);

    const run = repo.getRunModel('r1')?.run;
    expect(run?.aggregate_result).toBe('passed');
    expect(run?.completion).toBe('completed');
  });

  it('rejects overwriting an existing run', () => {
    const repo = freshRepo();
    repo.saveRunStart(runStart);
    expect(() => repo.saveRunStart(runStart)).toThrow();
  });

  it('rejects finalizing a run that does not exist', () => {
    const repo = freshRepo();
    try {
      repo.finalizeRun(finalize);
      throw new Error('expected finalizeRun to throw');
    } catch (error) {
      expect(isPlatformFailure(error)).toBe(true);
      expect((error as Error).message).toContain('does not exist');
    }
  });

  it('rejects finalizing the same run twice', () => {
    const repo = freshRepo();
    repo.saveRunStart(runStart);
    repo.finalizeRun(finalize);

    try {
      repo.finalizeRun(finalize);
      throw new Error('expected the second finalizeRun to throw');
    } catch (error) {
      expect(isPlatformFailure(error)).toBe(true);
      expect((error as Error).message).toContain('already finalized');
    }
  });
});

describe('heal events', () => {
  it('stores multiple heal events and reads them back for the run', () => {
    const repo = freshRepo();
    repo.saveRunStart(runStart);
    repo.saveTestCaseResult(makeResult(), []);
    repo.saveHealEvents([
      makeHeal({ id: 'h-1', step_order: 2, expected_locator: 'a', used_locator: 'b' }),
      makeHeal({ id: 'h-2', step_order: 4, expected_locator: 'c', used_locator: 'd' }),
    ]);

    const heals = repo.getRunModel('r1')?.heals ?? [];
    expect(heals.map((h) => h.id)).toEqual(['h-1', 'h-2']);
    expect(heals[0]?.expected_locator).toBe('a');
    expect(heals[0]?.used_locator).toBe('b');
    expect(heals[1]?.step_order).toBe(4);
  });

  it('returns heals grouped by test case, including a failed test case with a heal (BR-205)', () => {
    const repo = freshRepo();
    repo.saveRunStart(runStart);
    repo.saveTestCaseResult(makeResult({ id: 'tc-1', status: 'passed' }), []);
    repo.saveTestCaseResult(
      makeResult({ id: 'tc-2', status: 'failed', failure_type: 'step_not_executed' }),
      [],
    );
    // Insert out of order to prove getRunModel groups/orders by test_case_result_id.
    repo.saveHealEvents([makeHeal({ id: 'h-2', test_case_result_id: 'tc-2' })]);
    repo.saveHealEvents([makeHeal({ id: 'h-1', test_case_result_id: 'tc-1' })]);

    const heals = repo.getRunModel('r1')?.heals ?? [];
    expect(heals.map((h) => h.test_case_result_id)).toEqual(['tc-1', 'tc-2']);
    // The failed test case still carries its heal.
    expect(heals.find((h) => h.test_case_result_id === 'tc-2')?.id).toBe('h-2');
  });

  it('writes heal events in the same transaction as the test case result', () => {
    const { db, repo } = freshDbAndRepo();
    repo.saveRunStart(runStart);

    // A heal with a NOT NULL violation fails; wrapping both calls in one transaction must roll the
    // test case result back too (this is how the Evidence Collector coordinates the write in US-7.3).
    const badHeal = makeHeal({ screen: null as unknown as string });
    const writeBoth = db.transaction(() => {
      repo.saveTestCaseResult(makeResult(), []);
      repo.saveHealEvents([badHeal]);
    });

    expect(() => writeBoth()).toThrow();

    const model = repo.getRunModel('r1');
    expect(model?.results).toHaveLength(0);
    expect(model?.heals).toHaveLength(0);
  });

  it('transaction() commits the test case and its heals together', () => {
    const repo = freshRepo();
    repo.saveRunStart(runStart);

    repo.transaction(() => {
      repo.saveTestCaseResult(makeResult(), []);
      repo.saveHealEvents([makeHeal()]);
    });

    const model = repo.getRunModel('r1');
    expect(model?.results).toHaveLength(1);
    expect(model?.heals).toHaveLength(1);
  });

  it('transaction() rolls back the test case when a heal write fails', () => {
    const repo = freshRepo();
    repo.saveRunStart(runStart);

    const badHeal = makeHeal({ screen: null as unknown as string });
    expect(() =>
      repo.transaction(() => {
        repo.saveTestCaseResult(makeResult(), []);
        repo.saveHealEvents([badHeal]);
      }),
    ).toThrow();

    const model = repo.getRunModel('r1');
    expect(model?.results).toHaveLength(0);
    expect(model?.heals).toHaveLength(0);
  });
});
