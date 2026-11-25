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

  async backToProducts(): Promise<void> {
    await this.backButton.click();
  }
}
