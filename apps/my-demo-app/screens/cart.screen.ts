import { find, byAccessibilityId, type Locator } from '../../../src/index.js';

// Page Object for the catalog -> product detail -> cart flow (BR-007, ADR-011). Accessibility ids
// confirmed via a page-source probe: products are "ProductItem"; the product detail screen has the
// "AddToCart" button; the cart tab is "Cart-tab-item"; the cart shows its count as an element whose id
// is "<n> Items" (e.g. "1 Items"). No assertions here — steps assert.
const SCREEN = 'CartScreen';

const catalogTab: Locator = byAccessibilityId('Catalog-tab-item');
const productItem: Locator = byAccessibilityId('ProductItem');
const addToCart: Locator = byAccessibilityId('AddToCart');
const cartTab: Locator = byAccessibilityId('Cart-tab-item');

export const cartScreen = {
  /** Open the catalog, open the first product, and add it to the cart. */
  async addFirstProductToCart(): Promise<void> {
    await (await find(catalogTab, SCREEN)).click();
    await (await find(productItem, SCREEN)).click();
    await (await find(addToCart, SCREEN)).click();
  },

  /** Open the cart tab. */
  async openCart(): Promise<void> {
    await (await find(cartTab, SCREEN)).click();
  },

  /** Whether the cart shows exactly the given item count. A query, not an assertion. */
  async showsItemCount(count: number): Promise<boolean> {
    try {
      await find(byAccessibilityId(`${count} Items`), SCREEN);
      return true;
    } catch {
      return false;
    }
  },
};
