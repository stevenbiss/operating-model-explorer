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
export const fixtureDir = (name) => (name === 'acme-sample' ? SAMPLE_DIR : join(ROOT, 'tests', 'fixtures', name));
export const fileUrl = (p) => pathToFileURL(p).href;

// A folder on disk -> { 'relative/path': Uint8Array }
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
export async function loadZip(page, name) {
  const chooser = page.waitForEvent('filechooser');
  await page.getByRole('button', { name: 'Load .zip' }).click();
  await (await chooser).setFiles({ name: `${name}.zip`, mimeType: 'application/zip', buffer: zipFixture(name) });
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
  if (sink.errors.length || sink.dialogs.length || sink.requests.length) throw new Error(`Export of ${source} was not clean: ${JSON.stringify(sink)}`);
  return { path, url: fileUrl(path), name: download.suggestedFilename(), html: readFileSync(path, 'utf8') };
}

// An exported snapshot, made once per describe block and worker in beforeAll.
let made = 0;
export function useSnapshot(source) {
  const snap = {};
  test.beforeAll(async ({ browser }, info) => {
    Object.assign(snap, await exportSnapshot(browser, source, join(info.project.outputDir, 'snapshots', `${info.project.name}-w${info.workerIndex}-${process.pid}-${++made}-${source}`)));
  });
  return snap;
}

// Opens a snapshot at a route. With no persona in the URL the overview shows the persona prompt.
// Always a fresh document load: a goto that only changes the hash would keep the old page state.
export async function openSnapshot(page, snap, hash = '') {
  if (page.url().startsWith(snap.url)) await page.goto('about:blank');
  await page.goto(snap.url + hash);
  await expect(page.locator('main#om-main')).toBeAttached();
}

export const noHorizontalScroll = (page) => page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth);
