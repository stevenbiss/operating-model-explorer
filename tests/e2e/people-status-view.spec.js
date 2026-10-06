// Change add-people-status-simple-view, Test tasks 2.1–2.40, on dist/operating-model-explorer.html via file:// (author
// mode) and on snapshots exported through the real Export button (viewer mode). 1280×800 unless tagged; @mobile-only
// tests run at 375×812 only.
//
// Existing tests that still cover scenarios of this change (not duplicated here):
//   2.28 explorer-views › Main diagram first   = structure-diagrams.spec.js "2.56 explorer-views › Main diagram first"
//        (fixture structure-org: three structures, the main one listed last in the content).
//   2.37 author-mode › Reload after an edit    = author-mode.spec.js "2.51 author-mode › Reload after an edit (Chrome/Edge)".
// Node tests for the same rules (messages, defaults, parity): tests/unit/validate.test.js "1.1 …", tests/unit/sheet.test.js
// "1.2 …" and "1.9 …".
import { readFileSync } from 'node:fs';
import { test, expect, openEngine, loadZip, trySample, skipPrompt, go, messages, variant, useSnapshot, openSnapshot, noHorizontalScroll } from './helpers.js';

const KEY_MESSAGES = [
  'One team, one plan. Clients see a single Acme + Globex team, not two suppliers.',
  'Acme owns the client relationship. Globex owns the solution.',
  'Decide early. Every opportunity gets a go or no-go within five working days.',
];
const SA = ['Morgan Test', 'Riley Demo']; // the sample's Solution architect
const tip = (page) => page.getByTestId('people-tip');
const preview = (page) => page.getByTestId('preview');

// Tab forward until the focused element matches sel (a keyboard user reaching it), failing after max presses.
async function tabTo(page, sel, max = 150) {
  for (let i = 0; i < max; i++) {
    await page.keyboard.press('Tab');
    if (await page.evaluate((s) => !!document.activeElement && document.activeElement.matches(s), sel)) return;
  }
  throw new Error(`Tab never reached ${sel}`);
}

// Hover the middle of an element with the real mouse and wait past the pop-up's ~150ms delay.
async function hover(page, loc) {
  await loc.scrollIntoViewIfNeeded();
  const b = await loc.boundingBox();
  await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2, { steps: 4 });
  await page.waitForTimeout(400);
  return b;
}

const intersects = (a, b) => a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height;

