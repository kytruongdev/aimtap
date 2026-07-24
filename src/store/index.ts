// Result Store — per-app SQLite results, append-only repository.
// TICKET-006: database bootstrap, migrations, models. TICKET-007 adds the run repository.
export { openDatabase, applyMigrations } from './database.js';
export type { Db, Migration } from './database.js';
export * from './models.js';
