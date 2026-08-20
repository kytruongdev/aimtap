import { PlatformFailure, type DeviceType } from '../shared/index.js';
import type { Db } from './database.js';
import type {
  AggregateResult,
  HealEvent,
  RunCompletion,
  RunModel,
  ScopeKind,
  StepLog,
  StopReason,
  Run,
  TestCaseResult,
} from './models.js';

// Append-only access to the results database. Result records (TestCaseResult, StepLog) are
// insert-only and a new run never overwrites another run's data (FR-DATA-05, BR-009). The one
// mutation is finalizeRun, which completes the run's OWN summary row exactly once: the Run is
// inserted at open with completion='incomplete' (so TestCaseResult foreign keys resolve while the
// run is in progress), then finalized at close. A run interrupted before finalize stays
// 'incomplete' with its already-written test cases intact (BR-012).

export interface RunStart {
  run_id: string;
  app_id: string;
  app_version: string;
  device_id: string;
  device_type: DeviceType;
  os_version: string;
  started_at: string;
  scope_kind: ScopeKind;
  scope_criteria: string | null;
  schema_version: number;
}

export interface RunFinalize {
  run_id: string;
  ended_at: string;
  total_duration_ms: number;
  completion: RunCompletion;
  not_run_count: number;
  stop_reason: StopReason | null;
}

export interface RunRepository {
  saveRunStart(run: RunStart): void;
  finalizeRun(summary: RunFinalize): void;
  saveTestCaseResult(result: TestCaseResult, steps: StepLog[]): void;
  saveHealEvents(events: HealEvent[]): void;
  getRunModel(runId: string): RunModel | null;
}

export function createRunRepository(db: Db): RunRepository {
  const insertRun = db.prepare(
    `INSERT INTO run
       (run_id, app_id, app_version, device_id, device_type, os_version, started_at,
        completion, scope_kind, scope_criteria, schema_version)
     VALUES
       (@run_id, @app_id, @app_version, @device_id, @device_type, @os_version, @started_at,
        'incomplete', @scope_kind, @scope_criteria, @schema_version)`,
  );

  // ended_at IS NULL marks a run that has not been finalized yet, so a second finalize is a no-op
  // at SQL level and is turned into an explicit failure below.
  const finalizeRunStmt = db.prepare(
    `UPDATE run SET
       ended_at = @ended_at,
       total_duration_ms = @total_duration_ms,
       completion = @completion,
       aggregate_result = @aggregate_result,
       not_run_count = @not_run_count,
       stop_reason = @stop_reason
     WHERE run_id = @run_id AND ended_at IS NULL`,
  );

  const countFailing = db.prepare(
    `SELECT COUNT(*) AS n FROM test_case_result
     WHERE run_id = ? AND status NOT IN ('passed', 'passed_healed')`,
  );

  const insertResult = db.prepare(
    `INSERT INTO test_case_result
       (id, run_id, app_id, test_feature, test_case, status, started_at, duration_ms,
        screen, failure_type, error_message, evidence_missing)
     VALUES
       (@id, @run_id, @app_id, @test_feature, @test_case, @status, @started_at, @duration_ms,
        @screen, @failure_type, @error_message, @evidence_missing)`,
  );

  const insertStep = db.prepare(
    `INSERT INTO step_log
       (id, test_case_result_id, step_order, step_text, result, duration_ms,
        error_message, screenshot_path)
     VALUES
       (@id, @test_case_result_id, @step_order, @step_text, @result, @duration_ms,
        @error_message, @screenshot_path)`,
  );

  // heal_event is append-only and immutable (BR-207): insert-only, no update or delete path.
  const insertHeal = db.prepare(
    `INSERT INTO heal_event
       (id, test_case_result_id, step_order, screen, expected_locator, used_locator,
        screenshot_path, occurred_at)
     VALUES
       (@id, @test_case_result_id, @step_order, @screen, @expected_locator, @used_locator,
        @screenshot_path, @occurred_at)`,
  );

  const selectRun = db.prepare('SELECT * FROM run WHERE run_id = ?');
  const selectResults = db.prepare(
    'SELECT * FROM test_case_result WHERE run_id = ? ORDER BY started_at, id',
  );
  const selectSteps = db.prepare(
    `SELECT s.* FROM step_log s
       JOIN test_case_result t ON s.test_case_result_id = t.id
     WHERE t.run_id = ?
     ORDER BY t.id, s.step_order`,
  );
  // Grouped by test case (ordered by test_case_result_id) so the Reporter builds the "passed with
  // self-healing" label and heal entries per test case (US-7.4). Includes heals of failed test
  // cases too, since a heal can precede a later failure (BR-205).
  const selectHeals = db.prepare(
    `SELECT h.* FROM heal_event h
       JOIN test_case_result t ON h.test_case_result_id = t.id
     WHERE t.run_id = ?
     ORDER BY t.id, h.step_order, h.occurred_at`,
  );

  // One transaction per test case: the result and all its steps commit together or not at all.
  const saveResultTx = db.transaction((result: TestCaseResult, steps: StepLog[]) => {
    insertResult.run(result);
    for (const step of steps) insertStep.run(step);
  });

  // Append-only. As a better-sqlite3 transaction it is atomic on its own and nests as a savepoint
  // when the Evidence Collector (US-7.3) calls it inside the same test-case transaction.
  const saveHealsTx = db.transaction((events: HealEvent[]) => {
    for (const event of events) insertHeal.run(event);
  });

  return {
    saveRunStart(run) {
      insertRun.run(run);
    },

    finalizeRun(summary) {
      const failing = countFailing.get(summary.run_id) as { n: number };
      const aggregate_result: AggregateResult = failing.n > 0 ? 'failed' : 'passed';
      const outcome = finalizeRunStmt.run({ ...summary, aggregate_result });

      if (outcome.changes === 0) {
        const known = selectRun.get(summary.run_id) !== undefined;
        throw new PlatformFailure(
          known
            ? `Run ${summary.run_id} is already finalized`
            : `Run ${summary.run_id} does not exist`,
          { run_id: summary.run_id },
        );
      }
    },

    saveTestCaseResult(result, steps) {
      saveResultTx(result, steps);
    },

    saveHealEvents(events) {
      saveHealsTx(events);
    },

    getRunModel(runId) {
      const run = selectRun.get(runId) as Run | undefined;
      if (run === undefined) return null;
      const results = selectResults.all(runId) as TestCaseResult[];
      const steps = selectSteps.all(runId) as StepLog[];
      const heals = selectHeals.all(runId) as HealEvent[];
      return { run, results, steps, heals };
    },
  };
}
