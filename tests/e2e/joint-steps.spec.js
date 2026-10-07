// add-joint-steps test tasks 2.1–2.17: one test per scenario in the joint-steps, content-schema and capture-sheet
// deltas, on dist/operating-model-explorer.html via file:// (author mode) and on snapshots exported through the real
// Export button (viewer mode). The same scenarios at the model level: tests/unit/joint-steps.test.js.
// Already covered elsewhere and kept: the Joint pill next to Changed (explorer-views 2.35), the phone label for
// every Qualify step (explorer-views 2.37), the people line on a joint step (people-status-view), and the unit
// layout/render tests in tests/unit/layout.test.js (1.3, 1.4).
import { test, expect, openEngine, loadZip, loadFolder, trySample, skipPrompt, messages, go, variant, useSnapshot, openSnapshot, noHorizontalScroll } from './helpers.js';

const pv = (page) => page.getByTestId('preview');
const counts = (page) => page.getByTestId('report-counts');
const msg = (page, hasText) => messages(page).filter({ hasText });
const detail = (page) => page.getByTestId('step-detail');
const OWNER_CELL = '| 2 | Kick off the bid | bid manager; Solution  Architect |';
const sheetOwner = (name, owner) => variant('sheet-joint', name, { 'capture-sheet.md': (t) => t.replace(OWNER_CELL, `| 2 | Kick off the bid | ${owner} |`) });
const boxesOf = (scope, step) => scope.locator(`svg.swimlane g.node[data-step="${step}"]`);

// Each box of a step with the lane it sits in (by its vertical extent), in screen coordinates.
async function jointBoxes(scope, step) {
  return scope.locator('svg.swimlane').first().evaluate((svg, step) => {
    const lanes = [...svg.closest('[data-testid="swimlane"]').querySelectorAll('.lane-heads [data-testid^="lane-"]')].map((a) => ({ id: a.dataset.testid.slice(5), r: a.querySelector('.lane-hit').getBoundingClientRect() }));
    return [...svg.querySelectorAll(`g.node[data-step="${step}"]`)].map((g) => {
      const r = g.querySelector('rect.box').getBoundingClientRect();
      const lane = lanes.find((l) => r.top >= l.r.top - 0.5 && r.bottom <= l.r.bottom + 0.5);
      return { owner: g.dataset.owner, lane: lane && lane.id, x: r.left, y: r.top, w: r.width, h: r.height, pills: [...g.querySelectorAll('.pill text')].map((t) => t.textContent), testid: g.dataset.testid };
    });
  }, step);
}

// The tie path sampled every 2px, against every step box (rect.box) in the swimlane: points strictly inside a box.
async function tieCrossings(scope, step) {
  return scope.locator('svg.swimlane').first().evaluate((svg, step) => {
    const tie = svg.querySelector(`[data-testid="joint-tie-${step}"]`);
    if (!tie) return { missing: true };
    const m = tie.getScreenCTM();
    const len = tie.getTotalLength();
    const pts = [];
    for (let d = 0; d <= len; d += 2) pts.push(tie.getPointAtLength(d));
    pts.push(tie.getPointAtLength(len));
    const screen = pts.map((p) => new DOMPoint(p.x, p.y).matrixTransform(m));
    const boxes = [...svg.querySelectorAll('rect.box')].map((r) => ({ step: r.closest('g.node').dataset.step, owner: r.closest('g.node').dataset.owner, b: r.getBoundingClientRect() }));
    const hits = [];
    for (const p of screen) for (const { step: s, owner, b } of boxes) if (p.x > b.left + 0.5 && p.x < b.right - 0.5 && p.y > b.top + 0.5 && p.y < b.bottom - 0.5) hits.push(`${s}${owner ? `/${owner}` : ''} at ${Math.round(p.x)},${Math.round(p.y)}`);
    return { samples: screen.length, boxes: boxes.length, dash: getComputedStyle(tie).strokeDasharray, hits, xs: [Math.min(...screen.map((p) => p.x)), Math.max(...screen.map((p) => p.x))], ys: [Math.min(...screen.map((p) => p.y)), Math.max(...screen.map((p) => p.y))] };
  }, step);
}

