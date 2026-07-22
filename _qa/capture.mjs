import { createRequire } from 'node:module';
import { mkdir, writeFile } from 'node:fs/promises';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
await mkdir('_qa/ui', { recursive: true });
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true });
const page = await context.newPage();
const errors = new Set();
page.on('pageerror', error => errors.add(String(error.stack || error)));
page.on('console', message => { if (message.type() === 'error' && !message.text().includes('Forced Canvas error')) errors.add(message.text()); });

const load = async (target, url) => {
  await target.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await target.waitForFunction(() => window.__BREATH_LOOM__, null, { timeout: 30000 });
};

await load(page, 'http://127.0.0.1:5201/');
await page.waitForFunction(() => window.__BREATH_LOOM__.state.ghostState !== 'waiting', null, { timeout: 5000 });
await page.waitForTimeout(350);
const guided = await page.evaluate(() => window.__BREATH_LOOM__.state);
await page.screenshot({ path: '_qa/ui/guided-390x844.png' });

await page.mouse.move(78, 650);
await page.mouse.down();
for (const [x, y] of [[120,590],[165,520],[215,430],[270,340],[318,250]]) await page.mouse.move(x, y, { steps: 5 });
await page.waitForTimeout(760);
const held = await page.evaluate(() => window.__BREATH_LOOM__.state);
await page.screenshot({ path: '_qa/ui/held-390x844.png' });
await page.mouse.up();
await page.waitForTimeout(290);
const peak = await page.evaluate(() => window.__BREATH_LOOM__.state);
await page.screenshot({ path: '_qa/ui/release-peak-390x844.png' });
await page.waitForTimeout(2700);
const settled = await page.evaluate(() => window.__BREATH_LOOM__.state);

const compactPage = await context.newPage();
await compactPage.setViewportSize({ width: 320, height: 568 });
await load(compactPage, 'http://127.0.0.1:5201/');
await compactPage.waitForTimeout(1500);
const compact = await compactPage.evaluate(() => window.__BREATH_LOOM__.state);
await compactPage.screenshot({ path: '_qa/ui/guided-320x568.png' });
await compactPage.close();

const baselinePage = await context.newPage();
await load(baselinePage, 'http://127.0.0.1:5201/?baseline=1');
await baselinePage.waitForTimeout(650);
const baseline = await baselinePage.evaluate(() => ({
  state: window.__BREATH_LOOM__.state,
  hudHidden: getComputedStyle(document.querySelector('.bl-hud')).display === 'none',
  ghostHidden: getComputedStyle(document.querySelector('.bl-ghost')).display === 'none'
}));
await baselinePage.screenshot({ path: '_qa/ui/baseline-390x844.png' });
await baselinePage.close();

const errorPage = await context.newPage();
await errorPage.goto('http://127.0.0.1:5201/?forceError=1', { waitUntil: 'domcontentloaded' });
await errorPage.waitForTimeout(250);
const errorState = await errorPage.evaluate(() => ({ hidden: document.querySelector('.bl-error').hidden, text: document.querySelector('.bl-error').innerText }));
await errorPage.screenshot({ path: '_qa/ui/error-390x844.png' });

const report = { guided, held, peak, settled, compact, baseline, errorState, errors:[...errors] };
await writeFile('_qa/ui/playwright-state.json', JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
await browser.close();
