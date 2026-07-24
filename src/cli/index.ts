// CLI Entry — command registration and argument parsing for `aimtap`.
// Implemented in US-4.2 (TICKET-020), US-4.3 (TICKET-021, 022), US-4.4 (TICKET-023).
// Stub: prints a not-implemented notice so Makefile targets are wired before the commands land.

const command = process.argv[2] ?? '';
process.stdout.write(
  `aimtap: command "${command}" is not implemented yet (CLI lands in EPIC-4).\n`,
);
process.exit(1);
