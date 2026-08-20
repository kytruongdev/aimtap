// Config & Secrets — platform config, global API key, per-app test data loading (ADR-009).
// TICKET-003: env schema, platform config, API key. TICKET-004: test data load and completeness.
export { envSchema, parseEnv } from './env.schema.js';
export type { Env } from './env.schema.js';

export { loadPlatformConfig } from './platform-config.js';
export type { PlatformConfig } from './platform-config.js';

export {
  loadApiKey,
  loadCliToken,
  loadTestData,
  verifyTestDataComplete,
  testDataSchema,
} from './secrets.js';
export type { TestData, TestDataCompleteness, SecretTree } from './secrets.js';
