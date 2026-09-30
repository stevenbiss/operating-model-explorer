// Shared helpers for the end-to-end tests. Everything runs against the built file via file:// URLs:
// the engine (author mode) and snapshots exported from it through the real Export button (viewer mode).
import { test as base, expect } from '@playwright/test';
import { mkdirSync, readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { zipSync } from 'fflate';

const ROOT = fileURLToPath(new URL('../../', import.meta.url));
export const ENGINE_PATH = join(ROOT, 'dist', 'operating-model-explorer.html');
export const ENGINE_URL = pathToFileURL(ENGINE_PATH).href;
export const SAMPLE_DIR = join(ROOT, 'examples', 'acme-sample');
export const fixtureDir = (name) => (name === 'acme-sample' ? SAMPLE_DIR : name === 'acme-capture-sheet' ? join(ROOT, 'examples', 'acme-capture-sheet') : join(ROOT, 'tests', 'fixtures', name));
export const fileUrl = (p) => pathToFileURL(p).href;

export const SAMPLE_SHEET_DIR = join(ROOT, 'examples', 'acme-capture-sheet');
export const SAMPLE_SHEET = join(SAMPLE_SHEET_DIR, 'capture-sheet.md');

// A folder on disk -> { 'relative/path': Uint8Array }.
export function readFolder(dir) {
  const out = {};
  for (const e of readdirSync(dir, { recursive: true, withFileTypes: true })) {
    if (e.isFile()) out[relative(dir, join(e.parentPath, e.name)).replace(/\\/g, '/')] = new Uint8Array(readFileSync(join(e.parentPath, e.name)));
  }
  return out;
}

// A fixture folder as a .zip, wrapped in its own folder name the way an OS "compress" does.
export function zipFixture(name) {
  const files = readFolder(fixtureDir(name));
  return Buffer.from(zipSync(Object.fromEntries(Object.entries(files).map(([p, d]) => [`${name}/${p}`, d]))));
}

// A fixture varied in memory, as a zip source for loadZip / exportSnapshot: { name, buffer }.
// changes: { 'relative/path': text (added or replaced) | (old text) => new text | null (removed) }.
export function variant(base, name, changes) {
  const files = readFolder(fixtureDir(base));
  for (const [p, c] of Object.entries(changes)) {
    if (c === null) delete files[p];
    else if (typeof c === 'function') {
      if (!files[p]) throw new Error(`variant: ${base} has no ${p}`);
      const before = new TextDecoder().decode(files[p]);
      const after = c(before);
      if (after === before) throw new Error(`variant: the change to ${base}/${p} did nothing`);
      files[p] = new TextEncoder().encode(after);
    } else files[p] = typeof c === 'string' ? new TextEncoder().encode(c) : c;
  }
  return { name, buffer: Buffer.from(zipSync(Object.fromEntries(Object.entries(files).map(([p, d]) => [`${name}/${p}`, d])))) };
}

// Records console errors, uncaught exceptions, JS dialogs and any non-local request on every page of a context.
export function watch(context, sink) {
  const onPage = (page) => {
    page.on('console', (m) => m.type() === 'error' && sink.errors.push(`console.error: ${m.text()}`));
    page.on('pageerror', (e) => sink.errors.push(`pageerror: ${e.message}`));
    page.on('dialog', (d) => {
      sink.dialogs.push(`${d.type()}: ${d.message()}`);
      d.dismiss().catch(() => {});
    });
  };
  context.pages().forEach(onPage);
  context.on('page', onPage);
  context.on('request', (r) => !/^(file|data|blob|about):/i.test(r.url()) && sink.requests.push(r.url()));
}

export const test = base.extend({
  sink: async ({}, use) => use({ errors: [], dialogs: [], requests: [] }),
  // Auto fixture: every test fails on a console error, an uncaught exception, a JS dialog or a network request.
  guard: [
    async ({ context, sink }, use) => {
      watch(context, sink);
      await use(sink);
      expect(sink.errors, 'console errors').toEqual([]);
      expect(sink.dialogs, 'JavaScript dialogs').toEqual([]);
      expect(sink.requests, 'network requests other than file:, data: and blob:').toEqual([]);
    },
    { auto: true },
  ],
});
export { expect };

// ---------- author mode ----------

export async function openEngine(page) {
  await page.goto(ENGINE_URL);
  await expect(page.getByTestId('start')).toBeVisible();
}

// Load a fixture (or the sample) through the real "Load .zip" button and the file chooser it opens.
// name: a fixture folder, or a { name, buffer } zip from variant().
export async function loadZip(page, name) {
  const src = typeof name === 'string' ? { name, buffer: zipFixture(name) } : name;
  const chooser = page.waitForEvent('filechooser');
  await page.getByRole('button', { name: 'Load .zip' }).click();
  await (await chooser).setFiles({ name: `${src.name}.zip`, mimeType: 'application/zip', buffer: src.buffer });
  await expect(page.getByTestId('report')).toBeVisible();
}

// Load a fixture folder through the folder input (the fallback "Load folder" uses when there is no
// showDirectoryPicker, and the only folder path Playwright can drive).
export async function loadFolder(page, name) {
  await page.getByTestId('folder-input').setInputFiles(fixtureDir(name));
  await expect(page.getByTestId('report')).toBeVisible();
}

export async function trySample(page) {
  await page.getByRole('button', { name: 'Try the sample' }).click();
  await expect(page.getByTestId('report')).toBeVisible();
}

// Close the persona prompt if it is open (it opens on the overview when the model has personas).
export async function skipPrompt(page) {
  const prompt = page.getByTestId('persona-prompt');
  if (await prompt.isVisible()) await page.getByTestId('persona-skip').click();
  await expect(prompt).toBeHidden();
}

export const messages = (page) => page.getByTestId('report-message');

// Move the preview (author mode) or viewer to a route, the way a link would.
export async function go(page, hash) {
  await page.evaluate((h) => (location.hash = h), hash);
}

// ---------- snapshots ----------

// Loads a fixture (or 'sample' for "Try the sample") in the engine, exports it with the real Export button
// and returns the downloaded file's path and text. Runs in its own desktop-sized context.
export async function exportSnapshot(browser, source, outDir) {
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 }, acceptDownloads: true });
  const sink = { errors: [], dialogs: [], requests: [] };
  watch(context, sink);
  const page = await context.newPage();
  await openEngine(page);
  if (source === 'sample') await trySample(page);
  else await loadZip(page, source);
  await skipPrompt(page);
  const dl = page.waitForEvent('download');
  await page.getByTestId('export').click();
  const download = await dl;
  mkdirSync(outDir, { recursive: true });
  const path = join(outDir, download.suggestedFilename());
  await download.saveAs(path);
  await context.close();
  if (sink.errors.length || sink.dialogs.length || sink.requests.length) throw new Error(`Export of ${source.name || source} was not clean: ${JSON.stringify(sink)}`);
  return { path, url: fileUrl(path), name: download.suggestedFilename(), html: readFileSync(path, 'utf8') };
}

