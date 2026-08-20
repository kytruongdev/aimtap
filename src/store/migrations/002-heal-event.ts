import type { Db, Migration } from '../database.js';

// Phase 2 adds heal_event: one row per self-healing occurrence, append-only and immutable (BR-207,
// ADR-024). It is a child of test_case_result (like step_log) and carries no app_id/run_id — queried
// per run via a join. This migration is purely additive: test_case_result keeps its permissive
// Phase 1 CHECK (the two-value status axis is narrowed at the TypeScript layer in US-7.4), and
// migration 001 is never edited (ADR-020).

const DDL = `
CREATE TABLE heal_event (
  id TEXT PRIMARY KEY,
  test_case_result_id TEXT NOT NULL REFERENCES test_case_result(id),
  step_order INTEGER NOT NULL,
  screen TEXT NOT NULL,
  expected_locator TEXT NOT NULL,
  used_locator TEXT NOT NULL,
  screenshot_path TEXT,
  occurred_at TEXT NOT NULL
);

CREATE INDEX idx_heal_tcr ON heal_event (test_case_result_id);
`;

export const migration002: Migration = {
  version: 2,
  up(db: Db): void {
    db.exec(DDL);
  },
};
