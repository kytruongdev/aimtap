import { createInterface } from 'node:readline';
import { Command } from 'commander';
import { upsertEnvVar } from '../../config/index.js';
import { isClaudeCliPresent } from '../ai-cli.js';

// TICKET-032: `aimtap setup` — prepare the AI CLI (Claude Code) and store its long-lived token
// (ADR-026, US-210). The token is billed against a subscription, so setup does not install the CLI
// silently; it points the user at the install/token steps and saves what they paste. The token step
// uses `claude setup-token`, which needs the CLI present, so a missing CLI stops setup early.

export interface SetupDeps {
  /** True when the AI CLI is on PATH. */
  cliPresent: () => boolean;
  /** Read the token the user pastes (interactive; faked in tests). */
  readToken: () => Promise<string>;
  /** Persist the token to the git-ignored env file. */
  writeToken: (token: string) => void;
  out: (line: string) => void;
}

/** Pure setup flow returning the process exit code; the caller supplies the side-effecting deps. */
export async function runSetup(deps: SetupDeps): Promise<number> {
  deps.out('Setting up the AI CLI (Claude Code).');

  if (!deps.cliPresent()) {
    deps.out('Claude Code CLI not found on PATH.');
    deps.out('Install it from https://code.claude.com/docs, then re-run setup.');
    return 1;
  }

  deps.out('Run `claude setup-token` once to get a long-lived token, then paste it below.');
  const token = (await deps.readToken()).trim();
  if (token === '') {
    deps.out('No token entered — nothing was saved.');
    return 1;
  }

  deps.writeToken(token);
  deps.out('Saved CLAUDE_CODE_OAUTH_TOKEN to .env.local. AI features are ready.');
  return 0;
}

/** Read a single line from stdin (interactive; verified manually, not unit-tested). */
function promptLine(prompt: string): Promise<string> {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(prompt, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

export function setupCommand(): Command {
  return new Command('setup')
    .description('Prepare the AI CLI (Claude Code) and store its token in .env.local')
    .action(async () => {
      process.exitCode = await runSetup({
        cliPresent: isClaudeCliPresent,
        readToken: () => promptLine('Paste your Claude Code token: '),
        writeToken: (token) => upsertEnvVar('CLAUDE_CODE_OAUTH_TOKEN', token),
        out: (line) => process.stdout.write(`${line}\n`),
      });
    });
}
