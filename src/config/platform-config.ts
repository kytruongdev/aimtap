import path from 'node:path';
import { DEFAULT_WAIT_POLICY, type WaitPolicy } from '../shared/index.js';
import { parseEnv } from './env.schema.js';

// Operational configuration merged from the environment and defaults (NFR-04, NFR-05). Values the
// platform reads at startup: where output goes, the log level, whether AI is on, and the shared wait
// budget. Secrets are not here - the Claude API key and per-app test data are loaded by secrets.ts.

export interface PlatformConfig {
  /** Root directory for results and reports; per-app subtrees live under it. */
  outputDir: string;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  ai: { enabled: boolean };
  /** Resolved wait budget; startup passes this to configureWaitPolicy (ADR-015). */
  wait: WaitPolicy;
}

export function loadPlatformConfig(env: NodeJS.ProcessEnv = process.env): PlatformConfig {
  const parsed = parseEnv(env);
  return {
    outputDir: parsed.AIMTAP_OUTPUT_DIR ?? path.join(process.cwd(), 'output'),
    logLevel: parsed.LOG_LEVEL,
    ai: { enabled: parsed.AIMTAP_AI_ENABLED },
    wait: {
      timeoutMs: parsed.AIMTAP_WAIT_TIMEOUT_MS ?? DEFAULT_WAIT_POLICY.timeoutMs,
      intervalMs: parsed.AIMTAP_WAIT_INTERVAL_MS ?? DEFAULT_WAIT_POLICY.intervalMs,
      retries: parsed.AIMTAP_WAIT_RETRIES ?? DEFAULT_WAIT_POLICY.retries,
    },
  };
}
