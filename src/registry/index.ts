// App Registry — load and validate the declaration of one app (TICKET-005).
export { appConfigSchema } from './app-config.schema.js';
export type { AppConfig } from './app-config.schema.js';
export { loadAppConfig, parseAppConfig } from './load-app-config.js';
