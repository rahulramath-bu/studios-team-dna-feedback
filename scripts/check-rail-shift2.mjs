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

// Every ancestor of the rail plus each ancestor's direct children:
// tag.class -> height. Lets us diff states structurally.
const snapshot = (label) =>
  page.evaluate((tag) => {
    const describe = (el) =>
      `${el.tagName.toLowerCase()}${el.className && typeof el.className === 'string' ? '.' + el.className.trim().split(/\s+/).slice(0, 2).join('.') : ''}`;
    const rail = document.querySelector('.fivex-rail');
    if (!rail) return { tag, missing: true };
    const chain = [];
    let node = rail;
    while (node && node !== document.body) {
      const parent = node.parentElement;
      if (!parent) break;
      chain.push({
        parent: describe(parent),
        children: [...parent.children].map((child) => {
          const r = child.getBoundingClientRect();
          const cs = getComputedStyle(child);
          return `${describe(child)} h=${Math.round(r.height)} mt=${cs.marginTop} mb=${cs.marginBottom}${child === node ? '  <-- rail-path' : ''}`;
        }),
      });
      node = parent;
    }
    return { tag, chain };
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
const s0 = await snapshot('empty');

const faces = await page.$$('.fivex-rail button.onex-rail-face');
await faces[3].click();
await sleep(800);
const s1 = await snapshot('one');

const faces2 = await page.$$('.fivex-rail button.onex-rail-face');
await faces2[7].click();
await sleep(1600);
const s2 = await snapshot('duo');

console.log(JSON.stringify({ s0, s1, s2 }, null, 1));
await browser.close();
