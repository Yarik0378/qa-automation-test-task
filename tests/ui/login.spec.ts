import { test, expect } from '../../fixtures/test';
import { InventoryPage } from '../../pages/InventoryPage';
import { users, type User } from '../../test-data/users';

test('UI-01: standard user logs in and sees the catalog', async ({ page, loginPage }) => {
  await loginPage.open();
  await loginPage.login(users.standard);

  const inventory = new InventoryPage(page);
  await expect(page).toHaveURL(/\/inventory\.html$/);
  await expect(inventory.title).toHaveText('Products');
  await expect(inventory.items).toHaveCount(6);
});

test('UI-06: logout ends the session and protects inventory route', async ({ page, inventoryPage, loginPage }) => {
  await inventoryPage.logout();
  await expect(loginPage.loginButton).toBeVisible();

  await inventoryPage.open();
  await expect(page).not.toHaveURL(/inventory\.html/);
  await expect(loginPage.error).toHaveText("Epic sadface: You can only access '/inventory.html' when you are logged in.");
});

const rejectedLogins: { title: string; user: User; error: string }[] = [
  { title: 'empty username', user: { username: '', password: 'secret_sauce' }, error: 'Epic sadface: Username is required' },
  { title: 'empty password', user: { username: 'standard_user', password: '' }, error: 'Epic sadface: Password is required' },
  {
    title: 'wrong password',
    user: { username: 'standard_user', password: 'wrong_password' },
    error: 'Epic sadface: Username and password do not match any user in this service',
  },
  { title: 'locked out user', user: users.lockedOut, error: 'Epic sadface: Sorry, this user has been locked out.' },
];

for (const { title, user, error } of rejectedLogins) {
  test(`UI-N1: login is rejected for ${title}`, async ({ page, loginPage }) => {
    await loginPage.open();
    await loginPage.login(user);

    await expect(loginPage.error).toHaveText(error);
    await expect(page).not.toHaveURL(/inventory\.html/);
  });
}
