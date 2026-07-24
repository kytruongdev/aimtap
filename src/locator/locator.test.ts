import { describe, it, expect } from 'vitest';
import {
  byAccessibilityId,
  byClassChain,
  byId,
  byPredicate,
  describeLocator,
  toSelector,
} from './locator.js';

describe('locator builders', () => {
  it('carries the strategy and the raw value', () => {
    expect(byAccessibilityId('login-button')).toEqual({
      strategy: 'accessibility-id',
      value: 'login-button',
    });
  });
});

describe('toSelector', () => {
  it('maps every iOS strategy to its WebdriverIO selector', () => {
    expect(toSelector(byAccessibilityId('login-button'))).toBe('~login-button');
    expect(toSelector(byId('login'))).toBe('id=login');
    expect(toSelector(byPredicate('type == "XCUIElementTypeButton"'))).toBe(
      '-ios predicate string:type == "XCUIElementTypeButton"',
    );
    expect(toSelector(byClassChain('**/XCUIElementTypeButton[1]'))).toBe(
      '-ios class chain:**/XCUIElementTypeButton[1]',
    );
  });
});

describe('describeLocator', () => {
  it('renders a readable form for error messages', () => {
    expect(describeLocator(byAccessibilityId('login-button'))).toBe(
      'accessibility-id(login-button)',
    );
  });
});
