import { describe, it, expect } from 'vitest';
import Database from 'better-sqlite3';
import { applyMigrations } from './database.js';
import { migration001 } from './migrations/001-initial.js';

function names(db: Database.Database, type: 'table' | 'index'): string[] {
  const rows = db
    .prepare('SELECT name FROM sqlite_master WHERE type = ?')
    .all(type) as Array<{ name: string }>;
  return rows.map((row) => row.name);
}

/** Seed a database that is already at schema version 1, without running later migrations. */
function dbAtVersion1(): Database.Database {
  const db = new Database(':memory:');
  db.pragma('foreign_keys = ON');
  db.exec(
    `CREATE TABLE schema_migrations (version INTEGER PRIMARY KEY, applied_at TEXT NOT NULL);`,
  );
  migration001.up(db);
  db.prepare('INSERT INTO schema_migrations (version, applied_at) VALUES (1, ?)').run(
    '2026-07-24T00:00:00Z',
  );
  return db;
}

/** Insert a run and a test_case_result so heal_event foreign keys resolve. */
function seedParentRow(db: Database.Database): void {
  db.prepare(
    `INSERT INTO run (run_id, app_id, app_version, device_id, device_type, os_version,
       started_at, completion, scope_kind, not_run_count, schema_version)
     VALUES ('r1', 'demo', '1.0', 'd1', 'simulator', '17.0', '2026-07-24T00:00:00Z',
       'completed', 'full_suite', 0, 1)`,
  ).run();
  db.prepare(
    `INSERT INTO test_case_result (id, run_id, app_id, test_feature, test_case, status,
       started_at, duration_ms)
     VALUES ('t1', 'r1', 'demo', 'login', 'valid login', 'passed', '2026-07-24T00:00:00Z', 10)`,
  ).run();
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
    expect(versions).toHaveLength(2);

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

describe('migration 002 — heal_event', () => {
  it('adds the heal_event table and its index on an empty database, reaching version 2', () => {
    const db = new Database(':memory:');
    applyMigrations(db);

    expect(names(db, 'table')).toEqual(expect.arrayContaining(['heal_event']));
    expect(names(db, 'index')).toEqual(expect.arrayContaining(['idx_heal_tcr']));

    const versions = (
      db.prepare('SELECT version FROM schema_migrations ORDER BY version').all() as Array<{
        version: number;
      }>
    ).map((row) => row.version);
    expect(versions).toEqual([1, 2]);

    db.close();
  });

  it('upgrades a database already at version 1 to version 2', () => {
    const db = dbAtVersion1();
    expect(names(db, 'table')).not.toContain('heal_event');

    applyMigrations(db);

    expect(names(db, 'table')).toContain('heal_event');
    const versions = (
      db.prepare('SELECT version FROM schema_migrations ORDER BY version').all() as Array<{
        version: number;
      }>
    ).map((row) => row.version);
    expect(versions).toEqual([1, 2]);

    db.close();
  });

  it('allows a null screenshot_path (auxiliary evidence may be absent)', () => {
    const db = new Database(':memory:');
    db.pragma('foreign_keys = ON');
    applyMigrations(db);
    seedParentRow(db);

    expect(() =>
      db
        .prepare(
          `INSERT INTO heal_event (id, test_case_result_id, step_order, screen,
             expected_locator, used_locator, screenshot_path, occurred_at)
           VALUES ('h1', 't1', 2, 'LoginScreen', 'old', 'new', NULL, '2026-07-24T00:00:01Z')`,
        )
        .run(),
    ).not.toThrow();

    db.close();
  });

  it('rejects a heal_event whose test_case_result_id has no parent row', () => {
    const db = new Database(':memory:');
    db.pragma('foreign_keys = ON');
    applyMigrations(db);

    expect(() =>
      db
        .prepare(
          `INSERT INTO heal_event (id, test_case_result_id, step_order, screen,
             expected_locator, used_locator, screenshot_path, occurred_at)
           VALUES ('h1', 'ghost', 1, 'LoginScreen', 'old', 'new', NULL, '2026-07-24T00:00:01Z')`,
        )
        .run(),
    ).toThrow();

    db.close();
  });
});
