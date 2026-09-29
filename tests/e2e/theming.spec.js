// theming scenarios (tasks 2.15–2.22).
import { test, expect, openEngine, loadZip, trySample, skipPrompt, messages, go, useSnapshot, openSnapshot, exportSnapshot } from './helpers.js';

const PRIMARY = 'rgb(11, 31, 77)'; // #0b1f4d, the sample theme's primary colour
const DEFAULT_PRIMARY = 'rgb(31, 58, 95)'; // #1f3a5f, the built-in theme
const css = (loc, prop) => loc.evaluate((el, p) => getComputedStyle(el)[p], prop);
const lum = (rgb) => {
  const [r, g, b] = rgb.match(/\d+(\.\d+)?/g).slice(0, 3).map((v) => {
    const c = Number(v) / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

test.describe('theming (author mode)', () => {
  test.beforeEach(async ({ page }) => openEngine(page));

  test('2.15 theming › Custom colours applied', async ({ page, browser }, info) => {
    await trySample(page);
    await skipPrompt(page);
    const pv = page.getByTestId('preview');
    // Header
    expect(await css(pv.locator('.topbar'), 'backgroundColor')).toBe(PRIMARY);
    // Active navigation: the persona door / card titles and links use the primary colour as the link colour.
    expect(await css(pv.locator('.card h3').first(), 'color')).toBe(PRIMARY);
    // Selected item: the selected step in a swimlane.
    await go(page, '#/p/qualify-opportunity/s/assess-fit');
    const sel = pv.locator('.node.selected .box');
    await expect(sel).toHaveCount(1);
    expect(await css(sel, 'stroke')).toBe(PRIMARY);
    // The author controls keep the engine's own colours (the theme is scoped to the preview).
    expect(await css(page.locator('.author-bar'), 'backgroundColor')).toBe(DEFAULT_PRIMARY);
    // And the same colours in the exported snapshot.
    const snap = await exportSnapshot(browser, 'sample', info.outputPath('snap'));
    await openSnapshot(page, snap, '#/p/qualify-opportunity/s/assess-fit');
    expect(await css(page.locator('.topbar'), 'backgroundColor')).toBe(PRIMARY);
    expect(await css(page.locator('.node.selected .box'), 'stroke')).toBe(PRIMARY);
  });

  test('2.16 theming › Logo shown', async ({ page, browser }, info) => {
    await trySample(page);
    await skipPrompt(page);
    const check = async (scope) => {
      const logo = scope.locator('.topbar').getByTestId('logo');
      await expect(logo).toBeVisible();
      await expect(logo).toHaveAttribute('alt', 'Acme + Globex partnership');
      await expect(logo).toHaveAttribute('src', /^data:image\/svg\+xml;base64,/);
      expect(await logo.evaluate((img) => img.complete && img.naturalWidth > 0)).toBe(true);
    };
    await check(page.getByTestId('preview'));
    const snap = await exportSnapshot(browser, 'sample', info.outputPath('snap'));
    await openSnapshot(page, snap);
    await check(page.locator('body'));
  });

  test('2.17 theming › No theme file', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await loadZip(page, 'tiny');
    await expect(page.getByTestId('report-counts')).toContainText('0 errors, 0 warnings');
    await expect(messages(page).filter({ hasText: 'theme' })).toHaveCount(0);
    const pv = page.getByTestId('preview');
    expect(await css(pv.locator('.topbar'), 'backgroundColor')).toBe(DEFAULT_PRIMARY);
    await expect(pv.getByTestId('logo')).toHaveCount(0);
    // Default body text on the default background meets WCAG AA.
    const [fg, bg] = [await css(pv.locator('main'), 'color'), await css(pv, 'backgroundColor')];
    const ratio = (Math.max(lum(fg), lum(bg)) + 0.05) / (Math.min(lum(fg), lum(bg)) + 0.05);
    expect(ratio).toBeGreaterThanOrEqual(4.5);
  });

  test('2.20 theming › Low-contrast theme', async ({ page }) => {
    await loadZip(page, 'low-contrast');
    const m = messages(page).filter({ hasText: '#999999' });
    await expect(m.first()).toHaveAttribute('data-level', 'warning');
    await expect(m.first()).toContainText('#ffffff');
    await expect(m.first()).toContainText('2.85:1');
    await expect(m.first()).toContainText('4.5:1');
    await expect(m.first().locator('.msg-where')).toContainText('theme.md');
  });

  test('2.21 theming › Remote font rejected', async ({ page }) => {
    await loadZip(page, 'remote-font');
    const m = messages(page).filter({ hasText: 'https://fonts.example.com/brand.woff2' });
    await expect(m).toHaveCount(1);
    await expect(m).toHaveAttribute('data-level', 'error');
    await expect(m).toContainText('Fonts must be files in the assets/ folder');
    await expect(page.getByTestId('export')).toBeDisabled();
  });

  test('2.22 theming › Missing asset', async ({ page }) => {
    await loadZip(page, 'missing-asset');
    const m = messages(page).filter({ hasText: 'assets/missing.png' });
    await expect(m).toHaveCount(1);
    await expect(m).toHaveAttribute('data-level', 'error');
    await expect(m).toContainText('not found');
  });
});

test.describe('theming (no-theme snapshot)', () => {
  const snap = useSnapshot('tiny');

  test('2.18 theming › Dark mode', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' });
    await openSnapshot(page, snap, '#/p/flow/s/start');
    await expect(page.getByTestId('step-detail')).toBeVisible();
    const bg = await css(page.locator('body'), 'backgroundColor');
    const fg = await css(page.locator('main h1'), 'color');
    expect(lum(bg), `body background ${bg} is dark`).toBeLessThan(0.05);
    expect(lum(fg), `heading text ${fg} is light`).toBeGreaterThan(0.6);
    const panel = await css(page.getByTestId('step-detail'), 'backgroundColor');
    expect(lum(panel), `detail panel ${panel} is dark`).toBeLessThan(0.05);
    expect(lum(await css(page.getByTestId('step-detail').locator('h2'), 'color'))).toBeGreaterThan(0.6);
    // And light when the system prefers light.
    await page.emulateMedia({ colorScheme: 'light' });
    expect(lum(await css(page.locator('body'), 'backgroundColor'))).toBeGreaterThan(0.8);
  });
});

test.describe('theming (exported sample)', () => {
  const snap = useSnapshot('sample');

  test('2.19 theming › Rename workstream', async ({ page }) => {
    const texts = [];
    const grab = async () => texts.push(await page.locator('body').innerText());
    await openSnapshot(page, snap);
    await grab(); // persona prompt open
    await skipPrompt(page);
    await grab();
    await expect(page.locator('#om-ws-h')).toHaveText('Value streams');
    await page.getByTestId('workstream-card-presales').click();
    await expect(page.locator('main .eyebrow').first()).toHaveText('Value stream');
    await grab();
    await page.getByTestId('process-card-qualify-opportunity').click();
    await expect(page.getByTestId('breadcrumb')).toContainText('Presales');
    await grab();
    await page.getByTestId('step-capture-lead').click();
    await grab();
    await page.goto(`${snap.url}#/w/delivery`);
    await grab();
    await page.getByTestId('search-input').fill('Pre');
    await expect(page.getByTestId('search-group-workstream').locator('h2')).toContainText('Value streams');
    await grab();
    await page.goto(`${snap.url}#/me?persona=globex-solution-team`);
    await grab();
    await page.getByTestId('key-messages-button').click();
    await grab();
    for (const t of texts) expect(t).not.toMatch(/workstream/i);
    // Also none in accessible names the viewer UI generates.
    const labels = await page.locator('[aria-label]').evaluateAll((els) => els.map((e) => e.getAttribute('aria-label')).join(' | '));
    expect(labels).not.toMatch(/workstream/i);
  });
});
