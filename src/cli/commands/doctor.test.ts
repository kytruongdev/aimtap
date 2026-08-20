import { describe, it, expect } from 'vitest';
import type { EnvironmentReport } from '../../device/index.js';
import { runDoctor, type AiStatus } from './doctor.js';

const readyHost: EnvironmentReport = {
  ok: true,
  items: [
    { name: 'node', status: 'ok', reason: null },
    { name: 'xcode', status: 'ok', reason: null },
    { name: 'appium', status: 'ok', reason: null },
  ],
};

const aiReady: AiStatus = { cliPresent: true, tokenPresent: true };

function collect(report: EnvironmentReport, ai: AiStatus): { code: number; text: string } {
  const lines: string[] = [];
  const code = runDoctor(report, ai, (line) => lines.push(line));
  return { code, text: lines.join('\n') };
}

describe('runDoctor', () => {
  it('prints every host item and returns 0 when the environment is ready', () => {
    const { code, text } = collect(readyHost, aiReady);

    expect(code).toBe(0);
    expect(text).toContain('node');
    expect(text).toContain('appium');
    expect(text).toContain('Environment ready.');
  });

  it('returns 1 and shows the reason for each failing host check', () => {
    const report: EnvironmentReport = {
      ok: false,
      items: [
        { name: 'node', status: 'ok', reason: null },
        { name: 'appium', status: 'failed', reason: 'Appium not found on PATH' },
      ],
    };

    const { code, text } = collect(report, aiReady);

    expect(code).toBe(1);
    expect(text).toContain('FAIL');
    expect(text).toContain('Appium not found on PATH');
    expect(text).toContain('fix the items marked FAIL');
  });

  it('reports the AI CLI and token as present without changing a ready exit code', () => {
    const { code, text } = collect(readyHost, { cliPresent: true, tokenPresent: true });

    expect(code).toBe(0);
    expect(text).toContain('AI CLI (claude)');
    expect(text).toContain('AI token');
    expect(text).not.toContain('AI features are off');
  });

  it('warns when the AI CLI or token is missing but keeps the exit code at 0', () => {
    const { code, text } = collect(readyHost, { cliPresent: false, tokenPresent: false });

    // Missing AI must not fail doctor when the required host tools are present (BR-221).
    expect(code).toBe(0);
    expect(text).toContain('warn');
    expect(text).toContain('AI features are off');
    expect(text).toContain('not found on PATH');
    expect(text).toContain('run `aimtap setup`');
  });

  it('does not print the token value, only its presence', () => {
    const { text } = collect(readyHost, { cliPresent: true, tokenPresent: true });

    // The status line names the token but never carries a value.
    expect(text).toContain('AI token');
    expect(text).not.toMatch(/token[^\n]*=/i);
  });
});
