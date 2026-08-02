import fs from 'node:fs';
import path from 'node:path';
import puppeteer from 'puppeteer';
import {
  buildReportHtml,
  dataUriResolver,
  reportFilePath,
  type ReportFormat,
} from './report-html.js';
import type { ReportModel } from './report-model.js';

// TICKET-025: render the report HTML to a single PNG/PDF with Puppeteer's bundled Chromium (ADR-012),
// so a report looks the same on every QC machine. One file per run, attachable to Jira by hand
// (BC-05). Regenerated from stored data at any time, never re-running test cases (ADR-006).
//
// The pure parts (path, HTML, image embedding) live in report-html.ts and are unit-tested; the
// browser launch here is verified when a real run produces a report (conventions §3.1).

export async function render(
  model: ReportModel,
  format: ReportFormat,
  opts: { outputDir?: string } = {},
): Promise<string> {
  const outputDir = opts.outputDir ?? path.join(process.cwd(), 'output');
  const file = reportFilePath(model, format, outputDir);
  fs.mkdirSync(path.dirname(file), { recursive: true });

  const html = buildReportHtml(model, dataUriResolver());

  const browser = await puppeteer.launch({ headless: true });
  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'load' });
    if (format === 'pdf') {
      const bytes = await page.pdf({ format: 'A4', printBackground: true });
      fs.writeFileSync(file, bytes);
    } else {
      await page.setViewport({ width: 1024, height: 768 });
      const bytes = await page.screenshot({ fullPage: true });
      fs.writeFileSync(file, bytes);
    }
  } finally {
    await browser.close();
  }
  return file;
}
