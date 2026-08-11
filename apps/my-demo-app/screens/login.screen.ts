import { find, byAccessibilityId, byPredicate, type Locator } from '../../../src/index.js';

// Page Object for the login screen (BR-007, ADR-011). Confirmed via Appium Inspector: the screen lists
// usernames as buttons keyed by the email (accessibility id); tapping one fills both the username and
// password fields, so login only taps a username and submits. The submit button is named "Login".
const SCREEN = 'LoginScreen';

const loginButton: Locator = byPredicate("type == 'XCUIElementTypeButton' AND name == 'Login'");

export const loginScreen = {
  async login(username: string): Promise<void> {
    await (await find(byAccessibilityId(username), SCREEN)).click();
    await (await find(loginButton, SCREEN)).click();
  },
};
