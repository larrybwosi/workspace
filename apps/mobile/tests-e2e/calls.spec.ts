import { test, expect } from '@playwright/test';

test('calls page loads', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/Scrymechat/i);
});
