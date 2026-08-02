import { CommanderError } from 'commander';
import { logger } from '../shared/index.js';
import { buildProgram } from './program.js';

// CLI Entry point for `aimtap` (TICKET-020, ADR-017). Builds the command program and runs it. The
// commands live in ./commands and are registered in ./program.ts. `run` (US-4.3) and `report`
// (US-4.4) land as additional commands without changing this entry.

async function main(): Promise<void> {
  try {
    await buildProgram().parseAsync(process.argv);
  } catch (error) {
    if (error instanceof CommanderError) {
      // commander already printed usage/help; carry its exit code (0 for --help, non-zero on error).
      process.exitCode = error.exitCode;
      return;
    }
    logger.error({ err: error }, 'aimtap command failed');
    process.exitCode = 1;
  }
}

void main();
