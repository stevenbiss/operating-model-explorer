// Change add-wide-pannable-diagrams, Test tasks 2.1–2.18: full-width, window-height, drag-to-pan diagrams and the
// committee group's placement. Runs on dist/operating-model-explorer.html via file:// (author mode) and on snapshots
// exported through the real Export button. Tests are named "<task> <capability> › <scenario>".
// Fixtures: wide-tall-process (25 steps, 12 lanes), structure-wide-8 (eight party columns), committee-three-parties.
//
// Scenarios already covered by an existing test (not duplicated here):
//   2.8  explorer-views › Keyboard unchanged              = explorer-views.spec.js "2.36 explorer-views › Keyboard through a swimlane"
//   2.10 structure-diagrams › Many parties                = structure-diagrams.spec.js "2.33 structure-diagrams › Many parties" (structure-wide, six columns, 1024px)
//   2.14 committees › Committee lane and badge            = committees.spec.js "2.16 committees › Committee lane and badge"
//   2.15 committees › Membership shown in the member's own lane = committees.spec.js "2.17 committees › Membership shown in the member's own lane"
//   2.16 committees › Two committees in one process       = committees.spec.js "2.18 committees › Two committees in one process"
//   2.17 committees › Lane header opens the committee     = committees.spec.js "2.19 committees › Lane header opens the committee"
import { test, expect, useSnapshot, openSnapshot, openEngine, loadZip, skipPrompt, go, noHorizontalScroll } from './helpers.js';

const area = (scope) => scope.getByTestId('swimlane');
const diagram = (scope) => scope.getByTestId('structure-diagram');
const scrollOf = (loc) => loc.evaluate((el) => ({ left: el.scrollLeft, top: el.scrollTop, sw: el.scrollWidth, cw: el.clientWidth, sh: el.scrollHeight, ch: el.clientHeight }));
const pageScroll = (page) => page.evaluate(() => ({ x: window.scrollX, y: window.scrollY }));

// Scrolls the window so the area's top sits 16px below the top of the viewport (or as far as the page allows).
async function bringIntoView(page, loc) {
  await loc.evaluate((el) => window.scrollTo(0, el.getBoundingClientRect().top + window.scrollY - 16));
}

// A point inside the area's visible box that is empty: not on a step, box, link, lane header or scrollbar.
// prefer: 'br' (bottom-right first, so a drag up and left stays on screen) or 'tl'.
async function emptyPoint(loc, prefer = 'br') {
  const p = await loc.evaluate((el, prefer) => {
    const r = el.getBoundingClientRect();
    const right = Math.min(r.left + el.clientLeft + el.clientWidth, innerWidth) - 8;
    const bottom = Math.min(r.top + el.clientTop + el.clientHeight, innerHeight) - 8;
    const left = Math.max(r.left, 0) + 8;
    const top = Math.max(r.top, 0) + 8;
    const xs = [];
    const ys = [];
    for (let x = right; x >= left; x -= 12) xs.push(x);
    for (let y = bottom; y >= top; y -= 12) ys.push(y);
    if (prefer === 'tl') {
      xs.reverse();
      ys.reverse();
    }
    for (const y of ys)
      for (const x of xs) {
        const t = document.elementFromPoint(x, y);
        if (!t || !el.contains(t)) continue;
        if (t.closest('a, button, .node, [data-testid="structure-box"], .lane-heads, .more-cue')) continue;
        return { x, y };
      }
    return null;
  }, prefer);
  expect(p, 'an empty point inside the area').toBeTruthy();
  return p;
}

// A real mouse drag: down, move in steps, up.
async function drag(page, from, dx, dy, steps = 15) {
  await page.mouse.move(from.x, from.y);
  await page.mouse.down();
  await page.mouse.move(from.x + dx, from.y + dy, { steps });
  await page.mouse.up();
}

const center = async (loc) => {
  const b = await loc.boundingBox();
  return { x: b.x + b.width / 2, y: b.y + b.height / 2 };
};

