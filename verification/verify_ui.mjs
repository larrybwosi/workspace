import { chromium } from 'playwright';

async function run() {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1280, height: 800 });

  try {
    const port = 8082;
    console.log(`Navigating to http://localhost:${port}...`);
    await page.goto(`http://localhost:${port}`, { waitUntil: 'networkidle', timeout: 30000 });
    console.log('Page loaded');

    await page.screenshot({ path: 'verification/home-hero.png' });

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
      } else {
        console.warn(`Section ${section.name} not found with selector ${section.selector}`);
      }
    }

    console.log('Screenshots captured successfully in verification/ directory');
  } catch (e) {
    console.error('Error during verification:', e);
  } finally {
    await browser.close();
  }
}

run();
