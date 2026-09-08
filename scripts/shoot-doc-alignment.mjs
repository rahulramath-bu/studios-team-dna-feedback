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

// Team hero: rows with new pole words.
await page.screenshot({ path: '/tmp/doc-team-hero.png' });

// Stage: pace scale.
await page.evaluate(() => {
  document.querySelector('#fvsec-work')?.scrollIntoView({ block: 'start' });
});
await sleep(600);
await page.screenshot({ path: '/tmp/doc-stage.png' });

// Individual: persona with new roles.
await page.$$eval('.fivex-tab', (tabs) => {
  tabs.find((t) => t.textContent.includes('Individual'))?.click();
});
await sleep(1400);
await page.screenshot({ path: '/tmp/doc-individual.png' });

await browser.close();
console.log('done');
