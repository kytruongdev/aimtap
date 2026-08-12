import { find, byAccessibilityId, byPredicate, type Locator } from '../../../src/index.js';

// Page Object for the catalog -> product detail -> cart flow (BR-007, ADR-011). Accessibility ids
// confirmed via a page-source probe: products are "ProductItem"; the product detail screen has the
// "AddToCart" button; the cart tab is "Cart-tab-item"; the cart shows its count as an element whose id
// is "<n> Items" (e.g. "1 Items"). No assertions here — steps assert.
const SCREEN = 'CartScreen';

const catalogTab: Locator = byAccessibilityId('Catalog-tab-item');
const productItem: Locator = byAccessibilityId('ProductItem');
const addToCart: Locator = byAccessibilityId('AddToCart');
const cartTab: Locator = byAccessibilityId('Cart-tab-item');
// The cart count label reads "<n> Items"; matched by pattern so the actual number can be read (rather
// than waiting for a specific "<n> Items" element that may not exist — which would time the step out).
const itemCountLabel: Locator = byPredicate("name MATCHES '[0-9]+ Items'");

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

  /** The number of items the cart currently shows. A query, not an assertion. */
  async itemCount(): Promise<number> {
    const label = await (await find(itemCountLabel, SCREEN)).getAttribute('name');
    return Number(/(\d+)/.exec(label ?? '')?.[1] ?? 0);
  },
};
