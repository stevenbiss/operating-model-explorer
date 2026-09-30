// Change add-party-brands, Test tasks 2.1–2.19 (party-brands), 2.30 (content-schema) and 2.33 (capture-sheet), on
// dist/operating-model-explorer.html via file:// (author mode) and on snapshots exported through the real Export button.
// The theming tasks (2.20–2.27) are in theming.spec.js, and 2.31–2.32 in capture-sheet-authoring.spec.js.
// 2.28 = content-schema.spec.js "2.1 content-schema › Minimal valid model", 2.29 = "2.2 content-schema › Missing model file".
// Node tests for the same scenarios: tests/unit/brand.test.js, colour.test.js and theme.test.js.
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join } from 'node:path';
import {
  test, expect, openEngine, loadZip, loadFolder, skipPrompt, messages, go, fixtureDir, variant, useSnapshot, openSnapshot,
  exportSnapshot, watch, contentOf, noHorizontalScroll, brandPairs, frameColours, colourOf, rgbKey, hexRgb, luminance, contrast, SAMPLE_SHEET_DIR,
} from './helpers.js';
import { oklch } from '../../src/model/colour.js'; // a measuring function only (unit-tested against reference values)

const AXE = readFileSync(createRequire(import.meta.url).resolve('axe-core/axe.min.js'), 'utf8');
const pv = (page) => page.getByTestId('preview');
const counts = (page) => page.getByTestId('report-counts');
const msg = (page, hasText) => messages(page).filter({ hasText });
// The data: URI a mark file becomes, byte for byte.
const markUri = (dir, brand, file = 'mark.svg') => `data:image/svg+xml;base64,${readFileSync(join(dir, 'brands', brand, file)).toString('base64')}`;
const fixtureMark = (fx, brand) => markUri(fixtureDir(fx), brand);
// The engine's frame and meaning colours (src/styles.css).
const FRAME_PRIMARY = rgbKey('#1f3a5f');
const REMOVED = { light: rgbKey('#b42318'), dark: rgbKey('#f47067') };
// design.md D3: the neutral set for parties without a brand.
const NEUTRAL_HEX = ['#3e5c71', '#c0c9a5', '#635737', '#bea0ba', '#a2cfc5', '#a8ae99'];

async function axe(page, where) {
  await page.evaluate(AXE);
  const result = await page.evaluate(() => window.axe.run(document, { resultTypes: ['violations'] }));
  return result.violations
    .filter((v) => ['serious', 'critical'].includes(v.impact) || v.id === 'region')
    .map((v) => `${where}: ${v.id} (${v.impact}) ${v.help} -> ${v.nodes.slice(0, 5).map((n) => n.target.join(' ')).join(' | ')}`);
}

// Frame elements: header (minus the lockup), sub-bar, navigation, buttons, headings, step panel and footer.
const FRAME = (root) =>
  ['.topbar', '.topbar *', '.subbar', '.subbar *', '.crumbs a', '.btn', 'main h1', '.page-head .eyebrow', '.page-head .eyebrow a', '.detail', '.flow-btn', '.foot', '.foot *']
    .map((s) => `${root} ${s}`)
    .join(', ');

// The party colours the page is drawing right now, by party position: { band, bandText, tint } as "r,g,b".
async function partyColoursNow(page, root, n) {
  const out = [];
  for (let i = 0; i < n; i++) {
    const el = page.locator(`${root} [data-party="${i}"]`).first();
    out.push({ band: await colourOf(page, el, '--p-band'), bandText: await colourOf(page, el, '--p-band-text'), tint: await colourOf(page, el, '--p-tint') });
  }
  return out;
}

