import { Command } from 'commander';
import { doctorCommand } from './commands/doctor.js';

// TICKET-020: the `aimtap` command framework (ADR-017: commander). Each subcommand is registered as
// its own unit, so `run` (US-4.3) and `report` (US-4.4) are added with one line each — the framework
// itself is not touched. `exitOverride()` makes parse/usage errors throw a CommanderError instead of
// calling process.exit, so exit codes are controllable and unit-testable.

export function buildProgram(): Command {
  const program = new Command('aimtap')
    .description('Automated iOS test runner for QC')
    .exitOverride();

  program.addCommand(doctorCommand());
  // program.addCommand(runCommand());    // US-4.3
  // program.addCommand(reportCommand());  // US-4.4

  return program;
}
