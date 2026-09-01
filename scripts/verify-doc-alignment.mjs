import puppeteer from 'puppeteer-core';

const CHROME =
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const BASE = process.env.RAIL_URL ?? 'http://127.0.0.1:5177/team-dna';

const STALE = [
  'Vigilant',
  'Skeptical',
  'Reflective',
  'Strongly fast',
  'Strongly deliberate',
  'Leans fast',
  'Leans deliberate',
  'One decider',
  'Implementer',
  'Harmonizer',
  'Mobilizer',
  'Innovator',
  'Practical Stabilizer',
  'Adaptive Responder',
  'Steadying Presence',
  'Vigilant Sentinel',
  'Reflective Synthesizer',
];
const NEW_ROLES = [
  'Energizer',
  'Listener',
  'Explorer',
  'Builder',
  'Finisher',
  'Easygoer',
  'Connector',
  'Challenger',
  'Anchor',
  'Spark',
];

let failures = 0;
const fail = (msg) => {
  failures += 1;
  console.log(`FAIL: ${msg}`);
};
const ok = (msg) => console.log(`ok: ${msg}`);

const browser = await puppeteer.launch({
  headless: 'new',
  executablePath: CHROME,
});
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900 });
await page.evaluateOnNewDocument(() => {
  sessionStorage.setItem('teamDnaPageVariation', 'five');
});
await page.goto(BASE, { waitUntil: 'domcontentloaded' });
await sleep(1500);
await page.$$eval('button', (els) => {
  els.find((el) => el.textContent.includes('Try with sample data'))?.click();
});
await page.waitForSelector('.fivex-tab', { timeout: 15000 });
await sleep(800);

// innerText applies text-transform (mono caps), so compare uppercased.
const pageText = () =>
  page.evaluate(() => document.body.innerText.toUpperCase());

const checkStale = async (label) => {
  const text = await pageText();
  STALE.forEach((word) => {
    if (text.includes(word.toUpperCase()))
      fail(`${label}: stale "${word}" still visible`);
  });
};

// ── TEAM TAB ──────────────────────────────────────────────────────────────
// Expand every trait row so pole words and definitions are on screen.
const expanders = await page.$$('.fivex-stack [aria-expanded]');
for (const btn of expanders) {
  await btn.click().catch(() => {});
  await sleep(120);
}
await sleep(400);
let text = await pageText();
['PRACTICAL', 'EXPLORATIVE', 'CASUAL', 'THOROUGH', 'RESERVED', 'EXPRESSIVE',
 'CHALLENGING', 'COOPERATIVE', 'CALM', 'INTENSE'].forEach((word) => {
  if (!text.includes(word)) fail(`team: expected pole "${word}" not found`);
});
await checkStale('team');
ok('team tab poles');

// Walk all 5 working-style categories and every topic; collect scale tags.
const CATS = ['PACE', 'STRUCTURE', 'COLLABORATION', 'COMMUNICATION', 'APPROACH'];
for (const cat of CATS) {
  await page.$$eval(
    '.wstage-cats button, .wstage-tabs button, .wstage button',
    (btns, target) => {
      const hit = btns.find((b) =>
        b.textContent.toUpperCase().includes(target)
      );
      hit?.click();
    },
    cat
  );
  await sleep(600);
  // Topic pills within the category (Speed/Decisions etc.)
  const topics = await page.$$eval('.wstage-group-chips button', (btns) =>
    btns.map((b) => b.textContent.trim()).filter(Boolean)
  );
  const topicCount = Math.max(1, topics.length);
  for (let t = 0; t < topicCount; t += 1) {
    if (topics.length) {
      await page.$$eval(
        '.wstage-group-chips button',
        (btns, idx) => btns[idx]?.click(),
        t
      );
      await sleep(800);
    }
    const tags = (
      await page.$$eval('.wst-tag', (nodes) =>
        nodes.map((n) => n.textContent.trim()).join(' | ')
      )
    ).toUpperCase();
    console.log(`   ${cat} topic ${t + 1}: ${tags}`);
    if (/STRONGLY|LEANS|FLEXIBLE/.test(tags))
      fail(`${cat} topic ${t + 1}: old scale words in "${tags}"`);
    if (!/STRONG/.test(tags) || !/MODERATE/.test(tags) || !/NEUTRAL/.test(tags))
      fail(`${cat} topic ${t + 1}: new scale words missing in "${tags}"`);
  }
}
ok('working-style scales (all categories/topics)');

// ── INDIVIDUAL TAB ────────────────────────────────────────────────────────
await page.$$eval('.fivex-tab', (tabs) => {
  tabs.find((t) => t.textContent.includes('Individual'))?.click();
});
await sleep(1400);
// Click through every member and validate their roles are from the new set.
const memberCount = await page.$$eval(
  '.fivex-rail button.onex-rail-face',
  (els) => els.length
);
for (let i = 0; i < memberCount; i += 1) {
  const faces = await page.$$('.fivex-rail button.onex-rail-face');
  await faces[i].click();
  await sleep(700);
  const roles = await page.$$eval(
    '.fvx-role--primary, .fvx-role--secondary',
    (els) => els.map((el) => el.textContent.trim())
  );
  if (roles.length >= 2) {
    roles.forEach((role) => {
      if (!NEW_ROLES.includes(role))
        fail(`member ${i + 1}: role "${role}" not in the new archetype set`);
    });
    console.log(`   member ${i + 1}: ${roles.join(' / ')}`);
  } else {
    fail(`member ${i + 1}: role sentence missing (${roles.length})`);
  }
  const t = await pageText();
  STALE.forEach((word) => {
    if (t.includes(word.toUpperCase()))
      fail(`member ${i + 1}: stale "${word}" visible`);
  });
}
ok(`individual roles for ${memberCount} members`);

// ── COMPARE TAB ───────────────────────────────────────────────────────────
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
await checkStale('compare');
text = await pageText();
if (!/CALM|INTENSE/.test(text)) fail('compare: stability poles missing');
ok('compare tab');

console.log(failures === 0 ? 'ALL CHECKS PASSED' : `${failures} FAILURES`);
await browser.close();
process.exit(failures === 0 ? 0 : 1);
