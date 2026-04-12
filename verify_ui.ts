import { chromium } from 'playwright';

async function run() {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1280, height: 800 });

  try {
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });
    console.log('Page loaded');

    await page.screenshot({ path: 'verification/home-hero.png' });

    // Scroll and capture sections
    const sections = [
      { name: 'messaging', selector: 'section:nth-of-type(2)' },
      { name: 'issues', selector: 'section:nth-of-type(3)' },
      { name: 'github', selector: 'section:nth-of-type(4)' },
      { name: 'foundation', selector: 'section:nth-of-type(5)' },
      { name: 'stats', selector: 'section:nth-of-type(6)' },
      { name: 'cta', selector: 'section:nth-of-type(7)' }
    ];

    for (const section of sections) {
      const el = await page.$(section.selector);
      if (el) {
        await el.screenshot({ path: `verification/home-${section.name}.png` });
      }
    }

    console.log('Screenshots captured');
  } catch (e) {
    console.error('Error during verification:', e);
  } finally {
    await browser.close();
  }
}

run();
