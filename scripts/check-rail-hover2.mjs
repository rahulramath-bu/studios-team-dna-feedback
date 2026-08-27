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
await sleep(600);

await page.$$eval('.fivex-tab', (tabs) => {
  tabs.find((t) => t.textContent.includes('Compare'))?.click();
});
await sleep(800);
const preActive = await page.$('.fivex-rail button.onex-rail-face[data-active]');
if (preActive) {
  await preActive.click();
  await sleep(500);
}

// Pick one: everyone else should dim.
const faces = await page.$$('.fivex-rail button.onex-rail-face');
await faces[4].click();
await sleep(600);
const afterPick = await page.evaluate(() => ({
  dimmed: document.querySelectorAll('.fivex-rail [data-dim]').length,
  active: document.querySelectorAll('.fivex-rail [data-active]').length,
}));
console.log('one picked:', JSON.stringify(afterPick));
// Move the mouse away from the rail so no hover interferes.
await page.mouse.move(700, 700);
await sleep(400);
await page.screenshot({ path: '/tmp/rail2-one-picked.png' });

// Hover a far candidate: it un-dims, straight thread over the row.
await faces[9].hover();
await sleep(400);
const hoverState = await page.evaluate(() => {
  const line = document.querySelector('.fivex-rail-hoverline path');
  const hovered = document.querySelectorAll('.fivex-rail [data-dim]').length;
  const tip = [...document.querySelectorAll('.team-face-hover-label')].at(-1);
  return {
    thread: line ? line.getAttribute('d') : null,
    dimmedWhileHover: hovered,
    tooltip: tip ? tip.textContent : null,
  };
});
console.log('hovering candidate:', JSON.stringify(hoverState));
await page.screenshot({ path: '/tmp/rail2-hover-far.png' });

await browser.close();
console.log('done');