// ---------------------------------------------------------------------------------------------------------------
test.describe('wide diagrams (exported wide-tall-process)', () => {
  const snap = useSnapshot('wide-tall-process');

  test('2.1 explorer-views › More steps cue', async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 768 });
    await openSnapshot(page, snap, '#/p/long-flow');
    const a = area(page);
    const s = await scrollOf(a);
    expect(s.sw, 'the swimlane is wider than its area').toBeGreaterThan(s.cw);
    expect(await noHorizontalScroll(page), 'the page does not scroll horizontally').toBe(true);
    await expect(page.getByTestId('swimlane-more')).toBeVisible();
    await expect(page.getByTestId('swimlane-more')).toContainText('More steps');
    // Lane headers stay visible, also after scrolling the area sideways.
    await bringIntoView(page, a);
    const heads = a.locator('.lane-heads');
    await expect(heads).toBeVisible();
    await a.evaluate((el) => (el.scrollLeft = 600));
    await expect.poll(() => a.evaluate((el) => el.scrollLeft)).toBeGreaterThan(0);
    const [ab, hb] = await Promise.all([a.boundingBox(), heads.boundingBox()]);
    expect(hb.x, 'lane headers pinned at the left of the area').toBeGreaterThanOrEqual(ab.x - 1);
    expect(hb.x).toBeLessThanOrEqual(ab.x + 4);
    expect(await page.evaluate(() => window.scrollX)).toBe(0);
  });

  test('2.2 explorer-views › Swimlane uses the full width (snapshot, 1920×1080)', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await openSnapshot(page, snap, '#/p/long-flow');
    const b = await area(page).boundingBox();
    expect(b.width, 'swimlane area width in the snapshot').toBeGreaterThanOrEqual(1850);
    expect(await noHorizontalScroll(page)).toBe(true);
    // The heading and summary keep their readable line length.
    const lead = await page.locator('main .lead').first().boundingBox();
    if (lead) expect(lead.width).toBeLessThan(1000);
  });

  test('2.3 explorer-views › Both scrollbars stay on screen', async ({ page }) => {
    await openSnapshot(page, snap, '#/p/long-flow');
    expect(page.viewportSize()).toEqual({ width: 1280, height: 800 });
    const a = area(page);
    await a.scrollIntoViewIfNeeded();
    await bringIntoView(page, a);
    const b = await a.boundingBox();
    expect(b.height, 'the area is no taller than the window').toBeLessThanOrEqual(800);
    expect(b.y + b.height, 'the bottom edge (with the horizontal scrollbar) is on screen').toBeLessThanOrEqual(800);
    expect(b.y).toBeGreaterThanOrEqual(0);
    const s = await scrollOf(a);
    expect(s.ch, 'the lanes are taller than the area').toBeLessThan(s.sh);
    expect(s.cw, 'the lanes are wider than the area').toBeLessThan(s.sw);
    // (Headless Chromium hides scrollbars, so the scrollbar is shown by the overflow above plus overflow-x: auto.)
    expect(await a.evaluate((el) => getComputedStyle(el).overflowX)).toMatch(/auto|scroll/);
    // The lanes scroll vertically inside it, not the page.
    const before = await pageScroll(page);
    await a.evaluate((el) => (el.scrollTop = 200));
    await expect.poll(() => a.evaluate((el) => el.scrollTop)).toBeGreaterThan(0);
    expect(await pageScroll(page)).toEqual(before);
  });

  test('2.4 explorer-views › Drag the swimlane', async ({ page }) => {
    await openSnapshot(page, snap, '#/p/long-flow');
    const a = area(page);
    await bringIntoView(page, a);
    const s0 = await scrollOf(a);
    expect(s0.sw - s0.cw, 'room to scroll 300px right').toBeGreaterThanOrEqual(300);
    expect(s0.sh - s0.ch, 'room to scroll 200px down').toBeGreaterThanOrEqual(200);
    const p0 = await pageScroll(page);
    const from = await emptyPoint(a, 'br');
    await drag(page, from, -300, -200);
    const s1 = await scrollOf(a);
    expect(s1.left - s0.left, 'scrolled right').toBeGreaterThanOrEqual(290);
    expect(s1.left - s0.left).toBeLessThanOrEqual(310);
    expect(s1.top - s0.top, 'scrolled down').toBeGreaterThanOrEqual(190);
    expect(s1.top - s0.top).toBeLessThanOrEqual(210);
    expect(await pageScroll(page), 'the page itself does not scroll').toEqual(p0);
    // Nothing opened, and no text was selected.
    await expect(page.getByTestId('step-detail')).toHaveCount(0);
    expect(await page.evaluate(() => String(getSelection()))).toBe('');
  });

  test('2.5 explorer-views › Drag starting on a step', async ({ page }) => {
    await openSnapshot(page, snap, '#/p/long-flow');
    const a = area(page);
    await bringIntoView(page, a);
    const url = page.url();
    const s0 = await scrollOf(a);
    const from = await center(a.getByTestId('step-s01').locator('.box'));
    await drag(page, from, -100, 0);
    const s1 = await scrollOf(a);
    expect(s1.left - s0.left, 'the swimlane panned').toBeGreaterThanOrEqual(90);
    expect(s1.left - s0.left).toBeLessThanOrEqual(110);
    await page.waitForTimeout(100);
    await expect(page.getByTestId('step-detail')).toHaveCount(0);
    expect(page.url(), 'the step did not open').toBe(url);
    expect(await page.evaluate(() => String(getSelection()))).toBe('');
    // The next real click still works.
    await page.mouse.click(from.x - 100, from.y);
    await expect(page.getByTestId('step-detail')).toBeVisible();
  });

  test('2.6 explorer-views › Click still opens a step', async ({ page }) => {
    await openSnapshot(page, snap, '#/p/long-flow');
    const a = area(page);
    await bringIntoView(page, a);
    const p = await center(a.getByTestId('step-s01').locator('.box'));
    await page.mouse.click(p.x, p.y);
    await expect(page.getByTestId('step-detail')).toBeVisible();
    await expect(page.getByTestId('step-detail').locator('h2#om-detail-title')).toHaveText('Step 1 of the long flow');
    await expect(page).toHaveURL(/#\/p\/long-flow\/s\/s01/);
  });

  test('2.7 explorer-views › Hand cursor', async ({ page }) => {
    await openSnapshot(page, snap, '#/p/long-flow');
    const a = area(page);
    await bringIntoView(page, a);
    const p = await emptyPoint(a, 'br');
    await page.mouse.move(p.x - 40, p.y - 40);
    await page.mouse.move(p.x, p.y, { steps: 3 });
    const cursorAt = () => page.evaluate(({ x, y }) => getComputedStyle(document.elementFromPoint(x, y)).cursor, p);
    await expect.poll(() => a.evaluate((el) => getComputedStyle(el).cursor), { message: 'open hand on the area' }).toBe('grab');
    expect(await cursorAt(), 'open hand over the empty spot under the mouse').toBe('grab');
    await page.mouse.down();
    try {
      await expect.poll(() => a.evaluate((el) => getComputedStyle(el).cursor), { message: 'closed hand while held' }).toBe('grabbing');
      expect(await cursorAt()).toBe('grabbing');
    } finally {
      await page.mouse.up();
    }
    await expect.poll(() => a.evaluate((el) => getComputedStyle(el).cursor)).toBe('grab');
  });

  test('2.9 explorer-views › Phones keep the list', { tag: '@mobile-only' }, async ({ page }) => {
    expect(page.viewportSize().width).toBe(375);
    await openSnapshot(page, snap, '#/p/long-flow');
    const a = area(page);
    await expect(a).toHaveAttribute('data-layout', 'list');
    await expect(a.locator('svg')).toHaveCount(0);
    const items = a.getByTestId('swimlane-list').locator('> li');
    await expect(items).toHaveCount(25);
    const tops = await items.evaluateAll((lis) => lis.slice(0, 5).map((li) => li.getBoundingClientRect().top));
    for (let i = 1; i < tops.length; i++) expect(tops[i]).toBeGreaterThan(tops[i - 1]);
    // No panning area: no "More steps" cue, no hand cursor, nothing scrolls inside the list.
    await expect(page.getByTestId('swimlane-more')).toHaveCount(0);
    const first = a.getByTestId('step-s01');
    await first.hover();
    await page.mouse.move(370, 400);
    const m = await a.evaluate((el) => ({ cls: el.classList.contains('can-pan'), cursor: getComputedStyle(el).cursor, ox: getComputedStyle(el).overflowX, sw: el.scrollWidth, cw: el.clientWidth }));
    expect(m.cls, 'no can-pan class').toBe(false);
    expect(['grab', 'grabbing']).not.toContain(m.cursor);
    expect(m.ox).toBe('visible');
    expect(await noHorizontalScroll(page)).toBe(true);
  });

  // html-qa B1: selecting a step re-renders the view; the swimlane keeps its place and the step stays fully in sight.
  // The step's box must end inside the area's visible box (excluding its scrollbars) and inside the window.
  const placed = (page, id) => page.evaluate((id) => {
    const el = document.querySelector('[data-testid="swimlane"]');
    const r = el.getBoundingClientRect();
    const b = document.querySelector(`svg.swimlane [data-step="${id}"] .box`).getBoundingClientRect();
    const top = r.top + el.clientTop;
    const left = r.left + el.clientLeft;
    return {
      inArea: b.top >= top - 1 && b.bottom <= top + el.clientHeight + 1 && b.left >= left - 1 && b.right <= left + el.clientWidth + 1,
      inWindow: b.top >= -1 && b.bottom <= innerHeight + 1 && b.left >= -1 && b.right <= innerWidth + 1,
      scrollTop: el.scrollTop,
    };
  }, id);

  test('B1 explorer-views › Clicking a step keeps the swimlane in place and the step in view', async ({ page }) => {
    await openSnapshot(page, snap, '#/p/long-flow');
    const a = area(page);
    await bringIntoView(page, a);
    await a.evaluate((el) => (el.scrollTop = 500));
    // A step in a lower lane whose box is vertically around the middle of the window; the area is scrolled
    // sideways so it sits in the middle horizontally too.
    const id = await page.evaluate(() => {
      const el = document.querySelector('[data-testid="swimlane"]');
      const r = el.getBoundingClientRect();
      const n = [...el.querySelectorAll('svg.swimlane .node')].find((x) => {
        const bx = x.querySelector('.box').getBoundingClientRect();
        return bx.top > 150 && bx.bottom < innerHeight - 150;
      });
      if (!n) return null;
      el.scrollLeft += n.querySelector('.box').getBoundingClientRect().left - (r.left + el.clientWidth / 2);
      return n.dataset.step;
    });
    expect(id, 'a mid-window step to click').not.toBeNull();
    await page.locator(`svg.swimlane [data-step="${id}"] .box`).click();
    await expect(page).toHaveURL(new RegExp(`/s/${id}$`));
    await expect(page.locator('#om-detail-title')).toBeVisible();
    const p = await placed(page, id);
    expect(p.inArea, 'the step is fully inside the area').toBe(true);
    expect(p.inWindow, 'the step is fully inside the window').toBe(true);
    expect(p.scrollTop, 'the area did not jump back to the top').toBeGreaterThan(0);
  });

  test('B1 explorer-views › A deep link to a step in a lower lane shows it fully', async ({ page }) => {
    await openSnapshot(page, snap, '#/p/long-flow/s/s20');
    await expect(page.locator('#om-detail-title')).toBeVisible();
    const p = await placed(page, 's20');
    expect(p.inArea, 'the step is fully inside the area').toBe(true);
    expect(p.inWindow, 'the step is fully inside the window').toBe(true);
  });
});

