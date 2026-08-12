import { describe, it, expect } from 'vitest';
import { toRunSummary, formatRunSummary } from './run-summary.js';
import type { ReportModel } from './report-model.js';

// Pure tests over a hand-built ReportModel (no Store, no device) — this is the real transform + format
// logic the CLI relies on, not a mock of it.

function model(overrides: Partial<ReportModel> = {}): ReportModel {
  return {
    run_id: 'e48bb7ff-924f-4abf-840f-175d8fe518f1',
    context: {
      app_id: 'my-demo-app',
      app_version: '2.2.2',
      device_id: 'iPhone 17',
      device_type: 'simulator',
      os_version: '26.5',
      started_at: '2026-08-11T09:38:08.158Z',
      ended_at: '2026-08-11T09:38:23.000Z',
      total_duration_ms: 15000,
      completion: 'completed',
      aggregate_result: 'failed',
      scope_kind: 'full_suite',
      scope_criteria: null,
      not_run_count: 0,
      stop_reason: null,
      totals: { total: 3, passed: 2, failed: 1, passed_healed: 0 },
    },
    features: [
      {
        test_feature: 'Authentication',
        test_cases: [{ test_case: 'Log in with a valid account', status: 'passed', duration_ms: 6000 }],
      },
      {
        test_feature: 'Cart',
        test_cases: [
          { test_case: 'Add a product to the cart', status: 'passed', duration_ms: 9000 },
          { test_case: 'The cart count is wrongly expected to be two', status: 'failed', duration_ms: 12000 },
        ],
      },
    ],
    failures: [],
    ...overrides,
  };
}

describe('toRunSummary', () => {
  it('groups by feature with per-feature and overall counts', () => {
    const summary = toRunSummary(model());

    expect(summary.app_id).toBe('my-demo-app');
    expect(summary.features).toHaveLength(2);
    expect(summary.features[0]).toMatchObject({ test_feature: 'Authentication', passed: 1, failed: 0 });
    expect(summary.features[1]).toMatchObject({ test_feature: 'Cart', passed: 1, failed: 1 });
    expect(summary.features[1]?.test_cases).toHaveLength(2);
    expect(summary).toMatchObject({ total: 3, passed: 2, failed: 1 });
  });
});

describe('formatRunSummary', () => {
  it('shows every feature, each test case with pass/fail, and totals', () => {
    const text = formatRunSummary(toRunSummary(model())).join('\n');

    expect(text).toContain('Feature: Authentication   (1 test case)');
    expect(text).toContain('Feature: Cart   (2 test cases)');
    expect(text).toContain('✓ PASS  Log in with a valid account');
    expect(text).toContain('✓ PASS  Add a product to the cart');
    expect(text).toContain('✗ FAIL  The cart count is wrongly expected to be two');
    expect(text).toContain('Total: 3 test cases  →  2 passed, 1 failed');
  });

  it('handles a run where nothing matched', () => {
    const empty = toRunSummary(
      model({ features: [], context: { ...model().context, totals: { total: 0, passed: 0, failed: 0, passed_healed: 0 } } }),
    );
    expect(formatRunSummary(empty).join('\n')).toContain('No test cases were run.');
  });
});
