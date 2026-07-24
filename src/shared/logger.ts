import pino, { type Logger } from 'pino';

// Structured logging with a run-id child and dynamic secret masking.
// Secret branches are registered at runtime by Config & Secrets (registerSecretPaths);
// masking is applied on every log call so registration order does not matter.

const REDACTED = '[REDACTED]';
const secretPaths = new Set<string>();

/** Register dotted paths whose values must never appear in logs. A `*` segment matches any key. */
export function registerSecretPaths(paths: readonly string[]): void {
  for (const path of paths) secretPaths.add(path);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function redactAtPath(target: Record<string, unknown>, segments: readonly string[]): void {
  const [head, ...rest] = segments;
  if (head === undefined) return;

  const keys = head === '*' ? Object.keys(target) : head in target ? [head] : [];
  for (const key of keys) {
    if (rest.length === 0) {
      target[key] = REDACTED;
      continue;
    }
    const child = target[key];
    if (isRecord(child)) redactAtPath(child, rest);
  }
}

/** Return a copy of `object` with every registered secret path censored. Exported for unit tests. */
export function redactObject(object: Record<string, unknown>): Record<string, unknown> {
  if (secretPaths.size === 0) return object;
  const clone = structuredClone(object) as Record<string, unknown>;
  for (const path of secretPaths) {
    redactAtPath(clone, path.split('.'));
  }
  return clone;
}

const baseLogger = pino({
  level: process.env.LOG_LEVEL ?? 'info',
  formatters: {
    log(object) {
      return redactObject(object as Record<string, unknown>);
    },
  },
});

export const logger = baseLogger;

/** A child logger that stamps `run_id` onto every line of a run. */
export function loggerForRun(runId: string): Logger {
  return baseLogger.child({ run_id: runId });
}