// ---------------------------------------------------------------------------------------------------------------
test.describe('party-brands (author mode)', () => {
  test.beforeEach(async ({ page }) => openEngine(page));

  test('2.1 party-brands › Valid pack', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await loadFolder(page, 'brand-valid');
    await expect(counts(page)).toHaveText('0 errors, 0 warnings');
    await expect(messages(page)).toHaveCount(0);
    await skipPrompt(page);
    const card = pv(page).getByTestId('party-card-globex');
    await expect(card.locator('h3')).toContainText('Globex');
    await expect(card.locator('img.mk')).toHaveAttribute('src', fixtureMark('brand-valid', 'globex'));
    expect(await card.locator('img.mk').evaluate((img) => img.complete && img.naturalWidth > 0), 'Globex mark decoded').toBe(true);
    expect(await colourOf(page, card, 'borderLeftColor'), "the card's edge is Globex's colour").toBe(rgbKey('#a3367a'));
    await go(page, '#/p/flow');
    const band = pv(page).locator('.lane-heads .band[data-party="1"]');
    expect(await colourOf(page, band.locator('.band-bg'), 'fill'), "Globex's band").toBe(rgbKey('#a3367a'));
    await expect(band.locator('.band-name')).toHaveText('Globex');
  });

  test('2.2 party-brands › Missing mark', async ({ page }) => {
    await loadFolder(page, 'brand-missing-mark');
    const m = msg(page, 'mark.svg');
    await expect(m).toHaveCount(1);
    await expect(m).toHaveAttribute('data-level', 'error');
    await expect(m).toContainText('brands/globex/');
    await expect(m.locator('.msg-where')).toContainText('globex');
    await expect(page.getByTestId('export')).toBeDisabled();
  });

  test('2.3 party-brands › Invalid colour', async ({ page }) => {
    await loadFolder(page, 'brand-bad-colour');
    const m = msg(page, 'colours.primary');
    await expect(m).toHaveCount(1);
    await expect(m).toHaveAttribute('data-level', 'error');
    await expect(m.locator('.msg-where')).toContainText('brands/globex/brand.md');
    await expect(m).toContainText('"red"');
    await expect(m).toContainText('Colours must be hex values such as "#0b1f4d"');
  });

  test("2.4 party-brands › Id doesn't match its folder", async ({ page }) => {
    await loadFolder(page, 'brand-id-mismatch');
    const m = msg(page, 'globex-corp');
    await expect(m).toHaveCount(1);
    await expect(m).toHaveAttribute('data-level', 'error');
    await expect(m).toContainText('brands/globex/');
    await expect(m).toContainText('must match');
  });

  test('2.5 party-brands › Unknown brand', async ({ page }) => {
    await loadFolder(page, 'brand-unknown');
    const m = msg(page, 'globx');
    await expect(m).toHaveCount(1);
    await expect(m).toHaveAttribute('data-level', 'error');
    await expect(m).toContainText('The party "Globex"');
    await expect(m.locator('.msg-fix')).toContainText('Did you mean globex?');
  });

  test('2.7 party-brands › Sheet loaded without its brands', async ({ page }) => {
    const chooser = page.waitForEvent('filechooser');
    await page.getByRole('button', { name: 'Load capture sheet' }).click();
    await (await chooser).setFiles(join(fixtureDir('sheet-brands'), 'capture-sheet.md'));
    await expect(page.getByTestId('report')).toBeVisible();
    await expect(counts(page)).toContainText('2 errors');
    for (const [party, brand] of [['Acme Corp', 'acme'], ['Globex', 'globex']]) {
      const m = msg(page, `The party "${party}" uses the brand "${brand}"`);
      await expect(m).toHaveCount(1);
      await expect(m).toHaveAttribute('data-level', 'error');
      await expect(m).toContainText('Brand packs are read from the brands/ folder next to the capture sheet');
      await expect(m.locator('.msg-fix')).toContainText('Load the sheet\'s folder');
      await expect(m.locator('.msg-fix')).toContainText(`brands/${brand}/`);
    }
    await expect(page.getByTestId('export')).toBeDisabled();
  });

  test('2.8 party-brands › Swimlane bands', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await loadFolder(page, 'brand-valid');
    await skipPrompt(page);
    await go(page, '#/p/flow/s/step-acme');
    await expect(pv(page).getByTestId('step-detail')).toBeVisible();
    const brands = [
      { i: 0, name: 'Acme Corp', colour: '#0b5cad', mark: fixtureMark('brand-valid', 'acme') },
      { i: 1, name: 'Globex', colour: '#a3367a', mark: fixtureMark('brand-valid', 'globex') },
    ];
    const marks = pv(page).locator('.band-marks img.mk');
    await expect(marks).toHaveCount(2);
    for (const b of brands) {
      const band = pv(page).locator(`.lane-heads .band[data-party="${b.i}"]`);
      await expect(band.locator('.band-name')).toHaveText(b.name);
      expect(await colourOf(page, band.locator('.band-bg'), 'fill'), `${b.name} band colour`).toBe(rgbKey(b.colour));
      await expect(marks.nth(b.i)).toHaveAttribute('src', b.mark);
      expect(await marks.nth(b.i).evaluate((img) => img.complete && img.naturalWidth > 0), `${b.name} band mark decoded`).toBe(true);
      // The mark sits over its own band.
      const [mb, bb] = [await marks.nth(b.i).boundingBox(), await band.locator('.band-bg').boundingBox()];
      expect(mb.y >= bb.y - 1 && mb.y + mb.height <= bb.y + bb.height + 1, `${b.name} mark inside its band`).toBe(true);
      // The band rule across the body and the lane tints carry the same party.
      expect(await colourOf(page, pv(page).locator(`.swimlane:not(.lane-heads *) .band[data-party="${b.i}"] .band-line`), 'stroke')).toBe(rgbKey(b.colour));
      // The legend pairs the colour with the name.
      const item = pv(page).locator(`[data-testid="legend-party"][data-party="${b.i}"]`);
      await expect(item).toHaveText(b.name);
      expect(await colourOf(page, item.locator('.swatch'), 'backgroundColor')).toBe(rgbKey(b.colour));
      // ...and the mark, decorative because the name is beside it.
      const legendMark = item.locator('img.mk');
      await expect(legendMark).toHaveAttribute('src', b.mark);
      await expect(legendMark).toHaveAttribute('alt', '');
      expect(await legendMark.evaluate((img) => img.complete && img.naturalWidth > 0), `${b.name} legend mark decoded`).toBe(true);
    }
    // The owner chip in the step detail shows Acme's mark and name.
    const tag = pv(page).getByTestId('owner').locator('.ptag');
    await expect(tag).toHaveText('Acme Corp');
    await expect(tag.locator('img.mk')).toHaveAttribute('src', brands[0].mark);
    // The frame uses neither brand colour (nor their tints), and the header keeps the engine's own colour.
    const party = new Set();
    for (const c of await partyColoursNow(page, '#om-preview', 2)) party.add(c.band).add(c.tint);
    await page.emulateMedia({ colorScheme: 'dark' });
    for (const c of await partyColoursNow(page, '#om-preview', 2)) party.add(c.band).add(c.tint);
    await page.emulateMedia({ colorScheme: 'light' });
    const frame = await frameColours(page, FRAME('#om-preview'));
    expect(frame.length, 'frame colours were read').toBeGreaterThan(5);
    expect(frame.filter(([k]) => party.has(k)), 'frame elements drawn in a party colour').toEqual([]);
    expect(await colourOf(page, pv(page).locator('.topbar'), 'backgroundColor')).toBe(FRAME_PRIMARY);
  });

  test('2.9 party-brands › Party card', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await loadFolder(page, 'brand-valid');
    await skipPrompt(page);
    for (const [id, name, colour] of [['acme', 'Acme Corp', '#0b5cad'], ['globex', 'Globex', '#a3367a']]) {
      const card = pv(page).getByTestId(`party-card-${id}`);
      const h3 = card.locator('h3');
      await expect(h3).toHaveText(name);
      const mark = h3.locator('img.mk');
      await expect(mark).toHaveAttribute('src', fixtureMark('brand-valid', id));
      expect(await mark.evaluate((img) => img.complete && img.naturalWidth > 0)).toBe(true);
      // Next to its name: the mark and the name share the heading's row.
      const [mb, hb] = [await mark.boundingBox(), await h3.boundingBox()];
      expect(mb.y >= hb.y - 1 && mb.y + mb.height <= hb.y + hb.height + 1, `${name} mark beside the name`).toBe(true);
      expect(await colourOf(page, card, 'borderLeftColor'), `${name} card colour`).toBe(rgbKey(colour));
    }
  });

  test('2.10 party-brands › Light brand colour', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await loadFolder(page, 'brand-light-yellow');
    await skipPrompt(page);
    await go(page, '#/p/flow');
    const band = pv(page).locator('.lane-heads .band[data-party="1"]');
    await expect(band.locator('.band-name')).toHaveText('Sunco');
    const bg = (await colourOf(page, band.locator('.band-bg'), 'fill')).split(',').map(Number);
    const fg = (await colourOf(page, band.locator('.band-name'), 'fill')).split(',').map(Number);
    expect(bg.join(), "Sunco's band keeps its yellow").toBe(rgbKey('#ffd23f'));
    expect(luminance(fg), `text ${fg} on the yellow band is dark`).toBeLessThan(0.1);
    expect(contrast(fg, bg), 'band text contrast').toBeGreaterThanOrEqual(4.5);
    for (const p of (await brandPairs(page, '#om-preview')).filter((x) => x.party === '1' || x.kind === 'html')) expect(p.ratio, `${p.kind} ${p.what}`).toBeGreaterThanOrEqual(4.5);
  });

  // Replaces the retired theming "Low-contrast theme" test: the low-contrast fixture is now a brand whose grey no ink
  // reaches 4.5:1 on (Readable brand colours).
  test('party-brands › Readable brand colours: a mid grey is adjusted until its text meets AA, with a warning', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await loadFolder(page, 'low-contrast');
    const m = msg(page, 'Grey Co');
    await expect(m).toHaveCount(1);
    await expect(m).toHaveAttribute('data-level', 'warning');
    await expect(m).toContainText('#7a7a7a');
    await expect(m).toContainText('4.5:1');
    await expect(m.locator('.msg-where')).toContainText('parties/02-greyco.md');
    const drawn = (await m.locator('.msg-problem').innerText()).match(/drawn as (#[0-9a-f]{6})/i)[1];
    await expect(page.getByTestId('export')).toBeEnabled();
    await skipPrompt(page);
    await go(page, '#/p/flow');
    const band = pv(page).locator('.lane-heads .band[data-party="1"]');
    const bg = await colourOf(page, band.locator('.band-bg'), 'fill');
    expect(bg, 'drawn in the adjusted shade').toBe(rgbKey(drawn));
    expect(contrast(bg.split(',').map(Number), (await colourOf(page, band.locator('.band-name'), 'fill')).split(',').map(Number))).toBeGreaterThanOrEqual(4.5);
  });

  test('2.12 party-brands › Two similar reds', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await loadFolder(page, 'brand-two-reds');
    await expect(counts(page)).toHaveText('0 errors, 1 warning');
    const m = msg(page, 'too close');
    await expect(m).toHaveCount(1);
    await expect(m).toHaveAttribute('data-level', 'warning');
    await expect(m).toContainText('Crimson Co');
    await expect(m).toContainText('Redline');
    await expect(m).toContainText('#c92d25');
    await expect(m).toContainText('secondary colour, #1f5fbf');
    await expect(page.getByTestId('export')).toBeEnabled();
    await skipPrompt(page);
    await go(page, '#/p/flow');
    expect(await colourOf(page, pv(page).locator('.lane-heads .band[data-party="0"] .band-bg'), 'fill'), 'Redline keeps its primary').toBe(rgbKey('#d6281e'));
    expect(await colourOf(page, pv(page).locator('.lane-heads .band[data-party="1"] .band-bg'), 'fill'), 'Crimson Co uses its blue secondary').toBe(rgbKey('#1f5fbf'));
  });

  test('2.13 party-brands › Distinct colours', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await loadFolder(page, 'brand-distinct');
    await expect(counts(page)).toHaveText('0 errors, 0 warnings');
    await expect(messages(page)).toHaveCount(0);
    await skipPrompt(page);
    await go(page, '#/p/flow');
    expect(await colourOf(page, pv(page).locator('.lane-heads .band[data-party="0"] .band-bg'), 'fill'), 'navy as given').toBe(rgbKey('#0b1f4d'));
    expect(await colourOf(page, pv(page).locator('.lane-heads .band[data-party="1"] .band-bg'), 'fill'), 'green as given').toBe(rgbKey('#3aaa35'));
  });

  test('2.14 party-brands › Brand close to "Removed"', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    // The fixture, with Rust Co's step marked removed, so a "Removed" badge is on screen next to Rust Co's colour.
    await loadZip(page, variant('brand-near-removed', 'brand-near-removed', { 'processes/01-flow.md': (s) => s.replace('    owner: rustco-lead\n', '    owner: rustco-lead\n    change: { status: removed }\n') }));
    const m = msg(page, 'Rust Co');
    await expect(m).toHaveCount(1);
    await expect(m).toHaveAttribute('data-level', 'warning');
    await expect(m).toContainText('#b8261c');
    await expect(m).toContainText('can\'t be mistaken for "Removed"');
    const shifted = m.locator('.msg-problem');
    const hex = (await shifted.innerText()).match(/shifted shade, (#[0-9a-f]{6})/i)[1];
    expect(hex.toLowerCase()).not.toBe('#b8261c');
    await expect(page.getByTestId('export')).toBeEnabled();
    await skipPrompt(page);
    await go(page, '#/p/flow/s/step-rustco?changes=1');
    await expect(pv(page).getByTestId('step-detail')).toBeVisible();
    const band = pv(page).locator('.lane-heads .band[data-party="1"]');
    expect(await colourOf(page, band.locator('.band-bg'), 'fill'), 'Rust Co drawn in the shifted shade').toBe(rgbKey(hex));
    // The badges keep the engine's colour.
    const pill = pv(page).locator('.pill.badge-removed rect');
    await expect(pill).toHaveCount(1);
    expect(await colourOf(page, pill, 'stroke'), 'swimlane "Removed" badge').toBe(REMOVED.light);
    const badge = pv(page).getByTestId('step-detail').locator('.badge-removed');
    await expect(badge).toHaveText('Removed');
    expect(await colourOf(page, badge, 'borderTopColor'), 'detail "Removed" badge').toBe(REMOVED.light);
    await page.emulateMedia({ colorScheme: 'dark' });
    expect(await colourOf(page, pill, 'stroke'), 'dark "Removed" badge').toBe(REMOVED.dark);
    expect(await colourOf(page, band.locator('.band-bg'), 'fill')).not.toBe(REMOVED.dark);
  });

  test('2.15 party-brands › Unbranded party', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await loadFolder(page, 'brand-unbranded');
    await expect(counts(page)).toHaveText('0 errors, 0 warnings');
    await expect(messages(page)).toHaveCount(0);
    await skipPrompt(page);
    const card = pv(page).getByTestId('party-card-client-team');
    const init = card.locator('.mk-init');
    await expect(init).toHaveText('CT');
    const colour = await colourOf(page, init, 'backgroundColor');
    // An engine neutral (design D3), or one shifted to keep it apart from the other parties: low chroma either way.
    const hex = '#' + colour.split(',').map((v) => Number(v).toString(16).padStart(2, '0')).join('');
    const chroma = oklch(hex)[1];
    expect(chroma, `"CT" mark colour ${hex} is neutral (OKLCH chroma ${chroma.toFixed(3)})`).toBeLessThanOrEqual(Math.max(...NEUTRAL_HEX.map((n) => oklch(n)[1])) + 0.005);
    expect(colour).not.toBe(await colourOf(page, pv(page).getByTestId('party-card-globex'), 'borderLeftColor'));
    expect(await colourOf(page, card, 'borderLeftColor'), 'card edge in the same neutral').toBe(colour);
    await go(page, '#/p/flow');
    const bandMark = pv(page).locator('.band-marks .mk-init');
    await expect(bandMark).toHaveText('CT');
    expect(await colourOf(page, pv(page).locator('.lane-heads .band[data-party="1"] .band-bg'), 'fill'), 'band in the neutral').toBe(colour);
    await expect(pv(page).locator('.lane-heads .band[data-party="1"] .band-name')).toHaveText('Client Team');
    // The legend shows the initials beside the name (hidden from assistive tech, since the name is read), and Globex's mark.
    const legendInit = pv(page).locator('[data-testid="legend-party"][data-party="1"] .mk-init');
    await expect(legendInit).toHaveText('CT');
    await expect(legendInit).toHaveAttribute('aria-hidden', 'true');
    expect(await colourOf(page, legendInit, 'backgroundColor'), 'legend initials in the neutral').toBe(colour);
    await expect(pv(page).locator('[data-testid="legend-party"][data-party="1"]')).toHaveText('CTClient Team');
    await expect(pv(page).locator('[data-testid="legend-party"][data-party="0"] img.mk')).toHaveAttribute('src', fixtureMark('brand-unbranded', 'globex'));
  });

  test('2.30 content-schema › Brand packs are not elements', async ({ page, browser }, info) => {
    await loadFolder(page, 'brand-valid');
    await expect(counts(page)).toHaveText('0 errors, 0 warnings');
    await expect(messages(page)).toHaveCount(0);
    // Nothing from brands/ turns up as an element: in the model the engine exports.
    const snap = await exportSnapshot(browser, 'brand-valid', info.outputPath('snap'));
    const c = contentOf(snap.html);
    expect(Object.keys(c.elements).sort()).toEqual(['acme', 'acme-lead', 'flow', 'globex', 'globex-lead', 'main-ws']);
    expect(Object.values(c.elements).map((e) => e.type).sort()).toEqual(['party', 'party', 'process', 'role', 'role', 'workstream']);
    expect(c.elements.globex.brand).toBe('globex');
  });
});

