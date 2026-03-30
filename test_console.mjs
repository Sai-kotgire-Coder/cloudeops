import { chromium } from 'playwright';

(async () => {
  try {
    const browser = await chromium.launch();
    const page = await browser.newPage();
    
    page.on('console', msg => console.log('PAGE LOG:', msg.type(), msg.text()));
    page.on('pageerror', exception => {
      console.log(`Uncaught exception: "${exception}"`);
    });

    console.log('Navigating to http://localhost:8080/instances...');
    await page.goto('http://localhost:8080/instances', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    console.log('Done.');
    await browser.close();
  } catch (e) {
    console.error('Script error:', e);
  }
})();
