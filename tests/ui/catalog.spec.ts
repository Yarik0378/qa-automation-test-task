import { test, expect } from '../../fixtures/test';
import { products } from '../../test-data/products';

test('UI-02: product details match the catalog card', async ({ page, inventoryPage, productPage }) => {
  const name = products.backpack;
  const priceText = await inventoryPage.itemPrice(name).innerText();

  await inventoryPage.openProduct(name);

  await expect(page).toHaveURL(/inventory-item\.html\?id=\d+/);
  await expect(productPage.details.getByRole('img', { name })).toBeVisible();
  await expect(productPage.details.getByText(name, { exact: true })).toBeVisible();
  await expect(productPage.details.getByText(priceText, { exact: true })).toBeVisible();
  await expect(productPage.addToCartButton).toBeVisible();

  await productPage.backToProducts();
  await expect(inventoryPage.title).toHaveText('Products');
});