// ---------------------------------------------------------------------------------------------------------------
test.describe('party-brands (exported snapshot)', () => {
  const snap = useSnapshot('brand-valid');

  test('2.16 party-brands › Equal marks', async ({ page }) => {
    test.skip(page.viewportSize().width < 1280, 'specified at 1280px');
    await openSnapshot(page, snap);
    const lockup = page.getByTestId('lockup');
    const marks = lockup.locator('img.mk');
    await expect(marks).toHaveCount(2);
    expect(await marks.evaluateAll((els) => els.map((e) => e.alt))).toEqual(['Acme Corp', 'Globex']);
    await expect(marks.nth(0)).toHaveAttribute('src', fixtureMark('brand-valid', 'acme'));
    await expect(marks.nth(1)).toHaveAttribute('src', fixtureMark('brand-valid', 'globex'));
    const [a, b] = [await marks.nth(0).boundingBox(), await marks.nth(1).boundingBox()];
    expect(a.height).toBeGreaterThan(16);
    expect(Math.abs(a.height - b.height), 'same height').toBeLessThan(0.5);
    expect(Math.abs(a.y - b.y), 'side by side').toBeLessThan(0.5);
    expect(a.x < b.x, 'party order').toBe(true);
    for (const m of [marks.nth(0), marks.nth(1)]) expect(await m.evaluate((img) => img.complete && img.naturalWidth > 0)).toBe(true);
    // Next to the model name, in the header.
    const name = page.locator('.topbar .brand-name');
    await expect(name).toHaveText('Brand test');
    const n = await name.boundingBox();
    expect(a.x > n.x + n.width, 'marks after the name').toBe(true);
    expect(n.y + n.height / 2 > a.y && n.y + n.height / 2 < a.y + a.height, 'on the name\'s row').toBe(true);
    await expect(page.locator('.topbar')).toContainText('Brand test');
    expect(await page.locator('.topbar').evaluate((t) => t.contains(document.querySelector('[data-testid="lockup"]')))).toBe(true);
  });

  test('2.18 party-brands › Versions recorded, notes excluded', async ({ page }) => {
    const c = contentOf(snap.html);
    expect(c.brandsUsed).toEqual([
      { party: 'acme', brand: 'acme', version: '2026.1' },
      { party: 'globex', brand: 'globex', version: '2026.3' },
    ]);
    for (const note of ['Globex usage note', 'never place the mark on a busy photograph', 'Fictional usage notes for Acme Corp', 'Keep the mark square']) {
      expect(snap.html.includes(note), `snapshot contains "${note}"`).toBe(false);
    }
    // Recorded as data, not shown to viewers.
    await openSnapshot(page, snap);
    await skipPrompt(page);
    for (const hash of ['#/', '#/e/globex', '#/p/flow/s/step-globex']) {
      await openSnapshot(page, snap, hash);
      expect(await page.locator('body').innerText()).not.toContain('2026.3');
    }
  });
});

