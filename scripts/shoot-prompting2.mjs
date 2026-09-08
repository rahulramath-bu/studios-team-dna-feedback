import puppeteer from 'puppeteer-core';

const CHROME =
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const browser = await puppeteer.launch({
  headless: 'new',
  executablePath: CHROME,
});
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 950, deviceScaleFactor: 1.5 });
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

// Team: strengths (2 questions) then working styles (desc + one insight).
await page.evaluate(() => {
  document.querySelector('#fvsec-growth')?.scrollIntoView({ block: 'start' });
});
await sleep(500);
await page.screenshot({ path: '/tmp/p2-team-questions.png' });
await page.evaluate(() => {
  document.querySelector('#fvsec-work')?.scrollIntoView({ block: 'start' });
});
await sleep(600);
await page.screenshot({ path: '/tmp/p2-team-styles.png' });

// Individual: persona without title, P1 pill, then its working styles.
await page.$$eval('.fivex-tab', (tabs) => {
  tabs.find((t) => t.textContent.includes('Individual'))?.click();
});
await sleep(1400);
await page.screenshot({ path: '/tmp/p2-individual.png' });
const styleSection = await page.evaluate(() => {
  const el = [...document.querySelectorAll('.fvc-title')].find((t) =>
    t.textContent.toLowerCase().includes('how you like to work')
  );
  el?.closest('section')?.scrollIntoView({ block: 'start' });
  return !!el;
});
if (styleSection) {
  await sleep(600);
  await page.screenshot({ path: '/tmp/p2-individual-styles.png' });
}

// Compare: duo card (no title, no Worth knowing) + pair working styles.
await page.$$eval('.fivex-tab', (tabs) => {
  tabs.find((t) => t.textContent.includes('Compare'))?.click();
});
await sleep(900);
const pre = await page.$('.fivex-rail button.onex-rail-face[data-active]');
if (pre) {
  await pre.click();
  await sleep(400);
}
const faces = await page.$$('.fivex-rail button.onex-rail-face');
await faces[1].click();
await sleep(300);
const faces2 = await page.$$('.fivex-rail button.onex-rail-face');
await faces2[7].click();
await sleep(1600);
await page.screenshot({ path: '/tmp/p2-compare.png' });
await page.evaluate(() => {
  const el = [...document.querySelectorAll('.fvc-title')].find((t) =>
    t.textContent.toLowerCase().includes('side by side')
  );
  el?.closest('section')?.scrollIntoView({ block: 'start' });
});
await sleep(600);
await page.screenshot({ path: '/tmp/p2-compare-styles.png' });

await browser.close();
console.log('done');
