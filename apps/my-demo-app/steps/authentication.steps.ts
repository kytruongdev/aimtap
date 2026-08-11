import { Given, When, Then } from '@cucumber/cucumber';
import { assertExpectation } from '../../../src/index.js';
import { standardUser } from '../fixtures/users.js';
import { menuScreen } from '../screens/menu.screen.js';
import { loginScreen } from '../screens/login.screen.js';

// Authentication test feature (BA TF-1). Step definitions map each behaviour sentence to a Page Object
// method; no locators here, assertions via assertExpectation so a failed check becomes a
// wrong_conclusion (ADR-016). The opening step resets app state first so each scenario starts signed
// out, independent of what a previous run left behind (BR-005).

Given('the login screen is open', async () => {
  await menuScreen.resetAppState();
  await menuScreen.openLogin();
});

When('I log in with the standard account', async () => {
  await loginScreen.login(standardUser().username);
});

Then('the account is signed in', async () => {
  await assertExpectation(async () => {
    if (!(await menuScreen.isSignedIn())) {
      throw new Error('Expected the account to be signed in after login');
    }
  });
});
