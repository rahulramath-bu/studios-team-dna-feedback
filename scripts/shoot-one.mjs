/* Variation 4 "One system" review shots: overview, profile, compare states. */
import puppeteer from 'puppeteer-core';
import { mkdirSync } from 'node:fs';

const CHROME =
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const PAGE_URL = 'http://127.0.0.1:5177/team-dna';
const OUT = '/Users/rahulramath/Documents/Preetoshi/depth-explorations/concepts-v5';
mkdirSync(OUT, { recursive: true });

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function ensureTeam(page) {
  await sleep(1400);
  const clicked = await page.evaluate(() => {
    const button = [...document.querySelectorAll('button')].find(
      (el) => el.textContent.trim() === 'Try with sample data'
    );
    if (button) {
      button.click();
      return true;
    }
    return false;
  });
  if (clicked) await sleep(3400);
}

async function clickTab(page, title) {
  await page.evaluate((label) => {
    const tab = [...document.querySelectorAll('.onex-tabs .tabx-tab')].find(
      (el) => el.textContent.includes(label)
    );
    tab?.click();
  }, title);
  await sleep(1100);
}

async function clickRailFace(page, index) {
  await page.evaluate((i) => {
    document.querySelectorAll('.onex-rail-face')[i]?.click();
  }, index);
  await sleep(1100);
}

const browser = await puppeteer.launch({
  headless: 'new',
  executablePath: CHROME,
});
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 1000, deviceScaleFactor: 1.5 });

await page.evaluateOnNewDocument(() => {
  sessionStorage.setItem('teamDnaPageVariation', 'one');
});
await page.goto(PAGE_URL, { waitUntil: 'networkidle0' });
await ensureTeam(page);
await sleep(2200);

await page.screenshot({ path: `${OUT}/one-team.png`, fullPage: true });

await clickTab(page, 'My profile');
await sleep(1400);
await page.screenshot({ path: `${OUT}/one-profile.png`, fullPage: true });

await clickTab(page, 'Compare');
await sleep(1200);
await page.screenshot({ path: `${OUT}/one-compare-pick.png`, fullPage: true });

// Open a suggested pairing; the pair renders the original pair page.
await page.evaluate(() => {
  document.querySelector('.mapx-pairing')?.click();
});
await sleep(2400);
await page.screenshot({ path: `${OUT}/one-compare-pair.png`, fullPage: true });

await browser.close();
console.log('done');