test.describe('party-brands (unused pack)', () => {
  const snap = useSnapshot('brand-unused');

  test('2.6 party-brands › Unused pack left out', async () => {
    const initech = readFileSync(join(fixtureDir('brand-unused'), 'brands', 'initech', 'mark.svg'));
    for (const s of ['initech', 'Initech', '#2d7d9a', 'this pack is not used', initech.toString('base64')]) {
      expect(snap.html.includes(s), `snapshot contains ${s.slice(0, 40)}`).toBe(false);
    }
    const c = contentOf(snap.html);
    expect(Object.keys(c.marks).sort()).toEqual(['acme', 'globex']);
    expect(c.brandsUsed.map((b) => b.brand)).toEqual(['acme', 'globex']);
    // The used packs are there, so the check above is not vacuous.
    expect(snap.html).toContain(readFileSync(join(fixtureDir('brand-unused'), 'brands', 'globex', 'mark.svg')).toString('base64'));
  });
});

test.describe('party-brands (phone)', () => {
  for (const src of ['brand-valid', 'acme-sample']) {
    const snap = useSnapshot(src === 'acme-sample' ? 'sample' : src);
    test(`2.17 party-brands › Lockup on a phone (${src})`, { tag: '@mobile-only' }, async ({ page }) => {
      await openSnapshot(page, snap);
      await skipPrompt(page);
      const lockup = page.getByTestId('lockup');
      await expect(lockup.locator('img.mk')).toHaveCount(2);
      await expect(page.locator('.topbar .brand-name')).toBeVisible();
      expect(await noHorizontalScroll(page), 'no horizontal page scroll').toBe(true);
      const vw = page.viewportSize().width;
      for (const el of [lockup, page.locator('.topbar .brand-name'), ...(await lockup.locator('img.mk').all())]) {
        const b = await el.boundingBox();
        expect(b.x >= 0 && b.x + b.width <= vw, 'fits the screen').toBe(true);
      }
      const hs = await lockup.locator('img.mk').evaluateAll((els) => els.map((e) => e.getBoundingClientRect().height));
      expect(Math.abs(hs[0] - hs[1])).toBeLessThan(0.5);
      for (const hash of src === 'acme-sample' ? ['#/p/qualify-opportunity', '#/e/globex'] : ['#/p/flow', '#/e/globex']) {
        await openSnapshot(page, snap, hash);
        expect(await noHorizontalScroll(page), `no horizontal page scroll at ${hash}`).toBe(true);
      }
    });
  }
});

