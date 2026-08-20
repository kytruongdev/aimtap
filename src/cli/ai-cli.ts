import { execFileSync } from 'node:child_process';

// Host probe for the AI CLI, shared by `setup` and `doctor`. Kept thin and tool-touching: it only
// shells out and returns a boolean, so the command logic that uses it stays pure and unit-testable
// with a fake. Verified manually on a QC machine (conventions.md, unit test strategy).

/** True when the Claude Code CLI is on PATH (`command -v claude`). */
export function isClaudeCliPresent(): boolean {
  try {
    execFileSync('sh', ['-c', 'command -v claude'], { stdio: ['ignore', 'ignore', 'ignore'] });
    return true;
  } catch {
    return false;
  }
}
