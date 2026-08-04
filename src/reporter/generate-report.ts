import fs from 'node:fs';
import path from 'node:path';
import { PlatformFailure } from '../shared/index.js';
import { openDatabase, createRunRepository } from '../store/index.js';
import { buildReportModel } from './report-model.js';
import { render } from './render.js';
import type { ReportFormat } from './report-html.js';

// TICKET-021/023 (SA review of US-4.3): report assembly belongs to the Reporter, not the CLI —
// the module-boundary matrix (ADR-014) allows reporter -> store but not cli -> store. The CLI (US-4.3
// end-of-run and `aimtap report <run-id>` in US-4.4) calls these; opening the Result Store and
// rendering stay inside the Reporter. Regenerated from stored data, never re-running test cases
// (ADR-006).

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

/**
 * Find which app's Result Store holds a run. Results live per app at
 * output/<app-id>/results.db (ADR-002/ADR-009), so `aimtap report <run-id>` resolves the app by
 * looking through the existing stores. Only databases that already exist are opened — never created.
 */
export function findAppForRun(runId: string, outputDir: string): string | null {
  if (!fs.existsSync(outputDir)) return null;

  for (const entry of fs.readdirSync(outputDir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    if (!fs.existsSync(path.join(outputDir, entry.name, 'results.db'))) continue;

    const db = openDatabase(entry.name, outputDir);
    try {
      if (createRunRepository(db).getRunModel(runId) !== null) return entry.name;
    } finally {
      db.close();
    }
  }
  return null;
}

/** Resolve the app from the run-id, then render the report. Throws when the run does not exist. */
export async function generateReportForRun(
  runId: string,
  outputDir: string,
  format: ReportFormat = 'pdf',
): Promise<string> {
  const appId = findAppForRun(runId, outputDir);
  if (appId === null) {
    throw new PlatformFailure(`Run ${runId} was not found in ${outputDir}`, { run_id: runId });
  }
  return generateReport(appId, runId, outputDir, format);
}