// The tie is dotted, touches each of the step's boxes, and passes inside no step box.
async function expectTie(scope, step, boxes) {
  const t = await tieCrossings(scope, step);
  expect(t.missing, 'tie drawn').toBeUndefined();
  expect(t.dash, 'dotted').not.toBe('none');
  expect(t.samples).toBeGreaterThan(10);
  expect(t.boxes).toBeGreaterThan(boxes.length);
  expect(t.hits, 'tie points inside a step box').toEqual([]);
  // It spans from one box's middle to the other's, and reaches each box's left edge.
  const mids = boxes.map((b) => b.y + b.h / 2);
  expect(t.ys[0]).toBeCloseTo(Math.min(...mids), 0);
  expect(t.ys[1]).toBeCloseTo(Math.max(...mids), 0);
  expect(t.xs[1]).toBeCloseTo(boxes[0].x, 0);
}

// ---------- author mode: loading and messages ----------

test.describe('joint steps (author mode)', () => {
  test.beforeEach(async ({ page }) => openEngine(page));

  test('2.1 Steps with several role owners › Joint step loads', async ({ page }) => {
    await loadZip(page, sheetOwner('sheet-joint-exact', 'Bid manager; Solution architect'));
    await expect(counts(page)).toHaveText('0 errors, 0 warnings');
    await expect(messages(page)).toHaveCount(0);
    await skipPrompt(page);
    await go(page, '#/p/main-flow');
    // One step: one focusable box, one twin, and one detail page owned by both roles.
    await expect(pv(page).getByTestId('step-kick-off-the-bid')).toHaveCount(1);
    await expect(pv(page).getByTestId('joint-twin-kick-off-the-bid')).toHaveCount(1);
    const boxes = await jointBoxes(pv(page), 'kick-off-the-bid');
    expect(boxes.map((b) => b.lane)).toEqual(['bid-manager', 'solution-architect']);
    await pv(page).getByTestId('step-kick-off-the-bid').click();
    await expect(detail(page).locator('h2').first()).toHaveText('Kick off the bid');
    await expect(detail(page).getByTestId('owner-item')).toHaveCount(2);
    await expect(detail(page).getByTestId('joint-badge')).toHaveText('Joint');
  });

  test('2.2 Steps with several role owners › Committee among joint owners', async ({ page }) => {
    // Only the committee problem: the repeated-role step is made a single owner.
    await loadZip(page, variant('joint-invalid', 'joint-committee-only', { 'processes/01-main-flow.md': (t) => t.replace('owner: [bid-manager, bid-manager]', 'owner: bid-manager') }));
    await expect(messages(page)).toHaveCount(1);
    const m = messages(page).first();
    await expect(m).toHaveAttribute('data-level', 'error');
    await expect(m.locator('.msg-problem')).toContainText('"Decide together"');
    await expect(m.locator('.msg-problem')).toContainText('Joint owners must be roles');
    await expect(page.getByTestId('export')).toBeDisabled();
  });

  test('2.3 Steps with several role owners › Same role twice', async ({ page }) => {
    await loadZip(page, sheetOwner('sheet-joint-twice', 'Bid manager; Bid manager'));
    await expect(messages(page)).toHaveCount(1);
    const m = messages(page).first();
    await expect(m).toHaveAttribute('data-level', 'error');
    await expect(m.locator('.msg-problem')).toContainText('"Kick off the bid"');
    await expect(m.locator('.msg-problem')).toContainText('lists Bid manager twice');
    await expect(page.getByTestId('export')).toBeDisabled();
    // The folder form names the step and the repeated role too.
    await page.getByTestId('load-other').click();
    await loadFolder(page, 'joint-invalid');
    const f = msg(page, 'Plan the bid');
    await expect(f).toHaveCount(1);
    await expect(f).toHaveAttribute('data-level', 'error');
    await expect(f.locator('.msg-problem')).toContainText('lists Bid manager twice');
  });

  test('2.13 Sample joint step › Sample joint step loads', async ({ page }) => {
    // A sheet's ids come from the names, so the same process and step have other ids in the sheet form.
    for (const [form, proc, step] of [['folder', 'qualify-opportunity', 'kick-off-bid'], ['sheet', 'qualify-an-opportunity', 'kick-off-the-bid']]) {
      if (form === 'folder') await trySample(page);
      else {
        await page.getByTestId('load-other').click();
        await loadFolder(page, 'acme-capture-sheet');
      }
      await expect(counts(page), form).toHaveText('0 errors, 0 warnings');
      await expect(messages(page)).toHaveCount(0);
      await skipPrompt(page);
      await go(page, `#/p/${proc}`);
      await expect(pv(page).getByTestId(`step-${step}`)).toBeVisible();
      await expect(pv(page).getByTestId(`step-${step}`)).toHaveAttribute('aria-label', /^Kick off the bid, joint step/);
      const boxes = await jointBoxes(pv(page), step);
      expect(boxes.map((b) => b.lane).sort(), form).toEqual(['bid-manager', 'solution-architect']);
    }
  });

  test('2.14 Several owners on a step › Owner list in a file', async ({ page }) => {
    await loadFolder(page, 'joint-basic');
    await expect(counts(page)).toHaveText('0 errors, 0 warnings');
    await expect(messages(page)).toHaveCount(0);
    await skipPrompt(page);
    await go(page, '#/p/main-flow');
    expect((await jointBoxes(pv(page), 'kick-off-the-bid')).map((b) => [b.lane, b.pills.includes('Joint')])).toEqual([['bid-manager', true], ['solution-architect', true]]);
  });

  test('2.15 Several owners on a step › Unknown role in an owner list', async ({ page }) => {
    await loadZip(page, variant('joint-basic', 'joint-unknown-owner', { 'processes/01-main-flow.md': (t) => t.replace('owner: [bid-manager, solution-architect]', 'owner: [bid-manager, sol-arch]') }));
    const m = msg(page, 'sol-arch');
    await expect(m).toHaveCount(1);
    await expect(m).toHaveAttribute('data-level', 'error');
    await expect(m.locator('.msg-where')).toContainText('kick-off-the-bid'); // the step
    await expect(m.locator('.msg-problem')).toContainText('"sol-arch"');
    await expect(m.locator('.msg-fix')).toContainText('Did you mean solution-architect?');
    await expect(page.getByTestId('export')).toBeDisabled();
  });

  test('2.16 Several owners in the Owner cell › Joint owners in a sheet', async ({ page }) => {
    await loadFolder(page, 'sheet-joint'); // Owner: `bid manager; Solution  Architect`
    await expect(counts(page)).toHaveText('0 errors, 0 warnings');
    await expect(messages(page)).toHaveCount(0);
    await skipPrompt(page);
    await go(page, '#/p/main-flow/s/kick-off-the-bid');
    await expect(detail(page).getByTestId('owner-item')).toHaveCount(2);
    await expect(detail(page).getByTestId('owner-item').nth(0)).toContainText('Bid manager');
    await expect(detail(page).getByTestId('owner-item').nth(1)).toContainText('Solution architect');
    await expect(detail(page).getByTestId('joint-badge')).toHaveText('Joint');
  });

  test('2.17 Several owners in the Owner cell › Unknown name in the Owner list', async ({ page }) => {
    await loadZip(page, sheetOwner('sheet-joint-unknown', 'Bid manager; Sol architect'));
    const m = msg(page, 'Sol architect');
    await expect(m).toHaveCount(1);
    await expect(m).toHaveAttribute('data-level', 'error');
    await expect(m.locator('.msg-where')).toContainText('Process: Main flow');
    await expect(m.locator('.msg-where')).toContainText('row 2');
    await expect(m.locator('.msg-fix')).toContainText('Did you mean Solution architect?');
  });
});

