import fs from 'node:fs';
import path from 'node:path';
import Database from 'better-sqlite3';
import { migration001 } from './migrations/001-initial.js';

// Per-app SQLite results database (ADR-003): output/<app-id>/results.db, WAL mode, append-only.
// Migrations run in order at startup, tracked in schema_migrations; a released migration is never edited.

export type Db = Database.Database;

export interface Migration {
  version: number;
  up(db: Db): void;
}

const migrations: Migration[] = [migration001];

function defaultOutputDir(): string {
  return path.join(process.cwd(), 'output');
}

/** Apply every pending migration in version order, inside a single transaction. Idempotent. */
export function applyMigrations(db: Db): void {
  db.exec(
    `CREATE TABLE IF NOT EXISTS schema_migrations (
       version INTEGER PRIMARY KEY,
       applied_at TEXT NOT NULL
     );`,
  );

  const appliedRows = db
    .prepare('SELECT version FROM schema_migrations')
    .all() as Array<{ version: number }>;
  const applied = new Set(appliedRows.map((row) => row.version));

  const pending = migrations
    .filter((migration) => !applied.has(migration.version))
    .sort((a, b) => a.version - b.version);

  const record = db.prepare('INSERT INTO schema_migrations (version, applied_at) VALUES (?, ?)');
  const apply = db.transaction(() => {
    for (const migration of pending) {
      migration.up(db);
      record.run(migration.version, new Date().toISOString());
    }
  });
  apply();
}

/** Open (creating the file and folder if needed) the results database of one app, migrated and ready. */
export function openDatabase(appId: string, outputDir: string = defaultOutputDir()): Db {
  const appDir = path.join(outputDir, appId);
  fs.mkdirSync(appDir, { recursive: true });

  const db = new Database(path.join(appDir, 'results.db'));
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  applyMigrations(db);
  return db;
}
