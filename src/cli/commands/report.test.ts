import { describe, it, expect, vi } from 'vitest';
import { PlatformFailure } from '../../shared/index.js';
import { executeReport, type ReportDeps } from './report.js';

function deps(overrides: Partial<ReportDeps> = {}): { deps: ReportDeps; lines: string[] } {
  const lines: string[] = [];
  return {
    lines,
    deps: {
      generate: vi.fn().mockResolvedValue('/out/demo/reports/run-1.pdf'),
      outputDir: '/out',
      print: (line) => lines.push(line),
      ...overrides,
    },
  };
}

describe('executeReport', () => {
  it('renders the report and prints its path', async () => {
    const generate = vi.fn().mockResolvedValue('/out/demo/reports/run-1.pdf');
    const { deps: d, lines } = deps({ generate });

    const code = await executeReport('run-1', 'pdf', d);

    expect(code).toBe(0);
    expect(generate).toHaveBeenCalledWith('run-1', '/out', 'pdf');
    expect(lines.join('\n')).toContain('/out/demo/reports/run-1.pdf');
  });

  it('reports a clear error and creates nothing when the run does not exist', async () => {
    const generate = vi.fn().mockRejectedValue(new PlatformFailure('Run run-x was not found in /out'));
    const { deps: d, lines } = deps({ generate });

    const code = await executeReport('run-x', 'pdf', d);

    expect(code).toBe(1);
    expect(lines.join('\n')).toContain('was not found');
  });

  it('rejects an unknown format without calling the renderer', async () => {
    const generate = vi.fn();
    const { deps: d, lines } = deps({ generate });

    const code = await executeReport('run-1', 'svg', d);

    expect(code).toBe(1);
    expect(generate).not.toHaveBeenCalled();
    expect(lines.join('\n')).toContain('Unknown format');
  });
});
