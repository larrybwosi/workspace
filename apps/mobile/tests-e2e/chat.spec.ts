import { test, expect } from '@playwright/test';

test('chat app responds', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/Scrymechat/i);
});

test('login page responds', async ({ page }) => {
  await page.goto('/login');
  await expect(page).toHaveTitle(/Scrymechat/i);
});
