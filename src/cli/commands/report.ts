import { Command } from 'commander';
import { loadPlatformConfig } from '../../config/index.js';
import { generateReport } from '../../reporter/index.js';

// TICKET-023: `aimtap report <run-id>` — regenerate a run's report (a single self-contained HTML file)
// from stored data, never re-running test cases (ADR-006, sequence-diagrams §4). Results live in one
// shared Store keyed by run-id, so the Reporter resolves the app from the run itself and writes the
// report (report assembly lives in Reporter, not the CLI — ADR-014). A run-id that does not exist is a
// clear error with no file created.

export interface ReportDeps {
  generate: (runId: string, outputDir: string) => Promise<string>;
  outputDir: string;
  print: (line: string) => void;
}

export async function executeReport(runId: string, deps: ReportDeps): Promise<number> {
  try {
    const file = await deps.generate(runId, deps.outputDir);
    deps.print(`Report: ${file}`);
    return 0;
  } catch (error) {
    deps.print(error instanceof Error ? error.message : String(error));
    return 1;
  }
}

function withDefaults(deps?: Partial<ReportDeps>): ReportDeps {
  return {
    generate: deps?.generate ?? ((runId, outputDir) => generateReport(runId, outputDir)),
    outputDir: deps?.outputDir ?? loadPlatformConfig().outputDir,
    print: deps?.print ?? ((line) => process.stdout.write(`${line}\n`)),
  };
}

export function reportCommand(deps?: Partial<ReportDeps>): Command {
  return new Command('report')
    .argument('<run-id>', 'the run to report on')
    .action(async (runId: string) => {
      process.exitCode = await executeReport(runId, withDefaults(deps));
    });
}