// An exported snapshot, made once per describe block and worker in beforeAll.
let made = 0;
export function useSnapshot(source) {
  const snap = {};
  test.beforeAll(async ({ browser }, info) => {
    Object.assign(snap, await exportSnapshot(browser, source, join(info.project.outputDir, 'snapshots', `${info.project.name}-w${info.workerIndex}-${process.pid}-${++made}-${source.name || source}`)));
  });
  return snap;
}

// The model embedded in a snapshot file.
export const contentOf = (html) => JSON.parse(html.match(/<script id="om-content" type="application\/json">([\s\S]*?)<\/script>/)[1]);

// ---------- colours ----------

// Runs in the page: any CSS colour -> [r, g, b, a] (0-255), by painting it on a 1px canvas, so color-mix() and
// color(srgb ...) values are compared the same way as hex and rgb().
export const PX = `(c) => {
  const cv = (window.__omPx ||= document.createElement('canvas'));
  cv.width = cv.height = 1;
  const x = cv.getContext('2d', { willReadFrequently: true });
  x.clearRect(0, 0, 1, 1);
  x.fillStyle = 'rgba(0,0,0,0)';
  x.fillStyle = c;
  x.fillRect(0, 0, 1, 1);
  return [...x.getImageData(0, 0, 1, 1).data];
}`;
// Evaluated as a string expression by the test driver, so the page's CSP (no eval) does not apply.
export const installPx = (page) => page.evaluate(`window.__omPxFn = ${PX}`);
export const hexRgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const lin = (v) => ((v /= 255) <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
export const luminance = ([r, g, b]) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
export const contrast = (a, b) => {
  const [x, y] = [luminance(a), luminance(b)].sort((m, n) => n - m);
  return (x + 0.05) / (y + 0.05);
};

// Every text/background pair drawn on a party-coloured surface inside root, with its contrast ratio:
// HTML text whose nearest opaque background is a party band or tint colour, the party name on its band in the
// swimlane header column, and the role names (and teams) on their lane tints.
export async function brandPairs(page, root = 'body') {
  await installPx(page);
  return page.evaluate(
    ({ root, PX }) => {
      const px = window.__omPxFn;
      const lin = (v) => ((v /= 255) <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
      const lum = ([r, g, b]) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
      const ratio = (a, b) => {
        const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m);
        return Math.round(((x + 0.05) / (y + 0.05)) * 100) / 100;
      };
      const R = document.querySelector(root);
      const key = (c) => c.slice(0, 3).join();
      const partyColours = new Set();
      for (const e of R.querySelectorAll('[data-party]')) {
        if (e.dataset.party === 'none') continue;
        const cs = getComputedStyle(e);
        for (const v of ['--p-band', '--p-tint']) partyColours.add(key(px(cs.getPropertyValue(v).trim())));
      }
      const name = (el) => `${el.tagName.toLowerCase()}${el.className && typeof el.className === 'string' ? `.${el.className.trim().split(/\s+/).join('.')}` : el.className && el.className.baseVal ? `.${el.className.baseVal.split(/\s+/).join('.')}` : ''} "${el.textContent.trim().slice(0, 30)}"`;
      const out = [];
      for (const el of R.querySelectorAll('*')) {
        if (el instanceof SVGElement) continue;
        if (![...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim())) continue;
        if (!el.checkVisibility({ visibilityProperty: true, opacityProperty: true })) continue;
        let a = el;
        let bg = null;
        while (a) {
          const b = px(getComputedStyle(a).backgroundColor);
          if (b[3] > 0) {
            bg = b;
            break;
          }
          a = a.parentElement;
        }
        if (!bg || !partyColours.has(key(bg))) continue;
        if (bg[3] < 255) out.push({ kind: 'html', what: name(el), fg: null, bg, ratio: 0, note: 'translucent party background' });
        else out.push({ kind: 'html', what: name(el), fg: px(getComputedStyle(el).color), bg, ratio: ratio(px(getComputedStyle(el).color), bg) });
      }
      const visible = (el) => el.getBoundingClientRect().width > 0;
      for (const g of R.querySelectorAll('.lane-heads .band')) {
        const t = g.querySelector('.band-name');
        const r = g.querySelector('.band-bg');
        if (!t || !visible(t)) continue;
        const fg = px(getComputedStyle(t).fill);
        const bg = px(getComputedStyle(r).fill);
        out.push({ kind: 'band', party: g.dataset.party, what: name(t), fg, bg, ratio: ratio(fg, bg) });
      }
      for (const svg of R.querySelectorAll('.lane-heads svg')) {
        const heads = [...svg.querySelectorAll('g.lane .lane-head')];
        const links = [...svg.querySelectorAll('.lane-link')];
        heads.forEach((h, i) => {
          const bg = px(getComputedStyle(h).fill);
          for (const t of links[i] ? links[i].querySelectorAll('.lane-name, .lane-team') : []) {
            const fg = px(getComputedStyle(t).fill);
            out.push({ kind: 'lane', party: h.parentElement.dataset.party, what: name(t), fg, bg, ratio: ratio(fg, bg) });
          }
        });
      }
      return out;
    },
    { root, PX },
  );
}

// Every colour (text, background, border, outline, SVG fill and stroke) used by the elements matching sel inside
// root, as "r,g,b" strings, skipping anything inside a party's own elements (exclude).
export async function frameColours(page, sel, exclude = '[data-party]:not([data-party="none"]), .lockup, .mk') {
  await installPx(page);
  return page.evaluate(
    ({ sel, exclude, PX }) => {
      const px = window.__omPxFn;
      const out = new Map();
      for (const el of document.querySelectorAll(sel)) {
        if (exclude && el.closest(exclude)) continue;
        if (!el.checkVisibility()) continue;
        const cs = getComputedStyle(el);
        for (const p of ['color', 'backgroundColor', 'borderTopColor', 'borderRightColor', 'borderBottomColor', 'borderLeftColor', 'outlineColor', 'fill', 'stroke']) {
          const v = cs[p];
          if (!v || v === 'none') continue;
          const c = px(v);
          if (c[3] === 0) continue;
          const k = c.slice(0, 3).join();
          if (!out.has(k)) out.set(k, `${el.tagName.toLowerCase()}.${String(el.className && (el.className.baseVal ?? el.className)).split(' ')[0]} ${p}`);
        }
      }
      return [...out];
    },
    { sel, exclude, PX },
  );
}

// Opens a snapshot at a route. With no persona in the URL the overview shows the persona prompt.
// Always a fresh document load: a goto that only changes the hash would keep the old page state.
export async function openSnapshot(page, snap, hash = '') {
  if (page.url().startsWith(snap.url)) await page.goto('about:blank');
  await page.goto(snap.url + hash);
  await expect(page.locator('main#om-main')).toBeAttached();
}

export const noHorizontalScroll = (page) => page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth);

// A computed colour of the first element loc matches, as "r,g,b" (a custom property is read as its value).
export async function colourOf(page, loc, prop) {
  await installPx(page);
  return loc.first().evaluate((el, p) => {
    const cs = getComputedStyle(el);
    return window.__omPxFn(p.startsWith('--') ? cs.getPropertyValue(p).trim() : cs[p]).slice(0, 3).join();
  }, prop);
}
export const rgbKey = (hex) => hexRgb(hex).join();
