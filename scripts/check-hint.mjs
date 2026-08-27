import puppeteer from 'puppeteer-core';

const CHROME =
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const browser = await puppeteer.launch({
  headless: 'new',
  executablePath: CHROME,
});
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900 });
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
await page.$$eval('.fivex-tab', (tabs) => {
  tabs.find((t) => t.textContent.includes('Compare'))?.click();
});
await sleep(2600);

const read = () =>
  page.evaluate(() => {
    const card = document.querySelector('.fvx-hint-card');
    if (!card) return { present: false };
    const cs = getComputedStyle(card);
    const r = card.getBoundingClientRect();
    return {
      present: true,
      opacity: cs.opacity,
      animationName: cs.animationName,
      rect: { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width) },
      inViewport: r.y > 0 && r.y < 900,
    };
  });

console.log('zero state card:', JSON.stringify(await read()));

// Unselect if someone is preselected, then pick one and re-check.
const active = await page.$('.fivex-rail button.onex-rail-face[data-active]');
if (active) {
  await active.click();
  await sleep(600);
}
const faces = await page.$$('.fivex-rail button.onex-rail-face');
await faces[0].click();
await sleep(900);
console.log('anchored card:', JSON.stringify(await read()));
await sleep(2000);
console.log('anchored card +2s:', JSON.stringify(await read()));

await browser.close();
console.log('done');
