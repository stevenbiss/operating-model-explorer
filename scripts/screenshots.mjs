// Regenerates the README screenshots from the fictional Acme sample: node scripts/screenshots.mjs
// Run `npm run build` first so dist/acme-sample.html is current.
import { chromium } from '@playwright/test';
import { fileURLToPath } from 'node:url';
import { mkdirSync } from 'node:fs';

const file = new URL('../dist/acme-sample.html', import.meta.url).href;
const out = fileURLToPath(new URL('../docs/images/', import.meta.url));
mkdirSync(out, { recursive: true });

const shots = [
  ['home', '#/?view=detailed'],
  ['structure-partnership', '#/d/partnership-structure'],
  ['structure-account', '#/d/harbour-account'],
  ['swimlane-qualify', '#/p/qualify-an-opportunity'],
  ['swimlane-proposal', '#/p/build-the-proposal'],
  ['step-detail', '#/p/build-the-proposal/s/review-the-proposal'],
];

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1800, height: 900 } });
for (const [name, hash] of shots) {
  await page.goto(file + hash);
  await page.reload();
  await page.getByRole('button', { name: 'Explore without a persona' }).click({ timeout: 1500 }).catch(() => {});
  await page.waitForTimeout(600);
  await page.screenshot({ path: `${out}${name}.png`, fullPage: true });
  console.log(name);
}
await browser.close();
