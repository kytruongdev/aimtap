// Reporter — build the report model and write a single self-contained HTML report (ADR-006).
// TICKET-024: report model from the Result Store. TICKET-025: HTML template + one-file HTML output.
export { buildReportModel } from './report-model.js';
export type {
  ReportModel,
  ReportContext,
  ReportTotals,
  ReportFeature,
  ReportTestCaseRow,
  ReportFailure,
  ReportStep,
} from './report-model.js';

export { buildReportHtml, dataUriResolver, reportFilePath } from './report-html.js';
export type { ImageResolver } from './report-html.js';

export { render } from './render.js';

export { generateReport, summarizeRun } from './generate-report.js';

// Per-feature terminal run summary (printed by the CLI after a run).
export { toRunSummary, formatRunSummary } from './run-summary.js';
export type { RunSummary, RunSummaryFeature, RunSummaryCase } from './run-summary.js';