// Verifier round 2: on a phone, each step in the list shows its party's mark beside the party name.
test.describe('party-brands (phone step list marks)', () => {
  const snap = useSnapshot('brand-unbranded');

  test('party-brands › Party identity where the party appears: marks in the phone step list', { tag: '@mobile-only' }, async ({ page }) => {
    await openSnapshot(page, snap, '#/p/flow');
    await expect(page.getByTestId('swimlane')).toHaveAttribute('data-layout', 'list');
    const branded = page.getByTestId('step-step-globex').locator('.fi-lane .ptag');
    await expect(branded).toHaveText('Globex');
    const img = branded.locator('img.mk');
    await expect(img).toHaveAttribute('src', fixtureMark('brand-unbranded', 'globex'));
    await expect(img).toHaveAttribute('alt', '');
    expect(await img.evaluate((i) => i.complete && i.naturalWidth > 0), 'mark decoded').toBe(true);
    const unbranded = page.getByTestId('step-step-client-team').locator('.fi-lane .ptag');
    await expect(unbranded).toHaveText('CTClient Team');
    await expect(unbranded.locator('.mk-init')).toHaveAttribute('aria-hidden', 'true');
    // Beside the name: the mark and the name share a row.
    for (const tag of [branded, unbranded]) {
      const [mb, tb] = [await tag.locator('.mk').boundingBox(), await tag.boundingBox()];
      expect(mb.y >= tb.y - 1 && mb.y + mb.height <= tb.y + tb.height + 1, 'mark beside the party name').toBe(true);
    }
    expect(await noHorizontalScroll(page)).toBe(true);
  });
});

