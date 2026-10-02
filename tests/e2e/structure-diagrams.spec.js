// Change add-structure-diagrams, Test tasks 2.1 to 2.64, on dist/operating-model-explorer.html via file:// (author mode)
// and on snapshots exported through the real Export button (viewer mode).
// Fixtures (fictional names only): tests/fixtures/structure-org (three parties, three diagrams, the main one listed
// last, a removed box, two personas) and tests/fixtures/structure-wide (six party columns), plus the Acme sample.
//
// Scenarios covered elsewhere (the modified scenario's WHEN/THEN is unchanged and already asserted there):
//   2.35 = content-schema.spec.js "2.1 content-schema › Minimal valid model"
//   2.36 = content-schema.spec.js "2.2 content-schema › Missing model file"
//   2.39 = content-schema.spec.js "2.7 content-schema › Missing required field"
//   2.40 = content-schema.spec.js "2.8 content-schema › Duplicate id"
//   2.42 = content-schema.spec.js "2.9 content-schema › Unknown owner"
//   2.44 = capture-sheet-authoring.spec.js "2.1 capture-sheet › Acme capture sheet loads cleanly"
//   2.45 = capture-sheet-authoring.spec.js "2.2 capture-sheet › Missing required section"
//   2.47 = capture-sheet-authoring.spec.js "2.3 capture-sheet › Missing required column"
//   2.48 = capture-sheet-authoring.spec.js "2.4 capture-sheet › Columns in a different order"
//   2.57 = explorer-views.spec.js "2.25 explorer-views › Outline workstream"
//   2.59 = explorer-views.spec.js "2.30 explorer-views › Role across processes"
//   2.61 = explorer-views.spec.js "2.33 explorer-views › Find a step"
//   2.63 = theming.spec.js "2.19 theming › Rename workstream", plus "2.63 … (diagram pages)" below
//   2.54 = tests/unit/sheet.test.js "2.54 sample parity …" (Node)
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { test, expect, openEngine, loadZip, trySample, skipPrompt, messages, go, variant, fixtureDir, useSnapshot, openSnapshot, noHorizontalScroll } from './helpers.js';

const pv = (page) => page.getByTestId('preview');
const counts = (page) => page.getByTestId('report-counts');
const msg = (page, hasText) => messages(page).filter({ hasText });
const diagram = (page) => page.getByTestId('structure-diagram');
const cell = (page, band, party) => page.getByTestId(`structure-cell-${band}-${party}`);
const boxes = (page) => diagram(page).getByTestId('structure-box');
const lines = (page) => diagram(page).getByTestId('structure-line');

// Geometry of the line overlay, in page coordinates: every drawn line (and anything else in the overlay that could be an
// arrowhead), and every cell's rectangle.
async function overlay(page) {
  return diagram(page).evaluate((root) => {
    const svg = root.querySelector('svg.sd-lines');
    const o = svg.getBoundingClientRect();
    const rect = (el) => {
      const r = el.getBoundingClientRect();
      return { l: r.left, t: r.top, r: r.right, b: r.bottom };
    };
    const cells = Object.fromEntries([...root.querySelectorAll('.sd-cell')].map((c) => [`${c.dataset.band}/${c.dataset.col}`, rect(c)]));
    const lines = [...svg.querySelectorAll('line')].map((l) => ({
      x1: o.left + +l.getAttribute('x1'), y1: o.top + +l.getAttribute('y1'), x2: o.left + +l.getAttribute('x2'), y2: o.top + +l.getAttribute('y2'),
      markers: ['marker-start', 'marker-mid', 'marker-end'].map((a) => l.getAttribute(a)).filter(Boolean),
      css: [getComputedStyle(l).markerStart, getComputedStyle(l).markerEnd],
    }));
    const extra = [...svg.querySelectorAll('marker, polygon, path, polyline')].length;
    const labels = [...root.querySelectorAll('[data-testid="structure-line-label"]')].map((e) => ({ text: e.textContent, ...rect(e), visible: e.checkVisibility() }));
    return { cells, lines, extra, labels, ariaHidden: svg.getAttribute('aria-hidden') };
  });
}
// A point is on a cell's edge: inside the rectangle (with 1.5px slack) and within 1.5px of one of its sides.
const TOL = 1.5;
const onEdge = (x, y, c) => x >= c.l - TOL && x <= c.r + TOL && y >= c.t - TOL && y <= c.b + TOL && Math.min(Math.abs(x - c.l), Math.abs(x - c.r), Math.abs(y - c.t), Math.abs(y - c.b)) <= TOL;
// The line joining two cells (in either order), or undefined.
const joining = (g, a, b) => g.lines.find((l) => (onEdge(l.x1, l.y1, g.cells[a]) && onEdge(l.x2, l.y2, g.cells[b])) || (onEdge(l.x1, l.y1, g.cells[b]) && onEdge(l.x2, l.y2, g.cells[a])));
function plain(g) {
  expect(g.extra, 'no markers, arrowhead paths or polygons in the overlay').toBe(0);
  for (const l of g.lines) {
    expect(l.markers, 'no marker attributes on a line').toEqual([]);
    expect(l.css, 'no CSS markers on a line').toEqual(['none', 'none']);
  }
}