test.describe('wide diagrams (author mode)', () => {
  test('2.2 explorer-views › Swimlane uses the full width (author-mode preview, 1920×1080)', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await openEngine(page);
    await loadZip(page, 'wide-tall-process');
    await skipPrompt(page);
    await go(page, '#/p/long-flow');
    const pv = page.getByTestId('preview');
    const a = area(pv);
    await expect(a).toBeVisible();
    const m = await pv.evaluate((p) => {
      const cs = getComputedStyle(p);
      const pr = p.getBoundingClientRect();
      const ar = p.querySelector('[data-testid="swimlane"]').getBoundingClientRect();
      return { preview: pr.width, inner: p.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight), area: ar.width, leftGap: ar.left - pr.left, rightGap: pr.right - ar.right };
    });
    expect(m.preview, 'the preview is not capped at 1440px').toBeGreaterThan(1800);
    expect(m.leftGap, `area fills the preview's width: ${JSON.stringify(m)}`).toBeLessThanOrEqual(48);
    expect(m.rightGap, `area fills the preview's width: ${JSON.stringify(m)}`).toBeLessThanOrEqual(48);
    expect(await noHorizontalScroll(page)).toBe(true);
  });
});

// ---------------------------------------------------------------------------------------------------------------
test.describe('wide diagrams (exported structure-wide-8)', () => {
  const snap = useSnapshot('structure-wide-8');

  test('2.11 structure-diagrams › Diagram uses the full width', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await openSnapshot(page, snap, '#/d/board-map');
    await expect(diagram(page).getByTestId('structure-column')).toHaveCount(8);
    const b = await diagram(page).boundingBox();
    expect(b.width, 'diagram area width').toBeGreaterThanOrEqual(1850);
    expect(await noHorizontalScroll(page)).toBe(true);
  });

  test('2.12 structure-diagrams › Drag a wide diagram', async ({ page }) => {
    await openSnapshot(page, snap, '#/d/board-map');
    const d = diagram(page);
    await bringIntoView(page, d);
    const s0 = await scrollOf(d);
    expect(s0.sw - s0.cw, 'the diagram is at least 300px wider than its area').toBeGreaterThanOrEqual(300);
    const url = page.url();
    const p0 = await pageScroll(page);
    const from = await emptyPoint(d, 'br');
    await drag(page, from, -300, 0);
    const s1 = await scrollOf(d);
    expect(s1.left - s0.left, 'scrolled right').toBeGreaterThanOrEqual(290);
    expect(s1.left - s0.left).toBeLessThanOrEqual(310);
    expect(await pageScroll(page)).toEqual(p0);
    await page.waitForTimeout(100);
    expect(page.url(), 'releasing opens nothing').toBe(url);
    await expect(page.locator('main h1')).toHaveText('Board map');
  });

  test('2.12 structure-diagrams › Drag a wide diagram, starting on a box, opens nothing', async ({ page }) => {
    await openSnapshot(page, snap, '#/d/board-map');
    const d = diagram(page);
    await bringIntoView(page, d);
    const url = page.url();
    const s0 = await scrollOf(d);
    await drag(page, await center(d.getByTestId('structure-box').first()), -150, 0);
    expect((await scrollOf(d)).left - s0.left).toBeGreaterThanOrEqual(140);
    await page.waitForTimeout(100);
    expect(page.url()).toBe(url);
  });

  test('2.13 structure-diagrams › Click still opens a box', async ({ page }) => {
    await openSnapshot(page, snap, '#/d/board-map');
    const d = diagram(page);
    await bringIntoView(page, d);
    const p = await center(d.getByTestId('structure-box').first());
    await page.mouse.click(p.x, p.y);
    await expect(page).toHaveURL(/#\/r\/alder-lead/);
    await expect(page.locator('main h1')).toHaveText('Alder lead');
  });
});

