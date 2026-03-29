import { test, expect } from '@playwright/test';

test('has title', async ({ page }) => {
  await page.goto('/');

  // Expect a title "to contain" a substring.
  // Replace with an actual title expected from your app
  // await expect(page).toHaveTitle(/Dealio/);
});

test('login page loads', async ({ page }) => {
  await page.goto('/login');
  // Check for some text that should be on the login page
  // await expect(page.getByText('Login')).toBeVisible();
});
