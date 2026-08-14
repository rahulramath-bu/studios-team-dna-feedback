import puppeteer from 'puppeteer-core';

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const BASE = 'file:///tmp/bu-refs/vasil/coach-platform';
const OUT = '/tmp/bu-refs/shots';
import { mkdirSync } from 'node:fs';
mkdirSync(OUT, { recursive: true });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const browser = await puppeteer.launch({ headless: 'new', executablePath: CHROME });
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 1000, deviceScaleFactor: 1.5 });

for (const name of ['index', 'insights', 'coaching', 'discover']) {
  await page.goto(`${BASE}/${name}.html`, { waitUntil: 'networkidle0' }).catch(() => {});
  await sleep(1800);
  await page.evaluate(() => document.body.classList.add('page-ready'));
  await sleep(900);
  await page.screenshot({ path: `${OUT}/vasil-${name}.png`, fullPage: true });
  console.log(name);
}
await browser.close();
