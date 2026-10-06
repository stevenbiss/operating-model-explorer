// Change home-view-toggle-wide-header, Test tasks 2.1–2.20, on snapshots exported from dist/operating-model-explorer.html
// through the real Export button and opened via file://. 1280×800 unless tagged (@mobile-only runs at 375×812 only);
// 2.12 and 2.13 resize to 2560×1440.
//
// Existing tests that already cover scenarios of this change (not duplicated here):
//   2.1  explorer-views › Overview content          = people-status-view.spec.js "2.24 explorer-views › Overview content"
//   2.2  explorer-views › Detailed view             = people-status-view.spec.js "2.25 explorer-views › Detailed view"
//   2.3  explorer-views › Key messages still reachable in Simple view
//                                                   = people-status-view.spec.js "2.26 explorer-views › Key messages still reachable in Simple view"
//   2.4  explorer-views › Processes listed on the home page
//                                                   = people-status-view.spec.js "2.27 explorer-views › Processes listed on the home page"
//   2.5  explorer-views › Main diagram first        = structure-diagrams.spec.js "2.56 explorer-views › Main diagram first"
//   2.6  explorer-views › Home page on a phone      = people-status-view.spec.js "2.29 explorer-views › Home page on a phone"
//   2.15 author-mode › Reload after an edit         = author-mode.spec.js "2.51 author-mode › Reload after an edit (Chrome/Edge)"
//   2.16 author-mode › Preview the other view       = people-status-view.spec.js "2.38 author-mode › Preview the other view"
//   2.17 author-mode › Export ignores the preview toggle
//                                                   = people-status-view.spec.js "2.39 author-mode › Export ignores the preview toggle"
//   2.18 author-mode › Keyboard toggle              = people-status-view.spec.js "2.40 author-mode › Keyboard toggle"
//   2.19 capture-sheet › Detailed from the sheet    = people-status-view.spec.js "2.35 capture-sheet › Detailed from the sheet"
//   2.20 capture-sheet › Unknown view value         = people-status-view.spec.js "2.36 capture-sheet › Unknown view value"
import { test, expect, skipPrompt, variant, useSnapshot, openSnapshot, noHorizontalScroll } from './helpers.js';

const KEY_MESSAGES = [
  'One team, one plan. Clients see a single Acme + Globex team, not two suppliers.',
  'Acme owns the client relationship. Globex owns the solution.',
  'Decide early. Every opportunity gets a go or no-go within five working days.',
];

async function tabTo(page, sel, max = 150) {
  for (let i = 0; i < max; i++) {
    await page.keyboard.press('Tab');
    if (await page.evaluate((s) => !!document.activeElement && document.activeElement.matches(s), sel)) return;
  }
  throw new Error(`Tab never reached ${sel}`);
}

const home = (page) => page.getByTestId('home');
const doors = (page) => page.locator('main [data-testid^="persona-door"]');

async function expectDetailed(page) {
  await expect(home(page)).toHaveAttribute('data-view', 'detailed');
  await expect(page.getByTestId('purpose')).toContainText('find, win and deliver joint work');
  await expect(page.getByTestId('key-messages-section').locator('li p')).toHaveText(KEY_MESSAGES);
  await expect(doors(page)).toHaveCount(3);
  await expect(page.getByTestId('view-toggle-detailed')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByTestId('view-toggle-simple')).toHaveAttribute('aria-pressed', 'false');
}

async function expectSimple(page) {
  await expect(home(page)).toHaveAttribute('data-view', 'simple');
  await expect(page.getByTestId('purpose')).toHaveCount(0);
  await expect(page.getByTestId('key-messages-section')).toHaveCount(0);
  await expect(doors(page)).toHaveCount(0);
  await expect(page.getByTestId('view-toggle-simple')).toHaveAttribute('aria-pressed', 'true');
}

