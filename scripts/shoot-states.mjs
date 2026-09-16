import puppeteer from 'puppeteer-core';

const CHROME =
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const BASE = process.env.RAIL_URL ?? 'http://127.0.0.1:5177/team-dna';

const browser = await puppeteer.launch({
  headless: 'new',
  executablePath: CHROME,
});
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 950, deviceScaleFactor: 1.5 });
await page.evaluateOnNewDocument(() => {
  sessionStorage.setItem('teamDnaPageVariation', 'five');
});
page.on('pageerror', (err) => console.log('PAGE ERROR:', err.message));

const clickTab = (label) =>
  page.$$eval(
    '.fivex-tab',
    (tabs, target) => {
      tabs.find((t) => t.textContent.includes(target))?.click();
    },
    label
  );

const shootState = async (mode, tag) => {
  await page.goto(`${BASE}?demo=${mode}`, { waitUntil: 'domcontentloaded' });
  await sleep(1800);
  const hasTabs = await page.$('.fivex-tab');
  console.log(`[${tag}] V5 tabs present:`, !!hasTabs);
  await page.screenshot({ path: `/tmp/state-${tag}-team.png` });
  await clickTab('Individual');
  await sleep(1400);
  await page.screenshot({ path: `/tmp/state-${tag}-individual.png` });
  await clickTab('Compare');
  await sleep(1200);
  await page.screenshot({ path: `/tmp/state-${tag}-compare.png` });
  const railInfo = await page.evaluate(() => ({
    total: document.querySelectorAll('.fivex-rail .onex-rail-face').length,
    pending: document.querySelectorAll('.fivex-rail [data-pending]').length,
    text: document.body.innerText.includes('\u2014') ? 'HAS EM DASH' : 'no em dash',
  }));
  console.log(`[${tag}] rail:`, JSON.stringify(railInfo));
};

await shootState('waiting', 'waiting');
await shootState('enough-to-generate', 'threshold');

// Full sample team: compare empty state redesign.
await page.goto(BASE, { waitUntil: 'domcontentloaded' });
await sleep(1500);
await page.$$eval('button', (els) => {
  els.find((el) => el.textContent.includes('Try with sample data'))?.click();
});
await page.waitForSelector('.fivex-tab', { timeout: 15000 });
await sleep(600);
await clickTab('Compare');
await sleep(900);
const pre = await page.$('.fivex-rail button.onex-rail-face[data-active]');
if (pre) {
  await pre.click();
  await sleep(400);
}
await sleep(2400);
await page.screenshot({ path: '/tmp/state-full-compare-empty.png' });
const faces = await page.$$('.fivex-rail button.onex-rail-face');
await faces[2].click();
await sleep(1200);
await page.screenshot({ path: '/tmp/state-full-compare-one.png' });
const dash = await page.evaluate(() =>
  document.body.innerText.includes('\u2014') ? 'HAS EM DASH' : 'no em dash'
);
console.log('[full] compare picker:', dash);

await browser.close();
console.log('done');
