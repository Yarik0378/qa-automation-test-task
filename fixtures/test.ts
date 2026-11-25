import { test as base, expect } from '@playwright/test';
import { CartPage } from '../pages/CartPage';
import { CheckoutPage } from '../pages/CheckoutPage';
import { InventoryPage } from '../pages/InventoryPage';
import { LoginPage } from '../pages/LoginPage';
import { ProductPage } from '../pages/ProductPage';
import { users } from '../test-data/users';

type UiFixtures = {
  loginPage: LoginPage;
  /** Inventory page with standard_user already logged in through the UI. */
  inventoryPage: InventoryPage;
  productPage: ProductPage;
  cartPage: CartPage;
  checkoutPage: CheckoutPage;
};

export const test = base.extend<UiFixtures>({
  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },
  inventoryPage: async ({ page, loginPage }, use) => {
    await loginPage.open();
    await loginPage.login(users.standard);
    const inventory = new InventoryPage(page);
    await expect(inventory.title).toHaveText('Products');
    await use(inventory);
  },
  productPage: async ({ page }, use) => {
    await use(new ProductPage(page));
  },
  cartPage: async ({ page }, use) => {
    await use(new CartPage(page));
  },
  checkoutPage: async ({ page }, use) => {
    await use(new CheckoutPage(page));
  },
});

export { expect };

/** Marks a test as failing because of a known product bug (see README, "Знайдені баги"). */
export function knownBug(id: string, summary: string): void {
  test.info().annotations.push({ type: 'bug', description: `${id}: ${summary}` });
  test.fail();
}
