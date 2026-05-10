import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  // Mock session
  await page.route('**/api/auth/get-session', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        user: { id: 'user-1', name: 'Jane Doe', email: 'jane@example.com' },
        session: { id: 'sess-1', token: 'tok-1', expiresAt: new Date(Date.now() + 3600000).toISOString() },
      }),
    });
  });

  // Mock workspaces
  await page.route('**/api/workspaces', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([
        { id: 'w-1', name: 'Engineering', slug: 'eng' },
        { id: 'w-2', name: 'Design', slug: 'design' }
      ]),
    });
  });

  // Mock channels
  await page.route('**/api/channels', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([
        { id: 'c-1', name: 'general', type: 'PUBLIC' },
        { id: 'c-2', name: 'private-vault', type: 'PRIVATE' }
      ]),
    });
  });

  // Mock messages
  await page.route('**/api/**/messages*', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        messages: [
          {
            id: 'm-1',
            content: 'Welcome to the server!',
            timestamp: new Date().toISOString(),
            user: { id: 'u-2', name: 'System', image: null },
            reactions: [{ emoji: '👋', count: 5 }]
          }
        ],
        nextCursor: null
      }),
    });
  });

  // Mock realtime config
  await page.route('**/api/config/realtime', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ provider: 'ably' }),
    });
  });
});

test('verify profile layout', async ({ page }) => {
  await page.goto('/(tabs)/profile');
  await expect(page.getByText('Jane Doe')).toBeVisible();
  await expect(page.getByText('Edit Profile')).toBeVisible();
  await expect(page.getByText('Scan QR Code')).toBeVisible();
  await page.screenshot({ path: 'tests-e2e/screenshots/profile.png' });
});

test('verify sidebar navigation structure', async ({ page }) => {
  await page.goto('/(tabs)/workspaces');
  await expect(page.getByText('Select a server to see channels')).toBeVisible();
  await page.screenshot({ path: 'tests-e2e/screenshots/sidebar.png' });
});

test('verify chat screen elements', async ({ page }) => {
  await page.goto('/chat/c-1');
  await expect(page.getByText('# general')).toBeVisible();
  await expect(page.getByText('Welcome to the server!')).toBeVisible();
  await expect(page.getByPlaceholder('Message #general')).toBeVisible();
  await page.screenshot({ path: 'tests-e2e/screenshots/chat.png' });
});