// ---------------------------------------------------------------------------------------------------------------
test.describe('wide diagrams (exported committee-three-parties)', () => {
  const snap = useSnapshot('committee-three-parties');

  test('2.18 committees › Committee after the first party with members', async ({ page }) => {
    await openSnapshot(page, snap, '#/p/deal');
    const bands = await page.locator('.lane-heads .band').evaluateAll((gs) => gs.map((g) => ({ name: g.querySelector('.band-name').textContent.trim(), y: +g.querySelector('.band-bg').getAttribute('y') })));
    expect([...bands].sort((x, y) => x.y - y.y).map((b) => b.name)).toEqual(['Customer', 'Acme', 'Committees', 'Globex']);
    // The committee lane is under the Committees band and its step sits in it.
    const lane = await page.getByTestId('lane-deal-board').locator('.lane-hit').evaluate((r) => ({ y: +r.getAttribute('y'), h: +r.getAttribute('height') }));
    const committees = bands.find((b) => b.name === 'Committees');
    const globex = bands.find((b) => b.name === 'Globex');
    expect(lane.y).toBeGreaterThanOrEqual(committees.y);
    expect(lane.y + lane.h).toBeLessThanOrEqual(globex.y);
    const box = await page.locator('svg.swimlane [data-testid="step-decide"] .box').evaluate((r) => ({ y: +r.getAttribute('y'), h: +r.getAttribute('height') }));
    expect(box.y).toBeGreaterThanOrEqual(lane.y);
    expect(box.y + box.h).toBeLessThanOrEqual(lane.y + lane.h);
  });
});
