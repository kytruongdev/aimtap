import { PlatformFailure, type DeviceType } from '../shared/index.js';
import type {
  AggregateResult,
  FailureType,
  RunCompletion,
  RunRepository,
  ScopeKind,
  StepLog,
  StepResult,
  StopReason,
  TestCaseStatus,
} from '../store/index.js';

// TICKET-024: build the report model of one run from stored data (ADR-006, sequence-diagrams §4).
// Pure read logic - no rendering, no device. The report has two parts (ADR-006 §Hệ quả): a summary
// grouped by test feature (BR-016), and, for each failed test case, the failing-step screenshot,
// execution log, screen name, failure type and original error message. Missing evidence is marked as
// missing, never left blank (BR-004). The Reporter reads from the Result Store and regenerates from
// stored data without re-running test cases (`aimtap report <run-id>`).

export interface ReportTotals {
  total: number;
  passed: number;
  failed: number;
  passed_healed: number;
}

export interface ReportContext {
  app_id: string;
  app_version: string;
  device_id: string;
  device_type: DeviceType;
  os_version: string;
  started_at: string;
  ended_at: string | null;
  total_duration_ms: number | null;
  completion: RunCompletion;
  aggregate_result: AggregateResult | null;
  scope_kind: ScopeKind;
  scope_criteria: string | null;
  /** Number of selected test cases that never ran (incomplete run, BR-012). */
  not_run_count: number;
  stop_reason: StopReason | null;
  totals: ReportTotals;
}

/** One row of the summary table (ADR-006): the test case, its status and its duration. */
export interface ReportTestCaseRow {
  test_case: string;
  status: TestCaseStatus;
  duration_ms: number;
}

export interface ReportFeature {
  test_feature: string;
  test_cases: ReportTestCaseRow[];
}

export interface ReportStep {
  step_order: number;
  step_text: string;
  result: StepResult;
  duration_ms: number;
  error_message: string | null;
  screenshot_path: string | null;
}

export interface ReportFailure {
  test_feature: string;
  test_case: string;
  screen: string | null;
  failure_type: FailureType | null;
  error_message: string | null;
  /** Screenshot of the failing step; null when it was not captured. */
  screenshot_path: string | null;
  /** True when a capture failed for this test case; the report shows it as missing (BR-004). */
  evidence_missing: boolean;
  steps: ReportStep[];
}

export interface ReportModel {
  run_id: string;
  context: ReportContext;
  features: ReportFeature[];
  failures: ReportFailure[];
}

export function buildReportModel(
  runId: string,
  repository: Pick<RunRepository, 'getRunModel'>,
): ReportModel {
  const model = repository.getRunModel(runId);
  if (model === null) {
    throw new PlatformFailure(`Run ${runId} not found`, { run_id: runId });
  }
  const { run, results, steps } = model;

  const stepsByResult = new Map<string, StepLog[]>();
  for (const step of steps) {
    const list = stepsByResult.get(step.test_case_result_id) ?? [];
    list.push(step);
    stepsByResult.set(step.test_case_result_id, list);
  }

  const totals: ReportTotals = { total: results.length, passed: 0, failed: 0, passed_healed: 0 };
  const features: ReportFeature[] = [];
  const featureByName = new Map<string, ReportFeature>();

  for (const result of results) {
    if (result.status === 'passed') totals.passed += 1;
    else if (result.status === 'failed') totals.failed += 1;
    else totals.passed_healed += 1;

    let feature = featureByName.get(result.test_feature);
    if (feature === undefined) {
      feature = { test_feature: result.test_feature, test_cases: [] };
      featureByName.set(result.test_feature, feature);
      features.push(feature);
    }
    feature.test_cases.push({
      test_case: result.test_case,
      status: result.status,
      duration_ms: result.duration_ms,
    });
  }

  const failures: ReportFailure[] = results
    .filter((result) => result.status === 'failed')
    .map((result) => {
      const reportSteps: ReportStep[] = (stepsByResult.get(result.id) ?? []).map((step) => ({
        step_order: step.step_order,
        step_text: step.step_text,
        result: step.result,
        duration_ms: step.duration_ms,
        error_message: step.error_message,
        screenshot_path: step.screenshot_path,
      }));
      const failingStep = reportSteps.find((step) => step.result === 'failed');
      return {
        test_feature: result.test_feature,
        test_case: result.test_case,
        screen: result.screen,
        failure_type: result.failure_type,
        error_message: result.error_message,
        screenshot_path: failingStep?.screenshot_path ?? null,
        evidence_missing: result.evidence_missing === 1,
        steps: reportSteps,
      };
    });

  return {
    run_id: run.run_id,
    context: {
      app_id: run.app_id,
      app_version: run.app_version,
      device_id: run.device_id,
      device_type: run.device_type,
      os_version: run.os_version,
      started_at: run.started_at,
      ended_at: run.ended_at,
      total_duration_ms: run.total_duration_ms,
      completion: run.completion,
      aggregate_result: run.aggregate_result,
      scope_kind: run.scope_kind,
      scope_criteria: run.scope_criteria,
      not_run_count: run.not_run_count,
      stop_reason: run.stop_reason,
      totals,
    },
    features,
    failures,
  };
}
