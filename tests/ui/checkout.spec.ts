import { errors } from '@playwright/test';
import { test, expect, knownBug } from '../../fixtures/test';
import { roundCents } from '../../pages/money';
import { customer, products, TAX_RATE, type CheckoutInfo } from '../../test-data/products';

test('UI-05: completes checkout for two products with correct totals', async ({
  page,
  inventoryPage,
  cartPage,
  checkoutPage,
}) => {
  const names = [products.backpack, products.bikeLight];
  const prices = await Promise.all(names.map((name) => inventoryPage.priceOf(name)));
  const expectedItemTotal = roundCents(prices.reduce((sum, price) => sum + price, 0));
  const expectedTax = roundCents(expectedItemTotal * TAX_RATE);

  await test.step('add products and open cart', async () => {
    await inventoryPage.addToCart(...names);
    await inventoryPage.openCart();
    await expect(cartPage.itemTitles).toHaveText(names);
  });

  await test.step('fill customer information', async () => {
    await cartPage.checkout();
    await checkoutPage.fillInformation(customer);
    await checkoutPage.continue();
    await expect(page).toHaveURL(/checkout-step-two\.html$/);
  });

  await test.step('overview shows correct totals', async () => {
    await expect(checkoutPage.itemTitles).toHaveText(names);
    const summary = await checkoutPage.summary();
    expect(summary.itemTotal).toBe(expectedItemTotal);
    expect(summary.tax).toBe(expectedTax);
    expect(summary.total).toBe(roundCents(expectedItemTotal + expectedTax));
  });

  await test.step('finish order and cart is emptied', async () => {
    await checkoutPage.finish();
    await expect(page).toHaveURL(/checkout-complete\.html$/);
    await expect(checkoutPage.completeHeader).toBeVisible();
    await expect(inventoryPage.cartLink).toHaveText('');
  });
});

const missingFields: { field: keyof CheckoutInfo; error: string }[] = [
  { field: 'firstName', error: 'Error: First Name is required' },
  { field: 'lastName', error: 'Error: Last Name is required' },
  { field: 'postalCode', error: 'Error: Postal Code is required' },
];

for (const { field, error } of missingFields) {
  test(`UI-N2: checkout requires ${field}`, async ({ page, inventoryPage, cartPage, checkoutPage }) => {
    await inventoryPage.addToCart(products.backpack);
    await inventoryPage.openCart();
    await cartPage.checkout();

    await checkoutPage.fillInformation({ ...customer, [field]: '' });
    await checkoutPage.continue();

    await expect(checkoutPage.error).toHaveText(error);
    await expect(page).toHaveURL(/checkout-step-one\.html$/);
  });
}

test('UI-N3: an order cannot be placed with an empty cart', async ({
  page,
  inventoryPage,
  cartPage,
  checkoutPage,
}) => {
  knownBug('BUG-001', 'order with an empty cart is confirmed as dispatched');

  await inventoryPage.openCart();
  await expect(page).toHaveURL(/\/cart\.html$/);
  await expect(cartPage.itemTitles).toHaveCount(0);

  // No requirement says HOW the app must block it (disabled button, error, redirect),
  // so a step that times out counts as "blocked". Only timeouts are caught; the step
  // and reason are recorded, because a broken locator also times out and must be
  // told apart from a real fix when reading the report.
  const steps: [string, () => Promise<void>][] = [
    ['click Checkout', () => cartPage.checkout()],
    ['fill customer information', () => checkoutPage.fillInformation(customer)],
    ['click Continue', () => checkoutPage.continue()],
    ['click Finish', () => checkoutPage.finish()],
    ['wait for order confirmation', () => checkoutPage.completeHeader.waitFor({ timeout: 5_000 })],
  ];

  let blockedAt: string | undefined;
  for (const [name, action] of steps) {
    try {
      await test.step(name, action);
    } catch (error) {
      if (!(error instanceof errors.TimeoutError)) throw error;
      blockedAt = name;
      const reason = error.message
        .replace(/\u001b\[[0-9;]*m/g, '') // strip terminal colors
        .split('\n')
        .filter((line) => /Timeout|waiting for/.test(line))
        .map((line) => line.trim())
        .join(' | ');
      test.info().annotations.push({ type: 'blocked-at', description: `${name}: ${reason}` });
      break;
    }
  }

  expect(blockedAt, 'an order without items must not be confirmed').toBeDefined();
});
