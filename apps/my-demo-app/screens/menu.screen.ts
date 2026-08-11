import { find, byAccessibilityId, byPredicate, type Locator } from '../../../src/index.js';

// Page Object for the bottom-tab navigation and the "More" menu (BR-007, ADR-011). In this app login
// is reached from the More tab, not a landing login screen (confirmed via Appium Inspector). Locators
// centralized here; no assertions.
const SCREEN = 'MenuScreen';

const moreTab: Locator = byAccessibilityId('More-tab-item');
const loginMenuItem: Locator = byAccessibilityId('Login Button');
const resetMenuItem: Locator = byAccessibilityId('ResetAppState-menu-item');
// "Reset App State" opens a confirm alert (RESET APP), then a "done" alert (OK). Both must be accepted.
const resetConfirmButton: Locator = byAccessibilityId('RESET APP');
const resetDoneButton: Locator = byAccessibilityId('OK');
// The signed-in state shows this item; its button is not an accessibility element, so it is matched
// by name via a predicate rather than by accessibility id.
const logoutMenuItem: Locator = byPredicate("name == 'LogOut-menu-item'");

export const menuScreen = {
  /** Open the More tab and go to the login screen. */
  async openLogin(): Promise<void> {
    await (await find(moreTab, SCREEN)).click();
    await (await find(loginMenuItem, SCREEN)).click();
  },

  /** Clear app state (empties the cart, signs out) via the More menu, accepting both alerts. */
  async resetAppState(): Promise<void> {
    await (await find(moreTab, SCREEN)).click();
    await (await find(resetMenuItem, SCREEN)).click();
    await (await find(resetConfirmButton, SCREEN)).click();
    await (await find(resetDoneButton, SCREEN)).click();
  },

  /**
   * Whether an account is signed in: the More menu shows the Log Out item only when signed in. A
   * query, not an assertion (the step asserts). Returns false when the item never appears.
   */
  async isSignedIn(): Promise<boolean> {
    await (await find(moreTab, SCREEN)).click();
    try {
      await find(logoutMenuItem, SCREEN);
      return true;
    } catch {
      return false;
    }
  },
};
