import puppeteer from 'puppeteer-core';

const CHROME =
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const OUT = '/tmp/rail';

async function shotRail(page, name, pad = 60) {
  const box = await page.evaluate(() => {
    const rail = document.querySelector('.fivex-rail');
    if (!rail) return null;
    const r = rail.getBoundingClientRect();
    return { x: r.x, y: r.y, width: r.width, height: r.height };
  });
  if (!box) {
    console.log(`SKIP ${name}: no rail`);
    return;
  }
  await page.screenshot({
    path: `${OUT}-${name}.png`,
    clip: {
      x: Math.max(0, box.x - pad),
      y: Math.max(0, box.y - pad),
      width: Math.min(1440, box.width + pad * 2),
      height: box.height + pad * 2,
    },
    captureBeyondViewport: false,
  });
  console.log(`shot ${name}`);
}

console.log('launching');
const browser = await puppeteer.launch({
  headless: 'new',
  executablePath: CHROME,
});
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900 });
console.log('launched');

await page.evaluateOnNewDocument(() => {
  sessionStorage.setItem('teamDnaPageVariation', 'five');
});
await page.goto('http://127.0.0.1:5177/team-dna', {
  waitUntil: 'domcontentloaded',
  timeout: 30000,
});
console.log('loaded');
await sleep(1500);

// Enter sample data if the empty state is showing.
const sampleBtn = await page.$$eval('button', (els) => {
  const btn = els.find((el) => el.textContent.includes('Try with sample data'));
  if (btn) {
    btn.click();
    return true;
  }
  return false;
});
console.log('sample clicked:', sampleBtn);
await page.waitForSelector('.fivex-tab', { timeout: 15000 });
await sleep(600);

// --- Individual tab: tap-me cycle should appear on a face. ---
await page.$$eval('.fivex-tab', (tabs) => {
  tabs.find((t) => t.textContent.includes('Individual'))?.click();
});
await sleep(2200); // initial delay 1200ms + linger start
await shotRail(page, '1-individual-tapme');

// --- Compare tab: idle, tap-me cycles among all. ---
await page.$$eval('.fivex-tab', (tabs) => {
  tabs.find((t) => t.textContent.includes('Compare'))?.click();
});
await sleep(2200);
await shotRail(page, '2-compare-idle-tapme');

// --- Pick first person (3rd face). ---
const faces = await page.$$('.fivex-rail button.onex-rail-face');
console.log('faces:', faces.length);
await faces[2].click();
await sleep(2000);
await shotRail(page, '3-compare-one-picked');

// --- Pick second person (9th face) and catch the glide mid-flight. ---
const faces2 = await page.$$('.fivex-rail button.onex-rail-face');
await faces2[8].click();
await sleep(180);
await shotRail(page, '4-compare-midglide');
await sleep(900);
await shotRail(page, '5-compare-settled');

// Structural checks on the settled state.
const settled = await page.evaluate(() => {
  const rail = document.querySelector('.fivex-rail');
  const active = rail.querySelectorAll('[data-active]');
  const dim = rail.querySelectorAll('[data-dim]');
  const tie = rail.querySelector('.fivex-rail-tie');
  const kids = [...rail.children];
  const tieIdx = kids.indexOf(tie);
  const a = active[0]?.getBoundingClientRect();
  const railRect = rail.getBoundingClientRect();
  return {
    activeCount: active.length,
    dimCount: dim.length,
    hasTie: !!tie,
    tieIdx,
    total: kids.length,
    activeScale: active[0]
      ? getComputedStyle(active[0]).transform
      : null,
    pairCenterOffset: a
      ? Math.round(a.x + a.width / 2 - (railRect.x + railRect.width / 2))
      : null,
  };
});
console.log('settled:', JSON.stringify(settled, null, 2));

// --- Unpick one: back to one-picked, tie gone. ---
const activeBtns = await page.$$('.fivex-rail button.onex-rail-face[data-active]');
await activeBtns[0].click();
await sleep(900);
await shotRail(page, '6-compare-after-unpick');

await browser.close();
console.log('done');
