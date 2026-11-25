import { test, expect, knownBug } from '../../fixtures/test';
import type { InventoryPage, SortOption } from '../../pages/InventoryPage';

const byName = (a: string, b: string) => a.localeCompare(b);

const nameSorts: { option: SortOption; compare: (a: string, b: string) => number }[] = [
  { option: 'Name (A to Z)', compare: byName },
  { option: 'Name (Z to A)', compare: (a, b) => byName(b, a) },
];

const priceSorts: { option: SortOption; compare: (a: number, b: number) => number }[] = [
  { option: 'Price (low to high)', compare: (a, b) => a - b },
  { option: 'Price (high to low)', compare: (a, b) => b - a },
];

/** "Name (A to Z)" is the default order, so start from another one to make sure the sort really runs. */
async function sortFromDifferentOrder(inventoryPage: InventoryPage, option: SortOption): Promise<void> {
  await inventoryPage.sortBy(option === 'Name (Z to A)' ? 'Price (low to high)' : 'Name (Z to A)');
  await inventoryPage.sortBy(option);
}

test.describe('UI-03: catalog sorting', () => {
  for (const { option, compare } of nameSorts) {
    test(`UI-03: sorts products by ${option}`, async ({ inventoryPage }) => {
      await sortFromDifferentOrder(inventoryPage, option);

      const names = await inventoryPage.productNames();
      expect(names).toHaveLength(6);
      expect(names).toEqual([...names].sort(compare));
    });
  }

  // Two products share $15.99, so only prices are compared, not names.
  for (const { option, compare } of priceSorts) {
    test(`UI-03: sorts products by ${option}`, async ({ inventoryPage }) => {
      await sortFromDifferentOrder(inventoryPage, option);

      const prices = await inventoryPage.productPrices();
      expect(prices).toHaveLength(6);
      expect(prices).toEqual([...prices].sort(compare));
    });
  }
});

test('UI-07: keeps chosen sorting after returning from product details', async ({ inventoryPage, productPage }) => {
  knownBug('BUG-02', 'sorting resets to "Name (A to Z)" after "Back to products"');

  await inventoryPage.sortBy('Price (low to high)');
  const sortedNames = await inventoryPage.productNames();
  const firstProduct = sortedNames[0];
  if (!firstProduct) throw new Error('Catalog is empty');

  await inventoryPage.openProduct(firstProduct);
  await productPage.backToProducts();

  await expect(inventoryPage.title).toHaveText('Products');
  expect(await inventoryPage.productNames()).toEqual(sortedNames);
});
