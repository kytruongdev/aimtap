import { Given, When, Then } from '@cucumber/cucumber';
import { assertExpectation } from '../../../src/index.js';
import { menuScreen } from '../screens/menu.screen.js';
import { cartScreen } from '../screens/cart.screen.js';

// Cart test feature (BA TF-2). The opening step resets app state so the cart starts empty (BR-005);
// the count assertion reads the actual count and compares, so a wrong expectation fails as a
// wrong_conclusion (ADR-016) rather than timing out on an absent element.

Given('the cart is empty', async () => {
  await menuScreen.resetAppState();
});

When('I add a product to the cart', async () => {
  await cartScreen.addFirstProductToCart();
});

Then('the cart shows {int} items', async (count: number) => {
  await cartScreen.openCart();
  await assertExpectation(async () => {
    const actual = await cartScreen.itemCount();
    if (actual !== count) {
      throw new Error(`Expected the cart to show ${count} items but it shows ${actual}`);
    }
  });
});
