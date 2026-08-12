import nodeFs from 'node:fs';
import nodePath from 'node:path';
import type { ReportModel, ReportFailure, ReportStep } from './report-model.js';

// TICKET-025: build the one-file HTML document from the report model (ADR-006). Pure and testable;
// render.ts writes this HTML straight to a single self-contained .html file (screenshots embedded as
// data URIs, so there is no separate image file and no browser render). The template is controlled by
// the platform so it can carry the project-specific content: the summary grouped by test feature, and
// for each failed test case the failing-step screenshot, execution log, screen, failure type and
// original error message. Missing evidence is shown as missing, never left blank (BR-004).

/** Resolves a stored screenshot path to an <img> src (a data URI in a real render), or null. */
export type ImageResolver = (screenshotPath: string) => string | null;

const ENTITIES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

function esc(value: string): string {
  return value.replace(/[&<>"']/g, (char) => ENTITIES[char] ?? char);
}

function orDash(value: string | null): string {
  return value === null || value === '' ? '—' : esc(value);
}

const STYLE = `
  body { font-family: -apple-system, Arial, sans-serif; color: #1a1a1a; margin: 24px; }
  h1 { font-size: 20px; } h2 { font-size: 17px; margin-top: 28px; } h3 { font-size: 15px; }
  table { border-collapse: collapse; width: 100%; margin: 8px 0; }
  th, td { border: 1px solid #ddd; padding: 6px 10px; text-align: left; font-size: 13px; }
  .status-passed { color: #1a7f37; } .status-failed { color: #b3261e; }
  .status-passed_healed { color: #9a6700; }
  .banner { background: #fff4e5; border: 1px solid #e0b000; padding: 8px 12px; margin: 12px 0; }
  .missing { color: #b3261e; font-style: italic; }
  .failure { border-top: 2px solid #eee; padding-top: 12px; margin-top: 16px; }
  img.shot { max-width: 420px; border: 1px solid #ccc; }
`;

function contextSection(model: ReportModel): string {
  const c = model.context;
  const incomplete =
    c.completion === 'incomplete'
      ? `<div class="banner">Incomplete run — stopped: ${orDash(c.stop_reason)}; not run: ${c.not_run_count}</div>`
      : '';
  return `
    <h1>Test Run Report</h1>
    <p>Run <code>${esc(model.run_id)}</code></p>
    ${incomplete}
    <table>
      <tr><th>App</th><td>${esc(c.app_id)} (${esc(c.app_version)})</td>
          <th>Device</th><td>${esc(c.device_id)} · ${esc(c.device_type)} · iOS ${esc(c.os_version)}</td></tr>
      <tr><th>Started</th><td>${esc(c.started_at)}</td>
          <th>Duration</th><td>${c.total_duration_ms ?? '—'} ms</td></tr>
      <tr><th>Result</th><td>${orDash(c.aggregate_result)}</td>
          <th>Completion</th><td>${esc(c.completion)}</td></tr>
    </table>
    <p>Total ${c.totals.total} · Passed ${c.totals.passed} · Failed ${c.totals.failed} · Passed (healed) ${c.totals.passed_healed}</p>
  `;
}

function summarySection(model: ReportModel): string {
  const features = model.features
    .map((feature) => {
      const rows = feature.test_cases
        .map(
          (row) =>
            `<tr><td>${esc(row.test_case)}</td><td class="status-${row.status}">${esc(row.status)}</td><td>${row.duration_ms} ms</td></tr>`,
        )
        .join('');
      return `<h3>${esc(feature.test_feature)}</h3>
        <table><tr><th>Test case</th><th>Status</th><th>Duration</th></tr>${rows}</table>`;
    })
    .join('');
  return `<h2>Summary by test feature</h2>${features}`;
}

function screenshotBlock(failure: ReportFailure, resolveImage: ImageResolver): string {
  const src = failure.screenshot_path === null ? null : resolveImage(failure.screenshot_path);
  if (src !== null) return `<img class="shot" src="${esc(src)}" alt="failing step" />`;
  if (failure.evidence_missing) return `<p class="missing">Screenshot missing (capture failed)</p>`;
  return `<p class="missing">No screenshot</p>`;
}

function stepsTable(steps: ReportStep[]): string {
  const rows = steps
    .map(
      (step) =>
        `<tr><td>${step.step_order}</td><td>${esc(step.step_text)}</td><td class="status-${step.result}">${esc(step.result)}</td><td>${step.duration_ms} ms</td><td>${orDash(step.error_message)}</td></tr>`,
    )
    .join('');
  return `<table><tr><th>#</th><th>Step</th><th>Result</th><th>Duration</th><th>Error</th></tr>${rows}</table>`;
}

function failuresSection(model: ReportModel, resolveImage: ImageResolver): string {
  if (model.failures.length === 0) return '';
  const blocks = model.failures
    .map(
      (failure) => `
      <div class="failure">
        <h3>${esc(failure.test_feature)} › ${esc(failure.test_case)}</h3>
        <p>Screen: ${orDash(failure.screen)} · Failure type: ${orDash(failure.failure_type)}</p>
        <p>Error: ${orDash(failure.error_message)}</p>
        ${screenshotBlock(failure, resolveImage)}
        <h4>Execution log</h4>
        ${stepsTable(failure.steps)}
      </div>`,
    )
    .join('');
  return `<h2>Failures</h2>${blocks}`;
}

export function buildReportHtml(
  model: ReportModel,
  resolveImage: ImageResolver = (path) => path,
): string {
  return `<!doctype html>
<html lang="en">
<head><meta charset="utf-8" /><title>Test Run Report — ${esc(model.run_id)}</title>
<style>${STYLE}</style></head>
<body>
${contextSection(model)}
${summarySection(model)}
${failuresSection(model, resolveImage)}
</body>
</html>`;
}

// --- Pure helpers (output path + image embedding) --------------------------------------------------

/** Absolute output path for a run's report: output/<app-id>/reports/<run-id>.html. */
export function reportFilePath(model: ReportModel, outputDir: string): string {
  return nodePath.join(outputDir, model.context.app_id, 'reports', `${model.run_id}.html`);
}

/** Read each screenshot file into a data URI so the output stays a single self-contained file. */
export function dataUriResolver(
  readFile: (file: string) => Buffer = nodeFs.readFileSync,
): ImageResolver {
  return (screenshotPath) => {
    try {
      const bytes = readFile(screenshotPath);
      const ext = nodePath.extname(screenshotPath).slice(1) || 'png';
      return `data:image/${ext};base64,${bytes.toString('base64')}`;
    } catch {
      // A missing or unreadable file is treated as missing evidence, not a hard failure (BR-004).
      return null;
    }
  };
}
