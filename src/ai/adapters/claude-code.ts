import type { CodeAgent } from '../code-agent.js';

// Claude Code adapter (ADR-025/026). TICKET-031 implements the real subprocess call to
// `claude -p --output-format json`; this placeholder only satisfies the factory wiring so that
// TICKET-030 (port + control point + factory) compiles on its own.

export interface SpawnResult {
  code: number | null;
  stdout: string;
}

/** Injectable process seam. The default drives child_process.spawn; tests pass a fake (TICKET-031). */
export type SpawnFn = (input: {
  command: string;
  args: string[];
  stdin: string;
  env: NodeJS.ProcessEnv;
}) => Promise<SpawnResult>;

export function createClaudeCodeAdapter(opts: {
  token: string | null;
  spawnFn?: SpawnFn;
}): CodeAgent {
  void opts;
  return { invoke: () => Promise.resolve(null) };
}
