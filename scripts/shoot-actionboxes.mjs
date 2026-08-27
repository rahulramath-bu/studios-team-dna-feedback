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
});
await sleep(1500);
await page.$$eval('button', (els) => {
  els.find((el) => el.textContent.includes('Try with sample data'))?.click();
});
await page.waitForSelector('.fivex-tab', { timeout: 15000 });
await sleep(800);

const shootSection = async (name) => {
  const ok = await page.evaluate(() => {
    const el = document.querySelector('#fvsec-growth') ||
      [...document.querySelectorAll('.fvc-title')].find((t) =>
        t.textContent.toLowerCase().includes('strengths')
      )?.closest('section');
    if (!el) return false;
    el.scrollIntoView({ block: 'start' });
    window.scrollBy(0, -20);
    return true;
  });
  if (!ok) {
    console.log(`SKIP ${name}`);
    return;
  }
  await sleep(400);
  await page.screenshot({ path: `/tmp/box-${name}.png` });
  console.log(`shot ${name}`);
};

// Team tab.
await shootSection('team');

// Individual tab.
await page.$$eval('.fivex-tab', (tabs) => {
  tabs.find((t) => t.textContent.includes('Individual'))?.click();
});
await sleep(1200);
await shootSection('individual');

// Compare tab: complete a pair, then shoot its boxes.
await page.$$eval('.fivex-tab', (tabs) => {
  tabs.find((t) => t.textContent.includes('Compare'))?.click();
});
await sleep(800);
const pre = await page.$('.fivex-rail button.onex-rail-face[data-active]');
if (pre) {
  await pre.click();
  await sleep(400);
}
const faces = await page.$$('.fivex-rail button.onex-rail-face');
await faces[2].click();
await sleep(300);
const faces2 = await page.$$('.fivex-rail button.onex-rail-face');
await faces2[8].click();
await sleep(1600);
await shootSection('pair');

await browser.close();
console.log('done');