// ---------- viewer: the exported sample ----------

test.describe('joint steps (exported sample)', () => {
  const snap = useSnapshot('sample');

  test('2.4 Joint steps drawn in parallel › Parallel boxes with a dotted tie', async ({ page }) => {
    await openSnapshot(page, snap, '#/p/qualify-opportunity');
    const boxes = await jointBoxes(page, 'kick-off-bid');
    expect(boxes.map((b) => b.lane)).toEqual(['bid-manager', 'solution-architect']);
    expect(boxes[1].x, 'same column').toBeCloseTo(boxes[0].x, 1);
    for (const b of boxes) expect(b.pills, `${b.lane} box marked Joint`).toContain('Joint');
    await expect(page.locator('svg.swimlane .node-name', { hasText: 'Kick off the bid' })).toHaveCount(2);
    await expectTie(page, 'kick-off-bid', boxes);
  });

  test('2.7 One step everywhere else › Step detail lists the owners', { tag: '@mobile' }, async ({ page }) => {
    await openSnapshot(page, snap, '#/p/qualify-opportunity/s/kick-off-bid');
    const items = detail(page).getByTestId('owner-item');
    await expect(items).toHaveCount(2);
    await expect(items.nth(0)).toContainText('Bid manager');
    await expect(items.nth(0)).toContainText('Acme Corp');
    await expect(items.nth(1)).toContainText('Solution architect');
    await expect(items.nth(1)).toContainText('Globex');
    await expect(detail(page).getByTestId('joint-badge')).toHaveText('Joint');
  });

  test('2.8 One step everywhere else › Role pages', { tag: '@mobile' }, async ({ page }) => {
    for (const r of ['solution-architect', 'bid-manager']) {
      await openSnapshot(page, snap, `#/r/${r}`);
      const row = page.locator('main li', { has: page.getByRole('link', { name: 'Kick off the bid', exact: true }) });
      await expect(row, r).toHaveCount(1);
      await expect(row.locator('.tag')).toHaveText('Owner');
      await expect(row.getByTestId('joint-badge')).toHaveText('Joint');
    }
  });

  test('2.9 One step everywhere else › Persona emphasis', async ({ page }) => {
    await openSnapshot(page, snap, '#/p/qualify-opportunity?persona=globex-solution-team');
    const boxes = boxesOf(page, 'kick-off-bid');
    await expect(boxes).toHaveCount(2);
    for (let i = 0; i < 2; i++) {
      await expect(boxes.nth(i)).toHaveClass(/\bmine\b/);
      await expect(boxes.nth(i)).not.toHaveClass(/\bdim\b/);
    }
    await expect(page.getByTestId('joint-tie-kick-off-bid')).toHaveClass(/\bmine\b/);
    // A persona holding neither owner role (nor any RACI letter) sees both dimmed.
    await openSnapshot(page, snap, '#/p/qualify-opportunity?persona=acme-account-lead');
    for (let i = 0; i < 2; i++) await expect(boxesOf(page, 'kick-off-bid').nth(i)).toHaveClass(/\bdim\b/);
  });

  test('2.10 One step everywhere else › Phone list', { tag: '@mobile-only' }, async ({ page }) => {
    expect(page.viewportSize().width).toBe(375);
    await openSnapshot(page, snap, '#/p/qualify-opportunity');
    const lane = page.getByTestId('swimlane');
    await expect(lane).toHaveAttribute('data-layout', 'list');
    const it = lane.locator('a.flow-item[data-step="kick-off-bid"]');
    await expect(it).toHaveCount(1);
    await expect(lane.getByText('Kick off the bid', { exact: true })).toHaveCount(1);
    await expect(it.locator('.fi-lane')).toHaveText('Bid manager (Acme Corp) · Solution architect (Globex)');
    await expect(it).toContainText('Joint');
    expect(await noHorizontalScroll(page)).toBe(true);
  });

  test('2.11 Keyboard and screen readers for joint steps › One Tab stop', async ({ page }) => {
    await openSnapshot(page, snap, '#/p/qualify-opportunity');
    await page.locator('main h1').focus();
    const seen = [];
    for (let i = 0; i < 40; i++) {
      await page.keyboard.press('Tab');
      const id = await page.evaluate(() => document.activeElement.dataset.testid || document.activeElement.tagName);
      if (seen.length && !id.startsWith('step-') && !id.startsWith('joint-') && seen.some((s) => s.startsWith('step-'))) break;
      seen.push(id);
    }
    const steps = seen.filter((s) => s.startsWith('step-') || s.startsWith('joint-'));
    expect(steps.filter((s) => s === 'step-kick-off-bid'), 'one stop').toHaveLength(1);
    expect(steps.filter((s) => s.startsWith('joint-twin')), 'twins never focused').toEqual([]);
    expect(steps.indexOf('step-kick-off-bid'), 'after Go or no-go, in flow order').toBeGreaterThan(steps.indexOf('step-go-no-go'));
    await page.getByTestId('step-kick-off-bid').focus();
    await page.keyboard.press('Enter');
    await expect(detail(page).locator('h2#om-detail-title')).toHaveText('Kick off the bid');
    // Clicking the other box opens the same detail.
    await page.keyboard.press('Escape');
    await page.getByTestId('joint-twin-kick-off-bid').click();
    await expect(detail(page).locator('h2#om-detail-title')).toHaveText('Kick off the bid');
  });

  test('2.12 Keyboard and screen readers for joint steps › Accessible name', async ({ page }) => {
    await openSnapshot(page, snap, '#/p/qualify-opportunity');
    const label = await page.getByTestId('step-kick-off-bid').getAttribute('aria-label');
    expect(label).toContain('Kick off the bid');
    expect(label).toContain('joint step');
    expect(label).toContain('Bid manager');
    expect(label).toContain('Solution architect');
    // Exactly one node in the accessibility tree: the twin is hidden from screen readers.
    await expect(page.locator('svg.swimlane').getByRole('button', { name: /^Kick off the bid/ })).toHaveCount(1);
    await expect(page.getByTestId('joint-twin-kick-off-bid')).toHaveAttribute('aria-hidden', 'true');
  });
});

