import { openDatabase, createRunRepository } from '../store/index.js';
import { buildReportModel } from './report-model.js';
import { render } from './render.js';
import type { ReportFormat } from './report-html.js';

// TICKET-021/023 (SA review of US-4.3): report assembly belongs to the Reporter, not the CLI —
// the module-boundary matrix (ADR-014) allows reporter -> store but not cli -> store. The CLI (and
// `aimtap report <run-id>` in US-4.4) call this one function; opening the Result Store and rendering
// stay inside the Reporter. Regenerated from stored data, never re-running test cases (ADR-006).

export async function generateReport(
  appId: string,
  runId: string,
  outputDir: string,
  format: ReportFormat = 'pdf',
): Promise<string> {
  const db = openDatabase(appId, outputDir);
  try {
    const model = buildReportModel(runId, createRunRepository(db));
    return await render(model, format, { outputDir });
  } finally {
    db.close();
  }
}
