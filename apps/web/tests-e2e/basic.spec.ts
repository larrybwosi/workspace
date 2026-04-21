import { test, expect } from '@playwright/test';

test('has title', async ({ page }) => {
  await page.goto('/');
});

test('login page loads', async ({ page }) => {
  await page.goto('/login');
});