// ---------------------------------------------------------------------------------------------------------------
test.describe('people, status and view (author mode)', () => {
  test.beforeEach(async ({ page }) => openEngine(page));

  test('2.1 role-people › Role with people loads', async ({ page }) => {
    await loadZip(page, 'sheet-people-status-view');
    await expect(messages(page).filter({ hasText: /Solution architect|solution-architect/ })).toHaveCount(0);
    await expect(page.getByTestId('report-counts')).toContainText('0 errors');
    await skipPrompt(page);
    await go(page, '#/r/solution-architect');
    const sec = preview(page).getByTestId('role-people');
    await expect(sec.getByRole('heading', { name: 'People' })).toBeVisible();
    await expect(sec.locator('li')).toHaveText(['Sam Example', 'Alex Sample']);
  });

  test('2.2 role-people › Markup in a name', async ({ page, sink }) => {
    const NAME = '<img src=x onerror=alert(1)>';
    await loadZip(page, variant('people-mix', 'people-markup', { 'roles/account-lead.md': (t) => t.replace('people: [Sam Example]', `people: ["${NAME}"]`) }));
    await expect(page.getByTestId('report-counts')).toContainText('0 errors');
    await skipPrompt(page);
    await go(page, '#/r/account-lead');
    await expect(preview(page).getByTestId('role-people').locator('li')).toHaveText([NAME]);
    await go(page, '#/p/wide');
    const lane = preview(page).getByTestId('lane-account-lead');
    expect((await lane.locator('.lane-people').allTextContents()).join(' '), 'the name, wrapped over lines, as text').toBe(NAME);
    await hover(page, lane);
    await expect(tip(page)).toBeVisible();
    await expect(tip(page).locator('li')).toHaveText([NAME]);
    await go(page, '#/w/main-ws');
    await expect(preview(page).locator('a.chip[data-people="account-lead"]')).toContainText(NAME);
    await expect(page.locator('img[src="x"]')).toHaveCount(0);
    await page.waitForTimeout(200);
    expect(sink.dialogs).toEqual([]);
  });

  test('2.13 role-people › Sample people load', async ({ page }) => {
    for (const load of [() => trySample(page), () => loadZip(page, 'acme-capture-sheet')]) {
      await openEngine(page);
      await load();
      await expect(page.getByTestId('report-counts')).toContainText('0 errors, 0 warnings');
      await skipPrompt(page);
      await preview(page).locator('[data-testid^="process-card-"]', { hasText: 'Qualify an opportunity' }).click(); // the sheet derives its own ids
      await expect(preview(page).getByTestId('lane-account-lead').locator('.lane-people')).toHaveText('Sam Example');
      await expect(preview(page).getByTestId('lane-solution-architect').locator('.lane-people')).toHaveText('Multiple people');
      await go(page, '#/r/partner-manager');
      await expect(preview(page).getByTestId('role-people').locator('li')).toHaveText(['Jo Placeholder']);
    }
  });

  test('2.14 review-status › Default is under review', async ({ page }) => {
    await loadZip(page, 'status-mix');
    await expect(messages(page).filter({ hasText: /Review flow|review-flow|02-flow/ })).toHaveCount(0);
    await skipPrompt(page);
    await go(page, '#/p/review-flow');
    await expect(preview(page).locator('.page-head').getByTestId('status-badge')).toHaveText('Under review');
  });

  test('2.15 review-status › Agreed in a sheet', async ({ page }) => {
    const sheet = readFileSync(new URL('../fixtures/sheet-people-status-view/capture-sheet.md', import.meta.url), 'utf8');
    expect(sheet).toContain('Status: agreed'); // lower case in the fixture
    await loadZip(page, 'sheet-people-status-view');
    await expect(messages(page).filter({ hasText: /Build the proposal|Status/ })).toHaveCount(0);
    await skipPrompt(page);
    const card = preview(page).locator('[data-testid^="process-card-"]', { hasText: 'Build the proposal' });
    await expect(card.getByTestId('status-badge')).toHaveText('Agreed');
    await card.click();
    await expect(preview(page).locator('h1')).toHaveText('Build the proposal');
    await expect(preview(page).locator('.page-head').getByTestId('status-badge')).toHaveText('Agreed');
  });

  test('2.16 review-status › Invalid status', async ({ page }) => {
    await loadZip(page, 'status-invalid');
    const m = messages(page).filter({ hasText: 'approved' });
    await expect(m).toHaveCount(1);
    await expect(m).toHaveAttribute('data-level', 'error');
    await expect(m).toContainText(/Main diagram|main-diagram|01-main\.md/);
    await expect(m).toContainText('under-review');
    await expect(m).toContainText('agreed');
    await expect(page.getByTestId('export')).toBeDisabled();
  });

  test('2.23 review-status › Sample statuses', async ({ page }) => {
    const seen = [];
    for (const load of [() => trySample(page), () => loadZip(page, 'acme-capture-sheet')]) {
      await openEngine(page);
      await load();
      await expect(page.getByTestId('report-counts')).toContainText('0 errors, 0 warnings');
      await skipPrompt(page);
      const cards = preview(page).locator('[data-testid^="process-card-"], [data-testid^="structure-card-"]');
      // By kind and name: the sheet derives its own process ids from the names.
      seen.push(await cards.evaluateAll((els) => els.map((e) => `${e.dataset.testid.replace(/-card-.*/, '')} ${e.querySelector('h3').textContent}: ${e.querySelector('[data-testid="status-badge"]').textContent}`)));
    }
    expect(seen[1]).toEqual(seen[0]);
    expect(seen[0].filter((s) => s.startsWith('process ') && s.endsWith(': Agreed')).length).toBeGreaterThanOrEqual(1);
    expect(seen[0].filter((s) => s.startsWith('process ') && s.endsWith(': Under review')).length).toBeGreaterThanOrEqual(1);
    expect(seen[0].filter((s) => s.startsWith('structure ') && s.endsWith(': Under review')).length).toBeGreaterThanOrEqual(1);
  });

  test('2.30 content-schema › Invalid view', async ({ page }) => {
    await loadZip(page, 'view-invalid');
    const m = messages(page).filter({ hasText: 'compact' });
    await expect(m).toHaveCount(1);
    await expect(m).toHaveAttribute('data-level', 'error');
    await expect(m).toContainText('model.md');
    await expect(m).toContainText('simple');
    await expect(m).toContainText('detailed');
    await expect(page.getByTestId('export')).toBeDisabled();
  });

  test('2.31 content-schema › People must be a list', async ({ page }) => {
    await loadZip(page, 'people-not-list');
    const m = messages(page).filter({ hasText: /people/i });
    await expect(m).toHaveCount(1);
    await expect(m).toHaveAttribute('data-level', 'error');
    await expect(m).toContainText(/Account lead|account-lead/);
    await expect(m).toContainText(/list of names/i);
  });

  test('2.32 content-schema › Reference lists the fields', async ({ page }) => {
    await page.getByRole('button', { name: 'Content reference' }).click();
    const dlg = page.getByTestId('reference-dialog');
    await expect(dlg).toBeVisible();
    // The text of each type's section: from its heading to the next heading of the same level.
    const section = (type) =>
      dlg.getByRole('heading', { name: type, exact: true }).evaluate((h) => {
        let t = '';
        for (let n = h.nextElementSibling; n && n.tagName !== h.tagName; n = n.nextElementSibling) t += `${n.textContent}\n`;
        return t;
      });
    expect(await section('role')).toMatch(/\bpeople\b/);
    expect(await section('process')).toMatch(/\bstatus\b[\s\S]*under-review, agreed/);
    expect(await section('structure')).toMatch(/\bstatus\b[\s\S]*under-review, agreed/);
    expect(await section('model')).toMatch(/\bview\b[\s\S]*simple, detailed/);
  });

  test('2.33 capture-sheet › People from the sheet', async ({ page }) => {
    await loadZip(page, 'sheet-people-status-view');
    await skipPrompt(page);
    await go(page, '#/r/solution-architect');
    await expect(preview(page).getByTestId('role-people').locator('li')).toHaveText(['Sam Example', 'Alex Sample']);
    await go(page, '#/');
    await preview(page).locator('[data-testid^="process-card-"]', { hasText: 'Build the proposal' }).click();
    await expect(preview(page).getByTestId('lane-solution-architect').locator('.lane-people')).toHaveText('Multiple people');
  });

  test('2.34 capture-sheet › Unknown status value', async ({ page }) => {
    await loadZip(page, variant('sheet-people-status-view', 'sheet-status-done', { 'capture-sheet.md': (t) => t.replace('Status: agreed', 'Status: Done') }));
    const m = messages(page).filter({ hasText: 'Done' });
    await expect(m).toHaveCount(1);
    await expect(m).toHaveAttribute('data-level', 'error');
    await expect(m).toContainText('Build the proposal');
    await expect(m).toContainText('Under review');
    await expect(m).toContainText('Agreed');
  });

  test('2.36 capture-sheet › Unknown view value', async ({ page }) => {
    await loadZip(page, variant('sheet-people-status-view', 'sheet-view-full', { 'capture-sheet.md': (t) => t.replace('View: Detailed', 'View: Full') }));
    const m = messages(page).filter({ hasText: 'Full' });
    await expect(m).toHaveCount(1);
    await expect(m).toHaveAttribute('data-level', 'error');
    await expect(m).toContainText('View');
    await expect(m).toContainText('Simple');
    await expect(m).toContainText('Detailed');
  });

  test('2.38 author-mode › Preview the other view', async ({ page }) => {
    await trySample(page);
    await skipPrompt(page);
    const published = page.getByTestId('published-view');
    const toggle = page.getByTestId('preview-view-toggle');
    await expect(published).toHaveText('Published home page: Simple view');
    await expect(toggle).toHaveText('Preview Detailed view');
    await expect(toggle).toHaveAttribute('aria-pressed', 'false');
    await expect(preview(page).getByTestId('key-messages-section')).toHaveCount(0);
    await toggle.click();
    await expect(preview(page).getByTestId('key-messages-section')).toBeVisible();
    await expect(preview(page).getByTestId('key-messages-section').locator('li p')).toHaveText(KEY_MESSAGES);
    await expect(published).toHaveText('Published home page: Simple view');
    await expect(toggle).toHaveAttribute('aria-pressed', 'true');
  });

  test('2.39 author-mode › Export ignores the preview toggle', async ({ page, context }, info) => {
    await trySample(page);
    await skipPrompt(page);
    await page.getByTestId('preview-view-toggle').click();
    await expect(preview(page).getByTestId('home')).toHaveAttribute('data-view', 'detailed');
    const dl = page.waitForEvent('download');
    await page.getByTestId('export').click();
    const d = await dl;
    const path = info.outputPath(d.suggestedFilename());
    await d.saveAs(path);
    const viewer = await context.newPage();
    await viewer.goto(new URL(`file:///${path.replace(/\\/g, '/')}`).href);
    await skipPrompt(viewer);
    await expect(viewer.getByTestId('home')).toHaveAttribute('data-view', 'simple');
    await expect(viewer.getByTestId('key-messages-section')).toHaveCount(0);
    await expect(viewer.getByTestId('purpose')).toHaveCount(0);
  });

  test('2.40 author-mode › Keyboard toggle', async ({ page }) => {
    await trySample(page);
    await skipPrompt(page);
    const toggle = page.getByTestId('preview-view-toggle');
    await page.getByTestId('report').locator('h2, h1').first().focus().catch(() => {});
    await tabTo(page, '[data-testid="preview-view-toggle"]');
    await expect(toggle).toHaveRole('button');
    await expect(toggle).toHaveAttribute('aria-pressed', 'false');
    await page.keyboard.press('Space');
    await expect(toggle).toHaveAttribute('aria-pressed', 'true'); // exposed as a pressed toggle button
    await expect(page.getByRole('button', { name: 'Preview Detailed view', pressed: true })).toBeVisible();
    await expect(preview(page).getByTestId('home')).toHaveAttribute('data-view', 'detailed');
    await expect(toggle).toBeFocused();
    await page.keyboard.press('Space');
    await expect(toggle).toHaveAttribute('aria-pressed', 'false');
    await expect(preview(page).getByTestId('home')).toHaveAttribute('data-view', 'simple');
  });
});

