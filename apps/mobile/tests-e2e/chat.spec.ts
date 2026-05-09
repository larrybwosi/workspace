import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
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

  // Mock workspace channels
  await page.route('**/api/workspaces/test-workspace/channels', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([{ id: 'test-channel-id', name: 'general', workspaceId: 'test-workspace-id' }]),
    });
  });

  // Mock messages
  await page.route('**/api/**/channels/test-channel-id/messages*', async (route) => {
    const url = route.request().url();
    const isThread = url.includes('threadId=message-1');

    if (isThread) {
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
                  user: { id: 'other-user-id', name: 'Other User', avatar: null },
                  reactions: [],
                  replyCount: 2,
                  mentions: [],
                },
                {
                    id: 'reply-1',
                    content: 'This is a reply',
                    userId: 'test-user-id',
                    timestamp: new Date().toISOString(),
                    user: { id: 'test-user-id', name: 'Test User' },
                    reactions: [],
                    replyCount: 0,
                }
              ],
              nextCursor: null,
            }),
          });
    } else {
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
                  user: { id: 'other-user-id', name: 'Other User', avatar: null },
                  reactions: [],
                  replyCount: url.includes('withReplies') ? 2 : 0,
                  mentions: [],
                },
              ],
              nextCursor: null,
            }),
          });
    }
  });

  // Mock DMs
  await page.route('**/api/dms', async (route) => {
    await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
    });
  });
});

test('app responds', async ({ page }) => {
  const response = await page.goto('/');
  expect(response?.status()).toBe(200);
});

test('login page responds', async ({ page }) => {
  const response = await page.goto('/login');
  expect(response?.status()).toBe(200);
});
