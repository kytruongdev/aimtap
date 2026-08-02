import { Command } from 'commander';
import { checkEnvironment, createSystemProbes, type EnvironmentReport } from '../../device/index.js';

// TICKET-020: `aimtap doctor` — report the QC machine environment (UC-05). It runs the
// app-independent host-tool checks (Node, Xcode, Appium) via Device & Build Manager's
// checkEnvironment with no target (sequence-diagrams §1); target/device checks belong to the `run`
// preconditions (US-4.3). Prints through the CLI presentation layer; exit code is non-zero when any
// check fails so `make doctor` can gate.

/** Print the report and return the process exit code. Pure: the caller supplies the output sink. */
export function runDoctor(report: EnvironmentReport, out: (line: string) => void): number {
  for (const item of report.items) {
    const mark = item.status === 'ok' ? 'ok  ' : 'FAIL';
    out(`[${mark}] ${item.name}${item.reason === null ? '' : ` — ${item.reason}`}`);
  }
  out('');
  out(report.ok ? 'Environment ready.' : 'Environment has problems — fix the items marked FAIL.');
  return report.ok ? 0 : 1;
}

export function doctorCommand(): Command {
  return new Command('doctor')
    .description('Check that this machine has the tools a run needs (Node, Xcode, Appium)')
    .action(() => {
      const report = checkEnvironment(createSystemProbes());
      process.exitCode = runDoctor(report, (line) => process.stdout.write(`${line}\n`));
    });
}
