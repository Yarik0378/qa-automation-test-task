import type { Locator, Page } from '@playwright/test';
import { parseMoney } from './money';

export type SortOption = 'Name (A to Z)' | 'Name (Z to A)' | 'Price (low to high)' | 'Price (high to low)';

export class InventoryPage {
  readonly title: Locator;
  readonly sortSelect: Locator;
  readonly items: Locator;
  /** Text of this link is the cart badge: "" when empty, "2" with two items. */
  readonly cartLink: Locator;
  readonly menuButton: Locator;
  readonly logoutLink: Locator;

  constructor(readonly page: Page) {
    this.title = page.getByTestId('title');
    this.sortSelect = page.getByTestId('product-sort-container');
    this.items = page.getByTestId('inventory-item');
    this.cartLink = page.getByTestId('shopping-cart-link');
    this.menuButton = page.getByRole('button', { name: 'Open Menu' });
    this.logoutLink = page.getByTestId('logout-sidebar-link');
  }

  async open(): Promise<void> {
    await this.page.goto('/inventory.html');
  }

  /** Product card; both the image and the title are buttons named "View details for <name>". */
  item(name: string): Locator {
    return this.items.filter({
      has: this.page.getByRole('button', { name: `View details for ${name}`, exact: true }),
    });
  }

  /** Clickable product title inside the card (the image button has no text). */
  itemTitle(name: string): Locator {
    return this.item(name).getByRole('button', { name: `View details for ${name}`, exact: true }).filter({ hasText: name });
  }

  itemPrice(name: string): Locator {
    return this.item(name).getByText(/^\$\d+\.\d{2}$/);
  }

  addToCartButton(name: string): Locator {
    return this.item(name).getByRole('button', { name: 'Add to cart' });
  }

  removeButton(name: string): Locator {
    return this.item(name).getByRole('button', { name: 'Remove' });
  }

  async addToCart(...names: string[]): Promise<void> {
    for (const name of names) await this.addToCartButton(name).click();
  }

  async removeFromCart(name: string): Promise<void> {
    await this.removeButton(name).click();
  }

  async openProduct(name: string): Promise<void> {
    await this.itemTitle(name).click();
  }

  async sortBy(option: SortOption): Promise<void> {
    await this.sortSelect.selectOption(option);
  }

  async productNames(): Promise<string[]> {
    return this.items.getByRole('button', { name: /^View details for / }).filter({ hasText: /\S/ }).allInnerTexts();
  }

  async productPrices(): Promise<number[]> {
    const texts = await this.items.getByText(/^\$\d+\.\d{2}$/).allInnerTexts();
    return texts.map(parseMoney);
  }

  async priceOf(name: string): Promise<number> {
    return parseMoney(await this.itemPrice(name).innerText());
  }

  async openCart(): Promise<void> {
    await this.cartLink.click();
  }

  async logout(): Promise<void> {
    await this.menuButton.click();
    await this.logoutLink.click();
  }
}