// QA round 2, MINOR 1: a 34-character single word as a party name must not cause horizontal scroll on a phone.
test.describe('party-brands (long single-word name)', () => {
  const WORD = 'Supercalifragilisticexpialidocious';
  const snap = useSnapshot(variant('brand-unbranded', 'brand-long-word', { 'parties/02-client-team.md': (s) => s.replace('name: Client Team', `name: ${WORD}`) }));

  test('party-brands › A long single-word party name wraps, with no horizontal scroll', { tag: '@mobile-only' }, async ({ page }) => {
    expect(WORD).toHaveLength(34);
    const vw = page.viewportSize().width;
    for (const hash of ['#/e/client-team', '#/e/client-team-lead', '#/p/flow', '#/p/flow/s/step-client-team', '']) {
      await openSnapshot(page, snap, hash);
      await skipPrompt(page);
      expect(await noHorizontalScroll(page), `no horizontal page scroll at ${hash || 'overview'}`).toBe(true);
    }
    await openSnapshot(page, snap, '#/e/client-team');
    const h1 = page.locator('.party-head h1');
    await expect(h1).toContainText(WORD);
    const b = await h1.boundingBox();
    expect(b.x >= 0 && b.x + b.width <= vw, 'the heading fits the screen').toBe(true);
  });
});

// QA round 1, MAJOR 2 and 3: twenty parties, with long names ("Partner Organisation 1 Holdings").
test.describe('party-brands (many parties, long names)', () => {
  const snap = useSnapshot('brand-many-parties');
  const LONG = 'Partner Organisation 1 Holdings';

  test('party-brands › Swimlane bands: a long party name is shown in full, on up to two lines', async ({ page }) => {
    test.skip(page.viewportSize().width < 1280, 'the swimlane is drawn at desktop widths');
    await openSnapshot(page, snap, '#/p/flow');
    const band = page.locator('.lane-heads .band[data-party="0"]');
    const name = band.locator('.band-name');
    await expect(name).toHaveText(LONG);
    expect(await name.textContent()).not.toContain('…');
    expect(await name.evaluate((t) => getComputedStyle(t).textTransform), 'not uppercased').toBe('none');
    const bg = await band.locator('.band-bg').boundingBox();
    const lines = await name.locator('tspan').evaluateAll((ts) => ts.map((t) => ({ text: t.textContent, right: t.getBoundingClientRect().right })));
    expect(lines.length).toBeLessThanOrEqual(2);
    for (const l of lines) expect(l.right, `"${l.text}" fits its header cell`).toBeLessThanOrEqual(bg.x + bg.width);
    const tb = await name.boundingBox();
    expect(tb.y >= bg.y && tb.y + tb.height <= bg.y + bg.height, 'the name sits inside its band').toBe(true);
    // The legend swatch has an edge, so black or white brands stay visible.
    expect(await page.locator('[data-testid="legend-party"] .swatch').first().evaluate((s) => getComputedStyle(s).boxShadow)).not.toBe('none');
    expect(await noHorizontalScroll(page)).toBe(true);
  });

  test('party-brands › Twenty parties: the workstream card\'s marks wrap, with no horizontal scroll', { tag: '@mobile' }, async ({ page }) => {
    await openSnapshot(page, snap);
    await skipPrompt(page);
    const vw = page.viewportSize().width;
    const card = page.getByTestId('workstream-card-main-ws');
    const marks = card.locator('.dots .mk');
    await expect(marks).toHaveCount(20);
    const cb = await card.boundingBox();
    for (const m of await marks.all()) {
      const b = await m.boundingBox();
      expect(b.x >= cb.x - 0.5 && b.x + b.width <= cb.x + cb.width + 0.5, 'each mark inside the card').toBe(true);
    }
    expect(await noHorizontalScroll(page), 'no horizontal page scroll on the overview').toBe(true);
    for (const hash of ['#/w/main-ws', '#/p/flow', '#/e/partner-1']) {
      await openSnapshot(page, snap, hash);
      expect(await noHorizontalScroll(page), `no horizontal page scroll at ${hash}`).toBe(true);
    }
    // On a phone the steps are a list, and the long party name is shown in full.
    if (vw < 768) {
      await openSnapshot(page, snap, '#/p/flow');
      await expect(page.getByTestId('step-step-1').locator('.fi-lane')).toContainText(LONG);
    }
  });
});

