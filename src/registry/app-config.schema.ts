import { z } from 'zod';

// Single source of both the runtime validation and the AppConfig type: every external input is
// parsed through this schema and the type is inferred from it (coding-convention.md, input
// validation rules). Field shape follows the app.config.ts data contract in interface-spec.md.

// The AI switch is per-app and off by default (BR-209): a Phase 1 app.config.ts that never declares
// `ai` still parses and behaves exactly as Phase 1 (US-205). healRetries defaults to 3 (BR-202) and
// must be at least 1.
const aiConfigSchema = z
  .object({
    enabled: z.boolean(),
    healRetries: z.number().int().min(1),
  })
  .default({ enabled: false, healRetries: 3 });

export const appConfigSchema = z.object({
  appId: z.string().min(1),
  buildPath: z.string().min(1),
  deviceType: z.enum(['real', 'simulator']),
  deviceId: z.string().min(1),
  osVersion: z.string().min(1),
  ai: aiConfigSchema,
});

export type AppConfig = z.infer<typeof appConfigSchema>;
