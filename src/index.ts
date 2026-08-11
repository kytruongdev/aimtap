// Public entry point of the platform — the only module that apps/ may import from.
// Re-exports grow as modules are implemented; app content (Page Objects, step definitions, fixtures)
// reaches the platform only through this surface. Every re-export below is app-independent and stays
// within the ratified module matrix (ADR-014: root -> shared/locator/config).
export * from './shared/index.js';

// Element lookup for Page Objects (US-2.1).
export {
  find,
  byAccessibilityId,
  byClassChain,
  byId,
  byPredicate,
  describeLocator,
  toSelector,
} from './locator/index.js';
export type { Locator, LocatorStrategy, Element } from './locator/index.js';

// Per-app test data for fixtures (US-1.2, ADR-009).
export { loadTestData, verifyTestDataComplete } from './config/index.js';
export type { TestData } from './config/index.js';
