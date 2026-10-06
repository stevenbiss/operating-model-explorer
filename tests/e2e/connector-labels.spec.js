// Change fit-connector-labels, Test tasks 2.1–2.6: connector labels fit between steps (explorer-views).
// Runs on dist/operating-model-explorer.html via file:// (author mode) and on snapshots exported through the real
// Export button, at 1280×800. Tests are named "<task> <requirement> › <scenario>".
// Overlap checks compare each forward label's <text> box (getBoundingClientRect, which covers all its tspans) against
// every step rect.box and every other forward label. Positions come from the SVG's own attributes (user units).
// Fixtures: the Acme sample, branches-five (five branches, labels up to 24 chars), branch-label-long (a 60-char label).
import { test, expect, useSnapshot, openSnapshot, openEngine, trySample, loadZip, skipPrompt, go } from './helpers.js';

const REQ = 'explorer-views › Connector labels fit between steps';
const NW = 164;
const GAP_TODAY = 80;
// 1.7.0's fixed spacing: HEAD 196 + GAP 40 + rank * (NW 164 + 80).
const fixedX = (rank) => 236 + 244 * rank;

// Everything the checks need from the swimlane on screen.
async function measure(page) {
  const svg = page.getByTestId('swimlane').locator('svg.swimlane').first();
  await expect(svg).toBeVisible();
  return svg.evaluate((s) => {
    const r = (el) => {
      const b = el.getBoundingClientRect();
      return { left: b.left, right: b.right, top: b.top, bottom: b.bottom, width: b.width, height: b.height };
    };
    const steps = [...s.querySelectorAll('g.node[data-step]')].map((g) => {
      const box = g.querySelector('rect.box');
      return { id: g.dataset.step, x: +box.getAttribute('x'), y: +box.getAttribute('y'), rect: r(box) };
    });
    const labels = [...s.querySelectorAll('text.edge-label')].map((t) => {
      const cs = getComputedStyle(t);
      return {
        text: t.textContent,
        anchor: t.getAttribute('text-anchor'),
        x: +t.getAttribute('x'),
        y: +t.getAttribute('y'),
        tspans: t.querySelectorAll('tspan').length,
        tspanPos: [...t.querySelectorAll('tspan')].map((ts) => [+ts.getAttribute('x'), +ts.getAttribute('y')]),
        visible: cs.visibility !== 'hidden' && cs.display !== 'none' && +cs.opacity > 0,
        rect: r(t),
      };
    });
    return { steps, labels, svg: r(s) };
  });
}

const overlaps = (a, b) => a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;
const byId = (m) => Object.fromEntries(m.steps.map((s) => [s.id, s]));
const label = (m, text) => {
  const l = m.labels.find((x) => x.text === text);
  expect(l, `label "${text}" drawn in full`).toBeTruthy();
  return l;
};
const forward = (m) => m.labels.filter((l) => l.anchor === 'end');

// No forward label overlaps a step box or another forward label; each lies inside the SVG and is visible.
function expectClear(m) {
  const fw = forward(m);
  expect(fw.length, 'forward labels').toBeGreaterThan(0);
  for (const l of fw) {
    expect(l.visible, `"${l.text}" visible`).toBe(true);
    expect(l.rect.width, `"${l.text}" has a box`).toBeGreaterThan(0);
    expect(l.rect.left, `"${l.text}" inside the diagram (left)`).toBeGreaterThanOrEqual(m.svg.left);
    expect(l.rect.right, `"${l.text}" inside the diagram (right)`).toBeLessThanOrEqual(m.svg.right);
    for (const s of m.steps) expect(overlaps(l.rect, s.rect), `"${l.text}" overlaps step box ${s.id}: ${JSON.stringify({ label: l.rect, box: s.rect })}`).toBe(false);
    for (const o of fw) if (o !== l) expect(overlaps(l.rect, o.rect), `"${l.text}" overlaps "${o.text}"`).toBe(false);
  }
}

// The label sits between its source's right edge and its target's left edge, just before the target.
function expectBetween(m, text, from, to) {
  const s = byId(m);
  const l = label(m, text);
  expect(l.rect.left, `"${text}" starts after ${from}`).toBeGreaterThanOrEqual(s[from].rect.right);
  expect(l.rect.right, `"${text}" ends before ${to}`).toBeLessThanOrEqual(s[to].rect.left);
  expect(s[to].rect.left - l.rect.right, `"${text}" just before ${to}`).toBeLessThan(16);
  return l;
}

async function sampleProcess(mode, page, snap, pid) {
  if (mode === 'snapshot') await openSnapshot(page, snap, `#/p/${pid}`);
  else {
    await openEngine(page);
    await trySample(page);
    await skipPrompt(page);
    await go(page, `#/p/${pid}`);
  }
  await expect(page.getByTestId('swimlane')).toHaveAttribute('data-layout', 'svg');
  return measure(page);
}

async function fixtureProcess(mode, page, snap, fixture, pid) {
  if (mode === 'snapshot') await openSnapshot(page, snap, `#/p/${pid}`);
  else {
    await openEngine(page);
    await loadZip(page, fixture);
    await skipPrompt(page);
    await go(page, `#/p/${pid}`);
  }
  await expect(page.getByTestId('swimlane')).toHaveAttribute('data-layout', 'svg');
  return measure(page);
}

// Step rank = its column, from the distinct x positions in order.
const ranks = (m) => [...new Set(m.steps.map((s) => s.x))].sort((a, b) => a - b);

