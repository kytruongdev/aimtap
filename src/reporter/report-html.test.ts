import { describe, it, expect } from 'vitest';
import type { ReportModel } from './report-model.js';
import {
  buildReportHtml,
  dataUriResolver,
  reportFilePath,
} from './report-html.js';

function model(overrides: Partial<ReportModel> = {}): ReportModel {
  return {
    run_id: 'run-1',
    context: {
      app_id: 'demo',
      app_version: '1.2.0',
      device_id: 'sim-1',
      device_type: 'simulator',
      os_version: '17.5',
      started_at: '2026-08-02T10:00:00.000Z',
      ended_at: '2026-08-02T10:00:05.000Z',
      total_duration_ms: 5000,
      completion: 'completed',
      aggregate_result: 'failed',
      scope_kind: 'full_suite',
      scope_criteria: null,
      not_run_count: 0,
      stop_reason: null,
      totals: { total: 2, passed: 1, failed: 1, passed_healed: 0 },
    },
    features: [
      {
        test_feature: 'Login',
        test_cases: [
          { test_case: 'valid credentials', status: 'passed', duration_ms: 1000 },
          { test_case: 'locked account', status: 'failed', duration_ms: 1500 },
        ],
      },
    ],
    failures: [
      {
        test_feature: 'Login',
        test_case: 'locked account',
        screen: 'LoginScreen',
        failure_type: 'wrong_conclusion',
        error_message: 'expected the error banner',
        screenshot_path: '/output/demo/run-1/fail.png',
        evidence_missing: false,
        steps: [
          {
            step_order: 1,
            step_text: 'I submit locked credentials',
            result: 'failed',
            duration_ms: 12,
            error_message: 'assertion failed',
            screenshot_path: '/output/demo/run-1/fail.png',
          },
        ],
      },
    ],
    ...overrides,
  };
}

describe('buildReportHtml', () => {
  it('renders context, totals and the summary grouped by feature', () => {
    const html = buildReportHtml(model());

    expect(html).toContain('demo (1.2.0)');
    expect(html).toContain('Total 2 · Passed 1 · Failed 1');
    expect(html).toContain('Summary by test feature');
    expect(html).toContain('Login');
    expect(html).toContain('valid credentials');
    expect(html).toContain('status-failed');
  });

  it('renders the failure details: screen, failure type, error and execution log', () => {
    const html = buildReportHtml(model());

    expect(html).toContain('LoginScreen');
    expect(html).toContain('wrong_conclusion');
    expect(html).toContain('expected the error banner');
    expect(html).toContain('Execution log');
    expect(html).toContain('I submit locked credentials');
  });

  it('embeds the failing-step screenshot via the resolver', () => {
    const html = buildReportHtml(model(), () => 'data:image/png;base64,AAAA');

    expect(html).toContain('<img class="shot" src="data:image/png;base64,AAAA"');
  });

  it('shows missing evidence as missing, not blank (BR-004)', () => {
    const m = model();
    m.failures[0] = { ...m.failures[0]!, screenshot_path: null, evidence_missing: true };

    const html = buildReportHtml(m);
    expect(html).toContain('Screenshot missing (capture failed)');
  });

  it('shows an incomplete-run banner with the stop reason and not-run count', () => {
    const m = model();
    m.context = { ...m.context, completion: 'incomplete', not_run_count: 3, stop_reason: 'device_unavailable' };

    const html = buildReportHtml(m);
    expect(html).toContain('Incomplete run');
    expect(html).toContain('device_unavailable');
    expect(html).toContain('not run: 3');
  });

  it('escapes HTML in test-case names and error messages', () => {
    const m = model();
    m.failures[0] = { ...m.failures[0]!, error_message: '<script>alert(1)</script>' };

    const html = buildReportHtml(m);
    expect(html).not.toContain('<script>alert(1)</script>');
    expect(html).toContain('&lt;script&gt;');
  });
});

describe('reportFilePath', () => {
  it('places the report at output/<app-id>/reports/<run-id>.<ext>', () => {
    expect(reportFilePath(model(), 'pdf', '/out')).toBe('/out/demo/reports/run-1.pdf');
    expect(reportFilePath(model(), 'png', '/out')).toBe('/out/demo/reports/run-1.png');
  });
});

describe('dataUriResolver', () => {
  it('reads a screenshot file into a base64 data URI', () => {
    const resolve = dataUriResolver(() => Buffer.from('abc'));

    expect(resolve('/x/shot.png')).toBe('data:image/png;base64,YWJj');
  });

  it('returns null when the file cannot be read (treated as missing)', () => {
    const resolve = dataUriResolver(() => {
      throw new Error('gone');
    });

    expect(resolve('/x/missing.png')).toBeNull();
  });
});
