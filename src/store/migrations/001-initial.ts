import type { Db, Migration } from '../database.js';

// Initial schema: Run, TestCaseResult, StepLog (erd.md) plus the Phase 3 query indexes.
// Never edit a released migration — schema changes ship as a new numbered migration (ADR-003).

const DDL = `
CREATE TABLE run (
  run_id TEXT PRIMARY KEY,
  app_id TEXT NOT NULL,
  app_version TEXT NOT NULL,
  device_id TEXT NOT NULL,
  device_type TEXT NOT NULL CHECK (device_type IN ('real', 'simulator')),
  os_version TEXT NOT NULL,
  started_at TEXT NOT NULL,
  ended_at TEXT,
  total_duration_ms INTEGER,
  completion TEXT NOT NULL CHECK (completion IN ('completed', 'incomplete')),
  aggregate_result TEXT CHECK (aggregate_result IN ('passed', 'failed')),
  scope_kind TEXT NOT NULL CHECK (scope_kind IN ('full_suite', 'subset')),
  scope_criteria TEXT,
  not_run_count INTEGER NOT NULL DEFAULT 0,
  stop_reason TEXT CHECK (stop_reason IN ('cancelled_by_qc', 'device_unavailable')),
  schema_version INTEGER NOT NULL
);

CREATE TABLE test_case_result (
  id TEXT PRIMARY KEY,
  run_id TEXT NOT NULL REFERENCES run(run_id),
  app_id TEXT NOT NULL,
  test_feature TEXT NOT NULL,
  test_case TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('passed', 'failed', 'passed_healed')),
  started_at TEXT NOT NULL,
  duration_ms INTEGER NOT NULL,
  screen TEXT,
  failure_type TEXT CHECK (failure_type IN ('wrong_conclusion', 'step_not_executed')),
  error_message TEXT,
  evidence_missing INTEGER NOT NULL DEFAULT 0 CHECK (evidence_missing IN (0, 1))
);

CREATE TABLE step_log (
  id TEXT PRIMARY KEY,
  test_case_result_id TEXT NOT NULL REFERENCES test_case_result(id),
  step_order INTEGER NOT NULL,
  step_text TEXT NOT NULL,
  result TEXT NOT NULL CHECK (result IN ('passed', 'failed')),
  duration_ms INTEGER NOT NULL,
  error_message TEXT,
  screenshot_path TEXT
);

CREATE INDEX idx_tcr_app_feature_case ON test_case_result (app_id, test_feature, test_case);
CREATE INDEX idx_tcr_app_screen ON test_case_result (app_id, screen);
CREATE INDEX idx_run_app_started ON run (app_id, started_at);
`;

export const migration001: Migration = {
  version: 1,
  up(db: Db): void {
    db.exec(DDL);
  },
};
