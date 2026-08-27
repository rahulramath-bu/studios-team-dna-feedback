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
await sleep(600);

const measure = (label) =>
  page.evaluate((tag) => {
    const doc = (el) => {
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return Math.round(r.y + window.scrollY);
    };
    // Document-space Y of each landmark + heights of everything above the rail.
    const bar = document.querySelector('.fivex-rail');
    const tabs = document.querySelector('.fivex-tabbar');
    const head = document.querySelector('.fivex-head') ||
      document.querySelector('.fivex-team');
    const scroller = document.querySelector('.team-dna-insight-scroll');
    return {
      label: tag,
      railDocY: doc(bar),
      tabsDocY: doc(tabs),
      headDocY: doc(head),
      scrollY: Math.round(window.scrollY),
      scrollerScrollTop: scroller ? Math.round(scroller.scrollTop) : null,
      railH: bar ? Math.round(bar.getBoundingClientRect().height) : null,
    };
  }, label);

await page.$$eval('.fivex-tab', (tabs) => {
  tabs.find((t) => t.textContent.includes('Compare'))?.click();
});
await sleep(900);
const pre = await page.$('.fivex-rail button.onex-rail-face[data-active]');
if (pre) {
  await pre.click();
  await sleep(500);
}
console.log(JSON.stringify(await measure('empty (0 picked)')));

const faces = await page.$$('.fivex-rail button.onex-rail-face');
await faces[3].click();
await sleep(500);
console.log(JSON.stringify(await measure('one picked')));

const faces2 = await page.$$('.fivex-rail button.onex-rail-face');
await faces2[7].click();
await sleep(1600);
console.log(JSON.stringify(await measure('duo (2 picked)')));

await browser.close();
console.log('done');
