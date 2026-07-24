import { describe, it, expect } from 'vitest';
import Database from 'better-sqlite3';
import { applyMigrations } from './database.js';

function names(db: Database.Database, type: 'table' | 'index'): string[] {
  const rows = db
    .prepare('SELECT name FROM sqlite_master WHERE type = ?')
    .all(type) as Array<{ name: string }>;
  return rows.map((row) => row.name);
}

describe('applyMigrations', () => {
  it('creates the three entity tables and the Phase 3 indexes on an empty database', () => {
    const db = new Database(':memory:');
    applyMigrations(db);

    expect(names(db, 'table')).toEqual(
      expect.arrayContaining(['run', 'test_case_result', 'step_log', 'schema_migrations']),
    );
    expect(names(db, 'index')).toEqual(
      expect.arrayContaining(['idx_tcr_app_feature_case', 'idx_tcr_app_screen', 'idx_run_app_started']),
    );

    db.close();
  });

  it('is idempotent — running twice applies each migration once', () => {
    const db = new Database(':memory:');
    applyMigrations(db);
    applyMigrations(db);

    const versions = db.prepare('SELECT version FROM schema_migrations').all();
    expect(versions).toHaveLength(1);

    db.close();
  });

  it('enforces the status check constraint', () => {
    const db = new Database(':memory:');
    applyMigrations(db);
    db.prepare(
      `INSERT INTO run (run_id, app_id, app_version, device_id, device_type, os_version,
         started_at, completion, scope_kind, not_run_count, schema_version)
       VALUES ('r1', 'demo', '1.0', 'd1', 'simulator', '17.0', '2026-07-24T00:00:00Z',
         'completed', 'full_suite', 0, 1)`,
    ).run();

    const insertBadStatus = db.prepare(
      `INSERT INTO test_case_result (id, run_id, app_id, test_feature, test_case, status,
         started_at, duration_ms)
       VALUES ('t1', 'r1', 'demo', 'login', 'valid login', 'bogus', '2026-07-24T00:00:00Z', 10)`,
    );
    expect(() => insertBadStatus.run()).toThrow();

    db.close();
  });
});
