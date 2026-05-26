import { test, expect } from '@playwright/test';

test('verify app title', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/Scrymechat/i);
});
