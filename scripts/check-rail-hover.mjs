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

// Team tab (static faces): hover shows the name pill.
const staticFaces = await page.$$('.fivex-rail .onex-rail-face');
await staticFaces[3].hover();
await sleep(300);
const teamTip = await page.evaluate(() => {
  const tip = document.querySelector('.team-face-hover-label');
  return tip ? tip.textContent : null;
});
console.log('team tab tooltip:', teamTip);

// Compare tab: pick one, hover another -> tooltip + dotted thread.
await page.$$eval('.fivex-tab', (tabs) => {
  tabs.find((t) => t.textContent.includes('Compare'))?.click();
});
await sleep(800);
const preActive = await page.$('.fivex-rail button.onex-rail-face[data-active]');
if (preActive) {
  await preActive.click();
  await sleep(500);
}
const faces = await page.$$('.fivex-rail button.onex-rail-face');
await faces[2].click();
await sleep(500);
await faces[8].hover();
await sleep(350);
const hoverState = await page.evaluate(() => {
  const tip = document.querySelector('.team-face-hover-label');
  const line = document.querySelector('.fivex-rail-hoverline path');
  return {
    tooltip: tip ? tip.textContent : null,
    thread: line ? line.getAttribute('d') : null,
  };
});
console.log('picking-second hover:', JSON.stringify(hoverState));
await page.screenshot({ path: '/tmp/rail-hover-thread.png' });

// Complete the pair: thread clears, glide runs on the new bezier.
await faces[8].click();
await sleep(350);
await page.screenshot({ path: '/tmp/rail-glide-mid.png' });
await sleep(800);
const after = await page.evaluate(() => ({
  thread: !!document.querySelector('.fivex-rail-hoverline path'),
  tie: !!document.querySelector('.fivex-rail-tie'),
  active: document.querySelectorAll('.fivex-rail [data-active]').length,
}));
console.log('after pair:', JSON.stringify(after));
await page.screenshot({ path: '/tmp/rail-glide-settled.png' });

await browser.close();
console.log('done');
