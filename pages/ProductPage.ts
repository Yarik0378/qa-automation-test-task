import type { Locator, Page } from '@playwright/test';

export class ProductPage {
  readonly details: Locator;
  readonly addToCartButton: Locator;
  readonly backButton: Locator;

  constructor(readonly page: Page) {
    this.details = page.getByRole('main');
    this.addToCartButton = page.getByTestId('add-to-cart');
    this.backButton = page.getByTestId('back-to-products');
  }

  /** Product image; its accessible name (alt text) is the product name. */
  image(productName: string): Locator {
    return this.details.getByRole('img', { name: productName });
  }

  /** Name, description and price have no role or test id, so they are found by exact text. */
  text(value: string): Locator {
    return this.details.getByText(value, { exact: true });
  }

  async backToProducts(): Promise<void> {
    await this.backButton.click();
  }
}
