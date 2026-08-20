import { Command } from 'commander';
import { checkEnvironment, createSystemProbes, type EnvironmentReport } from '../../device/index.js';
import { loadCliToken } from '../../config/index.js';
import { isClaudeCliPresent } from '../ai-cli.js';

// TICKET-020: `aimtap doctor` — report the QC machine environment (UC-05). It runs the
// app-independent host-tool checks (Node, Xcode, Appium) via Device & Build Manager's
// checkEnvironment with no target (sequence-diagrams §1); target/device checks belong to the `run`
// preconditions (US-4.3). Prints through the CLI presentation layer; exit code is non-zero when any
// check fails so `make doctor` can gate.
//
// TICKET-033: also report the optional AI environment (CLI present, token set). These are advisory:
// a missing AI CLI or token never fails `doctor`, because runs that do not use AI still work
// (BR-221). The exit code stays driven by the required host tools only.

/** Whether the optional AI CLI and its token are available. */
export interface AiStatus {
  cliPresent: boolean;
  tokenPresent: boolean;
}

/** Print the report and return the process exit code. Pure: the caller supplies the output sink. */
export function runDoctor(
  report: EnvironmentReport,
  ai: AiStatus,
  out: (line: string) => void,
): number {
  for (const item of report.items) {
    const mark = item.status === 'ok' ? 'ok  ' : 'FAIL';
    out(`[${mark}] ${item.name}${item.reason === null ? '' : ` — ${item.reason}`}`);
  }

  out('');
  out('AI (optional — self-healing and test generation):');
  out(`[${ai.cliPresent ? 'ok  ' : 'warn'}] AI CLI (claude)${ai.cliPresent ? '' : ' — not found on PATH'}`);
  out(`[${ai.tokenPresent ? 'ok  ' : 'warn'}] AI token${ai.tokenPresent ? '' : ' — not set; run `aimtap setup`'}`);
  if (!ai.cliPresent || !ai.tokenPresent) {
    out('AI features are off; runs that do not use AI still work.');
  }

  out('');
  out(report.ok ? 'Environment ready.' : 'Environment has problems — fix the items marked FAIL.');
  return report.ok ? 0 : 1;
}

export function doctorCommand(): Command {
  return new Command('doctor')
    .description('Check that this machine has the tools a run needs (Node, Xcode, Appium; AI optional)')
    .action(() => {
      const report = checkEnvironment(createSystemProbes());
      const ai: AiStatus = {
        cliPresent: isClaudeCliPresent(),
        tokenPresent: loadCliToken() !== null,
      };
      process.exitCode = runDoctor(report, ai, (line) => process.stdout.write(`${line}\n`));
    });
}
