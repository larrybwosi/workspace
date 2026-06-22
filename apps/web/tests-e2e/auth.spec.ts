import { test, expect } from '@playwright/test';

/**
 * Note: These tests use API mocking because the sandbox environment lacks a pre-provisioned
 * PostgreSQL/Redis database required for full integration testing of Better-Auth.
 *
 * The tests verify:
 * 1. UI-to-API integration for signup and login flows.
 * 2. Proper handling of authentication success responses.
 * 3. Session retrieval and protected route access.
 */
test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Intercept auth and config calls to simulate a functional backend
    await page.route(url => url.pathname.includes('/api/auth') || url.pathname.includes('/api/config/realtime') || url.pathname.includes('/api/users/me'), async route => {
      const url = route.request().url();

      if (url.includes('/signup/email') || url.includes('/sign-up/email') || url.includes('/signin/email') || url.includes('/sign-in/email') || url.includes('/get-session')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            user: { id: 'u1', email: 'john@example.com', name: 'John Doe', emailVerified: true },
            session: { id: 's1', token: 't1', userId: 'u1', expiresAt: new Date(Date.now() + 3600000).toISOString() }
          })
        });
      } else if (url.includes('/api/users/me')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ id: 'u1', email: 'john@example.com', name: 'John Doe' })
        });
      } else if (url.includes('/api/config/realtime')) {
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ provider: 'none' })
        });
      } else {
        await route.continue();
      }
    });
  });

  test('should allow a new user to sign up', async ({ page }) => {
    await page.goto('/signup');
    await page.fill('input[id="name"]', 'John Doe');
    await page.fill('input[id="email"]', 'john@example.com');
    await page.fill('input[id="password"]', 'password123');
    await page.fill('input[id="confirmPassword"]', 'password123');
    const checkbox = page.getByRole('checkbox');
    await checkbox.click();

    await page.click('button[type="submit"]');

    // Check for text that only appears in the main app (logged in)
    await expect(page.getByText(/Welcome|General/i).first()).toBeVisible({ timeout: 15000 });
  });

  test('should allow an existing user to login', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[id="email"]', 'john@example.com');
    await page.fill('input[id="password"]', 'password123');

    await page.click('button[type="submit"]');
    await expect(page.getByText(/Welcome|General/i).first()).toBeVisible({ timeout: 15000 });
  });

  test('should verify session retrieval and authorization', async ({ page }) => {
    // Manually set a mock session cookie
    await page.context().addCookies([{
        name: 'better-auth.session_token',
        value: 't1',
        url: 'http://localhost:3001'
    }]);

    await page.goto('/');
    await expect(page.getByText(/Welcome|General/i).first()).toBeVisible({ timeout: 15000 });
  });
});
