import type { Locator, Page } from '@playwright/test';
import type { CheckoutInfo } from '../test-data/products';
import { parseMoney } from './money';

/** Covers all three checkout steps: information, overview and complete. */
export class CheckoutPage {
  readonly firstName: Locator;
  readonly lastName: Locator;
  readonly postalCode: Locator;
  readonly continueButton: Locator;
  readonly error: Locator;

  readonly itemTitles: Locator;
  readonly itemTotal: Locator;
  readonly tax: Locator;
  readonly total: Locator;
  readonly finishButton: Locator;

  readonly completeHeader: Locator;

  constructor(readonly page: Page) {
    this.firstName = page.getByTestId('firstName');
    this.lastName = page.getByTestId('lastName');
    this.postalCode = page.getByTestId('postalCode');
    this.continueButton = page.getByTestId('continue');
    this.error = page.getByRole('alert');

    this.itemTitles = page.getByRole('main').getByRole('button', { name: /^View details for / });
    this.itemTotal = page.getByTestId('subtotal-label');
    this.tax = page.getByTestId('tax-label');
    this.total = page.getByTestId('total-label');
    this.finishButton = page.getByTestId('finish');

    this.completeHeader = page.getByRole('heading', { name: 'Thank you for your order!' });
  }

  async fillInformation(info: Partial<CheckoutInfo>): Promise<void> {
    if (info.firstName !== undefined) await this.firstName.fill(info.firstName);
    if (info.lastName !== undefined) await this.lastName.fill(info.lastName);
    if (info.postalCode !== undefined) await this.postalCode.fill(info.postalCode);
  }

  async continue(): Promise<void> {
    await this.continueButton.click();
  }

  async finish(): Promise<void> {
    await this.finishButton.click();
  }

  async summary(): Promise<{ itemTotal: number; tax: number; total: number }> {
    return {
      itemTotal: parseMoney(await this.itemTotal.innerText()),
      tax: parseMoney(await this.tax.innerText()),
      total: parseMoney(await this.total.innerText()),
    };
  }
}
