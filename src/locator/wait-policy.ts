// The single place that defines how long the platform waits and how often it retries.
// Used by the Locator Resolver when finding elements and by the device probe (ADR-010), so both
// behave consistently. Fixed sleeps are never used (north-star.md §2.2, stability principles).

export interface WaitPolicy {
  /** Maximum time to wait for a condition to become true. */
  timeoutMs: number;
  /** Delay between polls and between retries. */
  intervalMs: number;
  /** Extra attempts after the first one, used to ride out transient glitches. */
  retries: number;
}

export const DEFAULT_WAIT_POLICY: WaitPolicy = {
  timeoutMs: 10_000,
  intervalMs: 500,
  retries: 2,
};

let current: WaitPolicy = { ...DEFAULT_WAIT_POLICY };

export function getWaitPolicy(): WaitPolicy {
  return current;
}

/** Tune the shared policy once at startup; the platform config owns the values it passes in. */
export function configureWaitPolicy(overrides: Partial<WaitPolicy>): void {
  current = { ...current, ...overrides };
}

export function resetWaitPolicy(): void {
  current = { ...DEFAULT_WAIT_POLICY };
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

/** Run an operation under the shared retry budget, rethrowing the last error when it never passes. */
export async function withRetries<T>(
  operation: () => Promise<T>,
  policy: WaitPolicy = getWaitPolicy(),
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 0; attempt <= policy.retries; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      if (attempt < policy.retries) await delay(policy.intervalMs);
    }
  }

  throw lastError;
}
