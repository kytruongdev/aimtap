import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { PlatformFailure } from '../shared/index.js';
import { appConfigSchema, type AppConfig } from './app-config.schema.js';

// The platform never imports apps/ statically; an app declaration is loaded at runtime by path
// convention (north-star.md §2.1), which is why loading is asynchronous.

function defaultAppsDir(): string {
  return path.join(process.cwd(), 'apps');
}

/** Validate a raw app declaration and confirm it belongs to the folder it was loaded from. */
export function parseAppConfig(input: unknown, expectedAppId: string): AppConfig {
  const parsed = appConfigSchema.safeParse(input);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((issue) => `${issue.path.join('.') || '(root)'}: ${issue.message}`)
      .join('; ');
    throw new PlatformFailure(`Invalid app declaration for "${expectedAppId}" — ${issues}`, {
      app_id: expectedAppId,
    });
  }

  if (parsed.data.appId !== expectedAppId) {
    throw new PlatformFailure(
      `App declaration id "${parsed.data.appId}" does not match its folder "${expectedAppId}"`,
      { app_id: expectedAppId, declared_app_id: parsed.data.appId },
    );
  }

  return parsed.data;
}

/** Load and validate `apps/<app-id>/app.config.ts`; throws PlatformFailure naming what is wrong. */
export async function loadAppConfig(
  appId: string,
  appsDir: string = defaultAppsDir(),
): Promise<AppConfig> {
  const file = path.join(appsDir, appId, 'app.config.ts');

  if (!fs.existsSync(file)) {
    throw new PlatformFailure(`App "${appId}" is not declared — ${file} not found`, {
      app_id: appId,
      file,
    });
  }

  const module = (await import(pathToFileURL(file).href)) as { default?: unknown };
  if (module.default === undefined) {
    throw new PlatformFailure(
      `App declaration "${file}" must have a default export with the app config`,
      { app_id: appId, file },
    );
  }

  return parseAppConfig(module.default, appId);
}
