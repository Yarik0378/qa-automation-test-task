import { test, expect } from '../../fixtures/test';
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

/**
 * "Name (A to Z)" is the default order, so first switch to another order and check
 * that the list really changed; otherwise a dead dropdown would pass the A-Z test.
 */
async function sortFromDifferentOrder(inventoryPage: InventoryPage, option: SortOption): Promise<void> {
  const initial = await inventoryPage.productNames();
  await inventoryPage.sortBy(option === 'Name (Z to A)' ? 'Price (low to high)' : 'Name (Z to A)');
  await expect
    .poll(() => inventoryPage.productNames(), { message: 'intermediate sort must change the order' })
    .not.toEqual(initial);
  await inventoryPage.sortBy(option);
}

// The product set does not change, so the expected list is the same set sorted up front.
// expect.poll re-reads the page until it matches, so a late re-render is not a flaky read.
test.describe('UI-03: catalog sorting', () => {
  for (const { option, compare } of nameSorts) {
    test(`UI-03: sorts products by ${option}`, async ({ inventoryPage }) => {
      const expected = (await inventoryPage.productNames()).sort(compare);
      expect(expected).toHaveLength(6);

      await sortFromDifferentOrder(inventoryPage, option);

      await expect.poll(() => inventoryPage.productNames()).toEqual(expected);
    });
  }

  // Two products share $15.99, so only prices are compared, not names.
  for (const { option, compare } of priceSorts) {
    test(`UI-03: sorts products by ${option}`, async ({ inventoryPage }) => {
      const expected = (await inventoryPage.productPrices()).sort(compare);
      expect(expected).toHaveLength(6);

      await sortFromDifferentOrder(inventoryPage, option);

      await expect.poll(() => inventoryPage.productPrices()).toEqual(expected);
    });
  }
});
