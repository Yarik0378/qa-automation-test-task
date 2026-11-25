import { test, expect } from '../../fixtures/test';
import { products } from '../../test-data/products';

test('UI-02: product details match the catalog card', async ({ page, inventoryPage, productPage }) => {
  const name = products.backpack;
  const priceText = await inventoryPage.itemPrice(name).innerText();

  await inventoryPage.openProduct(name);

  await expect(page).toHaveURL(/inventory-item\.html\?id=\d+/);
  await expect(productPage.image(name)).toBeVisible();
  await expect(productPage.text(name)).toBeVisible();
  await expect(productPage.text(priceText)).toBeVisible();
  await expect(productPage.addToCartButton).toBeVisible();

  await productPage.backToProducts();
  await expect(inventoryPage.title).toHaveText('Products');
});
