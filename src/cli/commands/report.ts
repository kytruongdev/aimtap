import { Command } from 'commander';
import { loadPlatformConfig } from '../../config/index.js';
import { generateReportForRun } from '../../reporter/index.js';
import type { ReportFormat } from '../../reporter/index.js';

// TICKET-023: `aimtap report <run-id> [--format pdf|png]` — regenerate a run's report from stored
// data, never re-running test cases (ADR-006, sequence-diagrams §4). Reporter resolves which app
// holds the run and renders it (report assembly lives in Reporter, not the CLI — matrix ADR-014). A
// run-id that does not exist is a clear error with no file created.

const FORMATS: readonly ReportFormat[] = ['pdf', 'png'];

function isReportFormat(value: string): value is ReportFormat {
  return (FORMATS as readonly string[]).includes(value);
}

export interface ReportDeps {
  generate: (runId: string, outputDir: string, format: ReportFormat) => Promise<string>;
  outputDir: string;
  print: (line: string) => void;
}

export async function executeReport(
  runId: string,
  format: string,
  deps: ReportDeps,
): Promise<number> {
  if (!isReportFormat(format)) {
    deps.print(`Unknown format "${format}" — use pdf or png.`);
    return 1;
  }
  try {
    const file = await deps.generate(runId, deps.outputDir, format);
    deps.print(`Report: ${file}`);
    return 0;
  } catch (error) {
    deps.print(error instanceof Error ? error.message : String(error));
    return 1;
  }
}

function withDefaults(deps?: Partial<ReportDeps>): ReportDeps {
  return {
    generate: deps?.generate ?? generateReportForRun,
    outputDir: deps?.outputDir ?? loadPlatformConfig().outputDir,
    print: deps?.print ?? ((line) => process.stdout.write(`${line}\n`)),
  };
}

export function reportCommand(deps?: Partial<ReportDeps>): Command {
  return new Command('report')
    .argument('<run-id>', 'the run to report on')
    .option('--format <format>', 'report format: pdf | png', 'pdf')
    .action(async (runId: string, opts: { format: string }) => {
      process.exitCode = await executeReport(runId, opts.format, withDefaults(deps));
    });
}
