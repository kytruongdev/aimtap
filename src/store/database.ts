import fs from 'node:fs';
import path from 'node:path';
import Database from 'better-sqlite3';
import { migration001 } from './migrations/001-initial.js';

// Single SQLite results database for every app: data/database.db, WAL mode, append-only. Every row
// carries its own app_id, so one shared store holds all apps' run history. It lives under data/
// (durable), separate from output/ (disposable reports/screenshots), and is never deleted by tooling.
// Migrations run in order at startup, tracked in schema_migrations; a released migration is never edited.

export type Db = Database.Database;

export interface Migration {
  version: number;
  up(db: Db): void;
}

const migrations: Migration[] = [migration001];

function defaultDataDir(): string {
  return path.join(process.cwd(), 'data');
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

/** Open (creating the file and folder if needed) the shared results database, migrated and ready. */
export function openDatabase(dataDir: string = defaultDataDir()): Db {
  fs.mkdirSync(dataDir, { recursive: true });

  const db = new Database(path.join(dataDir, 'database.db'));
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  applyMigrations(db);
  return db;
}
