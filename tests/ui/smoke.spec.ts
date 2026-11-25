import { test, expect } from '@playwright/test';

// Temporary smoke check for the scaffold; replaced by real UI specs in stage 2.
test('login page is reachable', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByTestId('login-button')).toBeVisible();
});
