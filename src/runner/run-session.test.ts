import { describe, it, expect, vi } from 'vitest';
import { isPlatformFailure } from '../shared/index.js';
import type { DeviceContext } from '../device/index.js';
import type { RunFinalize, RunStart } from '../store/index.js';
import {
  createRunSession,
  type ProgressEvent,
  type RunSessionDeps,
  type SignalSource,
} from './run-session.js';

const device: DeviceContext = {
  device_id: 'sim-1',
  device_type: 'simulator',
  os_version: '17.5',
  app_version: '1.2.0',
};

function fakeRepository() {
  const starts: RunStart[] = [];
  const finals: RunFinalize[] = [];
  return {
    starts,
    finals,
    saveRunStart: (run: RunStart) => starts.push(run),
    finalizeRun: (summary: RunFinalize) => finals.push(summary),
  };
}

function fakeSignals() {
  const handlers: Array<() => void> = [];
  const source: SignalSource = {
    on: (_signal, handler) => handlers.push(handler),
    off: (_signal, handler) => {
      const i = handlers.indexOf(handler);
      if (i >= 0) handlers.splice(i, 1);
    },
  };
  return { source, handlers, fire: () => handlers.forEach((h) => h()) };
}

/** A clock that returns each queued instant in turn, so durations are deterministic. */
function clockOf(...isos: string[]): () => Date {
  const queue = isos.map((iso) => new Date(iso));
  const last = queue[queue.length - 1] ?? new Date(0);
  return () => queue.shift() ?? last;
}

function build(overrides: Partial<RunSessionDeps> = {}) {
  const repository = fakeRepository();
  const events: ProgressEvent[] = [];
  const signals = fakeSignals();
  const session = createRunSession({
    repository,
    appId: 'demo',
    device,
    scope: { kind: 'subset', criteria: '{"tags":["@smoke"]}' },
    newRunId: () => 'run-123',
    now: clockOf('2026-08-01T10:00:00.000Z', '2026-08-01T10:00:05.000Z'),
    signals: signals.source,
    onProgress: (e) => events.push(e),
    ...overrides,
  });
  return { session, repository, events, signals };
}

describe('createRunSession.start', () => {
  it('persists the full run context, including scope, at the before hook', () => {
    const { session, repository } = build();

    session.start();

    expect(repository.starts).toHaveLength(1);
    expect(repository.starts[0]).toEqual({
      run_id: 'run-123',
      app_id: 'demo',
      app_version: '1.2.0',
      device_id: 'sim-1',
      device_type: 'simulator',
      os_version: '17.5',
      started_at: '2026-08-01T10:00:00.000Z',
      scope_kind: 'subset',
      scope_criteria: '{"tags":["@smoke"]}',
      schema_version: 1,
    });
  });
});

describe('createRunSession.finalize', () => {
  it('finalizes a completed run with no stop reason and total duration', () => {
    const { session, repository } = build();

    session.start();
    session.finalize();

    expect(repository.finals[0]).toEqual({
      run_id: 'run-123',
      ended_at: '2026-08-01T10:00:05.000Z',
      total_duration_ms: 5000,
      completion: 'completed',
      not_run_count: 0,
      stop_reason: null,
    });
  });

  it('finalizes an incomplete run with the stop reason and the skipped count', () => {
    const { session, repository } = build();

    session.start();
    session.requestStop('device_unavailable');
    session.testCaseSkipped('Login', 'locked account');
    session.testCaseSkipped('Login', 'wrong password');
    session.finalize();

    expect(repository.finals[0]).toMatchObject({
      completion: 'incomplete',
      not_run_count: 2,
      stop_reason: 'device_unavailable',
    });
  });

  it('throws a PlatformFailure when finalized before it started', () => {
    const { session } = build();

    try {
      session.finalize();
      expect.unreachable('finalize before start must throw');
    } catch (error) {
      expect(isPlatformFailure(error)).toBe(true);
    }
  });
});

describe('createRunSession stop flag', () => {
  it('keeps the first stop reason (device_unavailable wins over a later cancel)', () => {
    const { session } = build();
    session.start();

    session.requestStop('device_unavailable');
    session.requestStop('cancelled_by_qc');

    expect(session.stopReason()).toBe('device_unavailable');
    expect(session.isStopped()).toBe(true);
  });

  it('stops with cancelled_by_qc when a SIGINT arrives', () => {
    const { session, signals } = build();
    session.start();

    expect(signals.handlers).toHaveLength(1);
    signals.fire();

    expect(session.stopReason()).toBe('cancelled_by_qc');
  });

  it('removes the SIGINT listener at finalize', () => {
    const { session, signals } = build();

    session.start();
    expect(signals.handlers).toHaveLength(1);
    session.finalize();
    expect(signals.handlers).toHaveLength(0);
  });
});

describe('createRunSession progress events', () => {
  it('emits run, test-case and finish events for the display layer', () => {
    const { session, events } = build();

    session.start();
    session.testCaseStarted('Login', 'valid credentials');
    session.testCaseFinished('Login', 'valid credentials', 'passed');
    session.testCaseSkipped('Login', 'locked account');
    session.finalize();

    expect(events).toEqual([
      { type: 'run_started', run_id: 'run-123' },
      { type: 'test_case_started', test_feature: 'Login', test_case: 'valid credentials' },
      {
        type: 'test_case_finished',
        test_feature: 'Login',
        test_case: 'valid credentials',
        status: 'passed',
        completed: 1,
      },
      { type: 'test_case_skipped', test_feature: 'Login', test_case: 'locked account' },
      { type: 'run_finished', completion: 'completed', stop_reason: null },
    ]);
  });

  it('does not touch the repository result writes (no loop over test cases)', () => {
    const spy = vi.fn();
    const { session } = build({ repository: { saveRunStart: spy, finalizeRun: spy } });

    session.start();
    session.testCaseFinished('F', 'a', 'passed');
    session.testCaseFinished('F', 'b', 'failed');

    // Only start wrote so far; results are persisted by the Evidence Collector, not run-session.
    expect(spy).toHaveBeenCalledTimes(1);
  });
});
