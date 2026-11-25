import { test as base, expect } from '@playwright/test';
import { BookingClient } from '../api/BookingClient';
import { CartPage } from '../pages/CartPage';
import { CheckoutPage } from '../pages/CheckoutPage';
import { InventoryPage } from '../pages/InventoryPage';
import { LoginPage } from '../pages/LoginPage';
import { ProductPage } from '../pages/ProductPage';
import { apiAdmin, buildBooking, type Booking } from '../test-data/booking';
import { users } from '../test-data/users';

type UiFixtures = {
  loginPage: LoginPage;
  /** Inventory page with standard_user already logged in through the UI. */
  inventoryPage: InventoryPage;
  productPage: ProductPage;
  cartPage: CartPage;
  checkoutPage: CheckoutPage;
};

type ApiFixtures = {
  bookingClient: BookingClient;
  /** Valid admin token from POST /auth. */
  adminToken: string;
  /** Registers a booking id to delete after the test, even if the test fails midway. */
  trackBooking: (id: number) => void;
  /** A booking created through the API before the test; deleted afterwards. */
  existingBooking: { id: number; data: Booking };
};

export const test = base.extend<UiFixtures & ApiFixtures>({
  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },
  inventoryPage: async ({ page, loginPage }, use) => {
    await loginPage.open();
    await loginPage.login(users.standard);
    const inventory = new InventoryPage(page);
    await expect(inventory.title).toHaveText('Products');
    await use(inventory);
  },
  productPage: async ({ page }, use) => {
    await use(new ProductPage(page));
  },
  cartPage: async ({ page }, use) => {
    await use(new CartPage(page));
  },
  checkoutPage: async ({ page }, use) => {
    await use(new CheckoutPage(page));
  },

  bookingClient: async ({ request }, use) => {
    await use(new BookingClient(request));
  },
  adminToken: async ({ bookingClient }, use) => {
    await use(await bookingClient.createToken(apiAdmin));
  },
  trackBooking: async ({ bookingClient, adminToken }, use, testInfo) => {
    const ids = new Set<number>();
    await use((id) => ids.add(id));
    for (const id of ids) {
      // Already deleted bookings answer 404/405; that is fine for cleanup.
      const response = await bookingClient.delete(id, adminToken);
      if (![201, 404, 405].includes(response.status())) {
        testInfo.annotations.push({ type: 'cleanup', description: `booking ${id}: DELETE ${response.status()}` });
      }
    }
  },
  existingBooking: async ({ bookingClient, trackBooking }, use) => {
    const data = buildBooking();
    const response = await bookingClient.create(data);
    expect(response.status(), 'precondition: booking is created').toBe(200);
    const { bookingid } = (await response.json()) as { bookingid: number };
    trackBooking(bookingid);
    await use({ id: bookingid, data });
  },
});

export { expect };

/** Marks a test as failing because of a known product bug (see README, "Знайдені баги"). */
export function knownBug(id: string, summary: string): void {
  test.info().annotations.push({ type: 'bug', description: `${id}: ${summary}` });
  test.fail();
}
