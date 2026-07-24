// Locator shapes for XCUITest. Page Objects declare locators with these builders; the resolver
// translates them into WebdriverIO selectors. Strategy order of preference follows UC-02 3a:
// accessibility id, then id, then predicate string or class chain.

export type LocatorStrategy = 'accessibility-id' | 'id' | 'predicate' | 'class-chain';

export interface Locator {
  strategy: LocatorStrategy;
  value: string;
}

export function byAccessibilityId(value: string): Locator {
  return { strategy: 'accessibility-id', value };
}

export function byId(value: string): Locator {
  return { strategy: 'id', value };
}

export function byPredicate(value: string): Locator {
  return { strategy: 'predicate', value };
}

export function byClassChain(value: string): Locator {
  return { strategy: 'class-chain', value };
}

/** Translate a locator into the WebdriverIO selector string understood by the XCUITest driver. */
export function toSelector(locator: Locator): string {
  switch (locator.strategy) {
    case 'accessibility-id':
      return `~${locator.value}`;
    case 'id':
      return `id=${locator.value}`;
    case 'predicate':
      return `-ios predicate string:${locator.value}`;
    case 'class-chain':
      return `-ios class chain:${locator.value}`;
  }
}

export function describeLocator(locator: Locator): string {
  return `${locator.strategy}(${locator.value})`;
}
