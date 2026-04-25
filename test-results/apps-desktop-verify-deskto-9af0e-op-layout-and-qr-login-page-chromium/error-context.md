# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: apps/desktop/verify-desktop.spec.cjs >> verify desktop layout and qr login page
- Location: apps/desktop/verify-desktop.spec.cjs:3:1

# Error details

```
Error: expect(locator).toContainText(expected) failed

Locator: locator('h2')
Expected substring: "Login with QR Code"
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toContainText" with timeout 5000ms
  - waiting for locator('h2')

```

# Test source

```ts
  1  | const { test, expect } = require('@playwright/test');
  2  |
  3  | test('verify desktop layout and qr login page', async ({ page }) => {
  4  |   await page.addInitScript(() => {
  5  |     window.__TAURI_INTERNALS__ = {
  6  |       plugins: {
  7  |         sql: {},
  8  |         store: {}
  9  |       }
  10 |     };
  11 |   });
  12 |
  13 |   await page.goto('http://localhost:1420/login/qr');
  14 |   await page.waitForTimeout(5000);
  15 |
  16 |   // Dump page content for debugging
  17 |   const content = await page.content();
  18 |   console.log("Page content snippet:", content.substring(0, 1000));
  19 |
  20 |   await page.screenshot({ path: 'qr-login-desktop.png' });
  21 |
  22 |   // The TitleBar might not have rendered if there was a JS error
  23 |   const titleBar = page.locator('div[data-tauri-drag-region]');
  24 |   // await expect(titleBar).toBeVisible();
  25 |
> 26 |   await expect(page.locator('h2')).toContainText('Login with QR Code');
     |                                    ^ Error: expect(locator).toContainText(expected) failed
  27 | });
  28 |
```