// ---------------------------------------------------------------------------------------------------------------
test.describe('party-brands (hostile SVG mark)', () => {
  const snap = useSnapshot('brand-hostile-svg');

  // Records CSP violations and title changes, in case anything in the mark tried to run.
  const arm = (page) =>
    page.addInitScript(() => {
      window.__omCsp = [];
      document.addEventListener('securitypolicyviolation', (e) => window.__omCsp.push(`${e.violatedDirective} ${e.blockedURI}`));
    });
  async function harmless(page, root, title) {
    const mark = fixtureMark('brand-hostile-svg', 'globex');
    const imgs = page.locator(`${root} img.mk[data-party="1"]`);
    expect(await imgs.count(), 'the Globex mark is shown').toBeGreaterThan(0);
    for (const img of await imgs.all()) {
      await expect(img).toHaveAttribute('src', mark);
      expect(await img.evaluate((i) => i.complete && i.naturalWidth > 0), 'displayed as an image').toBe(true);
    }
    const state = await page.evaluate(() => ({
      title: document.title,
      csp: window.__omCsp,
      inline: [...document.querySelectorAll('svg')].filter((s) => /attacker|pwned|onload/i.test(s.outerHTML)).length,
      scripts: document.querySelectorAll('svg script, svg image, svg foreignObject').length,
      handlers: [...document.querySelectorAll('*')].filter((e) => [...e.attributes].some((a) => /^on/i.test(a.name))).length,
      text: document.documentElement.outerHTML.replace(/base64,[A-Za-z0-9+/=]+/g, '').match(/attacker\.example|pwned/g),
    }));
    expect(state.title, 'no script changed the title').toBe(title);
    expect(state.title).not.toMatch(/pwned/);
    expect(state.csp, 'nothing in the mark tried to load or run').toEqual([]);
    expect(state.inline, 'no inline SVG from the pack').toBe(0);
    expect(state.scripts, 'no script, image or foreignObject in inline SVG').toBe(0);
    expect(state.handlers, 'no event-handler attributes in the page').toBe(0);
    expect(state.text, 'the hostile markup is not in the page as text').toBeNull();
  }

  test('2.19 party-brands › Hostile SVG mark', { tag: '@mobile' }, async ({ page, browser, sink }) => {
    // Preview (author mode is specified for 768px and up, so it runs in a desktop-sized page).
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const own = { errors: [], dialogs: [], requests: [] };
    watch(ctx, own);
    const ap = await ctx.newPage();
    await arm(ap);
    await openEngine(ap);
    await loadFolder(ap, 'brand-hostile-svg');
    const title = 'Brand test: author mode'; // the engine names the tab after the loaded model
    await expect(counts(ap)).toHaveText('0 errors, 0 warnings');
    await skipPrompt(ap);
    await harmless(ap, '#om-preview', title);
    await go(ap, '#/p/flow/s/step-globex');
    await expect(pv(ap).getByTestId('step-detail')).toBeVisible();
    await harmless(ap, '#om-preview', title);
    await go(ap, '#/e/globex');
    await expect(pv(ap).locator('main h1')).toContainText('Globex');
    await harmless(ap, '#om-preview', title);
    await ctx.close();
    expect(own, 'preview: no console errors, dialogs or network requests').toEqual({ errors: [], dialogs: [], requests: [] });
    // The exported snapshot, at this project's size.
    expect(snap.html.replace(/base64,[A-Za-z0-9+/=]+/g, '')).not.toMatch(/attacker\.example|pwned|<script>document/);
    await arm(page);
    for (const hash of ['', '#/p/flow/s/step-globex', '#/e/globex', '#/r/globex-lead']) {
      await openSnapshot(page, snap, hash);
      await skipPrompt(page);
      await harmless(page, 'body', 'Brand test');
    }
    expect(sink.requests, 'snapshot: no network requests').toEqual([]);
  });
});

// ---------------------------------------------------------------------------------------------------------------
// Readable brand colours, light and dark, and axe, over the branded views of exported snapshots at this project's size.
const SWEEP = ['brand-valid', 'brand-light-yellow', 'brand-two-reds', 'brand-near-removed', 'brand-unbranded', 'brand-distinct', 'low-contrast', 'sample'];