for (const mode of ['snapshot', 'author']) {
  test.describe(`connector labels (${mode})`, () => {
    const sample = mode === 'snapshot' ? useSnapshot('sample') : null;
    const five = mode === 'snapshot' ? useSnapshot('branches-five') : null;
    const long = mode === 'snapshot' ? useSnapshot('branch-label-long') : null;

    test(`2.1 ${REQ} › Short label, no change [${mode}]`, async ({ page }) => {
      const m = await sampleProcess(mode, page, sample, 'qualify-opportunity');
      // The only branch labels are "Go" and "No go".
      expect(m.labels.map((l) => l.text).sort()).toEqual(['Go', 'No go']);
      // Every column keeps 1.7.0's width.
      const xs = ranks(m);
      xs.forEach((x, k) => expect(x, `column ${k}`).toBe(fixedX(k)));
      for (const s of m.steps) expect(xs.includes(s.x)).toBe(true);
      // Each label sits clear of the step boxes, just before its target.
      expectBetween(m, 'Go', 'go-no-go', 'kick-off-bid');
      expectBetween(m, 'No go', 'go-no-go', 'decline');
      expectClear(m);
    });

    test(`2.2 ${REQ} › Long label widens its gap [${mode}]`, async ({ page }) => {
      const m = await sampleProcess(mode, page, sample, 'build-proposal');
      const s = byId(m);
      const gap = s['submit-proposal'].x - s['review-proposal'].x - NW;
      expect(gap, 'gap before "Submit the proposal" wider than today').toBeGreaterThan(GAP_TODAY);
      // Columns without such labels keep today's width.
      const xs = ranks(m);
      const k = xs.indexOf(s['submit-proposal'].x);
      for (let i = 1; i < xs.length; i++) if (i !== k) expect(xs[i] - xs[i - 1] - NW, `gap before column ${i}`).toBe(GAP_TODAY);
      expect(xs[0]).toBe(fixedX(0));
      // Fully visible between the two steps on one line, overlapping no step box.
      const l = expectBetween(m, 'Approved, ready to submit', 'review-proposal', 'submit-proposal');
      expect(l.tspans, 'one line').toBe(0);
      expectClear(m);
    });

    test(`2.3 ${REQ} › Five-branch decision [${mode}]`, async ({ page }) => {
      const m = await fixtureProcess(mode, page, five, 'branches-five', 'triage');
      const BR = { 'Existing account': 'grow-account', 'New initiative': 'start-initiative', 'Not for us': 'decline-request', 'Refer to the other party': 'refer-request', 'Park or decline': 'park-request' };
      expect(Math.max(...Object.keys(BR).map((t) => t.length))).toBeLessThanOrEqual(24);
      expect(forward(m).map((l) => l.text).sort()).toEqual(Object.keys(BR).sort());
      for (const [t, to] of Object.entries(BR)) expectBetween(m, t, 'decide-route', to);
      expectClear(m);
    });

    test(`2.4 ${REQ} › Label past the maximum wraps [${mode}]`, async ({ page }) => {
      const TEXT = 'Approved by both parties and ready to send to the client now';
      expect(TEXT.length).toBe(60);
      const m = await fixtureProcess(mode, page, long, 'branch-label-long', 'approve');
      const s = byId(m);
      const gap = s['send-offer'].x - s['check-offer'].x - NW;
      expect(gap, 'gap at most 220px').toBeLessThanOrEqual(220);
      const l = expectBetween(m, TEXT, 'check-offer', 'send-offer');
      expect(l.tspans, 'two or more lines').toBeGreaterThanOrEqual(2);
      // Distinct line positions, in full (textContent above already equals the whole label, nothing cut).
      expect(new Set(l.tspanPos.map((p) => p[1])).size).toBe(l.tspans);
      expect(l.text).not.toContain('…');
      expectClear(m);
    });

    test(`2.5 ${REQ} › Loop-back label unchanged [${mode}]`, async ({ page }) => {
      const m = await sampleProcess(mode, page, sample, 'build-proposal');
      const s = byId(m);
      const l = label(m, 'Needs rework');
      const [a, b] = [s['review-proposal'], s['design-solution']];
      // 1.7.0 placement: centred between the two steps' centres, under the steps (below both boxes).
      expect(l.anchor).toBe('middle');
      expect(l.x).toBe((a.x + NW / 2 + b.x + NW / 2) / 2);
      expect(l.rect.top, 'under the source box').toBeGreaterThanOrEqual(a.rect.bottom);
      expect(l.rect.top, 'under the target box').toBeGreaterThanOrEqual(b.rect.bottom);
      expect(l.tspans).toBe(0);
    });
  });
}

test.describe('connector labels: author mode vs snapshot', () => {
  const snap = useSnapshot('sample');
  for (const pid of ['build-proposal', 'qualify-opportunity']) {
    test(`2.6 ${REQ} › Same layout in the snapshot [${pid}]`, async ({ page }) => {
      const strip = (m) => ({ steps: m.steps.map(({ id, x, y }) => ({ id, x, y })), labels: m.labels.map(({ text, anchor, x, y, tspanPos }) => ({ text, anchor, x, y, tspanPos })) });
      const preview = strip(await sampleProcess('author', page, null, pid));
      const exported = strip(await sampleProcess('snapshot', page, snap, pid));
      expect(preview.steps.length).toBeGreaterThan(0);
      expect(preview.labels.length).toBeGreaterThan(0);
      expect(exported).toEqual(preview);
    });
  }
});
