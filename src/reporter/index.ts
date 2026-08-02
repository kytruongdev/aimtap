// Reporter — build the report model and render a one-file PNG/PDF (ADR-006, ADR-012).
// TICKET-024: report model from the Result Store. TICKET-025: HTML template + PNG/PDF render.
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
export type { ImageResolver, ReportFormat } from './report-html.js';

export { render } from './render.js';
