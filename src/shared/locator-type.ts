// Locator type + strategy enum, hoisted to the shared kernel (ADR-027) so the AI Gateway can parse a
// healed locator without depending on the Locator Resolver module. The iOS builders, toSelector,
// describeLocator and the find logic stay in `src/locator/` and import these types from here.
// Strategy order of preference follows UC-02 3a: accessibility id, then id, then predicate or class chain.

// Single source of the strategy names so both the type and any runtime validator (the AI Gateway's
// Zod parse of a healed locator) stay in step.
export const LOCATOR_STRATEGIES = ['accessibility-id', 'id', 'predicate', 'class-chain'] as const;

export type LocatorStrategy = (typeof LOCATOR_STRATEGIES)[number];

export interface Locator {
  strategy: LocatorStrategy;
  value: string;
}
