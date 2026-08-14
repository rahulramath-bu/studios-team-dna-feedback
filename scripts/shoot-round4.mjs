/* Round-4 review shots: tabs lenses + expanded hero + dive-deeper modals. */
import puppeteer from 'puppeteer-core';
import { mkdirSync } from 'node:fs';

const CHROME =
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

const PAGE_URL = 'http://127.0.0.1:5177/team-dna';
const OUT = '/Users/rahulramath/Documents/Preetoshi/depth-explorations/concepts-v5';
mkdirSync(OUT, { recursive: true });

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function clickTab(page, title) {
  await page.evaluate((label) => {
    const tab = [...document.querySelectorAll('.tabx-tab')].find((el) =>
      el.textContent.includes(label)
    );
    tab?.click();
  }, title);
  await sleep(900);
}

/* The prototype lands on an empty state; seed Sample Team if offered. */
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

const browser = await puppeteer.launch({
  headless: 'new',
  executablePath: CHROME,
});
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 1000, deviceScaleFactor: 1.5 });

// ── Four tabs ──
await page.evaluateOnNewDocument(() => {
  sessionStorage.setItem('teamDnaPageVariation', 'tabs');
});
await page.goto(PAGE_URL, { waitUntil: 'networkidle0' });
await ensureTeam(page);
await sleep(1600);

await page.screenshot({ path: `${OUT}/r4-overview.png`, fullPage: true });

await clickTab(page, 'My profile');
await page.screenshot({ path: `${OUT}/r4-profile.png`, fullPage: true });

await clickTab(page, 'Chemistry');
await page.screenshot({ path: `${OUT}/r4-chemistry.png`, fullPage: true });

// ── Expanded ──
await page.evaluateOnNewDocument(() => {
  sessionStorage.setItem('teamDnaPageVariation', 'expanded');
});
await page.goto(PAGE_URL, { waitUntil: 'networkidle0' });
await ensureTeam(page);
await sleep(1600);
await page.screenshot({ path: `${OUT}/r4-expanded.png`, fullPage: true });

const heroHandle = await page.evaluateHandle(() => {
  const row = document.querySelector('.cw-row--hero');
  return row ? (row.closest('.info-block') ?? row) : document.body;
});
const heroCard = heroHandle.asElement();
if (heroCard) {
  await heroCard.screenshot({ path: `${OUT}/r4-expanded-hero.png` });
}

// Dive deeper: strengths, then growth.
const deeperCount = await page.evaluate(() => {
  const buttons = [...document.querySelectorAll('.info-block-deeper')];
  buttons[0]?.click();
  return buttons.length;
});
console.log('deeper buttons:', deeperCount);
await sleep(800);
let panel = await page.$('.ddp-panel');
if (panel) {
  await panel.screenshot({ path: `${OUT}/r4-deeper-strengths.png` });
  await page.keyboard.press('Escape');
  await sleep(500);
}

await page.evaluate(() => {
  const buttons = [...document.querySelectorAll('.info-block-deeper')];
  buttons[1]?.click();
});
await sleep(800);
panel = await page.$('.ddp-panel');
if (panel) {
  await panel.screenshot({ path: `${OUT}/r4-deeper-growth.png` });
  await page.keyboard.press('Escape');
  await sleep(400);
}

await browser.close();
console.log('done');
