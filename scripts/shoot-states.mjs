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
await page.setViewport({ width: 1440, height: 1000, deviceScaleFactor: 1.5 });
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

const pickViewAs = async (label) => {
  await page.$$eval('.monolith-persona-menu-trigger', (triggers) => {
    triggers.find((t) => t.textContent.includes('View as'))?.click();
  });
  await sleep(250);
  await page.$$eval(
    '.monolith-persona-menu-item',
    (items, target) => {
      items.find((item) => item.textContent.includes(target))?.click();
    },
    label
  );
  await sleep(1400);
};

const railInfo = () =>
  page.evaluate(() => ({
    total: document.querySelectorAll('.fivex-rail .onex-rail-face').length,
    pending: document.querySelectorAll('.fivex-rail [data-pending]').length,
    banner: !!document.querySelector('.insight-lifecycle-status'),
    emDash: document.body.innerText.includes('\u2014'),
    viewAs: [...document.querySelectorAll('.monolith-persona-menu-trigger')]
      .find((t) => t.textContent.includes('View as'))
      ?.querySelector('.monolith-persona-menu-value')?.textContent,
  }));

// Sample team, fully complete.
await page.goto(BASE, { waitUntil: 'domcontentloaded' });
await sleep(1500);
await page.$$eval('button', (els) => {
  els.find((el) => el.textContent.includes('Try with sample data'))?.click();
});
await page.waitForSelector('.fivex-tab', { timeout: 15000 });
await sleep(800);
console.log('[full]', JSON.stringify(await railInfo()));

// View as -> only you finished.
await pickViewAs('only you finished');
console.log('[one]', JSON.stringify(await railInfo()));
await page.screenshot({ path: '/tmp/state-one-team.png' });
await clickTab('Individual');
await sleep(1200);
await page.screenshot({ path: '/tmp/state-one-individual.png' });
await clickTab('Compare');
await sleep(1200);
await page.screenshot({ path: '/tmp/state-one-compare.png' });
await clickTab('Team');
await sleep(600);

// View as -> half finished: Generate anyway state.
await pickViewAs('half finished');
console.log('[half]', JSON.stringify(await railInfo()));
await page.screenshot({ path: '/tmp/state-half-team.png' });

// Generate anyway -> generating -> ready content.
await page.$$eval('button', (els) => {
  els.find((el) => el.textContent.trim() === 'Generate anyway')?.click();
});
await sleep(700);
await page.screenshot({ path: '/tmp/state-half-generating.png' });
await sleep(3200);
const afterGen = await page.evaluate(() => ({
  hasSignature: !!document.querySelector('#fvsec-hero .fvc--id h3'),
  title: document.querySelector('#fvsec-hero .fvc--id h3')?.textContent,
  sections: document.querySelectorAll('.fvg').length,
}));
console.log('[half after generate]', JSON.stringify(afterGen));
await page.screenshot({ path: '/tmp/state-half-generated.png' });

// Back to Manager: everyone complete again.
await pickViewAs('Manager');
console.log('[back to all]', JSON.stringify(await railInfo()));

await browser.close();
console.log('done');