// ---------------------------------------------------------------------------------------------------------------
test.describe('people and status (exported sample)', () => {
  const snap = useSnapshot('sample');

  test('2.3 role-people › One person', async ({ page }) => {
    await openSnapshot(page, snap, '#/p/qualify-opportunity');
    const lane = page.getByTestId('lane-account-lead');
    await expect(lane.locator('.lane-name')).toHaveText('Account lead');
    await expect(lane.locator('.lane-people')).toHaveText('Sam Example');
    const [n, p] = [await lane.locator('.lane-name').boundingBox(), await lane.locator('.lane-people').boundingBox()];
    expect(p.y, 'the person is under the role name').toBeGreaterThan(n.y);
  });

  test('2.4 role-people › Several people', async ({ page }) => {
    await openSnapshot(page, snap, '#/p/qualify-opportunity');
    await expect(page.getByTestId('lane-solution-architect').locator('.lane-people')).toHaveText('Multiple people');
    await openSnapshot(page, snap, '#/w/presales');
    const chip = page.locator('a.chip[data-people="solution-architect"]');
    await expect(chip).toContainText('Solution architect');
    await expect(chip.getByTestId('people-line')).toHaveText('Multiple people');
    await openSnapshot(page, snap, '#/p/qualify-opportunity/s/assess-fit');
    const owner = page.getByTestId('owner');
    await expect(owner).toContainText('Solution architect');
    await expect(owner.getByTestId('people-line')).toHaveText('Multiple people');
    await expect(owner).not.toContainText(SA[0]);
  });

  test('2.7 role-people › Hover shows the names', async ({ page }) => {
    await openSnapshot(page, snap, '#/p/qualify-opportunity');
    const lane = page.getByTestId('lane-solution-architect');
    await expect(tip(page)).toBeHidden();
    const b = await hover(page, lane);
    await expect(tip(page)).toBeVisible();
    await expect(tip(page).locator('.people-tip-h')).toHaveText('Solution architect');
    await expect(tip(page).locator('li')).toHaveText(SA);
    const t = await tip(page).boundingBox();
    expect(intersects(t, b), 'the pop-up does not cover the lane header').toBe(false);
    // Pointer out: onto the page heading, away from any role.
    const h = await page.locator('main h1').boundingBox();
    await page.mouse.move(h.x + 5, h.y + h.height / 2, { steps: 4 });
    await expect(tip(page)).toBeHidden();
  });

  test('2.8 role-people › Keyboard shows the names', async ({ page }) => {
    await openSnapshot(page, snap, '#/w/presales');
    const chip = page.locator('a.chip[data-people="solution-architect"]');
    await tabTo(page, 'a.chip[data-people="solution-architect"]');
    await expect(chip).toBeFocused();
    await expect(tip(page)).toBeVisible();
    await expect(tip(page).locator('li')).toHaveText(SA);
    await page.keyboard.press('Escape');
    await expect(tip(page)).toBeHidden();
    await expect(chip).toBeFocused();
  });

  test('2.9 role-people › Screen-reader description', async ({ page }) => {
    await openSnapshot(page, snap, '#/p/qualify-opportunity');
    await expect(page.getByTestId('lane-solution-architect')).toHaveAccessibleDescription(/Morgan Test.*Riley Demo/);
    await expect(page.getByTestId('lane-account-lead')).toHaveAccessibleDescription(/Sam Example/);
  });

  test('2.11 role-people › Role page lists people', async ({ page }) => {
    await openSnapshot(page, snap, '#/r/solution-architect');
    const sec = page.getByTestId('role-people');
    await expect(sec.getByRole('heading', { name: 'People' })).toBeVisible();
    await expect(sec.locator('li')).toHaveText(SA);
  });

  test('2.12 role-people › Mobile people line', { tag: '@mobile-only' }, async ({ page }) => {
    await openSnapshot(page, snap, '#/p/qualify-opportunity');
    await expect(page.getByTestId('swimlane-list')).toBeVisible();
    const lane = (id) => page.getByTestId(`step-${id}`).locator('.fi-lane');
    await expect(lane('capture-lead')).toContainText('Account lead (Sam Example)');
    await expect(lane('assess-fit')).toContainText('Solution architect (Multiple people)');
    await expect(lane('decline')).toContainText('Account lead (Sam Example)');
    await expect(lane('kick-off-bid')).not.toContainText('(');
    expect(await noHorizontalScroll(page)).toBe(true);
  });

  test('2.17 review-status › Badges on the home page', async ({ page }) => {
    await openSnapshot(page, snap);
    await skipPrompt(page);
    const cards = page.locator('main').locator('[data-testid^="process-card-"], [data-testid^="structure-card-"]');
    expect(await cards.count()).toBe(4);
    for (const c of await cards.all()) {
      await expect(c.getByTestId('status-badge')).toHaveCount(1);
      await expect(c.getByTestId('status-badge')).toHaveText(/^(Under review|Agreed)$/);
      await expect(c.getByTestId('status-badge')).toBeVisible();
    }
  });

  test('2.18 review-status › Badge on the page', async ({ page }) => {
    await openSnapshot(page, snap, '#/p/qualify-opportunity');
    const head = page.locator('main .page-head');
    await expect(head.locator('h1')).toHaveText('Qualify an opportunity');
    await expect(head.getByTestId('status-badge')).toHaveText('Agreed');
    const [h, b] = [await head.locator('h1').boundingBox(), await head.getByTestId('status-badge').boundingBox()];
    expect(b.y - (h.y + h.height), 'the badge sits right by the heading').toBeLessThan(40);
  });

  test('2.19 review-status › Badge in search', async ({ page }) => {
    for (const [q, name, status] of [['Qualify an opportunity', 'Qualify an opportunity', 'Agreed'], ['Build the proposal', 'Build the proposal', 'Under review']]) {
      await openSnapshot(page, snap, '#/w/presales');
      await page.getByTestId('search-input').fill(q);
      await page.getByTestId('search-input').press('Enter');
      const row = page.getByTestId('search-group-process').locator('li', { has: page.getByRole('link', { name, exact: true }) });
      await expect(row).toHaveCount(1);
      await expect(row.getByTestId('status-badge')).toHaveText(status);
    }
  });

  test('2.20 review-status › Notice on an under-review process', async ({ page }) => {
    await openSnapshot(page, snap, '#/p/build-proposal');
    const note = page.getByTestId('review-note');
    await expect(note).toBeVisible();
    await expect(note).toHaveText(/under review and may still change/);
    const [n, s] = [await note.boundingBox(), await page.getByTestId('swimlane').boundingBox()];
    expect(n.y + n.height, 'the notice is above the swimlane').toBeLessThanOrEqual(s.y + 1);
    // Part of the page text, before the diagram in reading order.
    expect(await note.evaluate((el) => !!(el.compareDocumentPosition(document.querySelector('[data-testid="swimlane"]')) & Node.DOCUMENT_POSITION_FOLLOWING))).toBe(true);
  });

  test('2.22 review-status › Mobile status', { tag: '@mobile-only' }, async ({ page }) => {
    await openSnapshot(page, snap, '#/p/build-proposal');
    await expect(page.locator('main .page-head').getByTestId('status-badge')).toHaveText('Under review');
    await expect(page.locator('main .page-head').getByTestId('status-badge')).toBeInViewport();
    await expect(page.getByTestId('review-note')).toBeVisible();
    await expect(page.getByTestId('review-note')).toHaveText(/under review and may still change/);
    expect(await noHorizontalScroll(page)).toBe(true);
  });

  test('2.24 explorer-views › Overview content', async ({ page }) => {
    await openSnapshot(page, snap);
    await skipPrompt(page);
    const main = page.locator('main');
    await expect(main.getByTestId('home')).toHaveAttribute('data-view', 'simple');
    await expect(main.getByTestId('model-name')).toHaveText('Acme + Globex partnership');
    await expect(main.locator('[data-testid^="party-card-"]')).toHaveCount(2);
    for (const id of ['acme', 'globex']) await expect(main.getByTestId(`party-card-${id}`)).toBeVisible();
    for (const id of ['presales', 'delivery']) await expect(main.getByTestId(`workstream-card-${id}`)).toBeVisible();
    for (const id of ['qualify-opportunity', 'build-proposal']) await expect(main.getByTestId(`process-card-${id}`)).toBeVisible();
    for (const id of ['partnership-structure', 'harbour-account']) await expect(main.getByTestId(`structure-card-${id}`)).toBeVisible();
    await expect(main.getByTestId('purpose')).toHaveCount(0);
    await expect(main.getByTestId('key-messages-section')).toHaveCount(0);
    await expect(main.locator('[data-testid^="persona-door"]')).toHaveCount(0);
  });

  test('2.26 explorer-views › Key messages still reachable in Simple view', { tag: '@mobile' }, async ({ page }) => {
    await openSnapshot(page, snap);
    await skipPrompt(page);
    await expect(page.getByTestId('home')).toHaveAttribute('data-view', 'simple');
    await page.getByTestId('key-messages-button').click();
    const dlg = page.getByTestId('key-messages-dialog');
    await expect(dlg).toBeVisible();
    await expect(dlg.locator('li p')).toHaveText(KEY_MESSAGES);
  });

  test('2.27 explorer-views › Processes listed on the home page', async ({ page }) => {
    await openSnapshot(page, snap);
    await skipPrompt(page);
    const cards = page.getByTestId('process-list').locator('[data-testid^="process-card-"]');
    expect(await cards.evaluateAll((els) => els.map((e) => e.dataset.testid))).toEqual(['process-card-qualify-opportunity', 'process-card-build-proposal']);
    for (const c of await cards.all()) {
      await expect(c.getByTestId('process-workstream')).toHaveText('Presales');
      await expect(c.getByTestId('status-badge')).toHaveText(/^(Under review|Agreed)$/);
    }
    await cards.first().click();
    await expect(page).toHaveURL(/#\/p\/qualify-opportunity/);
    await expect(page.getByTestId('swimlane')).toBeVisible();
    await expect(page.getByTestId('lane-account-lead')).toBeVisible();
  });

  test('2.29 explorer-views › Home page on a phone', { tag: '@mobile-only' }, async ({ page }) => {
    await openSnapshot(page, snap);
    await skipPrompt(page);
    const ids = await page.locator('main [data-testid="home"] > section.section').evaluateAll((els) => els.map((e) => e.dataset.testid));
    expect(ids).toEqual(['party-list', 'workstream-list', 'process-list', 'structure-list']);
    const boxes = [];
    for (const id of ids) boxes.push(await page.getByTestId(id).boundingBox());
    for (let i = 1; i < boxes.length; i++) expect(boxes[i].y, `${ids[i]} is below ${ids[i - 1]}`).toBeGreaterThanOrEqual(boxes[i - 1].y + boxes[i - 1].height - 1);
    expect(await noHorizontalScroll(page)).toBe(true);
  });
});

// ---------------------------------------------------------------------------------------------------------------
test.describe('people (exported people-mix)', () => {
  const snap = useSnapshot('people-mix');

  test('2.5 role-people › Box with its own name text', async ({ page }) => {
    await openSnapshot(page, snap, '#/d/org');
    const box = page.getByTestId('structure-box').filter({ has: page.locator('.sd-box-title', { hasText: 'Account lead' }) });
    await expect(box).toHaveCount(1);
    await expect(box.locator('.sd-box-name')).toHaveText('TBA');
    await expect(box).not.toContainText('Sam Example');
    // A box without its own name text shows the person instead.
    await expect(page.getByTestId('structure-box').filter({ has: page.locator('.sd-box-title', { hasText: 'Gamma lead' }) }).locator('.sd-box-name')).toHaveText('Riley Demo');
  });

  test('2.6 role-people › No people', async ({ page }) => {
    await openSnapshot(page, snap, '#/p/wide');
    const lane = page.getByTestId('lane-legal-counsel');
    await expect(lane.locator('.lane-name')).toHaveText('Legal counsel');
    await expect(lane.locator('.lane-team')).toHaveText('Alpha sales');
    await expect(lane.locator('.lane-people')).toHaveCount(0);
    await expect(lane).not.toHaveAttribute('data-people');
    await expect(lane).not.toHaveAttribute('aria-describedby');
    await openSnapshot(page, snap, '#/r/legal-counsel');
    await expect(page.getByTestId('role-people')).toHaveCount(0);
  });

  test('2.10 role-people › Pop-up stays on screen', async ({ page }) => {
    const vp = page.viewportSize();
    expect(vp.width).toBe(1280);
    // The right-most roles: the Gamma lead box in the right-hand column of the diagram, and the step owner in the
    // detail panel on the right of the wide swimlane.
    for (const [hash, sel] of [['#/d/org', '[data-testid="structure-box"][data-people="gamma-lead"]'], ['#/p/wide/s/assess', '[data-testid="owner"] [data-people="solution-architect"]']]) {
      await openSnapshot(page, snap, hash);
      const el = page.locator(sel);
      await el.scrollIntoViewIfNeeded();
      const b = await hover(page, el);
      expect(b.x + b.width, `${sel} is near the right edge`).toBeGreaterThan(vp.width * 0.6);
      await expect(tip(page)).toBeVisible();
      const t = await tip(page).boundingBox();
      expect(t.x).toBeGreaterThanOrEqual(0);
      expect(t.y).toBeGreaterThanOrEqual(0);
      expect(t.x + t.width).toBeLessThanOrEqual(vp.width);
      expect(t.y + t.height).toBeLessThanOrEqual(vp.height);
      expect(intersects(t, b), 'the pop-up does not cover its element').toBe(false);
    }
  });
});

// ---------------------------------------------------------------------------------------------------------------
test.describe('status (exported status-mix)', () => {
  const snap = useSnapshot('status-mix');

  test('2.21 review-status › No notice when agreed', async ({ page }) => {
    await openSnapshot(page, snap, '#/d/agreed-diagram');
    await expect(page.locator('main h1')).toHaveText('Agreed diagram');
    await expect(page.locator('main .page-head').getByTestId('status-badge')).toHaveText('Agreed');
    await expect(page.getByTestId('review-note')).toHaveCount(0);
    await openSnapshot(page, snap, '#/p/agreed-flow');
    await expect(page.locator('main h1')).toHaveText('Agreed flow');
    await expect(page.getByTestId('review-note')).toHaveCount(0);
    // Control: the under-review diagram does show the notice.
    await openSnapshot(page, snap, '#/d/review-diagram');
    await expect(page.getByTestId('review-note')).toBeVisible();
  });
});

// ---------------------------------------------------------------------------------------------------------------
test.describe('Detailed view (exported)', () => {
  const sample = useSnapshot(variant('acme-sample', 'acme-detailed', { 'model.md': (t) => t.replace(/^---(\r?\n)/, '---$1view: detailed$1') }));
  const fixture = useSnapshot('view-detailed');
  const sheet = useSnapshot('sheet-people-status-view');

  test('2.25 explorer-views › Detailed view', async ({ page }) => {
    await openSnapshot(page, sample);
    await skipPrompt(page);
    const main = page.locator('main');
    await expect(main.getByTestId('home')).toHaveAttribute('data-view', 'detailed');
    await expect(main.getByTestId('purpose')).toContainText('find, win and deliver joint work');
    await expect(main.getByTestId('key-messages-section').locator('li p')).toHaveText(KEY_MESSAGES);
    await expect(main.locator('[data-testid^="persona-door"]')).toHaveCount(3);
    // The parties, workstreams, processes and structures are still there.
    for (const id of ['party-list', 'workstream-list', 'process-list', 'structure-list']) await expect(main.getByTestId(id)).toBeVisible();
    // The small fixture too (no personas, so no doors).
    await openSnapshot(page, fixture);
    await skipPrompt(page);
    await expect(page.getByTestId('purpose')).toContainText('A small test model.');
    await expect(page.getByTestId('key-messages-section').locator('li p')).toHaveText(['Keep it small.', 'Test everything.']);
  });

  test('2.35 capture-sheet › Detailed from the sheet', async ({ page }) => {
    await openSnapshot(page, sheet);
    await skipPrompt(page);
    await expect(page.getByTestId('home')).toHaveAttribute('data-view', 'detailed');
    await expect(page.getByTestId('key-messages-section')).toBeVisible();
    await expect(page.getByTestId('key-messages-section').locator('li p')).toHaveText(['One team.', 'One plan.']);
  });
});
