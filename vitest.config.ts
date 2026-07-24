import { defineConfig } from 'vitest/config';

// Unit tests live next to source files as `<name>.test.ts` (coding-convention.md).
export default defineConfig({
  test: {
    include: ['src/**/*.test.ts'],
    environment: 'node',
  },
});
