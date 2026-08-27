import puppeteer from 'puppeteer-core';

const CHROME =
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const browser = await puppeteer.launch({
  headless: 'new',
  executablePath: CHROME,
});
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1.5 });

await page.evaluateOnNewDocument(() => {
  sessionStorage.setItem('teamDnaPageVariation', 'five');
});
await page.goto('http://127.0.0.1:5177/team-dna', {
  waitUntil: 'domcontentloaded',
  timeout: 30000,
});
await sleep(1500);
await page.$$eval('button', (els) => {
  els.find((el) => el.textContent.includes('Try with sample data'))?.click();
});
await page.waitForSelector('.fivex-tab', { timeout: 15000 });
await sleep(600);

await page.$$eval('.fivex-tab', (tabs) => {
  tabs.find((t) => t.textContent.includes('Compare'))?.click();
});
await sleep(2600);

// If someone is preselected (carried over from another lens), this is the
// anchored state. Shoot it, then unselect for the zero state.
const hasActive = await page.$('.fivex-rail button.onex-rail-face[data-active]');
if (hasActive) {
  await page.screenshot({ path: '/tmp/picker-anchored.png' });
  await hasActive.click();
  await sleep(700);
}
await page.screenshot({ path: '/tmp/picker-zero.png' });

// Anchored state: pick the first face.
const faces = await page.$$('.fivex-rail button.onex-rail-face');
await faces[0].click();
await sleep(700);
await page.screenshot({ path: '/tmp/picker-one.png' });

// Row click drives the duo view.
await page.$$eval('.fvx-pick-list .mapx-pairing', (rows) => rows[0]?.click());
await sleep(900);
const duoOk = await page.evaluate(
  () => !!document.querySelector('.fivex-rail-tie')
);
console.log('card click completes pair:', duoOk);

await browser.close();
console.log('done');
