import { getWaitPolicy, withRetries } from '../shared/index.js';

// Lightweight liveness probe run before each test case (ADR-010): a low-cost session command wrapped
// in the shared wait policy. Returns 'unavailable' when the session or device is gone so the Test
// Runner can stop the run (BR-018). It only reports - the decision to stop belongs to US-3.4.

export type ProbeResult = 'ready' | 'unavailable';

/** Minimal view of the session command we need, so the probe is unit-testable without a real session. */
export interface ProbeSession {
  execute(script: string): Promise<unknown>;
}

// A cheap round-trip that returns immediately on a live session and fails fast when it is gone.
// High-level WebdriverIO command only - no low-level WebDriver protocol calls (north-star.md §2.2).
const PROBE_COMMAND = 'mobile: activeAppInfo';

function withTimeout<T>(operation: () => Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`probe timed out after ${ms}ms`)), ms);
    operation().then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error: unknown) => {
        clearTimeout(timer);
        reject(error instanceof Error ? error : new Error(String(error)));
      },
    );
  });
}

/**
 * Probe the live session once before a test case. Ready on a normal return; unavailable on a
 * connection error or timeout after the shared retry budget (ADR-010, BR-018).
 */
export async function probeDuringRun(session: ProbeSession): Promise<ProbeResult> {
  const policy = getWaitPolicy();
  try {
    await withRetries(() => withTimeout(() => session.execute(PROBE_COMMAND), policy.timeoutMs));
    return 'ready';
  } catch {
    return 'unavailable';
  }
}
