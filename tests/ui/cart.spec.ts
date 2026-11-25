import { test, expect } from '../../fixtures/test';
import { products } from '../../test-data/products';

test('UI-04: adds two products to the cart and removes one', async ({ page, inventoryPage, cartPage }) => {
  const { backpack, bikeLight } = products;

  await test.step('add two products', async () => {
    await inventoryPage.addToCart(backpack, bikeLight);
    await expect(inventoryPage.cartLink).toHaveText('2');
    await expect(inventoryPage.removeButton(backpack)).toBeVisible();
    await expect(inventoryPage.removeButton(bikeLight)).toBeVisible();
  });

  await test.step('remove one product', async () => {
    await inventoryPage.removeFromCart(backpack);
    await expect(inventoryPage.cartLink).toHaveText('1');
    await expect(inventoryPage.addToCartButton(backpack)).toBeVisible();
  });

  await test.step('cart contains only the remaining product', async () => {
    await inventoryPage.openCart();
    await expect(page).toHaveURL(/\/cart\.html$/);
    await expect(cartPage.header).toContainText('Your Cart');
    await expect(cartPage.itemTitles).toHaveText([bikeLight]);
  });
});
