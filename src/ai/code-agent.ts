import { logger } from '../shared/index.js';
import { loadCliToken } from '../config/index.js';
import { createClaudeCodeAdapter } from './adapters/claude-code.js';

// AI Gateway (ADR-025): the single place the platform calls an external AI CLI. `CodeAgent` is the
// low-level contract — "run the CLI in a mode with a prompt, get the `result` string back". The heal
// and generate content that builds prompts and parses results lives above this port (US-7.2, US-8.1).
// A CodeAgent NEVER throws: on any failure (CLI missing, error, timeout, over the per-run limit) it
// returns null so a broken locator falls back to a normal Phase 1 failure (BR-208, NFR-204).

export type AgentMode = 'heal' | 'generate';

export interface CodeAgent {
  invoke(mode: AgentMode, prompt: string): Promise<string | null>;
}

export interface AgentLimits {
  /** Maximum CLI calls allowed in one run; calls beyond this return null (NFR-202). */
  maxCallsPerRun: number;
  /** Hard timeout for a single call; on expiry the call returns null. */
  callTimeoutMs: number;
}

/**
 * Wrap an agent with the run-level control point: cap the number of calls per run and bound each
 * call by a timeout. Every failure or timeout from `inner` is swallowed to null and logged at warn
 * level, without ever logging the prompt or page source (BR-219).
 */
export function withControlPoint(inner: CodeAgent, limits: AgentLimits): CodeAgent {
  let calls = 0;

  return {
    async invoke(mode, prompt) {
      if (calls >= limits.maxCallsPerRun) {
        logger.warn({ mode }, 'AI call skipped: per-run call limit reached');
        return null;
      }
      calls += 1;

      let timer: NodeJS.Timeout | undefined;
      try {
        return await new Promise<string | null>((resolve, reject) => {
          timer = setTimeout(() => reject(new Error('call timed out')), limits.callTimeoutMs);
          inner.invoke(mode, prompt).then(resolve, reject);
        });
      } catch (error) {
        logger.warn(
          { mode, reason: error instanceof Error ? error.message : 'error' },
          'AI CodeAgent call failed',
        );
        return null;
      } finally {
        if (timer !== undefined) clearTimeout(timer);
      }
    },
  };
}

/**
 * Build the AI Gateway: pick the adapter for the configured CLI (only Claude Code for now), load the
 * CLI token from the environment (ADR-026), and wrap the adapter in the control point. The app-level
 * AI switch is read by the assembly layer (US-7.5) / generate command (US-8.2), not here, so `ai`
 * never depends on `registry`.
 */
export function createCodeAgent(opts: { cli: 'claude-code'; limits: AgentLimits }): CodeAgent {
  const token = loadCliToken();
  const adapter = adapterFor(opts.cli, token);
  return withControlPoint(adapter, opts.limits);
}

function adapterFor(cli: 'claude-code', token: string | null): CodeAgent {
  switch (cli) {
    case 'claude-code':
      return createClaudeCodeAdapter({ token });
  }
}
