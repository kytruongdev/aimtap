import { describe, it, expect } from 'vitest';
import { CommanderError } from 'commander';
import { buildProgram } from './program.js';

describe('buildProgram', () => {
  it('registers the doctor command', () => {
    const program = buildProgram();

    expect(program.commands.map((command) => command.name())).toContain('doctor');
  });

  it('throws a CommanderError on an unknown command instead of calling process.exit', () => {
    const program = buildProgram();
    program.configureOutput({ writeErr: () => undefined });

    expect(() => program.parse(['node', 'aimtap', 'bogus'])).toThrow(CommanderError);
  });

  it('can register more commands without changing the framework', () => {
    const program = buildProgram();
    const before = program.commands.length;
    program.command('run');

    expect(program.commands.length).toBe(before + 1);
  });
});
