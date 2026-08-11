import { describe, it, expect, vi } from 'vitest';
import { PlatformFailure } from '../../shared/index.js';
import { executeReport, type ReportDeps } from './report.js';

function deps(overrides: Partial<ReportDeps> = {}): { deps: ReportDeps; lines: string[] } {
  const lines: string[] = [];
  return {
    lines,
    deps: {
      generate: vi.fn().mockResolvedValue('/out/demo/reports/run-1.html'),
      outputDir: '/out',
      print: (line) => lines.push(line),
      ...overrides,
    },
  };
}

describe('executeReport', () => {
  it('writes the report and prints its path', async () => {
    const generate = vi.fn().mockResolvedValue('/out/demo/reports/run-1.html');
    const { deps: d, lines } = deps({ generate });

    const code = await executeReport('run-1', d);

    expect(code).toBe(0);
    expect(generate).toHaveBeenCalledWith('run-1', '/out');
    expect(lines.join('\n')).toContain('/out/demo/reports/run-1.html');
  });

  it('reports a clear error and creates nothing when the run does not exist', async () => {
    const generate = vi.fn().mockRejectedValue(new PlatformFailure('Run run-x was not found in /out'));
    const { deps: d, lines } = deps({ generate });

    const code = await executeReport('run-x', d);

    expect(code).toBe(1);
    expect(lines.join('\n')).toContain('was not found');
  });
});
