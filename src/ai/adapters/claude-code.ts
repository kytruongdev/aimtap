import { spawn } from 'node:child_process';
import { z } from 'zod';
import type { AgentMode, CodeAgent } from '../code-agent.js';

// Claude Code adapter (ADR-025/026): run `claude -p --output-format json`, feed the prompt on stdin,
// read stdout, and take the `result` field. The process-touching part is isolated behind SpawnFn so
// argv building, token injection and parsing are unit-testable with a fake; the real spawn is
// verified manually (coding-convention.md §Testing). The adapter never throws — any failure is null.

const CLI_COMMAND = 'claude';
const BASE_ARGS = ['-p', '--output-format', 'json'];

// Per-mode permissions (ADR-025): heal is read-only (the page source is in the prompt, the CLI only
// returns a locator and must not edit files); generate may write a draft test file.
const MODE_ARGS: Record<AgentMode, string[]> = {
  heal: ['--permission-mode', 'plan', '--allowedTools', ''],
  generate: ['--permission-mode', 'acceptEdits', '--allowedTools', 'Write Edit'],
};

// The CLI's JSON envelope; passthrough keeps unknown fields (e.g. usage) without failing the parse.
const cliOutputSchema = z.object({ result: z.string() }).passthrough();

export interface SpawnResult {
  code: number | null;
  stdout: string;
}

/** Injectable process seam. The default drives child_process.spawn; tests pass a fake. */
export type SpawnFn = (input: {
  command: string;
  args: string[];
  stdin: string;
  env: NodeJS.ProcessEnv;
  /** Working directory for the child; undefined keeps the parent cwd. */
  cwd?: string;
}) => Promise<SpawnResult>;

export function createClaudeCodeAdapter(opts: {
  token: string | null;
  spawnFn?: SpawnFn;
  /** Directory the CLI runs in, so limited-write output lands there (generate: apps/<app-id>/). */
  cwd?: string;
}): CodeAgent {
  const runProcess = opts.spawnFn ?? defaultSpawn;

  return {
    async invoke(mode, prompt) {
      // No token → the AI feature simply stays off; do not spawn (ADR-026, BR-221).
      if (opts.token === null || opts.token.trim() === '') return null;

      const args = [...BASE_ARGS, ...MODE_ARGS[mode]];
      const env: NodeJS.ProcessEnv = { ...process.env, CLAUDE_CODE_OAUTH_TOKEN: opts.token };

      try {
        const { code, stdout } = await runProcess({
          command: CLI_COMMAND,
          args,
          stdin: prompt,
          env,
          cwd: opts.cwd,
        });
        if (code !== 0) return null;

        const parsed = cliOutputSchema.safeParse(JSON.parse(stdout) as unknown);
        return parsed.success ? parsed.data.result : null;
      } catch {
        // spawn failure or malformed (non-JSON) stdout → treated as "not available".
        return null;
      }
    },
  };
}

/** Real subprocess call — device/tool-touching, verified manually (not unit-tested). */
const defaultSpawn: SpawnFn = ({ command, args, stdin, env, cwd }) =>
  new Promise<SpawnResult>((resolve, reject) => {
    const child = spawn(command, args, { env, cwd, stdio: ['pipe', 'pipe', 'ignore'] });
    let stdout = '';

    child.stdout.setEncoding('utf8');
    child.stdout.on('data', (chunk: string) => {
      stdout += chunk;
    });
    child.on('error', reject);
    child.on('close', (code) => resolve({ code, stdout }));

    child.stdin.end(stdin);
  });
