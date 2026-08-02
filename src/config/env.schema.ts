import { z } from 'zod';
import { PlatformFailure } from '../shared/index.js';

// Single source of the environment-variable shape and the inferred type (coding-convention.md, input
// validation). Every value is optional so the platform runs on a bare machine: AI is off by default
// and Phase 1 needs no API key. Numbers and booleans arrive as strings from the environment, so they
// are coerced/normalised here. The Claude API key is a global secret read from .env.local by
// secrets.ts (ADR-009), not part of the operational config parsed here.

export const envSchema = z.object({
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
  /** Root of the results/report output tree; defaults to <cwd>/output in platform-config.ts. */
  AIMTAP_OUTPUT_DIR: z.string().min(1).optional(),
  /** AI features (self-healing, generation) land in Phase 2; off unless explicitly 'true'. */
  AIMTAP_AI_ENABLED: z
    .enum(['true', 'false'])
    .optional()
    .transform((value) => value === 'true'),
  AIMTAP_WAIT_TIMEOUT_MS: z.coerce.number().int().positive().optional(),
  AIMTAP_WAIT_INTERVAL_MS: z.coerce.number().int().positive().optional(),
  AIMTAP_WAIT_RETRIES: z.coerce.number().int().nonnegative().optional(),
});

export type Env = z.infer<typeof envSchema>;

/** Validate the raw environment; throws PlatformFailure naming the offending variables. */
export function parseEnv(raw: NodeJS.ProcessEnv = process.env): Env {
  const parsed = envSchema.safeParse(raw);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((issue) => `${issue.path.join('.') || '(root)'}: ${issue.message}`)
      .join('; ');
    throw new PlatformFailure(`Invalid environment configuration — ${issues}`, {});
  }
  return parsed.data;
}
