// Result Store — per-app SQLite results, append-only repository.
// TICKET-006: database bootstrap, migrations, models. TICKET-007: run repository.
export { openDatabase, applyMigrations } from './database.js';
export type { Db, Migration } from './database.js';
export * from './models.js';
export { createRunRepository } from './run-repository.js';
export type { RunRepository, RunStart, RunFinalize } from './run-repository.js';