// ---------------------------------------------------------------------------------------------------------------
test.describe('home-page view toggle (exported sample, Simple by default)', () => {
  const snap = useSnapshot('sample');

  test('2.7 explorer-views › Viewer switches to Detailed', async ({ page }) => {
    await openSnapshot(page, snap);
    await skipPrompt(page);
    await expectSimple(page);
    await page.getByTestId('view-toggle-detailed').click();
    await expectDetailed(page);
  });

  test('2.9 explorer-views › Choice kept in the URL', async ({ page, context }) => {
    await openSnapshot(page, snap);
    await skipPrompt(page);
    await page.getByTestId('view-toggle-detailed').click();
    await expect(home(page)).toHaveAttribute('data-view', 'detailed');
    await expect(page).toHaveURL(/view=detailed/);
    await page.getByTestId('process-card-qualify-opportunity').click();
    await expect(page.getByTestId('swimlane')).toBeVisible();
    await page.goBack();
    await skipPrompt(page);
    await expectDetailed(page);
    // Copy the home page URL into a new tab.
    const url = page.url();
    const tab = await context.newPage();
    await tab.goto(url);
    await skipPrompt(tab);
    await expectDetailed(tab);
    await tab.close();
  });

  test('2.10 explorer-views › Keyboard toggle', async ({ page }) => {
    await openSnapshot(page, snap);
    await skipPrompt(page);
    await expect(page.getByTestId('view-toggle')).toHaveAttribute('role', 'group');
    await tabTo(page, '[data-testid="view-toggle-detailed"]');
    const detailed = page.getByTestId('view-toggle-detailed');
    await expect(detailed).toHaveRole('button');
    await expect(detailed).toHaveAttribute('aria-pressed', 'false');
    await page.keyboard.press('Enter');
    await expect(home(page)).toHaveAttribute('data-view', 'detailed');
    await expect(page.getByTestId('view-toggle-detailed')).toBeFocused();
    await expect(page.getByRole('button', { name: 'Detailed', pressed: true })).toBeVisible();
    await expect(page.getByTestId('announcer')).toHaveText('Detailed view');
    // And back with Space.
    await page.keyboard.press('Shift+Tab');
    await expect(page.getByTestId('view-toggle-simple')).toBeFocused();
    await page.keyboard.press('Space');
    await expect(home(page)).toHaveAttribute('data-view', 'simple');
    await expect(page.getByTestId('view-toggle-simple')).toBeFocused();
    await expect(page.getByTestId('announcer')).toHaveText('Simple view');
  });

  test('2.11 explorer-views › Toggle on a phone', { tag: '@mobile-only' }, async ({ page }) => {
    await openSnapshot(page, snap);
    await skipPrompt(page);
    const vw = page.viewportSize().width;
    for (const id of ['view-toggle-simple', 'view-toggle-detailed']) {
      const b = await page.getByTestId(id).boundingBox();
      expect(b.x, `${id} left edge`).toBeGreaterThanOrEqual(0);
      expect(b.x + b.width, `${id} right edge`).toBeLessThanOrEqual(vw);
      expect(b.height, `${id} touch height`).toBeGreaterThanOrEqual(24);
    }
    await page.getByTestId('view-toggle-detailed').click();
    await expectDetailed(page);
    expect(await noHorizontalScroll(page)).toBe(true);
  });

  test('2.12 explorer-views › Header lines up on a wide screen', async ({ page }) => {
    await page.setViewportSize({ width: 2560, height: 1440 });
    await openSnapshot(page, snap, '#/p/qualify-opportunity');
    await skipPrompt(page);
    await expect(page.getByTestId('swimlane')).toBeVisible();
    const name = await page.locator('.topbar .brand-name').boundingBox();
    const h1 = await page.locator('main h1').boundingBox();
    expect(Math.abs(name.x - h1.x), `header name x=${name.x}, page h1 x=${h1.x}`).toBeLessThanOrEqual(8);
    expect(await noHorizontalScroll(page)).toBe(true);
    await page.screenshot({ path: test.info().outputPath('2.12-process-2560.png') });
  });

  test('2.13 explorer-views › Other pages unchanged', async ({ page }) => {
    await page.setViewportSize({ width: 2560, height: 1440 });
    await openSnapshot(page, snap);
    await skipPrompt(page);
    // Centred in the page's layout width (the bar's full-width parent; html has scrollbar-gutter: stable).
    const cw = (await page.locator('.topbar').boundingBox()).width;
    for (const sel of ['.topbar .bar-in', '.subbar .bar-in', '.foot .bar-in']) {
      const b = await page.locator(sel).boundingBox();
      expect(b.width, `${sel} width`).toBeLessThanOrEqual(1440);
      expect(Math.abs(b.x - (cw - (b.x + b.width))), `${sel} centred (x=${b.x}, w=${b.width})`).toBeLessThanOrEqual(1);
    }
    // Every item in the header sits inside that band.
    const band = await page.locator('.topbar .bar-in').boundingBox();
    for (const sel of ['.topbar .brand-name', '.topbar .top-tools']) {
      const b = await page.locator(sel).boundingBox();
      expect(b.x, `${sel} left`).toBeGreaterThanOrEqual(band.x);
      expect(b.x + b.width, `${sel} right`).toBeLessThanOrEqual(band.x + band.width);
    }
    await page.screenshot({ path: test.info().outputPath('2.13-home-2560.png') });
  });

  test('2.14 explorer-views › Phones unchanged', { tag: '@mobile-only' }, async ({ page }) => {
    // Baseline: the home page header (unchanged by this change) at the same width.
    await openSnapshot(page, snap);
    await skipPrompt(page);
    const before = await page.locator('.topbar .bar-in').evaluate((e) => {
      const cs = getComputedStyle(e);
      return { x: e.getBoundingClientRect().x, w: e.getBoundingClientRect().width, pl: cs.paddingLeft, pr: cs.paddingRight };
    });
    const nameBefore = await page.locator('.topbar .brand-name').boundingBox();
    await openSnapshot(page, snap, '#/p/qualify-opportunity');
    await skipPrompt(page);
    await expect(page.getByTestId('swimlane')).toBeVisible();
    const after = await page.locator('.topbar .bar-in').evaluate((e) => {
      const cs = getComputedStyle(e);
      return { x: e.getBoundingClientRect().x, w: e.getBoundingClientRect().width, pl: cs.paddingLeft, pr: cs.paddingRight };
    });
    const nameAfter = await page.locator('.topbar .brand-name').boundingBox();
    expect(after).toEqual(before);
    expect(after.pl).toBe('16px');
    expect(Math.abs(nameAfter.x - nameBefore.x)).toBeLessThanOrEqual(1);
    expect(await noHorizontalScroll(page)).toBe(true);
  });
});

// ---------------------------------------------------------------------------------------------------------------
test.describe('home-page view toggle (exported sample set to Detailed)', () => {
  const snap = useSnapshot(variant('acme-sample', 'acme-detailed', { 'model.md': (t) => t.replace(/^---(\r?\n)/, '---$1view: detailed$1') }));

  test('2.8 explorer-views › Viewer switches back to Simple', async ({ page }) => {
    await openSnapshot(page, snap);
    await skipPrompt(page);
    await expectDetailed(page);
    await page.getByTestId('view-toggle-simple').click();
    await expectSimple(page);
    await expect(page.getByTestId('view-toggle-detailed')).toHaveAttribute('aria-pressed', 'false');
  });
});
