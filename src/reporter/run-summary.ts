import type { TestCaseStatus } from '../store/index.js';
import type { ReportModel } from './report-model.js';

// A compact, terminal-friendly summary of one run: each test feature that ran, each of its test cases
// with a pass/fail status, and per-feature and overall counts (BR-016). Pure logic over the already
// built ReportModel - no Store access, no rendering - so it is unit-testable without a device or DB.
// The CLI prints this after a run so the result reads the same whether the whole suite or a single
// feature/test case ran; the file-level line WebdriverIO prints ("Spec Files: ...") is separate.

export interface RunSummaryCase {
  test_case: string;
  status: TestCaseStatus;
  /** Passed with self-healing — derived from heal_event, not a status (ADR-024). */
  healed: boolean;
}

export interface RunSummaryFeature {
  test_feature: string;
  test_cases: RunSummaryCase[];
  passed: number;
  failed: number;
  healed: number;
}

export interface RunSummary {
  app_id: string;
  run_id: string;
  features: RunSummaryFeature[];
  total: number;
  passed: number;
  failed: number;
  healed: number;
}

/** Repackage a ReportModel into the compact per-feature summary. */
export function toRunSummary(model: ReportModel): RunSummary {
  const features: RunSummaryFeature[] = model.features.map((feature) => {
    let passed = 0;
    let failed = 0;
    let healed = 0;
    for (const testCase of feature.test_cases) {
      if (testCase.status === 'failed') failed += 1;
      else passed += 1;
      if (testCase.healed) healed += 1;
    }
    return {
      test_feature: feature.test_feature,
      test_cases: feature.test_cases.map((tc) => ({
        test_case: tc.test_case,
        status: tc.status,
        healed: tc.healed,
      })),
      passed,
      failed,
      healed,
    };
  });

  const totals = model.context.totals;
  return {
    app_id: model.context.app_id,
    run_id: model.run_id,
    features,
    total: totals.total,
    passed: totals.passed,
    failed: totals.failed,
    healed: totals.healed,
  };
}

const RULE = '─'.repeat(64);

function statusLabel(testCase: RunSummaryCase): string {
  if (testCase.status === 'failed') return '✗ FAIL';
  if (testCase.healed) return '↻ HEAL';
  return '✓ PASS';
}

function counts(passed: number, failed: number, healed: number): string {
  const parts = [`${passed} passed`, `${failed} failed`];
  if (healed > 0) parts.push(`${healed} healed`);
  return parts.join(', ');
}

function plural(n: number): string {
  return n === 1 ? '' : 's';
}

/** Render the summary as terminal lines. */
export function formatRunSummary(summary: RunSummary): string[] {
  const lines: string[] = [RULE, ` Run summary — ${summary.app_id}  (run ${summary.run_id.slice(0, 8)})`, RULE];

  if (summary.features.length === 0) {
    lines.push(' No test cases were run.');
  }

  for (const feature of summary.features) {
    const n = feature.test_cases.length;
    lines.push(` Feature: ${feature.test_feature}   (${n} test case${plural(n)})`);
    for (const testCase of feature.test_cases) {
      lines.push(`   ${statusLabel(testCase)}  ${testCase.test_case}`);
    }
    lines.push(`   → ${counts(feature.passed, feature.failed, feature.healed)}`);
    lines.push('');
  }

  lines.push(
    ` Total: ${summary.total} test case${plural(summary.total)}  →  ${counts(summary.passed, summary.failed, summary.healed)}`,
  );
  lines.push(RULE);
  return lines;
}
