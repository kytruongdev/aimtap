import type { DeviceType, RunId } from '../shared/index.js';

// Result record types — one row shape per ERD entity (erd.md). Field names stay snake_case to match
// the SQLite columns and the JSON data contract in interface-spec.md.

/** Schema version stamped onto every Run written by this build (erd.md Run.schema_version). */
export const SCHEMA_VERSION = 1;

export type RunCompletion = 'completed' | 'incomplete';
export type AggregateResult = 'passed' | 'failed';
export type ScopeKind = 'full_suite' | 'subset';
export type StopReason = 'cancelled_by_qc' | 'device_unavailable';
export type TestCaseStatus = 'passed' | 'failed' | 'passed_healed';
export type FailureType = 'wrong_conclusion' | 'step_not_executed';
export type StepResult = 'passed' | 'failed';

export interface Run {
  run_id: RunId;
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
  /** JSON text of the subset selection criteria; null for a full-suite run (FR-RUN-02). */
  scope_criteria: string | null;
  not_run_count: number;
  stop_reason: StopReason | null;
  schema_version: number;
}

export interface TestCaseResult {
  id: string;
  run_id: RunId;
  app_id: string;
  test_feature: string;
  test_case: string;
  status: TestCaseStatus;
  started_at: string;
  duration_ms: number;
  screen: string | null;
  failure_type: FailureType | null;
  error_message: string | null;
  evidence_missing: 0 | 1;
}

export interface StepLog {
  id: string;
  test_case_result_id: string;
  step_order: number;
  step_text: string;
  result: StepResult;
  duration_ms: number;
  error_message: string | null;
  screenshot_path: string | null;
}

/**
 * One self-healing occurrence — a child of test_case_result (erd.md heal_event), append-only and
 * immutable (BR-207). It carries no app_id/run_id; a run's heal events are read via a join.
 * screenshot_path is null when the element screenshot could not be captured (auxiliary evidence).
 */
export interface HealEvent {
  id: string;
  test_case_result_id: string;
  step_order: number;
  screen: string;
  expected_locator: string;
  used_locator: string;
  screenshot_path: string | null;
  occurred_at: string;
}

/** Full result model of one run, assembled for the Reporter (interface-spec.md, Result Store). */
export interface RunModel {
  run: Run;
  results: TestCaseResult[];
  steps: StepLog[];
  heals: HealEvent[];
}
