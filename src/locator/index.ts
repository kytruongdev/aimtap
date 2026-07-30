// Locator Resolver - single element-finding point; iOS strategies and the find/sink API.
// The shared wait policy now lives in Shared (ADR-015); import it from there.
export {
  byAccessibilityId,
  byClassChain,
  byId,
  byPredicate,
  describeLocator,
  toSelector,
} from './locator.js';
export type { Locator, LocatorStrategy } from './locator.js';

export { find, registerScreenSink, clearScreenSink } from './locator-resolver.js';
export type { Element, ScreenSink } from './locator-resolver.js';
