import { describe, it, expect } from 'vitest';
import type { EnvironmentReport } from '../../device/index.js';
import { runDoctor } from './doctor.js';

describe('runDoctor', () => {
  it('prints every item and returns 0 when the environment is ready', () => {
    const report: EnvironmentReport = {
      ok: true,
      items: [
        { name: 'node', status: 'ok', reason: null },
        { name: 'xcode', status: 'ok', reason: null },
        { name: 'appium', status: 'ok', reason: null },
      ],
    };
    const lines: string[] = [];

    const code = runDoctor(report, (line) => lines.push(line));

    expect(code).toBe(0);
    const text = lines.join('\n');
    expect(text).toContain('node');
    expect(text).toContain('appium');
    expect(text).toContain('Environment ready.');
  });

  it('returns 1 and shows the reason for each failing check', () => {
    const report: EnvironmentReport = {
      ok: false,
      items: [
        { name: 'node', status: 'ok', reason: null },
        { name: 'appium', status: 'failed', reason: 'Appium not found on PATH' },
      ],
    };
    const lines: string[] = [];

    const code = runDoctor(report, (line) => lines.push(line));

    expect(code).toBe(1);
    const text = lines.join('\n');
    expect(text).toContain('FAIL');
    expect(text).toContain('Appium not found on PATH');
    expect(text).toContain('fix the items marked FAIL');
  });
});
