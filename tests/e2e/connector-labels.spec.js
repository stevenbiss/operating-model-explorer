// Change fit-connector-labels, Test tasks 2.1–2.6: connector labels fit between steps (explorer-views).
// Runs on dist/operating-model-explorer.html via file:// (author mode) and on snapshots exported through the real
// Export button, at 1280×800. Tests are named "<task> <requirement> › <scenario>".
// Overlap checks compare each forward label's <text> box (getBoundingClientRect, which covers all its tspans) against
// every step rect.box and every other forward label. Positions come from the SVG's own attributes (user units).
// Fixtures: the Acme sample, branches-five (five branches, labels up to 24 chars), branch-label-long (a 60-char label),
// and in-memory variants of branches-five for 2.8–2.11 (VARIANTS below).
import { test, expect, useSnapshot, openSnapshot, openEngine, trySample, loadZip, skipPrompt, go, variant } from './helpers.js';

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
    // Connector paths as their points (M/L/Q coordinates in order; a Q's control point is the rounded corner).
    const paths = [...s.querySelectorAll('path.edge[data-from]')].map((p) => {
      const n = (p.getAttribute('d').match(/-?\d+(?:\.\d+)?/g) || []).map(Number);
      const pts = [];
      for (let i = 0; i + 1 < n.length; i += 2) pts.push([n[i], n[i + 1]]);
      return { from: p.dataset.from, to: p.dataset.to, back: p.classList.contains('back'), pts };
    });
    return { steps, labels, paths, svg: r(s) };
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

// ---------- in-memory variants of branches-five (roles: account-lead = top lane, reviewer, solution-architect) ----------
const yq = (t) => JSON.stringify(t);
const step = (id, owner, next) =>
  `  - id: ${id}\n    name: ${yq(id.replace(/-/g, ' '))}\n    owner: ${owner}\n    raci:\n      ${owner}: A\n    next:${next.length ? '' : ' []'}\n` +
  next.map((n) => `      - to: ${n.to}\n${n.label ? `        label: ${yq(n.label)}\n` : ''}`).join('');
const proc = (id, steps) => `---\nid: ${id}\ntype: process\nname: ${yq(id.replace(/-/g, ' '))}\nworkstream: main-ws\nsteps:\n${steps.join('')}---\n`;
const fromFive = (name, pid, steps) => variant('branches-five', name, { 'processes/01-triage.md': null, [`processes/01-${pid}.md`]: proc(pid, steps) });

// 2.8: four labelled connectors (up to 60 chars) from four steps into one top-lane step.
const FOUR = {
  'src-one': 'Approved by both parties and ready to send to the client now',
  'src-two': 'Escalated to the partnership board for a decision',
  'src-three': 'Signed off by the reviewer',
  'src-four': 'Fast track',
};
const fourInto = fromFive('labels-four-into-one', 'four-into-one', [
  step('kick-off', 'account-lead', Object.keys(FOUR).map((to) => ({ to }))),
  step('src-one', 'account-lead', [{ to: 'final-step', label: FOUR['src-one'] }]),
  step('src-two', 'reviewer', [{ to: 'final-step', label: FOUR['src-two'] }]),
  step('src-three', 'solution-architect', [{ to: 'final-step', label: FOUR['src-three'] }]),
  step('src-four', 'reviewer', [{ to: 'final-step', label: FOUR['src-four'] }]),
  step('final-step', 'account-lead', []),
]);

// 2.9: one labelled branch to the next column, one two columns on into a lane with a step in the skipped column.
const skip = fromFive('labels-skip-column', 'skip-column', [
  step('decide-path', 'account-lead', [{ to: 'next-col', label: 'Needs a review' }, { to: 'far-step', label: 'Skip straight to delivery' }, { to: 'skipped-step' }]),
  step('next-col', 'reviewer', [{ to: 'far-step' }]),
  step('skipped-step', 'solution-architect', [{ to: 'far-step' }]),
  step('far-step', 'solution-architect', []),
]);

// 2.10: one 47-character hyphenated word.
const WORD = 'pre-approval-required-before-any-client-contact';
const longWord = fromFive('labels-long-word', 'long-word', [
  step('weigh-up', 'account-lead', [{ to: 'go-ahead', label: WORD }]),
  step('go-ahead', 'reviewer', []),
]);

// 2.11: six short-labelled connectors from six steps into one step.
const SIX = { 'six-a': 'Yes', 'six-b': 'No', 'six-c': 'Later', 'six-d': 'Partly', 'six-e': 'Urgent', 'six-f': 'Other' };
const SIX_OWNER = { 'six-a': 'account-lead', 'six-b': 'account-lead', 'six-c': 'reviewer', 'six-d': 'reviewer', 'six-e': 'solution-architect', 'six-f': 'solution-architect' };
const sixInto = fromFive('labels-six-into-one', 'six-into-one', [
  step('fan-out', 'account-lead', Object.keys(SIX).map((to) => ({ to }))),
  ...Object.entries(SIX).map(([id, label]) => step(id, SIX_OWNER[id], [{ to: 'merge-step', label }])),
  step('merge-step', 'reviewer', []),
]);

// Each forward connector into `to`: its source and the y where it enters (its last point), top to bottom.
const entries = (m, to) =>
  m.paths
    .filter((p) => p.to === to && !p.back)
    .map((p) => ({ from: p.from, x: p.pts[p.pts.length - 1][0], y: p.pts[p.pts.length - 1][1] }))
    .sort((a, b) => a.y - b.y);

