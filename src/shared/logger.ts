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

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (value === null || typeof value !== 'object') return false;
  const proto = Object.getPrototypeOf(value) as object | null;
  return proto === Object.prototype || proto === null;
}

// Deep-copy only plain objects and arrays so redaction can traverse them; keep every other value
// (Error, function, class instance, Buffer, …) by reference. Unlike structuredClone, this never
// throws on non-cloneable values — and AppFailure/PlatformFailure (Error instances) are logged often.
function safeClone(value: unknown, seen: Set<object>): unknown {
  if (Array.isArray(value)) {
    if (seen.has(value)) return '[Circular]';
    seen.add(value);
    const copy = value.map((item) => safeClone(item, seen));
    seen.delete(value);
    return copy;
  }
  if (!isPlainObject(value)) return value;
  if (seen.has(value)) return '[Circular]';
  seen.add(value);
  const copy: Record<string, unknown> = {};
  for (const [key, item] of Object.entries(value)) {
    copy[key] = safeClone(item, seen);
  }
  seen.delete(value);
  return copy;
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
    if (isPlainObject(child)) redactAtPath(child, rest);
  }
}

/** Return a copy of `object` with every registered secret path censored. Exported for unit tests. */
export function redactObject(object: Record<string, unknown>): Record<string, unknown> {
  if (secretPaths.size === 0) return object;
  const clone = safeClone(object, new Set<object>()) as Record<string, unknown>;
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
