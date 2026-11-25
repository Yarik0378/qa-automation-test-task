import type { Locator, Page } from '@playwright/test';

export class CartPage {
  readonly header: Locator;
  /** In the cart only the product title is a "View details for ..." button, one per line. */
  readonly itemTitles: Locator;
  readonly removeButtons: Locator;
  readonly checkoutButton: Locator;

  constructor(readonly page: Page) {
    this.header = page.getByTestId('secondary-header');
    this.itemTitles = page.getByRole('main').getByRole('button', { name: /^View details for / });
    this.removeButtons = page.getByRole('main').getByRole('button', { name: 'Remove' });
    this.checkoutButton = page.getByTestId('checkout');
  }

  async open(): Promise<void> {
    await this.page.goto('/cart.html');
  }

  async checkout(): Promise<void> {
    await this.checkoutButton.click();
  }
}
