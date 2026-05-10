import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  // Mock everything for functional testing
  await page.route('**/api/auth/get-session', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        user: { id: 'u-1', name: 'Tester' },
        session: { id: 's-1', token: 't-1' },
      }),
    });
  });

  await page.route('**/api/config/realtime', async (route) => {
    await route.fulfill({ status: 200, body: JSON.stringify({ provider: 'ably' }) });
  });

  await page.route('**/api/workspaces', async (route) => {
    await route.fulfill({ status: 200, body: JSON.stringify([{ id: 'w-1', name: 'Server 1', slug: 's1' }]) });
  });

  await page.route('**/api/channels', async (route) => {
    await route.fulfill({ status: 200, body: JSON.stringify([{ id: 'c-1', name: 'general', type: 'PUBLIC' }]) });
  });
});

test('can navigate to dm list', async ({ page }) => {
  await page.goto('/(tabs)/dms');
  await expect(page.getByText('Direct Messages')).toBeVisible();
});

test('can navigate to profile', async ({ page }) => {
  await page.goto('/(tabs)/profile');
  await expect(page.getByText('Tester')).toBeVisible();
});
