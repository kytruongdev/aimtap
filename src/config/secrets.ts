import fs from 'node:fs';
import path from 'node:path';
import { z } from 'zod';
import { PlatformFailure, registerSecretPaths } from '../shared/index.js';

// Loads secrets from outside the repository (ADR-009): the global Claude API key from the root
// .env.local, and per-app test data from apps/<app-id>/test-data.local.json. The secret branch is
// registered with the logger's mask so values never reach logs, result records or reports. Values
// that a test case consumes are not stored here - the test case creates them at its opening step
// (BR-017 rule 3).

// --- Global API key (root .env.local) ----------------------------------------------------------

const API_KEY_VAR = 'ANTHROPIC_API_KEY';

/** Minimal KEY=VALUE reader for .env.local; no dependency, ignores comments/blank lines. */
function readEnvFile(file: string): Record<string, string> {
  if (!fs.existsSync(file)) return {};
  const out: Record<string, string> = {};
  for (const raw of fs.readFileSync(file, 'utf8').split('\n')) {
    const line = raw.trim();
    if (line === '' || line.startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    const value = line.slice(eq + 1).trim().replace(/^["']|["']$/g, '');
    if (key !== '') out[key] = value;
  }
  return out;
}

/**
 * Read the Claude API key from the root .env.local (falling back to the ambient environment), and
 * register it with the log mask. Returns null when unset so the platform runs without it in Phase 1.
 */
export function loadApiKey(
  opts: { rootDir?: string; env?: NodeJS.ProcessEnv } = {},
): string | null {
  registerSecretPaths([API_KEY_VAR]);
  const fromFile = readEnvFile(path.join(opts.rootDir ?? process.cwd(), '.env.local'));
  const env = opts.env ?? process.env;
  const key = (fromFile[API_KEY_VAR] ?? env[API_KEY_VAR] ?? '').trim();
  return key === '' ? null : key;
}

// --- AI CLI token (root .env.local) ------------------------------------------------------------

const CLI_TOKEN_VAR = 'CLAUDE_CODE_OAUTH_TOKEN';

/**
 * Read the AI CLI OAuth token from the root .env.local (falling back to the ambient environment),
 * and register it with the log mask. This is the auth path for the external AI CLI in the direction-B
 * approach (ADR-026); it does not touch ANTHROPIC_API_KEY. Returns null when the token is unset so
 * the AI features simply stay off (BR-221) rather than failing the run.
 */
export function loadCliToken(
  opts: { rootDir?: string; env?: NodeJS.ProcessEnv } = {},
): string | null {
  registerSecretPaths([CLI_TOKEN_VAR]);
  const fromFile = readEnvFile(path.join(opts.rootDir ?? process.cwd(), '.env.local'));
  const env = opts.env ?? process.env;
  const token = (fromFile[CLI_TOKEN_VAR] ?? env[CLI_TOKEN_VAR] ?? '').trim();
  return token === '' ? null : token;
}

/**
 * Add or update a `KEY=value` entry in the root .env.local, preserving every other line (other keys,
 * comments, blanks). Used by `aimtap setup` to store the AI CLI token without clobbering existing
 * secrets (ADR-026). Creates the file if it does not exist.
 */
export function upsertEnvVar(key: string, value: string, opts: { rootDir?: string } = {}): void {
  const file = path.join(opts.rootDir ?? process.cwd(), '.env.local');
  const existing = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : '';
  // Drop the trailing newline so a newline-terminated file does not leave a blank line to append after.
  const lines = existing === '' ? [] : existing.replace(/\n$/, '').split('\n');
  const entry = `${key}=${value}`;

  let replaced = false;
  const next = lines.map((raw) => {
    const trimmed = raw.trim();
    if (trimmed === '' || trimmed.startsWith('#')) return raw;
    const eq = trimmed.indexOf('=');
    if (eq !== -1 && trimmed.slice(0, eq).trim() === key) {
      replaced = true;
      return entry;
    }
    return raw;
  });
  if (!replaced) next.push(entry);

  fs.writeFileSync(file, `${next.join('\n').replace(/\n+$/, '')}\n`, 'utf8');
}

// --- Per-app test data (apps/<app-id>/test-data.*.json) ----------------------------------------

/** A nested tree of string leaves; an account is a cluster of related fields (ADR-009). */
export type SecretTree = { [key: string]: string | SecretTree };

const secretTreeSchema: z.ZodType<SecretTree> = z.lazy(() =>
  z.record(z.union([z.string(), secretTreeSchema])),
);

// Two branches: `secrets` is masked in logs; `env` is non-secret config allowed in the report
// context (ADR-009). The per-app example file is the required-item list; this schema fixes the shape.
export const testDataSchema = z.object({
  secrets: secretTreeSchema.default({}),
  env: z.record(z.string()).default({}),
});

export interface TestData {
  secrets: SecretTree;
  env: Record<string, string>;
}

function appsDir(): string {
  return path.join(process.cwd(), 'apps');
}

function localFile(appId: string, dir: string): string {
  return path.join(dir, appId, 'test-data.local.json');
}

function exampleFile(appId: string, dir: string): string {
  return path.join(dir, appId, 'test-data.example.json');
}

function parseTestDataFile(file: string, appId: string): TestData {
  let raw: unknown;
  try {
    raw = JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (error) {
    throw new PlatformFailure(`Test data at ${file} is not valid JSON`, {
      app_id: appId,
      file,
      reason: error instanceof Error ? error.message : String(error),
    });
  }

  const parsed = testDataSchema.safeParse(raw);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((issue) => `${issue.path.join('.') || '(root)'}: ${issue.message}`)
      .join('; ');
    throw new PlatformFailure(`Test data at ${file} has the wrong shape — ${issues}`, {
      app_id: appId,
      file,
    });
  }
  return parsed.data;
}

/** Dotted leaf paths of a string tree, e.g. secrets.accounts.standard.password. */
function leafPaths(tree: SecretTree, prefix: string): Array<[string, string]> {
  const out: Array<[string, string]> = [];
  for (const [key, value] of Object.entries(tree)) {
    const dotted = `${prefix}.${key}`;
    if (typeof value === 'string') out.push([dotted, value]);
    else out.push(...leafPaths(value, dotted));
  }
  return out;
}

function requiredLeaves(data: TestData): Array<[string, string]> {
  return [
    ...leafPaths(data.secrets, 'secrets'),
    ...Object.entries(data.env).map(([key, value]): [string, string] => [`env.${key}`, value]),
  ];
}

function valueAtPath(data: TestData, dotted: string): string | undefined {
  let node: unknown = data;
  for (const segment of dotted.split('.')) {
    if (node === null || typeof node !== 'object') return undefined;
    node = (node as Record<string, unknown>)[segment];
  }
  return typeof node === 'string' ? node : undefined;
}

/**
 * Load and validate apps/<app-id>/test-data.local.json, and register its secret leaves with the log
 * mask. Throws PlatformFailure naming the file when it is missing or malformed.
 */
export function loadTestData(appId: string, dir: string = appsDir()): TestData {
  const file = localFile(appId, dir);
  if (!fs.existsSync(file)) {
    throw new PlatformFailure(
      `Test data for "${appId}" not found — copy test-data.example.json to ${file} and fill it in`,
      { app_id: appId, file },
    );
  }

  const data = parseTestDataFile(file, appId);
  registerSecretPaths(leafPaths(data.secrets, 'secrets').map(([dotted]) => dotted));
  return data;
}

export type TestDataCompleteness = { ok: true } | { ok: false; missing: string[] };

/**
 * Check that every item in the per-app example has a real value in the local file. `missing` lists
 * the field paths that are absent, blank, or still holding the example placeholder (FR-APP-04,
 * US-19). The example file is the required-item list and must exist in the repository.
 */
export function verifyTestDataComplete(
  appId: string,
  dir: string = appsDir(),
): TestDataCompleteness {
  const example = exampleFile(appId, dir);
  if (!fs.existsSync(example)) {
    throw new PlatformFailure(
      `Test data template for "${appId}" not found — expected ${example}`,
      { app_id: appId, file: example },
    );
  }
  const required = requiredLeaves(parseTestDataFile(example, appId));

  const local = localFile(appId, dir);
  if (!fs.existsSync(local)) {
    return { ok: false, missing: required.map(([dotted]) => dotted) };
  }
  const localData = parseTestDataFile(local, appId);

  const missing = required
    .filter(([dotted, placeholder]) => {
      const value = valueAtPath(localData, dotted);
      return value === undefined || value.trim() === '' || value === placeholder;
    })
    .map(([dotted]) => dotted);

  return missing.length === 0 ? { ok: true } : { ok: false, missing };
}
