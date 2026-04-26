import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log(`Error in browser: "${msg.text()}"`);
    }
  });

  // Mock the session API
  await page.route('**/api/auth/get-session', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        user: {
          id: 'test-user-id',
          name: 'Test User',
          email: 'test@example.com',
          image: null,
        },
        session: {
          id: 'test-session-id',
          token: 'test-token',
          expiresAt: new Date(Date.now() + 3600000).toISOString(),
        },
      }),
    });
  });

  // Mock workspaces
  await page.route('**/api/workspaces', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([{ id: 'test-workspace-id', name: 'Test Workspace', slug: 'test-workspace' }]),
    });
  });

  // Mock channels
  await page.route('**/api/channels', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([{ id: 'test-channel-id', name: 'general', workspaceId: 'test-workspace-id' }]),
    });
  });

  // Mock messages
  await page.route('**/api/channels/test-channel-id/messages*', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        messages: [
          {
            id: 'message-1',
            content: 'Hello world',
            userId: 'other-user-id',
            timestamp: new Date().toISOString(),
            user: { id: 'other-user-id', name: 'Other User' },
            reactions: [],
            replyCount: 0,
          },
        ],
        nextCursor: null,
      }),
    });
  });
});

test('can send a message', async ({ page }) => {
  await page.goto('/chat/test-channel-id?workspaceId=test-workspace-id');

  // Wait for initial messages to load
  await expect(page.getByText('Hello world')).toBeVisible();

  // Mock send message
  await page.route('**/api/channels/test-channel-id/messages', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        id: 'new-message-id',
        content: 'Test reply',
        userId: 'test-user-id',
        timestamp: new Date().toISOString(),
        user: { id: 'test-user-id', name: 'Test User' },
        reactions: [],
        replyCount: 0,
      }),
    });
  });

  const input = page.getByPlaceholder('Type a message...');
  await input.fill('Test reply');
  await page.locator('button').filter({ hasText: 'send' }).or(page.locator('div[role="button"]').filter({ hasText: 'send' })).click();

  // Verification depends on implementation details, but we expect input to be cleared
  await expect(input).toHaveValue('');
});

test('can navigate to thread', async ({ page }) => {
    // Update mock to include a message with replies
    await page.route('**/api/channels/test-channel-id/messages*', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            messages: [
              {
                id: 'message-1',
                content: 'Hello world',
                userId: 'other-user-id',
                timestamp: new Date().toISOString(),
                user: { id: 'other-user-id', name: 'Other User' },
                reactions: [],
                replyCount: 2,
              },
            ],
            nextCursor: null,
          }),
        });
      });

    await page.goto('/chat/test-channel-id?workspaceId=test-workspace-id');

    await expect(page.getByText('2 replies')).toBeVisible();
    await page.getByText('2 replies').click();

    // Verify navigation to thread
    await expect(page).toHaveURL(/\/chat\/test-channel-id\/thread\/message-1/);
    await expect(page.getByText('Thread')).toBeVisible();
});
