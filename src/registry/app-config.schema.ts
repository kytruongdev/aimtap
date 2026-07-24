import { z } from 'zod';

// Single source of both the runtime validation and the AppConfig type: every external input is
// parsed through this schema and the type is inferred from it (coding-convention.md, input
// validation rules). Field shape follows the app.config.ts data contract in interface-spec.md.

export const appConfigSchema = z.object({
  appId: z.string().min(1),
  buildPath: z.string().min(1),
  deviceType: z.enum(['real', 'simulator']),
  deviceId: z.string().min(1),
  osVersion: z.string().min(1),
});

export type AppConfig = z.infer<typeof appConfigSchema>;
