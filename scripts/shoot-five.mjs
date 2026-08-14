/* V5 review shots: overview, the working-styles stage states, profile, compare. */
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
    const tab = [...document.querySelectorAll('.fivex-tab')].find(
      (el) => el.textContent.trim() === label
    );
    tab?.click();
  }, title);
  await sleep(1100);
}

async function shootStage(page, rowLabel, path) {
  if (rowLabel) {
    await page.evaluate((label) => {
      const row = [...document.querySelectorAll('.wstage-row')].find((el) =>
        el.textContent.includes(label)
      );
      row?.click();
    }, rowLabel);
    await sleep(1000);
  }
  const handle = await page.evaluateHandle(() => {
    const stage = document.querySelector('.wstage');
    return stage ? (stage.closest('section') ?? stage) : document.body;
  });
  const element = handle.asElement();
  if (element) await element.screenshot({ path });
}

const browser = await puppeteer.launch({
  headless: 'new',
  executablePath: CHROME,
});
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 1000, deviceScaleFactor: 1.5 });

await page.evaluateOnNewDocument(() => {
  sessionStorage.setItem('teamDnaPageVariation', 'five');
});
await page.goto(PAGE_URL, { waitUntil: 'networkidle0' });
await ensureTeam(page);
await sleep(2400);

await page.screenshot({ path: `${OUT}/five-team.png`, fullPage: true });
await shootStage(page, null, `${OUT}/five-stage-a.png`);
await shootStage(page, 'Feedback style', `${OUT}/five-stage-b.png`);

await clickTab(page, 'Individual profiles');
await sleep(1600);
await page.screenshot({ path: `${OUT}/five-profile.png`, fullPage: true });

await clickTab(page, 'Compare profiles');
await sleep(1200);
await page.screenshot({ path: `${OUT}/five-picker.png`, fullPage: true });
await page.evaluate(() => {
  document.querySelector('.mapx-pairing')?.click();
});
await sleep(2400);
await page.screenshot({ path: `${OUT}/five-compare.png`, fullPage: true });

// Small screen: the rail should wrap into chips and cards stack.
await clickTab(page, 'Team profile');
await page.setViewport({ width: 760, height: 1100, deviceScaleFactor: 1.5 });
await sleep(1400);
await page.screenshot({ path: `${OUT}/five-team-narrow.png`, fullPage: true });

await browser.close();
console.log('done');
