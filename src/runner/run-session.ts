import { PlatformFailure, logger, type RunId } from '../shared/index.js';
import {
  SCHEMA_VERSION,
  type RunRepository,
  type ScopeKind,
  type StopReason,
  type TestCaseStatus,
} from '../store/index.js';
import type { DeviceContext } from '../device/index.js';

// TICKET-019: run-level state and coordination inside the worker process (ADR-013). The platform
// does NOT loop over test cases - WebdriverIO/Cucumber owns the loop and drives the hooks
// (cucumber-hooks.ts, TICKET-018), which read and write this state. run-session holds the run id, the
// aggregate progress, and the stop flag; it writes the run context at the `before` hook and the run
// summary at the `after` hook.
//
// The aggregate_result (BR-011) is derived by the Result Store from the persisted test_case_result
// rows at finalizeRun, so run-session never computes it here - it only decides completion,
// not_run_count and stop_reason. Already-finished test cases are untouched: each one was written in
// its own transaction the moment it ended (ADR-003), so a stop keeps their data intact (BR-012).

/** Progress signals for the display layer (US-4.3). Enough to show which test case runs and totals. */
export type ProgressEvent =
  | { type: 'run_started'; run_id: RunId }
  | { type: 'test_case_started'; test_feature: string; test_case: string }
  | {
      type: 'test_case_finished';
      test_feature: string;
      test_case: string;
      status: TestCaseStatus;
      completed: number;
    }
  | { type: 'test_case_skipped'; test_feature: string; test_case: string }
  | { type: 'run_finished'; completion: 'completed' | 'incomplete'; stop_reason: StopReason | null };

/** Selection recorded on the run; the CLI (US-4.3) translates criteria into Cucumber spec/tag filters. */
export interface RunScope {
  kind: ScopeKind;
  /** JSON text of the subset criteria, or null for a full-suite run (FR-RUN-02). */
  criteria: string | null;
}

/** The subset of the process signal surface run-session needs, faked in unit tests. */
export interface SignalSource {
  on(signal: 'SIGINT', handler: () => void): void;
  off(signal: 'SIGINT', handler: () => void): void;
}

export interface RunSessionDeps {
  repository: Pick<RunRepository, 'saveRunStart' | 'finalizeRun'>;
  appId: string;
  /** The validated run device, from Device & Build Manager (FR-DEV-02). */
  device: DeviceContext;
  scope: RunScope;
  newRunId: () => string;
  now?: () => Date;
  signals?: SignalSource;
  onProgress?: (event: ProgressEvent) => void;
}

export interface RunSession {
  readonly runId: RunId;
  /** `before` hook: persist the run context so test-case foreign keys resolve during the run. */
  start(): void;
  /** `after` hook: finalize the run summary exactly once (completion, not_run_count, stop_reason). */
  finalize(): void;
  isStopped(): boolean;
  stopReason(): StopReason | null;
  /** First reason wins; a stopped run stays stopped so the summary keeps its original cause. */
  requestStop(reason: StopReason): void;
  testCaseStarted(testFeature: string, testCase: string): void;
  testCaseFinished(testFeature: string, testCase: string, status: TestCaseStatus): void;
  testCaseSkipped(testFeature: string, testCase: string): void;
}

export function createRunSession(deps: RunSessionDeps): RunSession {
  const { repository, appId, device, scope, newRunId } = deps;
  const now = deps.now ?? (() => new Date());
  const signals: SignalSource = deps.signals ?? process;
  const emit = (event: ProgressEvent): void => deps.onProgress?.(event);

  const runId: RunId = newRunId();
  let startedAt: Date | null = null;
  let stop: StopReason | null = null;
  let completed = 0;
  let notRun = 0;

  // Stored so it can be removed at finalize - a lingering SIGINT listener would leak across runs.
  const onSigint = (): void => {
    logger.info({ run_id: runId }, 'run cancelled by qc (SIGINT)');
    // requestStop is idempotent; if the device already stopped the run, that reason stays.
    session.requestStop('cancelled_by_qc');
  };

  const session: RunSession = {
    runId,

    start() {
      startedAt = now();
      repository.saveRunStart({
        run_id: runId,
        app_id: appId,
        app_version: device.app_version,
        device_id: device.device_id,
        device_type: device.device_type,
        os_version: device.os_version,
        started_at: startedAt.toISOString(),
        scope_kind: scope.kind,
        scope_criteria: scope.criteria,
        schema_version: SCHEMA_VERSION,
      });
      signals.on('SIGINT', onSigint);
      emit({ type: 'run_started', run_id: runId });
    },

    finalize() {
      if (startedAt === null) {
        throw new PlatformFailure(`Run ${runId} finalized before it started`, { run_id: runId });
      }
      signals.off('SIGINT', onSigint);

      const endedAt = now();
      const completion = stop === null ? 'completed' : 'incomplete';
      repository.finalizeRun({
        run_id: runId,
        ended_at: endedAt.toISOString(),
        total_duration_ms: endedAt.getTime() - startedAt.getTime(),
        completion,
        not_run_count: notRun,
        stop_reason: stop,
      });
      emit({ type: 'run_finished', completion, stop_reason: stop });
    },

    isStopped() {
      return stop !== null;
    },

    stopReason() {
      return stop;
    },

    requestStop(reason) {
      if (stop === null) stop = reason;
    },

    testCaseStarted(testFeature, testCase) {
      emit({ type: 'test_case_started', test_feature: testFeature, test_case: testCase });
    },

    testCaseFinished(testFeature, testCase, status) {
      completed += 1;
      emit({
        type: 'test_case_finished',
        test_feature: testFeature,
        test_case: testCase,
        status,
        completed,
      });
    },

    testCaseSkipped(testFeature, testCase) {
      notRun += 1;
      emit({ type: 'test_case_skipped', test_feature: testFeature, test_case: testCase });
    },
  };

  return session;
}
