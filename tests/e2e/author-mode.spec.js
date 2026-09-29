// author-mode scenarios (tasks 2.47–2.55), on dist/operating-model-explorer.html via file://.
import { readFileSync } from 'node:fs';
import { test, expect, openEngine, loadZip, loadFolder, trySample, skipPrompt, go, readFolder, zipFixture, fileUrl, fixtureDir, exportSnapshot } from './helpers.js';

const exportDownload = async (page, dir) => {
  const dl = page.waitForEvent('download');
  await page.getByTestId('export').click();
  const d = await dl;
  const path = `${dir}/${d.suggestedFilename()}`;
  await d.saveAs(path);
  return { path, name: d.suggestedFilename(), html: readFileSync(path, 'utf8') };
};

test.describe('author-mode', () => {
  test.beforeEach(async ({ page }) => openEngine(page));

  test('2.47 author-mode › First open', async ({ page }) => {
    await expect(page).toHaveTitle(/author mode/);
    for (const name of ['Load capture sheet', 'Load folder', 'Load .zip', 'Try the sample', 'Content reference']) {
      await expect(page.getByRole('button', { name, exact: true })).toBeVisible();
      await expect(page.getByRole('button', { name, exact: true })).toBeEnabled();
    }
    await expect(page.getByTestId('workspace')).toBeHidden();
    await expect(page.locator('#om-content')).toHaveCount(0);
  });

  test('2.48 author-mode › Load a zip', async ({ page, sink }) => {
    await loadZip(page, 'acme-sample');
    await expect(page.getByTestId('report')).toBeVisible();
    await expect(page.getByTestId('report-counts')).toContainText('0 errors, 0 warnings');
    await expect(page.getByTestId('source')).toContainText('acme-sample.zip');
    await expect(page.getByTestId('preview')).toBeVisible();
    await expect(page.getByTestId('preview').getByTestId('persona-prompt')).toBeVisible();
    await skipPrompt(page);
    await expect(page.getByTestId('preview').getByTestId('model-name')).toHaveText('Acme + Globex partnership');
    expect(sink.requests).toEqual([]);
  });

  test('2.49 author-mode › Load the bundled sample', async ({ page }) => {
    let chooser = false;
    page.on('filechooser', () => (chooser = true));
    await page.getByRole('button', { name: 'Try the sample' }).click();
    await expect(page.getByTestId('report')).toBeVisible();
    await expect(page.getByTestId('report-counts')).toContainText('0 errors');
    await skipPrompt(page);
    await expect(page.getByTestId('preview').getByTestId('model-name')).toHaveText('Acme + Globex partnership');
    expect(chooser, 'no file chooser opened').toBe(false);
  });

  test('2.50 author-mode › Clean model', async ({ page }) => {
    await trySample(page);
    await expect(page.getByTestId('report-counts')).toContainText('0 errors, 0 warnings');
    await expect(page.getByTestId('ready')).toContainText('Ready to export');
    await expect(page.getByTestId('report-message')).toHaveCount(0);
  });

  // The real showDirectoryPicker dialog cannot be driven by Playwright (design D9), so an in-memory
  // directory handle stands in for it. The real-dialog path still needs a manual check in Chrome and Edge.
  test('2.51 author-mode › Reload after an edit (Chrome/Edge)', async ({ page }) => {
    const files = Object.fromEntries(Object.entries(readFolder(fixtureDir('tiny'))).map(([p, d]) => [p, Buffer.from(d).toString('utf8')]));
    await page.addInitScript((initial) => {
      window.__omFiles = { ...initial };
      window.__omPickerCalls = 0;
      const dir = (prefix, name) => ({
        kind: 'directory',
        name,
        async queryPermission() {
          return 'granted';
        },
        async *entries() {
          const seen = new Set();
          for (const path of Object.keys(window.__omFiles).filter((p) => p.startsWith(prefix))) {
            const [head, ...rest] = path.slice(prefix.length).split('/');
            if (seen.has(head)) continue;
            seen.add(head);
            if (rest.length) yield [head, dir(`${prefix}${head}/`, head)];
            else yield [head, { kind: 'file', name: head, getFile: async () => new File([window.__omFiles[path]], head) }];
          }
        },
      });
      window.showDirectoryPicker = async () => {
        window.__omPickerCalls++;
        return dir('', 'tiny');
      };
    }, files);
    await page.reload();
    await page.getByRole('button', { name: 'Load folder' }).click();
    await expect(page.getByTestId('report-counts')).toContainText('0 errors');
    const reload = page.getByRole('button', { name: 'Reload' });
    await expect(reload).toBeVisible();
    await go(page, '#/p/flow');
    const lane = page.getByTestId('preview').getByTestId('lane-account-lead');
    await expect(lane).toContainText('Account lead');
    // The author edits the role's name in the folder, then reloads.
    await page.evaluate(() => {
      window.__omFiles['roles/account-lead.md'] = window.__omFiles['roles/account-lead.md'].replace('name: Account lead', 'name: Client partner');
    });
    await reload.click();
    await expect(lane).toContainText('Client partner');
    await expect(page.getByTestId('author-live')).toContainText('Reloaded');
    expect(await page.evaluate(() => window.__omPickerCalls), 'folder not selected again').toBe(1);
  });

  test('2.52 author-mode › Export and open', { tag: '@mobile' }, async ({ page: author, context, browser }, info) => {
    let snap;
    if (author.viewportSize().width >= 768) {
      await trySample(author);
      await skipPrompt(author);
      snap = await exportDownload(author, info.outputPath());
    } else {
      // Author mode is specified for 768px and up: export at desktop size, then open the file on the small screen.
      snap = await exportSnapshot(browser, 'sample', info.outputPath());
    }
    expect(snap.name).toBe('acme-sample.html');
    // Opened from disk in a new tab, with the network disabled.
    await context.setOffline(true);
    const page = await context.newPage();
    await page.goto(fileUrl(snap.path));
    // Viewer mode with the theme, and no author controls.
    await expect(page.locator('#om-content')).toHaveCount(1);
    await expect(page.getByTestId('persona-prompt')).toBeVisible();
    await page.getByTestId('persona-skip').click();
    await expect(page.getByTestId('model-name')).toHaveText('Acme + Globex partnership');
    expect(await page.locator('.topbar').evaluate((el) => getComputedStyle(el).backgroundColor)).toBe('rgb(11, 31, 77)');
    await expect(page.getByTestId('logo')).toBeVisible();
    for (const id of ['start', 'workspace', 'report', 'export', 'reload', 'load-folder', 'load-zip', 'try-sample', 'content-reference', 'zip-input', 'folder-input']) await expect(page.getByTestId(id)).toHaveCount(0);
    await expect(page.locator('.author, .author-bar, #om-sample')).toHaveCount(0);
    // Footer: version and export date.
    const today = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
    await expect(page.getByTestId('footer')).toContainText('Version 1.0');
    await expect(page.getByTestId('footer')).toContainText(`Exported ${today}`);
    // Main flows work offline.
    await page.getByTestId('workstream-card-presales').click();
    await page.getByTestId('process-card-qualify-opportunity').click();
    await page.getByTestId('step-capture-lead').click();
    await expect(page.getByTestId('step-detail')).toContainText('Capture the lead');
  });

  test('2.53 author-mode › Export blocked by errors', async ({ page }) => {
    await loadZip(page, 'missing-name');
    const ex = page.getByTestId('export');
    await expect(ex).toBeVisible();
    await expect(ex).toBeDisabled();
    await expect(ex).toHaveText('Fix 1 error to export');
    await expect(page.getByTestId('blocked')).toContainText('Fix 1 error to export');
  });

  test('2.54 author-mode › Unused file excluded', async ({ page }, info) => {
    await loadFolder(page, 'unused-file');
    // The file was read (8 files), but no element references it.
    await expect(page.getByTestId('report')).toContainText('8 files read');
    await expect(page.getByTestId('report-counts')).toContainText('0 errors');
    const snap = await exportDownload(page, info.outputPath());
    expect(snap.name).toBe('tiny.html');
    expect(snap.html).not.toContain('PRIVATE-NOTE-7f3a9c');
    expect(snap.html).not.toContain('confidential author notes');
    expect(snap.html).not.toContain('private.txt');
    expect(snap.html).not.toContain(Buffer.from('PRIVATE-NOTE-7f3a9c').toString('base64').slice(0, 20));
    // No author file paths, bundled sample or validation report either: check the embedded content.
    const content = snap.html.match(/<script id="om-content" type="application\/json">([\s\S]*?)<\/script>/)[1];
    expect(content).not.toMatch(/\.md"|notes\/|unused-file|How to fix|Ready to export/);
    expect(snap.html).not.toContain('<script id="om-sample"');
  });

  test('2.55 author-mode › Keyboard load', async ({ page }) => {
    // Reference: the same zip dropped onto the page.
    const b64 = zipFixture('acme-sample').toString('base64');
    await page.evaluate((data) => {
      const bytes = Uint8Array.from(atob(data), (c) => c.charCodeAt(0));
      const dt = new DataTransfer();
      dt.items.add(new File([bytes], 'acme-sample.zip', { type: 'application/zip' }));
      document.querySelector('[data-testid="drop-zone"]').dispatchEvent(new DragEvent('drop', { dataTransfer: dt, bubbles: true, cancelable: true }));
    }, b64);
    await expect(page.getByTestId('report')).toBeVisible();
    await skipPrompt(page);
    const dropped = { report: await page.getByTestId('report').innerText(), preview: await page.getByTestId('preview').innerText(), source: await page.getByTestId('source').innerText() };

    await page.reload();
    await expect(page.getByTestId('start')).toBeVisible();
    // Keyboard only: Tab to "Load .zip", Enter, choose the file.
    const zipBtn = page.getByRole('button', { name: 'Load .zip' });
    for (let i = 0; i < 20 && !(await zipBtn.evaluate((b) => b === document.activeElement)); i++) await page.keyboard.press('Tab');
    await expect(zipBtn).toBeFocused();
    const chooser = page.waitForEvent('filechooser');
    await page.keyboard.press('Enter');
    await (await chooser).setFiles({ name: 'acme-sample.zip', mimeType: 'application/zip', buffer: zipFixture('acme-sample') });
    await expect(page.getByTestId('report')).toBeVisible();
    await skipPrompt(page);
    expect(await page.getByTestId('report').innerText()).toBe(dropped.report);
    expect(await page.getByTestId('preview').innerText()).toBe(dropped.preview);
    expect(await page.getByTestId('source').innerText()).toBe(dropped.source);
  });
});
