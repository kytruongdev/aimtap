import { describe, it, expect, vi } from 'vitest';
import { createClaudeCodeAdapter, type SpawnFn, type SpawnResult } from './claude-code.js';

/** A fake spawn that records its input and returns a canned result. */
function fakeSpawn(result: SpawnResult) {
  const calls: Array<{ command: string; args: string[]; stdin: string; env: NodeJS.ProcessEnv }> = [];
  const spawnFn: SpawnFn = async (input) => {
    calls.push(input);
    return result;
  };
  return { spawnFn, calls };
}

describe('createClaudeCodeAdapter', () => {
  it('builds read-only argv for heal and feeds the prompt on stdin', async () => {
    const { spawnFn, calls } = fakeSpawn({ code: 0, stdout: '{"result":"loc"}' });
    const adapter = createClaudeCodeAdapter({ token: 'tok', spawnFn });

    await adapter.invoke('heal', 'the-prompt');

    expect(calls).toHaveLength(1);
    expect(calls[0]?.command).toBe('claude');
    expect(calls[0]?.args).toEqual(['-p', '--output-format', 'json', '--permission-mode', 'plan', '--allowedTools', '']);
    expect(calls[0]?.stdin).toBe('the-prompt');
  });

  it('builds limited-write argv for generate', async () => {
    const { spawnFn, calls } = fakeSpawn({ code: 0, stdout: '{"result":"file"}' });
    const adapter = createClaudeCodeAdapter({ token: 'tok', spawnFn });

    await adapter.invoke('generate', 'p');

    expect(calls[0]?.args).toEqual([
      '-p', '--output-format', 'json', '--permission-mode', 'acceptEdits', '--allowedTools', 'Write Edit',
    ]);
  });

  it('injects the token into the child environment', async () => {
    const { spawnFn, calls } = fakeSpawn({ code: 0, stdout: '{"result":"x"}' });
    const adapter = createClaudeCodeAdapter({ token: 'secret-token', spawnFn });

    await adapter.invoke('heal', 'p');

    expect(calls[0]?.env.CLAUDE_CODE_OAUTH_TOKEN).toBe('secret-token');
  });

  it('returns the result string from valid JSON stdout', async () => {
    const { spawnFn } = fakeSpawn({ code: 0, stdout: '{"result":"a-locator","usage":{"tokens":9}}' });
    const adapter = createClaudeCodeAdapter({ token: 'tok', spawnFn });

    await expect(adapter.invoke('heal', 'p')).resolves.toBe('a-locator');
  });

  it('returns null on malformed (non-JSON) stdout', async () => {
    const { spawnFn } = fakeSpawn({ code: 0, stdout: 'not json at all' });
    const adapter = createClaudeCodeAdapter({ token: 'tok', spawnFn });

    await expect(adapter.invoke('heal', 'p')).resolves.toBeNull();
  });

  it('returns null when JSON lacks a string result field', async () => {
    const { spawnFn } = fakeSpawn({ code: 0, stdout: '{"other":true}' });
    const adapter = createClaudeCodeAdapter({ token: 'tok', spawnFn });

    await expect(adapter.invoke('heal', 'p')).resolves.toBeNull();
  });

  it('returns null on a non-zero exit code', async () => {
    const { spawnFn } = fakeSpawn({ code: 1, stdout: '{"result":"ignored"}' });
    const adapter = createClaudeCodeAdapter({ token: 'tok', spawnFn });

    await expect(adapter.invoke('heal', 'p')).resolves.toBeNull();
  });

  it('returns null and does not spawn when the token is missing', async () => {
    const spawnFn = vi.fn<SpawnFn>();
    const adapter = createClaudeCodeAdapter({ token: null, spawnFn });

    await expect(adapter.invoke('heal', 'p')).resolves.toBeNull();
    expect(spawnFn).not.toHaveBeenCalled();
  });
});