// ---------------------------------------------------------------------------------------------------------------
test.describe('structure-diagrams (author mode)', () => {
  test.beforeEach(async ({ page }) => openEngine(page));

  test('2.1 structure-diagrams › Diagram with author\'s own vocabulary', async ({ page }) => {
    await loadZip(page, 'structure-org');
    await expect(counts(page)).toHaveText('0 errors, 0 warnings');
    await skipPrompt(page);
    await go(page, '#/d/regions');
    await expect(pv(page).locator('main h1')).toHaveText('Regional market');
    await expect(pv(page).getByTestId('structure-kind')).toHaveText('Local market');
    await expect(pv(page).locator('.sd-band')).toHaveText(['Strategic', 'Tactical', 'Operational']);
    const ys = await pv(page).locator('.sd-band').evaluateAll((els) => els.map((e) => e.getBoundingClientRect().top));
    expect(ys[0]).toBeLessThan(ys[1]);
    expect(ys[1]).toBeLessThan(ys[2]);
  });

  test('2.2 structure-diagrams › Missing bands', async ({ page }) => {
    await loadZip(page, variant('structure-org', 'no-bands', { 'structures/02-regions.md': (t) => t.replace(/bands:[\s\S]*?(?=boxes:)/, '') }));
    const m = msg(page, '"bands"');
    await expect(m).toHaveCount(1);
    await expect(m).toHaveAttribute('data-level', 'error');
    await expect(m.locator('.msg-where')).toContainText('structures/02-regions.md');
    await expect(m.locator('.msg-where')).toContainText('regions');
    await expect(m.locator('.msg-problem')).toContainText('missing');
  });

  test('2.3 structure-diagrams › Sub-bands drawn inside their band', async ({ page }) => {
    await loadZip(page, 'structure-org');
    await skipPrompt(page);
    await go(page, '#/d/programme');
    const parent = pv(page).getByTestId('structure-band-programme-management');
    const harbour = pv(page).getByTestId('structure-band-harbour');
    const summit = pv(page).getByTestId('structure-band-summit');
    await expect(parent).toHaveText('Programme management');
    await expect(harbour).toHaveText('Harbour');
    await expect(summit).toHaveText('Summit');
    const [p, h, s] = await Promise.all([parent, harbour, summit].map((l) => l.boundingBox()));
    expect(h.y + h.height, 'Harbour above Summit').toBeLessThanOrEqual(s.y + 1);
    // One row containing both sub-rows: the parent label spans from Harbour's top to Summit's bottom, beside them.
    expect(p.y).toBeLessThanOrEqual(h.y + 1);
    expect(p.y + p.height).toBeGreaterThanOrEqual(s.y + s.height - 1);
    expect(p.x + p.width).toBeLessThanOrEqual(h.x + 1);
    // The sub-rows' cells sit in the sub-rows.
    const [hc, sc] = await Promise.all([cell(page, 'harbour', 'acme'), cell(page, 'summit', 'acme')].map((l) => l.boundingBox()));
    expect(hc.y).toBeLessThan(sc.y);
    expect(hc.y).toBeGreaterThanOrEqual(p.y - 1);
    expect(sc.y + sc.height).toBeLessThanOrEqual(p.y + p.height + 1);
  });

  test('2.4 structure-diagrams › Nesting too deep', async ({ page }) => {
    await loadZip(page, variant('structure-org', 'too-deep', { 'structures/01-programme.md': (t) => t.replace('{ id: summit, name: Summit }', '{ id: summit, name: Summit, bands: [{ id: deeper, name: Deeper }] }') }));
    const m = msg(page, 'nested only one level deep');
    await expect(m).toHaveCount(1);
    await expect(m).toHaveAttribute('data-level', 'error');
    await expect(m.locator('.msg-where')).toContainText('programme');
    await expect(m.locator('.msg-problem')).toContainText('"Summit"');
  });

  test('2.5 structure-diagrams › Box in a band with sub-bands', async ({ page }) => {
    await loadZip(page, variant('structure-org', 'box-in-parent', { 'structures/01-programme.md': (t) => t.replace('{ band: summit, role: solution-architect }', '{ band: programme-management, role: solution-architect }') }));
    const m = msg(page, 'which has sub-bands');
    await expect(m).toHaveCount(1);
    await expect(m).toHaveAttribute('data-level', 'error');
    await expect(m.locator('.msg-problem')).toContainText('"Programme management"');
    await expect(m.locator('.msg-fix')).toContainText(/Harbour or Summit/);
  });

  test('2.6 structure-diagrams › Duplicate band id', async ({ page }) => {
    await loadZip(page, variant('structure-org', 'dup-band', { 'structures/02-regions.md': (t) => t.replace('{ id: tactical, name: Tactical }', '{ id: strategic, name: Tactical }') }));
    const m = msg(page, 'Two bands');
    await expect(m).toHaveCount(1);
    await expect(m).toHaveAttribute('data-level', 'error');
    await expect(m.locator('.msg-where')).toContainText('regions');
    await expect(m.locator('.msg-problem')).toContainText('"strategic"');
  });

  test('2.9 structure-diagrams › Box names both a role and a team', async ({ page }) => {
    await loadZip(page, variant('structure-org', 'role-and-team', { 'structures/03-market.md': (t) => t.replace('{ band: delivery, team: globex-solutions }', '{ band: delivery, role: delivery-lead, team: globex-solutions }') }));
    const m = msg(page, 'names both a role and a team');
    await expect(m).toHaveCount(1);
    await expect(m).toHaveAttribute('data-level', 'error');
    await expect(m.locator('.msg-where')).toContainText('market');
    await expect(m.locator('.msg-problem')).toContainText('band "Delivery"');
  });

  test('2.10 structure-diagrams › Same role in two bands', async ({ page }) => {
    await loadZip(page, 'structure-org');
    await expect(counts(page)).toHaveText('0 errors, 0 warnings');
    await skipPrompt(page);
    await go(page, '#/d/programme');
    const h = cell(page, 'harbour', 'acme').getByTestId('structure-box');
    const s = cell(page, 'summit', 'acme').getByTestId('structure-box');
    await expect(h).toHaveCount(1);
    await expect(s).toHaveCount(1);
    await expect(h.locator('.sd-box-title')).toHaveText('Account lead');
    await expect(s.locator('.sd-box-title')).toHaveText('Account lead');
    await expect(h.locator('.sd-box-name')).toHaveText('Sam Example');
    await expect(s.locator('.sd-box-name')).toHaveText('Quinn Lighthouse');
  });

  test('2.14 structure-diagrams › Line to the same cell', async ({ page }) => {
    await loadZip(page, variant('structure-org', 'same-cell', { 'structures/03-market.md': (t) => t.replace('lines:\n', 'lines:\n  - { from: { band: delivery, party: globex }, to: { band: delivery, party: globex } }\n') }));
    const m = msg(page, 'to itself');
    await expect(m).toHaveCount(1);
    await expect(m).toHaveAttribute('data-level', 'error');
    await expect(m.locator('.msg-where')).toContainText('market');
    await expect(m.locator('.msg-problem')).toContainText('(Delivery, Globex)');
  });

  test('2.15 structure-diagrams › Unknown role in a box', async ({ page }) => {
    await loadZip(page, variant('structure-org', 'unknown-role', { 'structures/03-market.md': (t) => t.replace('role: account-lead, name: Sam Example', 'role: acount-lead, name: Sam Example') }));
    const m = msg(page, 'acount-lead');
    await expect(m).toHaveCount(1);
    await expect(m).toHaveAttribute('data-level', 'error');
    await expect(m.locator('.msg-where')).toContainText('market');
    await expect(m.locator('.msg-fix')).toContainText('Did you mean account-lead?');
  });

  test('2.16 structure-diagrams › Unknown related structure', async ({ page }) => {
    // The spec's example ids (harbor/harbour) applied to this fixture: programm / programme.
    await loadZip(page, variant('structure-org', 'unknown-related', { 'structures/03-market.md': (t) => t.replace('related: [programme]', 'related: [programm]') }));
    const m = msg(page, 'programm');
    await expect(m).toHaveCount(1);
    await expect(m).toHaveAttribute('data-level', 'error');
    await expect(m.locator('.msg-problem')).toContainText('related structure "programm"');
    await expect(m.locator('.msg-fix')).toContainText('Did you mean programme?');
  });

  test('2.17 structure-diagrams › No main diagram', async ({ page }) => {
    await loadZip(page, variant('structure-org', 'no-main', { 'structures/02-regions.md': null, 'structures/03-market.md': (t) => t.replace('main: true\n', '') }));
    const m = msg(page, 'main diagram');
    await expect(m).toHaveCount(1);
    await expect(m).toHaveAttribute('data-level', 'error');
    await expect(m.locator('.msg-problem')).toContainText('One structure must be the main diagram');
    await expect(m.locator('.msg-problem')).toContainText('Coastal programme');
    await expect(m.locator('.msg-problem')).toContainText('Harbourside partnership');
    await expect(page.getByTestId('export')).toBeDisabled();
  });

  test('2.18 structure-diagrams › Two main diagrams', async ({ page }) => {
    await loadZip(page, variant('structure-org', 'two-main', { 'structures/01-programme.md': (t) => t.replace('kind: Sub-programme\n', 'kind: Sub-programme\nmain: true\n') }));
    const m = msg(page, 'main diagram');
    await expect(m).toHaveCount(1);
    await expect(m).toHaveAttribute('data-level', 'error');
    await expect(m.locator('.msg-problem')).toContainText('More than one');
    await expect(m.locator('.msg-problem')).toContainText('Coastal programme');
    await expect(m.locator('.msg-problem')).toContainText('Harbourside partnership');
    await expect(m.locator('.msg-problem')).not.toContainText('Regional market');
  });

  test('2.19 structure-diagrams › Model without diagrams', async ({ page }) => {
    await loadZip(page, variant('structure-org', 'no-diagrams', { 'structures/01-programme.md': null, 'structures/02-regions.md': null, 'structures/03-market.md': null }));
    await expect(counts(page)).toHaveText('0 errors, 0 warnings');
    await expect(msg(page, /main diagram|main structure/i)).toHaveCount(0);
    await skipPrompt(page);
    await expect(pv(page).getByTestId('structure-list')).toHaveCount(0);
  });

  test('2.34 structure-diagrams › Sample diagrams load', async ({ page }) => {
    await trySample(page);
    await expect(page.locator('[data-testid="report-message"][data-level="error"]')).toHaveCount(0);
    await expect(counts(page)).toContainText('0 errors');
    await skipPrompt(page);
    await pv(page).getByTestId('structure-card-acme-globex-partnership').click();
    await expect(pv(page).locator('main h1')).toHaveText('Acme + Globex partnership');
    // Sub-bands
    await expect(pv(page).locator('.sd-band.sd-sub')).toHaveText([/^Harbour account/, /^Summit account$/]);
    // A team box (lists its roles)
    await expect(pv(page).locator('[data-testid="structure-box"]:has(.sd-roles)').first()).toBeVisible();
    // A labelled line
    await expect(pv(page).getByTestId('structure-line').first()).toBeAttached();
    await expect(pv(page).getByTestId('structure-line-label').filter({ hasText: 'Joint steering' })).toBeVisible();
    // A band link that opens the related diagram
    const open = pv(page).getByTestId('band-open-harbour-account');
    await expect(open).toHaveAttribute('href', /#\/d\/harbour-account/);
    await open.click();
    await expect(pv(page).locator('main h1')).toHaveText('Harbour account');
  });

  test('2.37 content-schema › Structure found by type, not folder', async ({ page }) => {
    const src = readFileSync(join(fixtureDir('structure-org'), 'structures', '01-programme.md'), 'utf8');
    await loadZip(page, variant('structure-org', 'structure-in-roles', { 'structures/01-programme.md': null, 'roles/programme.md': src }));
    await expect(counts(page)).toHaveText('0 errors, 0 warnings');
    await expect(msg(page, 'programme')).toHaveCount(0);
    await skipPrompt(page);
    await go(page, '#/d/programme');
    await expect(pv(page).locator('main h1')).toHaveText('Coastal programme');
    await expect(pv(page).locator('main .eyebrow').first()).toHaveText('Structure');
  });

  test('2.38 content-schema › Sample exercises every type', async ({ page }) => {
    // The other types and the decision step are asserted by content-schema.spec.js "2.6 … Sample exercises every type".
    await trySample(page);
    await expect(counts(page)).toContainText('0 errors');
    await skipPrompt(page);
    await expect(pv(page).locator('[data-testid^="structure-card-"]')).toHaveCount(2);
    await expect(pv(page).locator('[data-testid^="party-card-"]')).toHaveCount(2);
    await expect(pv(page).locator('[data-testid^="workstream-card-"]')).toHaveCount(2);
    await go(page, '#/p/qualify-opportunity');
    await expect(pv(page).locator('svg.swimlane path.edge[data-from="go-no-go"]')).toHaveCount(2);
    await expect(pv(page).locator('.edge-label', { hasText: /^Go$/ })).toHaveCount(1);
    await expect(pv(page).locator('.edge-label', { hasText: /^No go$/ })).toHaveCount(1);
  });

  test('2.41 content-schema › Structure and workstream cannot share an id', async ({ page }) => {
    await loadZip(page, variant('structure-org', 'shared-id', { 'structures/02-regions.md': (t) => t.replace('id: regions', 'id: presales') }));
    const m = msg(page, 'The id "presales" is also used by');
    await expect(m).toHaveCount(1);
    await expect(m).toHaveAttribute('data-level', 'error');
    await expect(m).toContainText('structures/02-regions.md');
    await expect(m).toContainText('workstreams/presales.md');
  });

  test('2.43 content-schema › Unknown party on a line', async ({ page }) => {
    await loadZip(page, variant('structure-org', 'unknown-line-party', { 'structures/03-market.md': (t) => t.replace('to: { band: leadership, party: globex }', 'to: { band: leadership, party: globx }') }));
    const m = msg(page, 'globx');
    await expect(m).toHaveCount(1);
    await expect(m).toHaveAttribute('data-level', 'error');
    await expect(m.locator('.msg-where')).toContainText('structures/03-market.md');
    await expect(m.locator('.msg-fix')).toContainText('Did you mean globex?');
  });

  test('2.64 theming › Rename structure', async ({ page }) => {
    await loadZip(page, variant('acme-sample', 'org-model-labels', { 'theme.md': (t) => t.replace('labels:\n', 'labels:\n  structure: Org model\n  structures: Org models\n') }));
    await expect(counts(page)).toHaveText('0 errors, 0 warnings');
    await skipPrompt(page);
    const texts = [];
    const grab = async () => {
      await expect(pv(page).locator('main h1')).toBeVisible();
      texts.push(await pv(page).innerText());
    };
    // Overview list
    await expect(pv(page).locator('#om-st-h')).toHaveText('Org models');
    await expect(pv(page).getByTestId('main-structure')).toHaveText('Main org model');
    await grab();
    // Diagram heading and Related panel
    await pv(page).getByTestId('structure-card-acme-globex-partnership').click();
    await expect(pv(page).locator('main .eyebrow').first()).toHaveText('Org model');
    await expect(pv(page).getByTestId('structure-related').locator('h3').first()).toHaveText('Org models');
    await grab();
    await go(page, '#/d/harbour-account');
    await expect(pv(page).getByTestId('structure-related').locator('h3').first()).toHaveText('Org models');
    await grab();
    // Search results
    await go(page, '#/search?q=Harbour');
    await expect(pv(page).getByTestId('search-group-structure').locator('h2')).toContainText('Org models');
    await grab();
    await go(page, '#/search?q=Sam%20Example');
    await expect(pv(page).getByTestId('search-group-structure').locator('h2')).toContainText('Org models');
    await grab();
    // Role profile and workstream page
    await go(page, '#/r/account-lead');
    await expect(pv(page).getByTestId('role-structures').locator('h2')).toContainText('Org models');
    await grab();
    await go(page, '#/w/presales');
    await expect(pv(page).getByTestId('workstream-structures').locator('h2')).toContainText('org models');
    await grab();
    for (const t of texts) expect(t).not.toMatch(/structure/i);
    const attrs = await pv(page).locator('[aria-label], [title]').evaluateAll((els) => els.map((e) => `${e.getAttribute('aria-label') || ''} ${e.getAttribute('title') || ''}`).join(' | '));
    expect(attrs).not.toMatch(/structure/i);
  });
});

// ---------------------------------------------------------------------------------------------------------------
// capture-sheet scenarios for Structure sections, on the single-file "Load capture sheet" path.
const SHEET = readFileSync(join(fixtureDir('sheet-tiny'), 'capture-sheet.md'), 'utf8');
const TEAMS = '## Teams\n\n| Team | Party |\n|---|---|\n| Globex Solutions | Globex |\n';
const STRUCTURE = `## Structure: Partnership

Kind: Partnership
Main: yes
Workstreams: Presales

### Bands

| Band | Inside | Opens |
|---|---|---|
| Leadership | | |
| Delivery | Leadership | |

### Boxes

| Band | Role | Team | Name | Note |
|---|---|---|---|---|
| Delivery | Account lead | | Sam Example | Grade: Director |
| Delivery | Solution architect | | | |
| Delivery | | Globex Solutions | | |

### Lines

| From band | From party | To band | To party | Label |
|---|---|---|---|---|
| Delivery | Acme Corp | Delivery | Globex | Joint steering |
`;
const sheetWith = (structure = STRUCTURE) => `${SHEET.trimEnd()}\n\n${TEAMS}\n${structure}`;
const edit = (src, from, to) => {
  expect(src.includes(from), `text contains ${JSON.stringify(from)}`).toBe(true);
  return src.replace(from, to);
};
async function loadSheet(page, text) {
  const chooser = page.waitForEvent('filechooser');
  await page.getByRole('button', { name: 'Load capture sheet' }).click();
  await (await chooser).setFiles({ name: 'capture-sheet.md', mimeType: 'text/markdown', buffer: Buffer.from(text) });
  await expect(page.getByTestId('report')).toBeVisible();
}

test.describe('capture-sheet structure sections (author mode)', () => {
  test.beforeEach(async ({ page }) => openEngine(page));

  test('2.46 capture-sheet › Structure section recognised', async ({ page }) => {
    await loadSheet(page, sheetWith());
    await expect(counts(page)).toHaveText('0 errors, 0 warnings');
    await expect(msg(page, /unknown|not a recognised|section/i)).toHaveCount(0);
    await skipPrompt(page);
    const card = pv(page).getByTestId('structure-card-partnership');
    await expect(card.locator('h3')).toHaveText('Partnership');
    await card.click();
    await expect(pv(page).locator('main h1')).toHaveText('Partnership');
  });

  test('2.49 capture-sheet › Lines table missing a column', async ({ page }) => {
    let s = edit(STRUCTURE, '| From band | From party | To band | To party | Label |\n|---|---|---|---|---|', '| From band | From party | To band | Label |\n|---|---|---|---|');
    s = edit(s, '| Delivery | Acme Corp | Delivery | Globex | Joint steering |', '| Delivery | Acme Corp | Delivery | Joint steering |');
    await loadSheet(page, sheetWith(s));
    const m = msg(page, 'To party');
    await expect(m).toHaveCount(1);
    await expect(m).toHaveAttribute('data-level', 'error');
    await expect(m.locator('.msg-where')).toHaveText('Structure: Partnership › Lines');
    await expect(m.locator('.msg-problem')).toHaveText('The Lines table has no "To party" column.');
  });

  test('2.50 capture-sheet › Structure written in a sheet', async ({ page }) => {
    await loadSheet(page, sheetWith());
    await expect(counts(page)).toHaveText('0 errors, 0 warnings');
    await skipPrompt(page);
    await go(page, '#/d/partnership');
    // The sub-band inside its band
    const parent = pv(page).getByTestId('structure-band-leadership');
    const sub = pv(page).getByTestId('structure-band-delivery');
    await expect(parent).toHaveText('Leadership');
    await expect(sub).toHaveText('Delivery');
    await expect(sub).toHaveClass(/sd-sub/);
    const [p, s] = await Promise.all([parent.boundingBox(), sub.boundingBox()]);
    expect(p.y).toBeLessThanOrEqual(s.y + 1);
    expect(p.y + p.height).toBeGreaterThanOrEqual(s.y + s.height - 1);
    // The three boxes in their party columns
    await expect(pv(page).getByTestId('structure-column')).toHaveText([/Acme Corp$/, /Globex$/]);
    await expect(cell(page, 'delivery', 'acme-corp').getByTestId('structure-box')).toHaveCount(1);
    await expect(cell(page, 'delivery', 'acme-corp').getByTestId('structure-box')).toContainText('Account lead');
    await expect(cell(page, 'delivery', 'globex').getByTestId('structure-box')).toHaveCount(2);
    await expect(cell(page, 'delivery', 'globex').getByTestId('structure-box').locator('.sd-box-title')).toHaveText(['Solution architect', 'Globex Solutions']);
    // The labelled line, joining the two cells
    await expect(lines(page)).toHaveCount(1);
    await expect(pv(page).getByTestId('structure-line-label')).toHaveText('Joint steering');
    const g = await overlay(page);
    expect(joining(g, 'delivery/acme-corp', 'delivery/globex'), JSON.stringify(g)).toBeTruthy();
    plain(g);
  });

  test('2.51 capture-sheet › Unknown band name in a box', async ({ page }) => {
    await loadSheet(page, sheetWith(edit(STRUCTURE, '| Delivery | Account lead |', '| Deliver | Account lead |')));
    const m = msg(page, 'Deliver');
    await expect(m).toHaveCount(1);
    await expect(m).toHaveAttribute('data-level', 'error');
    await expect(m.locator('.msg-where')).toContainText('Structure: Partnership');
    await expect(m.locator('.msg-where')).toContainText('Boxes');
    await expect(m.locator('.msg-where')).toContainText('row 1');
    await expect(m.locator('.msg-fix')).toContainText('Did you mean Delivery?');
  });

  test('2.52 capture-sheet › Role and team both filled', async ({ page }) => {
    await loadSheet(page, sheetWith(edit(STRUCTURE, '| Delivery | | Globex Solutions |', '| Delivery | Account lead | Globex Solutions |')));
    const m = messages(page).filter({ has: page.locator('.msg-where', { hasText: 'row 3' }) });
    await expect(m).toHaveCount(1);
    await expect(m).toHaveAttribute('data-level', 'error');
    await expect(m.locator('.msg-where')).toContainText('Structure: Partnership');
    await expect(m.locator('.msg-where')).toContainText('Boxes');
    await expect(m.locator('.msg-fix')).toContainText(/only one/);
  });

  test('2.53 capture-sheet › Missing Bands subsection', async ({ page }) => {
    await loadSheet(page, sheetWith(STRUCTURE.replace(/### Bands[\s\S]*?(?=### Boxes)/, '')));
    const m = msg(page, '### Bands');
    await expect(m).toHaveCount(1);
    await expect(m).toHaveAttribute('data-level', 'error');
    await expect(m.locator('.msg-where')).toHaveText('Structure: Partnership');
  });
});

// ---------------------------------------------------------------------------------------------------------------
test.describe('structure-diagrams (exported fixture)', () => {
  const snap = useSnapshot('structure-org');

  test('2.7 structure-diagrams › Box content', async ({ page }) => {
    await openSnapshot(page, snap, '#/d/market');
    const box = cell(page, 'leadership', 'acme').getByTestId('structure-box').first();
    await expect(box.locator('.sd-box-title')).toHaveText('Account lead');
    await expect(box.locator('.sd-box-name')).toHaveText('Sam Example');
    await expect(box.locator('.sd-box-note')).toHaveText('Grade: Director');
    // In the role's party column: under the Acme Corp header.
    const head = diagram(page).getByTestId('structure-column').filter({ hasText: 'Acme Corp' });
    const [h, b] = await Promise.all([head.boundingBox(), box.boundingBox()]);
    expect(b.x).toBeGreaterThanOrEqual(h.x - 1);
    expect(b.x + b.width).toBeLessThanOrEqual(h.x + h.width + 1);
  });

  test('2.8 structure-diagrams › Team box lists its roles', async ({ page }) => {
    await openSnapshot(page, snap, '#/d/market');
    const box = cell(page, 'delivery', 'globex').getByTestId('structure-box');
    await expect(box).toHaveCount(1);
    await expect(box.locator('.sd-box-title')).toHaveText('Globex Solutions');
    await expect(box.locator('.sd-roles li')).toHaveCount(2);
    expect((await box.locator('.sd-roles li').allTextContents()).sort()).toEqual(['Pricing analyst', 'Solution architect']);
  });

  test('2.11 structure-diagrams › Unused party has no column', async ({ page }) => {
    await openSnapshot(page, snap, '#/d/market');
    await expect(diagram(page).getByTestId('structure-column')).toHaveText([/Acme Corp$/, /Globex$/]);
    await expect(diagram(page).locator('[data-col="initech"]')).toHaveCount(0);
  });

  test('2.12 structure-diagrams › Line across parties', async ({ page }) => {
    await openSnapshot(page, snap, '#/d/market');
    await expect(lines(page)).toHaveCount(2);
    const g = await overlay(page);
    plain(g);
    expect(g.ariaHidden).toBe('true');
    const l = joining(g, 'leadership/acme', 'leadership/globex');
    expect(l, `a line joins (Leadership, Acme) and (Leadership, Globex): ${JSON.stringify(g)}`).toBeTruthy();
    expect(Math.abs(l.y1 - l.y2), 'horizontal').toBeLessThanOrEqual(1);
    const label = g.labels.find((x) => x.text === 'Joint steering');
    expect(label && label.visible, '"Joint steering" is shown').toBe(true);
    // Shown with the line: the label sits over the line's midpoint.
    const [mx, my] = [(l.x1 + l.x2) / 2, (l.y1 + l.y2) / 2];
    expect(mx >= label.l - 2 && mx <= label.r + 2 && my >= label.t - 2 && my <= label.b + 2, `label ${JSON.stringify(label)} at midpoint ${mx},${my}`).toBe(true);
  });

  test('2.13 structure-diagrams › Line down a column', async ({ page }) => {
    await openSnapshot(page, snap, '#/d/market');
    await expect(lines(page)).toHaveCount(2);
    const g = await overlay(page);
    plain(g);
    const l = joining(g, 'leadership/acme', 'delivery/acme');
    expect(l, `a line joins (Leadership, Acme) and (Delivery, Acme): ${JSON.stringify(g)}`).toBeTruthy();
    expect(Math.abs(l.x1 - l.x2), 'vertical').toBeLessThanOrEqual(1);
  });

  test('2.20 structure-diagrams › Relation shown from both sides', async ({ page }) => {
    // market lists programme in related; programme lists nothing.
    await openSnapshot(page, snap, '#/d/market');
    await page.getByTestId('structure-related').getByRole('link', { name: 'Coastal programme' }).click();
    await expect(page.locator('main h1')).toHaveText('Coastal programme');
    await page.getByTestId('structure-related').getByRole('link', { name: 'Harbourside partnership' }).click();
    await expect(page.locator('main h1')).toHaveText('Harbourside partnership');
  });

  test('2.22 structure-diagrams › Related workstream', async ({ page }) => {
    await openSnapshot(page, snap, '#/d/market');
    const link = page.getByTestId('structure-related').getByRole('link', { name: 'Presales' });
    await expect(link).toHaveAttribute('href', /#\/w\/presales/);
    await link.click();
    await expect(page.locator('main h1')).toHaveText('Presales');
  });

  test('2.23 structure-diagrams › Deep link to a diagram', { tag: '@mobile' }, async ({ page, context }) => {
    await openSnapshot(page, snap);
    await skipPrompt(page);
    await page.getByTestId('structure-card-market').click();
    await expect(page.locator('main h1')).toHaveText('Harbourside partnership');
    const url = page.url();
    expect(url).toContain('#/d/market');
    const tab = await context.newPage();
    await tab.goto(url);
    await expect(tab.locator('main h1')).toHaveText('Harbourside partnership');
    await expect(tab.getByTestId('structure-diagram')).toBeVisible();
    await expect(tab.getByTestId('breadcrumb').locator('li')).toHaveText(['Harbourside demo', 'Harbourside partnership']);
  });

  test('2.25 structure-diagrams › Role box opens the role', { tag: '@mobile' }, async ({ page }) => {
    await openSnapshot(page, snap, '#/d/market');
    await cell(page, 'leadership', 'acme').getByTestId('structure-box').first().click();
    await expect(page.locator('main h1')).toHaveText('Account lead');
    await expect(page).toHaveURL(/#\/r\/account-lead/);
    // And a team box opens the team's page.
    await openSnapshot(page, snap, '#/d/market');
    await cell(page, 'delivery', 'globex').getByTestId('structure-box').click();
    await expect(page.locator('main h1')).toHaveText('Globex Solutions');
  });

  test('2.26 structure-diagrams › Your role marked', { tag: '@mobile' }, async ({ page }) => {
    await openSnapshot(page, snap, '#/d/market?persona=lead-view');
    const mine = cell(page, 'leadership', 'acme').getByTestId('structure-box').first();
    await expect(mine).toContainText('Your role');
    await expect(boxes(page).filter({ hasText: 'Your role' })).toHaveCount(1);
    // Every other box is still shown and can be opened.
    const n = await boxes(page).count();
    expect(n).toBe(5);
    for (let i = 0; i < n; i++) {
      await expect(boxes(page).nth(i)).toBeVisible();
      await expect(boxes(page).nth(i)).toHaveAttribute('href', /#\/(r|e)\//);
    }
    await cell(page, 'leadership', 'globex').getByTestId('structure-box').click();
    await expect(page.locator('main h1')).toHaveText('Partner manager');
    // A team box is marked for a persona whose role is in that team.
    await openSnapshot(page, snap, '#/d/market?persona=pricing-view');
    await expect(boxes(page).filter({ hasText: 'Your role' })).toHaveCount(1);
    await expect(cell(page, 'delivery', 'globex').getByTestId('structure-box')).toContainText('Your role');
  });

  test('2.27 structure-diagrams › Nothing hidden', async ({ page }) => {
    const seen = [];
    for (const q of ['', '?persona=lead-view', '?persona=pricing-view']) {
      await openSnapshot(page, snap, `#/d/market${q}`);
      await expect(lines(page).first()).toBeAttached();
      seen.push([await boxes(page).count(), await lines(page).count(), await page.getByTestId('structure-line-label').count()]);
    }
    expect(seen).toEqual([[5, 2, 1], [5, 2, 1], [5, 2, 1]]);
  });

  test('2.28 structure-diagrams › Removed box hidden by default', { tag: '@mobile' }, async ({ page }) => {
    await openSnapshot(page, snap, '#/d/market');
    await expect(page.locator('#om-changes')).not.toBeChecked();
    await expect(boxes(page)).toHaveCount(5);
    await expect(cell(page, 'operations', 'globex').getByTestId('structure-box')).toHaveCount(0);
    await expect(diagram(page)).not.toContainText('The partner manager ran operations.');
  });

  test('2.29 structure-diagrams › Removed box with markers on', { tag: '@mobile' }, async ({ page }) => {
    await openSnapshot(page, snap, '#/d/market');
    await page.getByTestId('change-toggle').click();
    await expect(page.locator('#om-changes')).toBeChecked();
    await expect(boxes(page)).toHaveCount(6);
    const removed = cell(page, 'operations', 'globex').getByTestId('structure-box');
    await expect(removed).toHaveCount(1);
    await expect(removed.locator('.sd-box-title')).toHaveText('Partner manager');
    await expect(removed.getByTestId('badge')).toHaveText('Removed');
    await expect(removed.getByTestId('today')).toContainText('Today');
    await expect(removed.getByTestId('today')).toContainText('The partner manager ran operations.');
    await expect(removed).toBeVisible();
  });

  test('2.30 structure-diagrams › Tab through a diagram', async ({ page }) => {
    await openSnapshot(page, snap, '#/d/market');
    await page.locator('main h1').focus();
    const order = [];
    for (let i = 0; i < 40; i++) {
      await page.keyboard.press('Tab');
      const f = await page.evaluate(() => {
        const a = document.activeElement;
        if (!a || !a.closest('.sd')) return { inside: false };
        const cs = getComputedStyle(a);
        const ring = (cs.outlineStyle !== 'none' && parseFloat(cs.outlineWidth) > 0) || (cs.boxShadow && cs.boxShadow !== 'none');
        return { inside: true, box: a.dataset.box ?? null, cell: a.closest('.sd-cell') && a.closest('.sd-cell').dataset.testid, ring, visible: a.matches(':focus-visible') };
      });
      if (f.inside) order.push(f);
      else if (order.length) break;
    }
    expect(order.map((f) => f.cell)).toEqual([
      'structure-cell-leadership-acme', 'structure-cell-leadership-globex', 'structure-cell-delivery-acme', 'structure-cell-delivery-globex', 'structure-cell-operations-acme',
    ]);
    for (const f of order) {
      expect(f.ring, `focus ring on ${f.cell}`).toBe(true);
      expect(f.visible).toBe(true);
    }
    // Enter on a role box opens its profile.
    await page.locator('main h1').focus();
    for (let i = 0; i < 40; i++) {
      await page.keyboard.press('Tab');
      if (await page.evaluate(() => document.activeElement && document.activeElement.dataset.testid === 'structure-box')) break;
    }
    await page.keyboard.press('Enter');
    await expect(page.locator('main h1')).toHaveText('Account lead');
  });

  test('2.31 structure-diagrams › Lines described as text', async ({ page }) => {
    await openSnapshot(page, snap, '#/d/market');
    const c = cell(page, 'leadership', 'acme');
    const aria = await c.ariaSnapshot();
    // The cell's band and party, and the related cell with the line's label, all exposed to assistive technology.
    expect(aria).toMatch(/heading "Acme Corp\s*, Leadership"/);
    expect(aria).toContain('Related to: Globex, Leadership: “Joint steering”');
    expect(aria).toContain('Related to: Acme Corp, Delivery');
    // And from the other end.
    expect(await cell(page, 'leadership', 'globex').ariaSnapshot()).toContain('Related to: Acme Corp, Leadership: “Joint steering”');
    // The drawn lines are hidden from assistive technology, so the text is the carrier.
    await expect(diagram(page).getByTestId('structure-lines')).toHaveAttribute('aria-hidden', 'true');
  });

  test('2.56 explorer-views › Main diagram first', async ({ page }) => {
    await openSnapshot(page, snap);
    await skipPrompt(page);
    const cards = page.getByTestId('structure-list').locator('[data-testid^="structure-card-"]');
    await expect(cards).toHaveCount(3);
    expect(await cards.evaluateAll((els) => els.map((e) => e.dataset.testid))).toEqual(['structure-card-market', 'structure-card-programme', 'structure-card-regions']);
    await expect(cards.first().getByTestId('main-structure')).toHaveText('Main structure');
    await expect(page.getByTestId('structure-list').getByTestId('main-structure')).toHaveCount(1);
    await expect(cards.nth(1)).toContainText('Sub-programme');
    await expect(cards.nth(2)).toContainText('Local market');
    for (const [id, name] of [['market', 'Harbourside partnership'], ['programme', 'Coastal programme'], ['regions', 'Regional market']]) {
      await openSnapshot(page, snap);
      await skipPrompt(page);
      await page.getByTestId(`structure-card-${id}`).click();
      await expect(page.locator('main h1')).toHaveText(name);
      await expect(page).toHaveURL(new RegExp(`#/d/${id}`));
    }
  });

  test('2.58 explorer-views › Related diagrams on a workstream', async ({ page }) => {
    await openSnapshot(page, snap, '#/w/presales');
    const link = page.getByTestId('workstream-structures').getByRole('link', { name: 'Harbourside partnership' });
    await expect(link).toBeVisible();
    await expect(page.getByTestId('workstream-structures').getByRole('link')).toHaveCount(1);
    await link.click();
    await expect(page.locator('main h1')).toHaveText('Harbourside partnership');
  });

  test('2.60 explorer-views › Role in diagrams', async ({ page }) => {
    await openSnapshot(page, snap, '#/r/account-lead');
    const links = page.getByTestId('role-structures').getByRole('link');
    await expect(links).toHaveText(['Coastal programme', 'Harbourside partnership']);
    await links.first().click();
    await expect(page.locator('main h1')).toHaveText('Coastal programme');
    await page.goBack();
    await page.getByTestId('role-structures').getByRole('link', { name: 'Harbourside partnership' }).click();
    await expect(page.locator('main h1')).toHaveText('Harbourside partnership');
  });

  test('2.62 explorer-views › Find a person on a diagram', { tag: '@mobile' }, async ({ page }) => {
    await openSnapshot(page, snap, '#/d/market');
    await page.getByTestId('search-input').fill('Quinn');
    const group = page.getByTestId('search-group-structure');
    await expect(group.getByTestId('search-result')).toHaveText(['Coastal programme']);
    await expect(group.getByTestId('search-box-match')).toContainText('Quinn Lighthouse');
    await expect(page.getByTestId('search-count')).toHaveText('1 result');
    await group.getByTestId('search-result').click();
    await expect(page.locator('main h1')).toHaveText('Coastal programme');
    await expect(page.getByTestId('structure-diagram')).toContainText('Quinn Lighthouse');
  });
});

// ---------------------------------------------------------------------------------------------------------------
test.describe('structure-diagrams (exported sample)', () => {
  const snap = useSnapshot('sample');
  const MAIN = '#/d/acme-globex-partnership';

  test('2.21 structure-diagrams › Drill down from a band', { tag: '@mobile' }, async ({ page }) => {
    await openSnapshot(page, snap, MAIN);
    await page.getByTestId('band-open-harbour-account').click();
    await expect(page.locator('main h1')).toHaveText('Harbour account');
    await expect(page.getByTestId('structure-diagram')).toBeVisible();
  });

  test('2.24 structure-diagrams › Back from a drill-down', async ({ page }) => {
    await openSnapshot(page, snap);
    await skipPrompt(page);
    await page.getByTestId('structure-card-acme-globex-partnership').click();
    await expect(page.locator('main h1')).toHaveText('Acme + Globex partnership');
    await page.getByTestId('band-open-harbour-account').click();
    await expect(page.locator('main h1')).toHaveText('Harbour account');
    await page.goBack();
    await expect(page.locator('main h1')).toHaveText('Acme + Globex partnership');
    await expect(page).toHaveURL(/#\/d\/acme-globex-partnership/);
  });

  test('2.32 structure-diagrams › Mobile diagram', { tag: '@mobile-only' }, async ({ page }) => {
    await openSnapshot(page, snap, MAIN);
    const d = diagram(page);
    await expect(d.getByTestId('structure-box').first()).toBeVisible();
    // Bands (and sub-bands) as headings, in order.
    const bands = d.locator('.sd-band');
    await expect(bands).toHaveText([/^Partnership leadership$/, /^Account management$/, /^Harbour account/, /^Summit account$/, /^Delivery$/]);
    expect(await bands.evaluateAll((els) => els.every((e) => /^H[1-6]$/.test(e.tagName) && e.checkVisibility()))).toBe(true);
    // Each band is followed by its parties' boxes (each cell headed by its party), and their "Related to" lines.
    const layout = await d.evaluate((root) => {
      const top = (e) => e.getBoundingClientRect().top;
      const heads = [...root.querySelectorAll('.sd-band')].map((h) => ({ id: h.dataset.testid.replace('structure-band-', ''), y: top(h) }));
      const cells = [...root.querySelectorAll('.sd-cell:not(.sd-empty)')].map((c) => ({
        band: c.dataset.band, y: top(c), visible: c.checkVisibility(),
        partyShown: c.querySelector('.sd-cell-h').checkVisibility() && c.querySelector('.sd-cell-h').getBoundingClientRect().width > 1,
        rel: [...c.querySelectorAll('.sd-rel li')].map((li) => ({ text: li.textContent, shown: li.getBoundingClientRect().width > 1 && li.checkVisibility() })),
      }));
      return { heads, cells, lines: root.querySelector('.sd-lines').checkVisibility() };
    });
    expect(layout.lines, 'the line overlay is hidden').toBe(false);
    const ys = layout.heads.map((h) => h.y);
    expect([...ys].sort((a, b) => a - b)).toEqual(ys);
    for (const c of layout.cells) {
      const i = layout.heads.findIndex((h) => h.id === c.band);
      expect(c.visible).toBe(true);
      expect(c.partyShown, `party label shown in ${c.band}`).toBe(true);
      expect(c.y, `${c.band} cell after its heading`).toBeGreaterThan(layout.heads[i].y);
      if (layout.heads[i + 1]) expect(c.y, `${c.band} cell before the next heading`).toBeLessThan(layout.heads[i + 1].y);
      for (const r of c.rel) expect(r.shown, `"${r.text}" visible`).toBe(true);
    }
    const allRel = layout.cells.flatMap((c) => c.rel.map((r) => r.text));
    expect(allRel).toContain('Related to: Globex, Partnership leadership: “Joint steering”');
    expect(allRel).toContain('Related to: Globex, Harbour account: “Weekly bid call”');
    expect(await noHorizontalScroll(page)).toBe(true);
  });

  test('2.55 explorer-views › Overview content', { tag: '@mobile' }, async ({ page }) => {
    await openSnapshot(page, snap);
    await skipPrompt(page);
    const main = page.locator('main');
    await expect(main.getByTestId('model-name')).toHaveText('Acme + Globex partnership');
    await expect(main.getByTestId('purpose')).toContainText('How Acme and Globex find, win and deliver joint work');
    await expect(main.getByTestId('party-card-acme')).toBeVisible();
    await expect(main.getByTestId('party-card-globex')).toBeVisible();
    await expect(main.getByTestId('workstream-card-presales')).toBeVisible();
    await expect(main.getByTestId('workstream-card-delivery')).toBeVisible();
    await expect(main.getByTestId('structure-card-acme-globex-partnership')).toContainText('Acme + Globex partnership');
    await expect(main.getByTestId('structure-card-harbour-account')).toContainText('Harbour account');
    await expect(main.getByTestId('key-messages').locator('li p')).toHaveCount(3);
  });

  test('2.63 theming › Rename workstream (diagram pages)', async ({ page }) => {
    // The sample theme renames workstream to Value stream; the diagram pages must use it too.
    for (const hash of [MAIN, '#/d/harbour-account']) {
      await openSnapshot(page, snap, hash);
      await expect(page.locator('main h1')).toBeVisible();
      expect(await page.locator('body').innerText()).not.toMatch(/workstream/i);
    }
    await openSnapshot(page, snap, MAIN);
    await expect(page.getByTestId('structure-related').locator('h3', { hasText: 'Value streams' })).toBeVisible();
  });
});

// ---------------------------------------------------------------------------------------------------------------
test.describe('structure-diagrams (wide diagram)', () => {
  const snap = useSnapshot('structure-wide');

  test('2.33 structure-diagrams › Many parties', async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 800 });
    await openSnapshot(page, snap, '#/d/board-map');
    await expect(diagram(page).getByTestId('structure-column')).toHaveCount(6);
    const scroller = diagram(page);
    const m = await scroller.evaluate((el) => ({ sw: el.scrollWidth, cw: el.clientWidth, ox: getComputedStyle(el).overflowX }));
    expect(m.sw, 'the diagram is wider than its container').toBeGreaterThan(m.cw);
    expect(['auto', 'scroll']).toContain(m.ox);
    expect(await noHorizontalScroll(page), 'the page does not scroll horizontally').toBe(true);
    // It scrolls inside its container, and a focused box is scrolled into view.
    const last = boxes(page).last();
    await last.focus();
    await expect.poll(() => scroller.evaluate((el) => el.scrollLeft)).toBeGreaterThan(0);
    const [s, b] = await Promise.all([scroller.boundingBox(), last.boundingBox()]);
    expect(b.x + b.width).toBeLessThanOrEqual(s.x + s.width + 1);
    expect(b.x).toBeGreaterThanOrEqual(s.x - 1);
    expect(await page.evaluate(() => window.scrollX)).toBe(0);
  });
});