test.describe('party-brands (colour sweep)', () => {
  const snaps = Object.fromEntries(SWEEP.map((s) => [s, useSnapshot(s)]));
  // The views each fixture has: overview, a process with a step open (one per party), a party page, a role page and a workstream.
  const views = async (page, src) => {
    const c = contentOf(snaps[src].html);
    const out = ['#/', `#/w/${c.order.workstream[0]}`];
    for (const p of c.order.process.slice(0, 2)) for (const s of c.elements[p].steps) out.push(`#/p/${p}/s/${s.id}`);
    for (const p of c.order.party) out.push(`#/e/${p}`);
    for (const r of c.order.role.slice(0, 3)) out.push(`#/r/${r}`);
    return out;
  };

  test('2.11 party-brands › Dark mode', { tag: '@mobile' }, async ({ page }) => {
    test.setTimeout(240_000);
    const fails = [];
    let pairs = 0;
    let bandPairs = 0;
    for (const src of SWEEP) {
      const c = contentOf(snaps[src].html);
      for (const hash of await views(page, src)) {
        await page.emulateMedia({ colorScheme: 'dark' });
        await openSnapshot(page, snaps[src], hash);
        await skipPrompt(page);
        // Dark-mode variants: each party's band and tint are the resolved dark colours, not the light ones.
        if (hash === '#/') {
          const now = await partyColoursNow(page, 'body', c.order.party.length);
          c.partyColours.forEach((pc, i) => {
            if (now[i].band !== rgbKey(pc.darkBand)) fails.push(`${src}: party ${i} band ${now[i].band} is not its dark band ${pc.darkBand}`);
            if (now[i].tint !== rgbKey(pc.darkTint)) fails.push(`${src}: party ${i} tint ${now[i].tint} is not its dark tint ${pc.darkTint}`);
            if (rgbKey(pc.darkTint) === rgbKey(pc.tint)) fails.push(`${src}: party ${i} has the same tint in light and dark`);
            if (contrast(hexRgb(pc.darkBandText), hexRgb(pc.darkBand)) < 4.5) fails.push(`${src}: party ${i} dark band text ${pc.darkBandText} on ${pc.darkBand}`);
          });
          const bg = (await colourOf(page, page.locator('body'), 'backgroundColor')).split(',').map(Number);
          if (luminance(bg) > 0.05) fails.push(`${src}: body is not dark (${bg})`);
        }
        for (const p of await brandPairs(page, 'body')) {
          pairs++;
          if (p.kind === 'band') bandPairs++;
          if (!(p.ratio >= 4.5)) fails.push(`${src} ${hash} dark: ${p.kind} ${p.what} ${p.fg} on ${p.bg} = ${p.ratio}${p.note ? ` (${p.note})` : ''}`);
        }
      }
    }
    expect(pairs, 'text/background pairs on party colours were found').toBeGreaterThan(40);
    if (page.viewportSize().width >= 768) expect(bandPairs, 'swimlane band names were checked').toBeGreaterThan(10);
    expect(fails).toEqual([]);
  });

  test('party-brands › Readable brand colours: AA on every party-coloured surface in light mode', { tag: '@mobile' }, async ({ page }) => {
    test.setTimeout(240_000);
    const fails = [];
    let pairs = 0;
    for (const src of SWEEP) {
      const c = contentOf(snaps[src].html);
      c.partyColours.forEach((pc, i) => {
        if (contrast(hexRgb(pc.bandText), hexRgb(pc.band)) < 4.5) fails.push(`${src}: party ${i} band text ${pc.bandText} on ${pc.band}`);
      });
      for (const hash of await views(page, src)) {
        await page.emulateMedia({ colorScheme: 'light' });
        await openSnapshot(page, snaps[src], hash);
        await skipPrompt(page);
        for (const p of await brandPairs(page, 'body')) {
          pairs++;
          if (!(p.ratio >= 4.5)) fails.push(`${src} ${hash} light: ${p.kind} ${p.what} ${p.fg} on ${p.bg} = ${p.ratio}${p.note ? ` (${p.note})` : ''}`);
        }
      }
    }
    expect(pairs).toBeGreaterThan(40);
    expect(fails).toEqual([]);
  });

  test('party-brands › Colour is never the only cue', { tag: '@mobile' }, async ({ page }) => {
    const fails = [];
    for (const src of ['brand-valid', 'brand-unbranded', 'sample']) {
      for (const hash of await views(page, src)) {
        await openSnapshot(page, snaps[src], hash);
        await skipPrompt(page);
        // Every visible HTML element drawn in a party's colour carries (or sits inside) that party's name or mark.
        const bad = await page.evaluate(() => {
          const named = (el) => {
            for (let a = el; a; a = a.parentElement) {
              if (a.textContent.trim() || a.querySelector('img[alt]:not([alt=""]), [aria-label]') || a.getAttribute('aria-label')) return true;
              if (a.matches('li, a, p, h1, h2, h3')) break;
            }
            return false;
          };
          return [...document.querySelectorAll('[data-party]:not([data-party="none"])')]
            .filter((e) => !(e instanceof SVGElement) && e.checkVisibility() && !named(e))
            .map((e) => e.outerHTML.slice(0, 120));
        });
        fails.push(...bad.map((b) => `${src} ${hash}: ${b}`));
        // Swimlane bands (desktop): each coloured band row has its party name.
        for (const g of await page.locator('.lane-heads .band').all()) {
          if ((await g.getAttribute('data-party')) === 'none') continue;
          if (!(await g.locator('.band-name').textContent()).trim()) fails.push(`${src} ${hash}: band without a name`);
        }
      }
    }
    expect(fails).toEqual([]);
  });

  test('html-deliverable › No serious axe violations on branded views, light and dark', { tag: '@mobile' }, async ({ page }) => {
    test.setTimeout(240_000);
    const found = [];
    for (const src of ['brand-valid', 'brand-light-yellow', 'brand-unbranded', 'sample']) {
      for (const scheme of ['light', 'dark']) {
        await page.emulateMedia({ colorScheme: scheme });
        for (const hash of (await views(page, src)).filter((h, i, a) => i < 4 || h.startsWith('#/e/') || h === a[a.length - 1])) {
          await openSnapshot(page, snaps[src], hash);
          await skipPrompt(page);
          found.push(...(await axe(page, `${src} ${hash} ${scheme} ${page.viewportSize().width}px`)));
        }
      }
    }
    expect(found).toEqual([]);
  });
});

// ---------------------------------------------------------------------------------------------------------------
test.describe('capture-sheet (brands)', () => {
  test.beforeEach(async ({ page }) => openEngine(page));

  test("2.33 capture-sheet › Brands from the sheet's folder", async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await loadFolder(page, 'acme-capture-sheet');
    await expect(counts(page)).toHaveText('0 errors, 0 warnings');
    await expect(messages(page)).toHaveCount(0);
    await skipPrompt(page);
    for (const [id, name, colour] of [['acme', 'Acme Corp', '#0b5cad'], ['globex', 'Globex', '#a3367a']]) {
      const card = pv(page).locator('.card-party', { has: page.locator('h3', { hasText: new RegExp(`^${name}$`) }) });
      await expect(card).toHaveCount(1);
      await expect(card.locator('img.mk')).toHaveAttribute('src', markUri(SAMPLE_SHEET_DIR, id));
      expect(await card.locator('img.mk').evaluate((img) => img.complete && img.naturalWidth > 0)).toBe(true);
      expect(await colourOf(page, card, 'borderLeftColor'), `${name} colour`).toBe(rgbKey(colour));
    }
    const lockup = pv(page).getByTestId('lockup').locator('img.mk');
    expect(await lockup.evaluateAll((els) => els.map((e) => e.alt))).toEqual(['Acme Corp', 'Globex']);
    await go(page, '#/w/presales');
    await pv(page).locator('[data-testid^="process-card-"]').first().click();
    await expect(pv(page).getByTestId('swimlane')).toBeVisible();
    const names = await pv(page).locator('.lane-heads .band .band-name').allTextContents();
    expect(names).toEqual(expect.arrayContaining(['Acme Corp', 'Globex']));
    const marks = pv(page).locator('.band-marks img.mk');
    expect(await marks.evaluateAll((els) => els.map((e) => e.getAttribute('src')))).toEqual(expect.arrayContaining([markUri(SAMPLE_SHEET_DIR, 'acme'), markUri(SAMPLE_SHEET_DIR, 'globex')]));
  });
});