// Points along each straight run of a path (corners included), every 2px.
function samples(pts) {
  const out = [];
  for (let i = 1; i < pts.length; i++) {
    const [[x0, y0], [x1, y1]] = [pts[i - 1], pts[i]];
    const n = Math.max(1, Math.ceil(Math.hypot(x1 - x0, y1 - y0) / 2));
    for (let k = 0; k <= n; k++) out.push([x0 + ((x1 - x0) * k) / n, y0 + ((y1 - y0) * k) / n]);
  }
  return out;
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

  test.describe(`connector labels, many-entry variants (${mode})`, () => {
    const four = mode === 'snapshot' ? useSnapshot(fourInto) : null;
    const sk = mode === 'snapshot' ? useSnapshot(skip) : null;
    const word = mode === 'snapshot' ? useSnapshot(longWord) : null;
    const six = mode === 'snapshot' ? useSnapshot(sixInto) : null;

    test(`2.8 ${REQ} › Several labels into one step [${mode}]`, async ({ page }) => {
      const m = await fixtureProcess(mode, page, four, fourInto, 'four-into-one');
      const s = byId(m);
      const t = s['final-step'];
      expect(t.y, 'target in the top lane').toBe(Math.min(...m.steps.map((x) => x.y)));
      expect(Math.max(...Object.values(FOUR).map((l) => l.length))).toBe(60);
      // Each connector enters the step's left edge at its own point, at least 16px apart.
      const ins = entries(m, 'final-step');
      expect(ins.map((e) => e.from).sort()).toEqual(Object.keys(FOUR).sort());
      for (const e of ins) {
        expect(e.x, `${e.from} enters at the left edge`).toBe(t.x - 3);
        expect(e.y, `${e.from} enters within the step`).toBeGreaterThanOrEqual(t.y);
        expect(e.y, `${e.from} enters within the step`).toBeLessThanOrEqual(t.y + 70);
      }
      for (let i = 1; i < ins.length; i++) expect(ins[i].y - ins[i - 1].y, `entry ${i} apart from ${i - 1}`).toBeGreaterThanOrEqual(16);
      // All four labels in full, inside the diagram, clear of steps and of each other.
      for (const text of Object.values(FOUR)) label(m, text);
      expectClear(m);
      // Labels run top to bottom in the same order as their connectors.
      const labelOrder = Object.values(FOUR).map((text) => ({ text, top: label(m, text).rect.top })).sort((a, b) => a.top - b.top).map((x) => x.text);
      expect(labelOrder).toEqual(ins.map((e) => FOUR[e.from]));
    });

    test(`2.9 ${REQ} › Branch that skips a column [${mode}]`, async ({ page }) => {
      const m = await fixtureProcess(mode, page, sk, skip, 'skip-column');
      const s = byId(m);
      // Set-up: far-step is two columns on, in a lane that has a step in the skipped column.
      const xs = ranks(m);
      expect(xs.indexOf(s['far-step'].x) - xs.indexOf(s['decide-path'].x)).toBe(2);
      expect(xs.indexOf(s['skipped-step'].x)).toBe(xs.indexOf(s['decide-path'].x) + 1);
      expect(s['skipped-step'].y).toBe(s['far-step'].y);
      // The longer branch passes no step box.
      const p = m.paths.find((x) => x.from === 'decide-path' && x.to === 'far-step');
      expect(p, 'decide-path → far-step connector').toBeTruthy();
      for (const st of m.steps)
        for (const [x, y] of samples(p.pts)) {
          const inside = x > st.x + 0.5 && x < st.x + NW - 0.5 && y > st.y + 0.5 && y < st.y + 70 - 0.5;
          expect(inside, `long branch passes through ${st.id} at (${x.toFixed(1)}, ${y.toFixed(1)})`).toBe(false);
        }
      // Its label sits clear of every step box (and the other label).
      expect(forward(m).map((l) => l.text).sort()).toEqual(['Needs a review', 'Skip straight to delivery']);
      expectClear(m);
    });

    test(`2.10 ${REQ} › One very long word [${mode}]`, async ({ page }) => {
      expect(WORD.length).toBe(47);
      expect(WORD).not.toMatch(/\s/);
      const m = await fixtureProcess(mode, page, word, longWord, 'long-word');
      const l = label(m, WORD); // textContent equals the whole word: nothing cut, no added spaces
      expect(l.tspans, 'more than one line').toBeGreaterThanOrEqual(2);
      expect(new Set(l.tspanPos.map((p) => p[1])).size).toBe(l.tspans);
      expectClear(m);
    });

    test(`2.11 ${REQ} › Many connectors into one step [${mode}]`, async ({ page }) => {
      const m = await fixtureProcess(mode, page, six, sixInto, 'six-into-one');
      const t = byId(m)['merge-step'];
      const ins = entries(m, 'merge-step');
      expect(ins.length).toBe(6);
      for (const e of ins) {
        expect(e.x, `${e.from} enters at the left edge`).toBe(t.x - 3);
        expect(e.y, `${e.from} enters within the step's left edge`).toBeGreaterThanOrEqual(t.y);
        expect(e.y, `${e.from} enters within the step's left edge`).toBeLessThanOrEqual(t.y + 70);
      }
      expect(new Set(ins.map((e) => e.y)).size, 'six distinct entry points').toBe(6);
      expect(forward(m).map((l) => l.text).sort()).toEqual(Object.values(SIX).sort());
      expectClear(m);
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
