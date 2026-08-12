import fs from 'node:fs';
import path from 'node:path';
import { buildReportHtml, dataUriResolver, reportFilePath } from './report-html.js';
import type { ReportModel } from './report-model.js';

// TICKET-025: write the report as a single self-contained HTML file — the model rendered by
// report-html.ts with screenshots embedded as data URIs (ADR-006). One file per run, opens in any
// browser, attachable to a ticket by hand. Regenerated from stored data at any time, never re-running
// test cases (ADR-006). Replaces the earlier Puppeteer PNG/PDF render (reverses ADR-012): the HTML is
// already self-contained, so no headless browser / bundled Chromium is needed.

export function render(model: ReportModel, opts: { outputDir?: string } = {}): string {
  const outputDir = opts.outputDir ?? path.join(process.cwd(), 'output');
  const file = reportFilePath(model, outputDir);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, buildReportHtml(model, dataUriResolver()));
  return file;
}
