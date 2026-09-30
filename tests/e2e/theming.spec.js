// theming scenarios. Change add-party-brands, Test tasks 2.20–2.27 (the theme is labels only; colours, fonts, logo and
// palette are retired keys that warn and are ignored). "2.19 theming › Rename workstream" is from add-capture-sheet
// authoring and is unchanged. The removed "Low-contrast theme" scenario is replaced by the brand contrast tests in
// party-brands.spec.js (the low-contrast fixture is now a brand whose colour needs adjusting).
import { test, expect, openEngine, loadZip, skipPrompt, messages, go, variant, useSnapshot, openSnapshot, exportSnapshot, frameColours, rgbKey } from './helpers.js';

const DEFAULT_PRIMARY = 'rgb(31, 58, 95)'; // #1f3a5f, the engine's neutral frame
const RETIRED_PRIMARY = rgbKey('#0b1f4d'); // the colour the old sample theme set
const css = (loc, prop) => loc.evaluate((el, p) => getComputedStyle(el)[p], prop);
const lum = (rgb) => {
  const [r, g, b] = rgb.match(/\d+(\.\d+)?/g).slice(0, 3).map((v) => {
    const c = Number(v) / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const counts = (page) => page.getByTestId('report-counts');
const themeMessages = (page) => messages(page).filter({ has: page.locator('.msg-where', { hasText: /theme/i }) });
// The engine's neutral frame, light scheme: header, body and headings.
async function neutralFrame(page, root) {
  expect(await css(page.locator(`${root} .topbar`).first(), 'backgroundColor'), 'header').toBe(DEFAULT_PRIMARY);
  expect(await css(page.locator(`${root} .topbar`).first(), 'color'), 'header text').toBe('rgb(255, 255, 255)');
  expect(await css(page.locator(`${root} main h1`).first(), 'color'), 'heading').toBe('rgb(27, 31, 36)');
  const used = await frameColours(page, `${root}, ${root} *`, null);
  expect(used.filter(([k]) => k === RETIRED_PRIMARY), 'the retired theme colour is not used anywhere').toEqual([]);
}

// tiny, plus a theme.md.
const withTheme = (name, header, base = 'tiny', extra = {}) => variant(base, name, { 'theme.md': `---\ntype: theme\n${header}\n---\n`, ...extra });
const LOGO = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 40"><rect width="120" height="40" fill="#0b1f4d"/><text x="8" y="26" fill="#fff">OLD LOGO</text></svg>';

test.describe('theming (author mode)', () => {
  test.beforeEach(async ({ page }) => openEngine(page));

  test('2.20 theming › Labels applied', async ({ page }) => {
    await loadZip(page, withTheme('labels-only', 'labels: { workstream: "Value stream", workstreams: "Value streams" }'));
    await expect(counts(page)).toHaveText('0 errors, 0 warnings');
    await expect(themeMessages(page)).toHaveCount(0);
    await skipPrompt(page);
    const pv = page.getByTestId('preview');
    await expect(pv.locator('#om-ws-h')).toHaveText('Value streams');
    await go(page, '#/w/main-ws');
    await expect(pv.locator('main .eyebrow').first()).toHaveText('Value stream');
    // (The fixture's own text says "workstream", so the full-UI check is 2.19 Rename workstream, on the sample.)
    await expect(pv.locator('main h1')).toHaveText('Main work');
  });

  test('2.21 theming › Custom colours applied', async ({ page, browser }, info) => {
    await page.emulateMedia({ colorScheme: 'light' });
    const src = withTheme('custom-colours', 'colors:\n  primary: "#0b1f4d"');
    await loadZip(page, src);
    await expect(counts(page)).toHaveText('0 errors, 1 warning');
    const m = messages(page).filter({ hasText: '"colors"' });
    await expect(m).toHaveCount(1);
    await expect(m).toHaveAttribute('data-level', 'warning');
    await expect(m).toContainText('ignored');
    await expect(m).toContainText('Party colours now come from brand packs');
    await expect(m.locator('.msg-where')).toContainText('theme.md');
    await expect(page.getByTestId('export')).toBeEnabled();
    await skipPrompt(page);
    await neutralFrame(page, '#om-preview');
    // And the exported snapshot: the neutral frame. (The retired key's value is still copied into the embedded theme
    // data, inert; the spec doesn't say whether it may be. Reported, not asserted.)
    const snap = await exportSnapshot(browser, src, info.outputPath('snap'));
    await openSnapshot(page, snap);
    await skipPrompt(page);
    await neutralFrame(page, 'body');
  });

  test('2.22 theming › Logo shown', async ({ page, browser }, info) => {
    const src = withTheme('logo', 'logo: assets/logo.svg', 'brand-valid', { 'assets/logo.svg': LOGO });
    await loadZip(page, src);
    await expect(counts(page)).toHaveText('0 errors, 1 warning');
    const m = messages(page).filter({ hasText: '"logo"' });
    await expect(m).toHaveCount(1);
    await expect(m).toHaveAttribute('data-level', 'warning');
    await expect(m).toContainText('ignored');
    await expect(m).toContainText('party marks from brand packs');
    await skipPrompt(page);
    const logoB64 = Buffer.from(LOGO).toString('base64');
    const check = async (scope) => {
      const bar = scope.locator('.topbar');
      await expect(bar.getByTestId('logo')).toHaveCount(0);
      await expect(bar.locator('.brand-name')).toHaveText('Brand test');
      const marks = bar.getByTestId('lockup').locator('img.mk');
      expect(await marks.evaluateAll((els) => els.map((e) => e.alt))).toEqual(['Acme Corp', 'Globex']);
      for (const mk of await marks.all()) expect(await mk.evaluate((img) => img.complete && img.naturalWidth > 0)).toBe(true);
      // The only images in the header are the two party marks.
      await expect(bar.locator('img')).toHaveCount(2);
      expect(await bar.evaluate((b, s) => b.innerHTML.includes(s), logoB64), 'the logo is not in the header').toBe(false);
    };
    await check(page.getByTestId('preview'));
    const snap = await exportSnapshot(browser, src, info.outputPath('snap'));
    expect(snap.html).not.toContain(logoB64);
    await openSnapshot(page, snap);
    await skipPrompt(page);
    await check(page.locator('body'));
  });

  test('2.23 theming › No theme file', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await loadZip(page, 'tiny');
    await expect(counts(page)).toContainText('0 errors, 0 warnings');
    await expect(messages(page).filter({ hasText: 'theme' })).toHaveCount(0);
    const pv = page.getByTestId('preview');
    expect(await css(pv.locator('.topbar'), 'backgroundColor')).toBe(DEFAULT_PRIMARY);
    await expect(pv.getByTestId('logo')).toHaveCount(0);
    // No branded party, so no lockup: the name stands alone.
    await expect(pv.getByTestId('lockup')).toHaveCount(0);
    // Default body text on the default background meets WCAG AA.
    const [fg, bg] = [await css(pv.locator('main'), 'color'), await css(pv, 'backgroundColor')];
    const ratio = (Math.max(lum(fg), lum(bg)) + 0.05) / (Math.min(lum(fg), lum(bg)) + 0.05);
    expect(ratio).toBeGreaterThanOrEqual(4.5);
  });

  test('2.25 theming › Remote font rejected', async ({ page, browser, sink }, info) => {
    await loadZip(page, 'remote-font');
    await expect(counts(page)).toHaveText('0 errors, 1 warning');
    const m = messages(page).filter({ hasText: '"fonts"' });
    await expect(m).toHaveCount(1);
    await expect(m).toHaveAttribute('data-level', 'warning');
    await expect(m).toContainText('retired');
    await expect(m).toContainText('ignored');
    await expect(m).toContainText('No font is fetched');
    await expect(page.getByTestId('export')).toBeEnabled();
    await skipPrompt(page);
    const fonts = async () =>
      page.evaluate(() => ({
        faces: [...document.fonts].map((f) => f.family),
        rules: [...document.styleSheets].flatMap((s) => [...s.cssRules]).filter((r) => r instanceof CSSFontFaceRule).length,
        body: getComputedStyle(document.querySelector('#om-preview main, main')).fontFamily,
      }));
    for (const f of [await fonts()]) {
      expect(f.faces, 'no font face loaded').toEqual([]);
      expect(f.rules, 'no @font-face rule').toBe(0);
      expect(f.body).toMatch(/^"Segoe UI Variable Text", "Segoe UI", system-ui/);
    }
    const snap = await exportSnapshot(browser, 'remote-font', info.outputPath('snap'));
    // The URL is still copied, inert, into the embedded theme data (reported, not asserted); nothing loads it.
    expect(snap.html).not.toMatch(/@font-face/);
    await openSnapshot(page, snap);
    await skipPrompt(page);
    const f = await fonts();
    expect(f.faces).toEqual([]);
    expect(f.rules).toBe(0);
    expect(f.body).toMatch(/^"Segoe UI Variable Text", "Segoe UI", system-ui/);
    expect(sink.requests, 'no font fetched').toEqual([]);
  });

  test('2.26 theming › Remote mark rejected', async ({ page }) => {
    await loadZip(page, 'brand-remote-mark');
    const m = messages(page).filter({ hasText: 'https://example.com/mark.svg' });
    await expect(m).toHaveCount(1);
    await expect(m).toHaveAttribute('data-level', 'error');
    await expect(m).toContainText("Marks must be files in the brand pack's folder");
    await expect(m.locator('.msg-where')).toContainText('brands/globex/brand.md');
    await expect(page.getByTestId('export')).toBeDisabled();
  });

  test('2.27 theming › Missing asset', async ({ page }) => {
    await loadZip(page, 'missing-asset');
    const m = messages(page).filter({ hasText: 'assets/missing.png' });
    await expect(m).toHaveCount(1);
    await expect(m).toHaveAttribute('data-level', 'error');
    await expect(m).toContainText('not found');
    await expect(page.getByTestId('export')).toBeDisabled();
  });
});

test.describe('theming (no-theme snapshot)', () => {
  const snap = useSnapshot('tiny');

  test('2.24 theming › Dark mode', async ({ page }) => {
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