// ---------- viewer: fixtures ----------

test.describe('joint steps (exported joint-basic)', () => {
  const snap = useSnapshot('joint-basic');

  test('2.5 Joint steps drawn in parallel › Connectors attach to the nearest box', async ({ page }) => {
    await openSnapshot(page, snap, '#/p/main-flow');
    const r = await page.locator('svg.swimlane').first().evaluate((svg) => {
      const e = svg.querySelector('path.edge[data-from="capture-the-lead"][data-to="kick-off-the-bid"]');
      const end = new DOMPoint(...(({ x, y }) => [x, y])(e.getPointAtLength(e.getTotalLength()))).matrixTransform(e.getScreenCTM());
      const src = svg.querySelector('g.node[data-step="capture-the-lead"] rect.box').getBoundingClientRect();
      const boxes = [...svg.querySelectorAll('g.node[data-step="kick-off-the-bid"]')].map((g) => ({ owner: g.dataset.owner, b: g.querySelector('rect.box').getBoundingClientRect() }));
      const srcMid = src.top + src.height / 2;
      const dist = (b) => Math.abs(b.top + b.height / 2 - srcMid);
      const nearer = boxes.reduce((a, b) => (dist(b.b) < dist(a.b) ? b : a));
      const on = (b) => Math.abs(end.x - b.left) <= 4 && end.y >= b.top && end.y <= b.bottom;
      return { end: [end.x, end.y], nearer: nearer.owner, onBoxes: boxes.filter((b) => on(b.b)).map((b) => b.owner), distances: boxes.map((b) => [b.owner, dist(b.b)]) };
    });
    expect(r.nearer, 'the box nearer the Account lead lane').toBe('bid-manager');
    expect(r.onBoxes, `connector ends ${r.end} on the nearer box`).toEqual(['bid-manager']);
  });
});

test.describe('joint steps (exported joint-far)', () => {
  const snap = useSnapshot('joint-far');

  test('2.6 Joint steps drawn in parallel › Owners in non-adjacent lanes', async ({ page }) => {
    await openSnapshot(page, snap, '#/p/main-flow');
    const boxes = await jointBoxes(page, 'kick-off-the-bid');
    expect(boxes.map((b) => b.lane)).toEqual(['bid-manager', 'solution-architect']);
    for (const b of boxes) expect(b.pills, `${b.lane} box marked Joint`).toContain('Joint');
    expect(boxes[1].x, 'same column').toBeCloseTo(boxes[0].x, 1);
    // The lane between them holds a step in that column.
    const [mid] = await jointBoxes(page, 'brief-the-client');
    expect(mid.lane).toBe('account-lead');
    expect(mid.x, 'the step between is in the same column').toBeCloseTo(boxes[0].x, 1);
    expect(mid.y).toBeGreaterThan(boxes[0].y);
    expect(mid.y).toBeLessThan(boxes[1].y);
    await expectTie(page, 'kick-off-the-bid', boxes);
  });
});
