// Follow-up to add-engine-v1: dismissing the persona prompt in the author preview must not hide it
// in an exported snapshot opened later in the same browser tab (same sessionStorage).
import { join } from 'node:path';
import { test, expect, openEngine, trySample, skipPrompt, fileUrl, watch, go } from './helpers.js';

test('persona prompt › preview dismissal does not carry into an exported snapshot', async ({ browser, sink }, info) => {
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 }, acceptDownloads: true });
  watch(context, sink); // the auto guard then fails the test on console errors, dialogs or requests
  const page = await context.newPage();
  await openEngine(page);
  await trySample(page);
  await expect(page.getByTestId('persona-prompt')).toBeVisible();
  await skipPrompt(page);
  const dl = page.waitForEvent('download');
  await page.getByTestId('export').click();
  const download = await dl;
  const path = join(info.outputPath(), download.suggestedFilename());
  await download.saveAs(path);
  await page.goto(fileUrl(path)); // same tab, so the same sessionStorage
  await expect(page.getByTestId('persona-prompt')).toBeVisible();
  await context.close();
});

// Same scoping for exploration progress: processes visited in the author preview are not "explored" in the snapshot.
test('exploration progress › preview visits do not carry into an exported snapshot', async ({ browser, sink }, info) => {
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 }, acceptDownloads: true });
  watch(context, sink);
  const page = await context.newPage();
  await openEngine(page);
  await trySample(page);
  await skipPrompt(page);
  const pv = page.getByTestId('preview');
  await go(page, '#/p/qualify-opportunity');
  await expect(pv.locator('.progress-text')).toHaveText('1 of 2 processes explored');
  const dl = page.waitForEvent('download');
  await page.getByTestId('export').click();
  const download = await dl;
  const path = join(info.outputPath(), download.suggestedFilename());
  await download.saveAs(path);
  await page.goto(fileUrl(path)); // same tab, so the same sessionStorage
  await skipPrompt(page);
  await expect(page.locator('.progress-text')).toHaveText('0 of 2 processes explored');
  await page.getByTestId('workstream-card-presales').click();
  await expect(page.getByTestId('process-card-qualify-opportunity')).not.toContainText('Explored');
  // Progress made in the snapshot still counts there.
  await page.getByTestId('process-card-qualify-opportunity').click();
  await expect(page.locator('.progress-text')).toHaveText('1 of 2 processes explored');
  await context.close();
});

// In author mode the prompt opens inside the preview, not as a page-level modal, so the report and Export stay usable.
test('persona prompt › in the author preview it does not block the report or Export', async ({ page }) => {
  await openEngine(page);
  await trySample(page);
  const prompt = page.getByTestId('preview').getByTestId('persona-prompt');
  await expect(prompt).toBeVisible();
  expect(await prompt.evaluate((d) => d.matches(':modal'))).toBe(false);
  await expect(page.locator('#om-report-title')).toBeFocused();
  const dl = page.waitForEvent('download');
  await page.getByTestId('export').click(); // would time out if the prompt covered it
  await dl;
  await expect(prompt).toBeVisible();
  await prompt.getByTestId('persona-skip').focus();
  await page.keyboard.press('Escape');
  await expect(prompt).toBeHidden();
});
