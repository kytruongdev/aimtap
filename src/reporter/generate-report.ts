import { openDatabase, createRunRepository } from '../store/index.js';
import { buildReportModel } from './report-model.js';
import { toRunSummary, type RunSummary } from './run-summary.js';
import { render } from './render.js';

// TICKET-021/023 (SA review of US-4.3): report assembly belongs to the Reporter, not the CLI — the
// module-boundary matrix (ADR-014) allows reporter -> store but not cli -> store. The CLI (US-4.3
// end-of-run and `aimtap report <run-id>` in US-4.4) calls these. Results live in one shared Store
// (data/database.db) keyed by the globally-unique run-id, so a run resolves its own app from its row -
// no app-id needed and no scan across stores. The report is a single self-contained HTML file written
// under output/<app-id>/reports/; regenerated from stored data, never re-running test cases (ADR-006).

export async function generateReport(
  runId: string,
  outputDir: string,
  dataDir?: string,
): Promise<string> {
  const db = openDatabase(dataDir);
  try {
    const model = buildReportModel(runId, createRunRepository(db));
    return render(model, { outputDir });
  } finally {
    db.close();
  }
}

/**
 * Read one run's stored results and return a compact per-feature pass/fail summary (no rendering).
 * The CLI prints this after a run. Reporter reads the Store here; the CLI never does (ADR-014).
 */
export function summarizeRun(runId: string, dataDir?: string): RunSummary {
  const db = openDatabase(dataDir);
  try {
    return toRunSummary(buildReportModel(runId, createRunRepository(db)));
  } finally {
    db.close();
  }
}
