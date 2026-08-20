import { describe, it, expect, vi } from 'vitest';
import { runSetup, type SetupDeps } from './setup.js';

function deps(overrides: Partial<SetupDeps> = {}): { deps: SetupDeps; lines: string[] } {
  const lines: string[] = [];
  const base: SetupDeps = {
    cliPresent: () => true,
    readToken: () => Promise.resolve('tok-123'),
    writeToken: vi.fn(),
    out: (line) => lines.push(line),
    ...overrides,
  };
  return { deps: base, lines };
}

describe('runSetup', () => {
  it('prints install guidance and does not write the token when the CLI is missing', async () => {
    const writeToken = vi.fn();
    const { deps: d, lines } = deps({ cliPresent: () => false, writeToken });

    const code = await runSetup(d);

    expect(code).toBe(1);
    expect(lines.join('\n')).toContain('not found on PATH');
    expect(lines.join('\n')).toContain('code.claude.com');
    expect(writeToken).not.toHaveBeenCalled();
  });

  it('saves a pasted token and returns 0', async () => {
    const writeToken = vi.fn();
    const { deps: d, lines } = deps({
      cliPresent: () => true,
      readToken: () => Promise.resolve('  my-token  '),
      writeToken,
    });

    const code = await runSetup(d);

    expect(code).toBe(0);
    expect(writeToken).toHaveBeenCalledWith('my-token'); // trimmed
    expect(lines.join('\n')).toContain('AI features are ready');
  });

  it('does not write when the pasted token is blank', async () => {
    const writeToken = vi.fn();
    const { deps: d, lines } = deps({
      cliPresent: () => true,
      readToken: () => Promise.resolve('   '),
      writeToken,
    });

    const code = await runSetup(d);

    expect(code).toBe(1);
    expect(writeToken).not.toHaveBeenCalled();
    expect(lines.join('\n')).toContain('nothing was saved');
  });

  it('never prints the token value', async () => {
    const { deps: d, lines } = deps({ readToken: () => Promise.resolve('super-secret-token') });

    await runSetup(d);

    expect(lines.join('\n')).not.toContain('super-secret-token');
  });
});
