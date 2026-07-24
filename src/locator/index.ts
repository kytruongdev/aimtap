// Locator Resolver - single element-finding point; wait policy and iOS strategies.
// TICKET-011: locator shapes and wait policy. TICKET-012: find and the screen sink.
export {
  byAccessibilityId,
  byClassChain,
  byId,
  byPredicate,
  describeLocator,
  toSelector,
} from './locator.js';
export type { Locator, LocatorStrategy } from './locator.js';

export {
  DEFAULT_WAIT_POLICY,
  configureWaitPolicy,
  getWaitPolicy,
  resetWaitPolicy,
  withRetries,
} from './wait-policy.js';
export type { WaitPolicy } from './wait-policy.js';

export { find, registerScreenSink, clearScreenSink } from './locator-resolver.js';
export type { Element, ScreenSink } from './locator-resolver.js';
