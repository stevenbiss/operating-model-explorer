import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { loadModel } from '../../src/model/load.js';
import { columns, entryPoints, flow, labelLines, labelWidth } from '../../src/model/layout.js';
import { swimlaneSvg } from '../../src/viewer/swimlane.js';
import { files, MODEL, readFolder, SAMPLE, withoutAccountable } from './helpers.js';

const sample = loadModel(readFolder(SAMPLE)).model;
const ranks = (f) => Object.fromEntries(Object.entries(f.nodes).map(([id, n]) => [id, n.rank]));
const pairs = (f) => f.edges.map((e) => `${e.from}>${e.to}${e.label ? `:${e.label}` : ''}${e.back ? ' (back)' : ''}`);

// A tiny model with one process; steps given as YAML lines.
function mini(steps) {
  const m = loadModel(
    files({
      'model.md': MODEL,
      'parties/a.md': '---\nid: pa\ntype: party\nname: A\n---\n',
      'parties/b.md': '---\nid: pb\ntype: party\nname: B\n---\n',
      'roles/x.md': '---\nid: rx\ntype: role\nname: X\nparty: pa\n---\n',
      'roles/y.md': '---\nid: ry\ntype: role\nname: Y\nparty: pb\n---\n',
      'workstreams/w.md': '---\nid: w\ntype: workstream\nname: W\nsummary: S\ndetail: detailed\n---\n',
      'processes/p.md': `---\nid: p\ntype: process\nname: P\nworkstream: w\nsteps:\n${steps}---\n`,
    }),
  );
  assert.deepEqual(withoutAccountable(m.messages), []);
  return m.model;
}
const step = (id, owner, extra = '') => `  - id: ${id}\n    name: ${id}\n    owner: ${owner}\n${extra}`;
const removed = '    change: { status: removed }\n';

test('rank is the longest path from the start; decision branches share a column', () => {
  const f = flow(sample, 'qualify-opportunity');
  assert.deepEqual(ranks(f), { 'capture-lead': 0, 'assess-fit': 1, 'go-no-go': 2, decline: 3, 'kick-off-bid': 3 });
  assert.deepEqual(pairs(f).filter((p) => p.startsWith('go-no-go')), ['go-no-go>kick-off-bid:Go', 'go-no-go>decline:No go']);
  assert.equal(f.ranks, 4);
});

test('a rework loop is a back-edge and does not count for rank', () => {
  const f = flow(sample, 'build-proposal');
  assert.ok(pairs(f).includes('review-proposal>design-solution:Needs rework (back)'));
  assert.equal(f.edges.filter((e) => e.back).length, 1);
  assert.equal(f.nodes['design-solution'].rank, 1);
  assert.equal(f.nodes['submit-proposal'].rank, 4);
});

test('removed steps are hidden and bridged while change markers are off, and shown when on', () => {
  const off = flow(sample, 'build-proposal');
  assert.ok(!off.nodes['courier-copies']);
  assert.ok(!pairs(off).some((p) => p.includes('courier')));
  const on = flow(sample, 'build-proposal', { showRemoved: true });
  assert.equal(on.nodes['courier-copies'].rank, 5);
  assert.ok(pairs(on).includes('submit-proposal>courier-copies'));
});

test('bridging connects the predecessor to the removed step\'s successors, keeping the branch label', () => {
  const m = mini(
    step('a', 'rx', '    next: [{ to: b, label: Yes }, { to: d, label: No }]\n') +
      step('b', 'rx', removed) +
      step('c', 'ry', removed) +
      step('d', 'ry'),
  );
  assert.deepEqual(pairs(flow(m, 'p')), ['a>d:Yes']);
  assert.deepEqual(pairs(flow(m, 'p', { showRemoved: true })), ['a>b:Yes', 'a>d:No', 'b>c', 'c>d']);
});

test('a removed loop cannot create a self-connection', () => {
  const m = mini(step('a', 'rx') + step('b', 'rx', `    next: [a]\n${removed}`));
  assert.deepEqual(pairs(flow(m, 'p')), []);
});

test('lanes are grouped by party in content order, including RACI-only roles, with the committee between the parties', () => {
  const f = flow(sample, 'qualify-opportunity');
  assert.deepEqual(
    f.groups.map((g) => [g.party, g.lanes]),
    [
      ['acme', ['account-lead', 'bid-manager', 'delivery-manager']],
      [null, ['bid-board']],
      ['globex', ['partner-manager', 'solution-architect']],
    ],
  );
  assert.deepEqual(flow(sample, 'build-proposal').groups.map((g) => g.party), ['acme', 'globex'], 'no committees group without committee steps');
  assert.equal(f.rows['delivery-manager'], 0, 'consulted/informed only');
  assert.equal(f.rows['account-lead'], 1);
});

test('steps in the same lane and column stack, and flow order follows rank then lane', () => {
  const m = mini(step('a', 'rx', '    next: [b, c]\n') + step('b', 'ry', '    next: [d]\n') + step('c', 'ry', '    next: [d]\n') + step('d', 'rx'));
  const f = flow(m, 'p');
  assert.deepEqual([f.nodes.b.slot, f.nodes.c.slot], [0, 1]);
  assert.equal(f.rows.ry, 2);
  assert.deepEqual(f.order, ['a', 'b', 'c', 'd']);
  assert.ok(f.edges.every((e) => e.crossParty));
});

// ---------- committee lanes (committees spec › Committee lanes in the swimlane, design D3, D8) ----------

// Parties A, B and C; roles x (A), y (B), z (C); committees listed as given.
function withCommittees(steps, committees = {}) {
  const m = loadModel(
    files({
      'model.md': MODEL,
      'parties/a.md': '---\nid: pa\ntype: party\nname: A\n---\n',
      'parties/b.md': '---\nid: pb\ntype: party\nname: B\n---\n',
      'parties/c.md': '---\nid: pc\ntype: party\nname: C\n---\n',
      'roles/x.md': '---\nid: rx\ntype: role\nname: X\nparty: pa\n---\n',
      'roles/y.md': '---\nid: ry\ntype: role\nname: Y\nparty: pb\n---\n',
      'roles/z.md': '---\nid: rz\ntype: role\nname: Z\nparty: pc\n---\n',
      'workstreams/w.md': '---\nid: w\ntype: workstream\nname: W\nsummary: S\ndetail: detailed\n---\n',
      ...Object.fromEntries(Object.entries(committees).map(([id, members], i) => [`committees/${i}-${id}.md`, `---\nid: ${id}\ntype: committee\nname: ${id}\nmembers: ${members}\n---\n`])),
      'processes/p.md': `---\nid: p\ntype: process\nname: P\nworkstream: w\nsteps:\n${steps}---\n`,
    }),
  );
  // Committee-level warnings (one A member, all A from one party, owns no step) don't matter for layout.
  assert.deepEqual(withoutAccountable(m.messages).filter((x) => !(x.level === 'warning' && /committee/.test(x.problem))), []);
  return m.model;
}
const XY = '{rx: A, ry: A}';

test('2.16 a committee lane sits in one group directly after the first party group; its members take part', () => {
  const f = flow(withCommittees(step('a', 'rx') + step('b', 'board') + step('c', 'ry'), { board: XY }), 'p');
  assert.deepEqual(f.groups.map((g) => [g.party, !!g.committee, g.lanes]), [['pa', false, ['rx']], [null, true, ['board']], ['pb', false, ['ry']]]);
  assert.deepEqual(f.lanes, ['rx', 'board', 'ry']);
  assert.equal(f.nodes.b.lane, 1);
  assert.equal(f.rows.board, 1);
  assert.deepEqual(f.order, ['a', 'b', 'c']);
});

test('2.21 handoffs into and out of a committee are cross-party by party sets', () => {
  const m = withCommittees(step('a', 'rx', '    next: [b]\n') + step('b', 'onlyx', '    next: [c]\n') + step('c', 'board', '    next: [d]\n') + step('d', 'board2', '    next: [e]\n') + step('e', 'board'), { onlyx: '{rx: A}', board: XY, board2: '{ry: A, rx: A}' });
  const cross = Object.fromEntries(flow(m, 'p').edges.map((e) => [`${e.from}>${e.to}`, e.crossParty]));
  // a committee with only party A members is not a cross-party handoff from an A step; one with A and B is.
  assert.deepEqual(cross, { 'a>b': false, 'b>c': true, 'c>d': false, 'd>e': false });
});

test('2.18 two committees: one group, in the order their first steps appear in the flow, not content order', () => {
  const m = withCommittees(step('a', 'rx') + step('b', 'second') + step('c', 'first') + step('d', 'rz'), { first: XY, second: '{rx: A, rz: A}' });
  const f = flow(m, 'p');
  assert.deepEqual(m.order.committee, ['first', 'second']);
  // ry takes part only through "first", so it is idle there and has no lane (list-idle-committee-members D2).
  assert.deepEqual(f.groups.map((g) => g.lanes), [['rx'], ['second', 'first'], ['rz']]);
  assert.deepEqual(f.idle, { second: [], first: ['ry'] });
  assert.equal(f.groups.filter((g) => g.committee).length, 1);
});

test('2.18 committee after the first party with members: Customer (A), Acme (B), Committees, Globex (C)', () => {
  // ry is informed on a role-owned step, so it has a lane and the B group is shown (an idle member would have none).
  const f = flow(withCommittees(step('a', 'rx', '    raci: { ry: I }\n') + step('b', 'board') + step('c', 'rz'), { board: '{ry: A, rz: A}' }), 'p');
  assert.deepEqual(f.groups.map((g) => (g.committee ? 'committees' : g.party)), ['pa', 'pb', 'committees', 'pc']);
  assert.deepEqual(f.lanes, ['rx', 'ry', 'board', 'rz']);
});

test('committees sit where the first member party would be when all its members are idle: Customer, Committees, Globex', () => {
  const f = flow(withCommittees(step('a', 'rx') + step('b', 'board') + step('c', 'rz'), { board: '{ry: A}' }), 'p');
  assert.deepEqual(f.groups.map((g) => (g.committee ? 'committees' : g.party)), ['pa', 'committees', 'pc']);
  assert.deepEqual(f.idle, { board: ['ry'] });
});

test('with only one party group shown, the committees group sits after it', () => {
  const f = flow(withCommittees(step('a', 'board') + step('b', 'rx'), { board: '{rx: A}' }), 'p');
  assert.deepEqual(f.groups.map((g) => g.lanes), [['rx'], ['board']]);
});

test('2.61 a process with no committee-owned steps has the same layout as before, with no committees group', () => {
  const steps = step('a', 'rx', '    next: [b, c]\n') + step('b', 'ry', '    next: [d]\n') + step('c', 'ry', '    raci: { rz: C }\n    next: [d]\n') + step('d', 'rx');
  const plain = flow(withCommittees(steps), 'p');
  assert.ok(!plain.groups.some((g) => g.committee));
  // The same process in a model with a committee that owns nothing here: an identical layout.
  assert.deepEqual(flow(withCommittees(steps, { board: XY }), 'p'), plain);
  assert.deepEqual(plain.idle, {});
});

// ---------- idle committee members (list-idle-committee-members D2) ----------

test('1.1 a member that takes part only through its committee is idle: no lane, listed in idle', () => {
  const f = flow(withCommittees(step('a', 'rx') + step('b', 'board'), { board: XY }), 'p');
  assert.deepEqual(f.lanes, ['rx', 'board']);
  assert.deepEqual(f.idle, { board: ['ry'] });
});

test('1.1 a member that owns a step keeps its lane and is not idle', () => {
  const f = flow(withCommittees(step('a', 'board') + step('b', 'ry'), { board: XY }), 'p');
  assert.ok(f.lanes.includes('ry'));
  assert.deepEqual(f.idle, { board: ['rx'] });
});

test('1.1 a member with a letter on a role-owned step keeps its lane', () => {
  const f = flow(withCommittees(step('a', 'rx', '    raci: { ry: I }\n') + step('b', 'board'), { board: XY }), 'p');
  assert.deepEqual(f.lanes, ['rx', 'board', 'ry']);
  assert.deepEqual(f.idle, { board: [] });
});

test("1.1 a member with a letter on its own committee's step is still idle", () => {
  const f = flow(withCommittees(step('a', 'rx') + step('b', 'board', '    raci: { ry: C }\n'), { board: XY }), 'p');
  assert.ok(!f.lanes.includes('ry'));
  assert.deepEqual(f.idle, { board: ['ry'] });
});

test('1.1 a letter on a step owned by a committee the role is not on counts as taking part', () => {
  const f = flow(withCommittees(step('a', 'rx') + step('b', 'board', '    raci: { rz: I }\n') + step('c', 'panel'), { board: XY, panel: '{rz: A, rx: A}' }), 'p');
  assert.ok(f.lanes.includes('rz'));
  assert.deepEqual(f.idle, { board: ['ry'], panel: [] });
});

test('1.1 a role idle in two committees is listed in both', () => {
  const f = flow(withCommittees(step('a', 'rx') + step('b', 'board') + step('c', 'panel'), { board: XY, panel: '{ry: A, rx: A}' }), 'p');
  assert.ok(!f.lanes.includes('ry'));
  assert.deepEqual(f.idle, { board: ['ry'], panel: ['ry'] });
});

test('1.7 idle members are ordered by their letter (A, R, C, I) first, then party order', () => {
  // Party order is rx (A), ry (B), rz (C); letters put the last party's A member first.
  const f = flow(withCommittees(step('a', 'board'), { board: '{rx: C, ry: I, rz: A}' }), 'p');
  assert.deepEqual(f.idle, { board: ['rz', 'rx', 'ry'] });
  const g = flow(withCommittees(step('a', 'board'), { board: '{rx: I, ry: R, rz: C}' }), 'p');
  assert.deepEqual(g.idle, { board: ['ry', 'rz', 'rx'] });
});

test('1.1 idle members are in party order, then role order, not member order', () => {
  const f = flow(withCommittees(step('a', 'board'), { board: '{rz: C, ry: A, rx: A}' }), 'p');
  assert.deepEqual(f.idle, { board: ['rx', 'ry', 'rz'] });
  assert.deepEqual(f.lanes, ['board']);
});

test("1.1 idleness is per process: the sample's Legal counsel is idle in Qualify and has a lane in Build the proposal", () => {
  assert.deepEqual(flow(sample, 'qualify-opportunity').idle, { 'bid-board': ['legal-counsel'] });
  assert.ok(!flow(sample, 'qualify-opportunity').lanes.includes('legal-counsel'));
  assert.ok(flow(sample, 'build-proposal').lanes.includes('legal-counsel'));
});

// fit-connector-labels 1.1: column positions sized to connector labels (D2, D3).
const gaps = (f) => {
  const { x } = columns(f);
  return x.slice(1).map((v, k) => v - x[k] - 164);
};
const chain = (label) => mini(step('a', 'rx') + step('b', 'ry', label ? `    next:\n      - to: c\n        label: ${label}\n` : '') + step('c', 'rx') + step('d', 'ry'));

test('1.1 with no labels every step keeps its 1.7.0 position', () => {
  assert.deepEqual(columns(flow(chain(), 'p')).x, [0, 1, 2, 3].map((k) => 196 + k * 244 + 40));
  // Short labels keep 1.7.0's 80px gaps: "No go" (44) + 24 is under the minimum.
  assert.deepEqual(gaps(flow(chain('No go'), 'p')), [80, 80, 80]);
  assert.deepEqual(gaps(flow(sample, 'qualify-opportunity')), [80, 80, 80]);
});

test('1.1 a long label widens only the gap in front of its target', () => {
  const label = 'Needs a second look'; // 19 characters
  assert.equal(labelWidth(label), Math.ceil(19.25 * 6.4) + 8, 'one capital');
  assert.deepEqual(gaps(flow(chain(label), 'p')), [80, labelWidth(label) + 24, 80]);
  // The sample: the gap before "Submit the proposal" is wider than 1.7.0's 80px.
  const f = flow(sample, 'build-proposal');
  assert.equal(gaps(f)[f.nodes['submit-proposal'].rank - 1], labelWidth('Approved, ready to submit') + 24);
  assert.equal(labelWidth('Approved, ready to submit') + 24, 194);
  assert.deepEqual(labelLines('Approved, ready to submit'), ['Approved, ready to submit'], 'fits on one line');
});

test('1.1 a 60-character label caps its gap at 220px', () => {
  const label = 'Approved by both parties and ready to send to the client now';
  assert.equal(label.length, 60);
  assert.deepEqual(gaps(flow(chain(label), 'p')), [80, 220, 80]);
  const lines = labelLines(label);
  assert.ok(lines.length >= 2);
  assert.equal(lines.join(' '), label, 'wrapped at spaces, nothing cut');
  for (const l of lines) assert.ok(labelWidth(l) <= 196, `${l}: ${labelWidth(l)}`);
});

test('1.1 a word longer than a line breaks after "-" or "/", or else mid-word, and nothing is cut', () => {
  const hyphen = 'cross-functional-reprioritisation-required-now'; // 47 characters
  const lines = labelLines(hyphen);
  assert.ok(lines.length > 1);
  assert.equal(lines.join(''), hyphen);
  for (const l of lines) assert.ok(labelWidth(l) + 24 <= 220, l);
  assert.ok(lines.slice(0, -1).every((l) => l.endsWith('-')), 'breaks after hyphens');
  assert.deepEqual(labelLines('Send to legal/commercial/procurement/finance/approvals'), ['Send to legal/commercial/', 'procurement/finance/approvals']);
  const word = 'x'.repeat(40);
  const plain = labelLines(`Go ${word} now`);
  assert.equal(plain.join(' ').replace(/(x) (x)/, '$1$2'), `Go ${word} now`);
  assert.ok(plain.every((l) => labelWidth(l) + 24 <= 220), 'split mid-word into pieces that fit');
});

test('1.1 wide characters (U+2E80 and up) count as 1.7, W and M 1.5, other capitals 1.25', () => {
  assert.equal(labelWidth('承認'), Math.ceil(3.4 * 6.4) + 8);
  assert.equal(labelWidth('ab'), Math.ceil(2 * 6.4) + 8);
  assert.equal(labelWidth('Ab'), Math.ceil(2.25 * 6.4) + 8, 'capitals count as 1.25');
  assert.equal(labelWidth('WM'), Math.ceil(3 * 6.4) + 8, 'W and M count as 1.5');
});

const branches = (...bs) => `    next:\n${bs.map(([to, label]) => `      - to: ${to}\n        label: ${label}\n`).join('')}`;

// Renders a process's swimlane in Node, with a minimal viewer context.
const L = Object.assign((k) => k, { lower: (k) => k, a: (k) => k });
const svgOf = (m, p) => {
  const f = flow(m, p);
  const html = swimlaneSvg({ m, f, L, dp: () => '', mark: () => '', mine: null, cue: () => null, badge: () => null, stepLabel: (s) => s.name, roleHref: () => '#', letterWord: (l) => l, label: 'P', selected: null });
  const box = (id) => {
    const [, x, y] = html.match(new RegExp(`data-step="${id}"[^]*?<rect class="box" x="([\\d.]+)" y="([\\d.]+)"`));
    return { x: +x, y: +y, cy: +y + 35 };
  };
  const edge = (a, b) => html.match(new RegExp(`d="([^"]*)"[^>]*data-from="${a}" data-to="${b}"`))[1];
  return { f, html, box, edge, cols: columns(f).x };
};

test('1.1 a branch that skips a column bends just past the column before its target, not along the target lane', () => {
  // a -> b -> d and a -> d: d is two columns on, in b's lane, so a lane-level run at d's height would pass behind b.
  const m = mini(step('a', 'rx', branches(['b', 'Next'], ['d', 'Skip ahead'])) + step('b', 'ry', '    next: [d]\n') + step('d', 'ry'));
  const { edge, box, cols } = svgOf(m, 'p');
  const mx = cols[1] + 164 + 12;
  const a = box('a');
  assert.ok(edge('a', 'd').includes(`Q${mx} ${a.cy}`), `bends at x=${mx}: ${edge('a', 'd')}`);
  assert.ok(edge('a', 'b').includes(`Q${a.x + 164 + 12} ${a.cy}`), 'adjacent columns bend just past the source');
});

test('1.1 a skip branch past a step in its own lane runs along the lane boundary, through no step box', () => {
  // s -> mid -> far, all in rx's lane, and s -> far (labelled): mid sits in the skipped column at s's height.
  const m = mini(step('s', 'rx', branches(['mid', 'Next'], ['far', 'Skip ahead'])) + step('mid', 'rx', '    next: [far]\n') + step('far', 'rx') + step('y1', 'ry'));
  const { edge, box, html } = svgOf(m, 'p');
  const pts = (d) => [...d.matchAll(/(-?[\d.]+) (-?[\d.]+)/g)].map((p) => [+p[1], +p[2]]);
  const crosses = (d, b) => pts(d).some(([x0, y0], i, all) => {
    if (!i) return false;
    const [x1, y1] = all[i - 1];
    return Math.max(x0, x1) > b.x && Math.min(x0, x1) < b.x + 164 && Math.max(y0, y1) > b.y && Math.min(y0, y1) < b.y + 70;
  });
  const d = edge('s', 'far');
  assert.ok(!crosses(d, box('mid')), d);
  // It runs along rx's lane bottom: the lane line's y.
  const laneLine = +html.match(/<line class="lane-line" x1="0" x2="\d+" y1="([\d.]+)"/)[1];
  assert.ok(pts(d).some(([, y]) => y === laneLine), `${d} along y=${laneLine}`);
  // Without a step in the way, the route is unchanged (the earlier skip test), and adjacent edges never detour.
  assert.ok(!pts(edge('s', 'mid')).some(([, y]) => y === laneLine));
});

test('1.1 entry points: one label sits 6px above the centre line; several get their own lines, 16px or more apart', () => {
  assert.deepEqual(entryPoints([1], 100, 75, 125, 400), [{ y: 100, baseline: 94 }]);
  const box = (pt, n) => [pt.baseline - 12, pt.baseline + (n - 1) * 14 + 3];
  for (const [counts, cy] of [[[1, 1], 200], [[1, 1, 1], 200], [[1, 1, 1, 1], 200], [[3, 3, 3, 3], 87], [[2, 1, 3], 87]]) {
    const pts = entryPoints(counts, cy, cy - 25, cy + 25, 400);
    const boxes = pts.map((pt, i) => box(pt, counts[i]));
    pts.forEach((pt, i) => {
      if (i) assert.ok(pt.y - pts[i - 1].y >= 16, `${counts}: pitch`);
      assert.ok(pt.y >= cy - 25 && pt.y <= cy + 25, `${counts}: entry within the step's edge`);
      assert.ok(boxes[i][0] >= 0 && boxes[i][1] <= 400, `${counts}: inside the diagram`);
      for (let j = 0; j < i; j++) assert.ok(boxes[j][1] < boxes[i][0] || boxes[i][1] < boxes[j][0], `${counts}: labels ${j} and ${i} overlap`);
    });
  }
  // Labels always stack in their connectors' order, top to bottom, whether or not they fit beside their own lines.
  for (const counts of [[1, 1], [3, 3, 3, 3], [1, 3, 1, 3, 1], [2, 2, 2, 2, 2, 2], [3, 1, 1, 1, 1, 1, 3]]) {
    for (const [cy, limit] of [[87, 400], [87, 1000], [300, 340], [200, 400]]) {
      const pts = entryPoints(counts, cy, cy - 25, cy + 25, limit);
      pts.forEach((pt, i) => i && assert.ok(pt.baseline > pts[i - 1].baseline + (counts[i - 1] - 1) * 14, `${counts} at ${cy}: label ${i} above label ${i - 1}`));
      pts.forEach((pt, i) => i && assert.ok(pt.y > pts[i - 1].y, `${counts} at ${cy}: entry order`));
    }
  }
  // Few short labels sit directly above their own lines, with no other line between.
  const two = entryPoints([1, 1], 200, 175, 225, 400);
  two.forEach((pt) => assert.equal(pt.baseline, pt.y - 6));
});

test('1.1 six entries: spread evenly along the step edge when 16px apart would leave it; labels still clear of each other', () => {
  const counts = [1, 1, 1, 1, 1, 1];
  const pts = entryPoints(counts, 87, 62, 112, 600);
  const ys = pts.map((p) => p.y);
  assert.equal(ys[0], 62);
  assert.equal(ys[5], 112);
  ys.forEach((y, i) => i && assert.ok(Math.abs(y - ys[i - 1] - 10) < 1e-9, 'even pitch of 50 / 5'));
  const boxes = pts.map((pt) => [pt.baseline - 12, pt.baseline + 3]);
  boxes.forEach((b, i) => {
    assert.ok(b[0] >= 0 && b[1] <= 600, 'inside the diagram');
    if (i) assert.ok(boxes[i - 1][1] < b[0], `labels ${i - 1} and ${i} overlap`);
  });
  // Four still keep 16px.
  const four = entryPoints([1, 1, 1, 1], 87, 62, 112, 600).map((p) => p.y);
  four.forEach((y, i) => i && assert.ok(y - four[i - 1] >= 16));
});

test('1.1 several labelled connectors into one step enter at their own points, ordered by the source height', () => {
  const m = mini(step('a', 'rx', branches(['c', 'From above'])) + step('b', 'ry', branches(['c', 'From below'])) + step('c', 'rx'));
  const { edge } = svgOf(m, 'p');
  const end = (d) => +d.trim().split(/\s+/).pop();
  assert.ok(end(edge('a', 'c')) + 16 <= end(edge('b', 'c')), `${edge('a', 'c')} | ${edge('b', 'c')}`);
});

test('1.1 the width estimate is at least the width from a bold sans-serif character table, for the sample and fixture labels', () => {
  // Advance widths of a bold sans-serif (Helvetica Bold / Arial Bold, units per 1000 em), at 12px. Others count as "W".
  const em = { ' ': 278, ',': 278, '.': 278, '-': 333, "'": 238, f: 333, i: 278, j: 278, l: 278, r: 389, t: 333, z: 500, m: 889, w: 778, I: 278, J: 556, M: 833, W: 944, E: 667, F: 611, L: 611, P: 667, S: 667, T: 611, V: 667, X: 667, Y: 667, Z: 611, G: 778, O: 778, Q: 778 };
  for (const c of 'acekmsvxy') em[c] ??= 556;
  for (const c of 'bdghnopqu') em[c] ??= 611;
  for (const c of 'ABCDHKNRU') em[c] ??= 722;
  const table = (s) => [...s].reduce((w, c) => w + (em[c] ?? 944), 0) * 12 / 1000;
  const labels = [
    ...Object.values(sample.elements).filter((e) => e.type === 'process').flatMap((p) => p.steps.flatMap((s) => s.next.map((n) => n.label).filter(Boolean))),
    'Existing account', 'New initiative', 'Not for us', 'Refer to the other party', 'Park or decline',
    'Approved by both parties and ready to send to the client now',
    'WHO MANAGES MOMENTUM WORKFLOW', 'MANAGEMENT', 'WORKFLOW', 'HANDOVER TO DELIVERY', 'Move to Wave Two',
  ];
  assert.ok(labels.includes('Approved, ready to submit'));
  for (const l of labels) assert.ok(labelWidth(l) >= table(l), `${l}: ${labelWidth(l)} < ${table(l)}`);
});

test('1.1 labelled and unlabelled connectors into one step each enter at their own point; no line crosses a label', () => {
  const m = mini(step('s', 'rx', '    next: [a, b, u]\n') + step('a', 'rx', branches(['c', 'Approved'])) + step('b', 'ry', branches(['c', 'Needs a second look'])) + step('u', 'ry', '    next: [c]\n') + step('c', 'rx'));
  const { html, edge, box } = svgOf(m, 'p');
  const c = box('c');
  const labels = [...html.matchAll(/<text class="edge-label" x="([\d.]+)" y="([\d.]+)" text-anchor="end">([^<]+)<\/text>/g)].map(([, x, y, t]) => ({ t, l: +x - labelWidth(t), r: +x, top: +y - 12, bottom: +y + 3 }));
  assert.deepEqual(labels.map((l) => l.t).sort(), ['Approved', 'Needs a second look']);
  const ends = ['a', 'b', 'u'].map((s) => +edge(s, 'c').trim().split(/\s+/).pop());
  assert.equal(new Set(ends).size, 3, `three entry points: ${ends}`);
  ends.forEach((y) => assert.ok(y > c.y && y < c.y + 70, 'on the step edge'));
  const pts = (d) => [...d.matchAll(/(-?[\d.]+) (-?[\d.]+)/g)].map((p) => [+p[1], +p[2]]);
  for (const d of [...html.matchAll(/<path class="edge[^"]*" d="([^"]*)"/g)].map((x) => x[1])) {
    pts(d).forEach(([x0, y0], i, all) => {
      if (!i) return;
      const [x1, y1] = all[i - 1];
      for (const l of labels) assert.ok(!(Math.max(x0, x1) > l.l && Math.min(x0, x1) < l.r && Math.max(y0, y1) > l.top && Math.min(y0, y1) < l.bottom), `${d} crosses ${l.t}`);
    });
  }
  // A step with only unlabelled connectors keeps its single centre entry.
  assert.ok(edge('s', 'a').trim().endsWith(` ${box('a').cy}`));
});

test('1.1 a skip detour in the bottom lane runs inside it, not on the diagram edge', () => {
  const m = mini(step('t', 'rx', '    next: [s]\n') + step('s', 'ry', branches(['mid', 'Next'], ['far', 'Skip ahead'])) + step('mid', 'ry', '    next: [far]\n') + step('far', 'ry'));
  const { html, edge } = svgOf(m, 'p');
  const height = +html.match(/<svg class="swimlane" width="[\d.]+" height="([\d.]+)"/)[1];
  const ys = [...edge('s', 'far').matchAll(/(-?[\d.]+) (-?[\d.]+)/g)].map((p) => +p[2]);
  assert.equal(Math.max(...ys), height - 6);
});

// ---------- joint steps (add-joint-steps 1.3, 1.4) ----------
const fixture = (name) => loadModel(readFolder(fileURLToPath(new URL(`../fixtures/${name}/`, import.meta.url)))).model;
const allBoxes = (html) => [...html.matchAll(/<g class="node[^"]*"([^>]*)><rect class="ring"[^>]*\/><rect class="box" x="([\d.]+)" y="([\d.]+)"/g)].map((m) => ({ attrs: m[1], x: +m[2], y: +m[3] }));
const tieOf = (html, id) => html.match(new RegExp(`class="joint-tie[^"]*" data-testid="joint-tie-${id}" d="([^"]*)"`))[1];
// Every segment of a path, as [x0, y0, x1, y1], from its M, H and V commands.
const segments = (d) => {
  const out = [];
  let x = 0;
  let y = 0;
  for (const [, c, a, b] of d.matchAll(/([MHV])(-?[\d.]+)(?: (-?[\d.]+))?/g)) {
    if (c === 'M') [x, y] = [+a, +b];
    else {
      const [nx, ny] = c === 'H' ? [+a, y] : [x, +a];
      out.push([x, y, nx, ny]);
      [x, y] = [nx, ny];
    }
  }
  return out;
};
// Strictly inside a box (touching its edge, as a stub does, is fine).
const through = ([x0, y0, x1, y1], b) => Math.max(x0, x1) > b.x && Math.min(x0, x1) < b.x + 164 && Math.max(y0, y1) > b.y && Math.min(y0, y1) < b.y + 70;

test('1.3 adjacent owner lanes: a box in each owner lane at one rank, the primary first; the step once in order', () => {
  const f = flow(fixture('joint-basic'), 'main-flow');
  const n = f.nodes['kick-off-the-bid'];
  assert.deepEqual(n.twins, [{ owner: 'bid-manager', lane: 1, slot: 0 }, { owner: 'solution-architect', lane: 2, slot: 0 }]);
  assert.deepEqual([n.lane, n.slot, n.rank], [1, 0, 1]);
  assert.deepEqual(f.order, ['capture-the-lead', 'kick-off-the-bid', 'plan-the-work']);
  assert.equal(f.order.filter((id) => id === 'kick-off-the-bid').length, 1);
  // Into it from Account lead (lane 0): the Bid manager box. Out of it to Solution architect (lane 2): that box.
  const [into, out] = f.edges;
  assert.deepEqual([into.toBox.owner, out.fromBox.owner], ['bid-manager', 'solution-architect']);
  assert.ok(into.crossParty && out.crossParty, 'cross-party by party set');
});

test('1.3 non-adjacent owner lanes: both boxes in one column, with the step in the lane between them in that column too', () => {
  const f = flow(fixture('joint-far'), 'main-flow');
  assert.deepEqual(f.lanes, ['bid-manager', 'account-lead', 'solution-architect']);
  assert.deepEqual(f.nodes['kick-off-the-bid'].twins.map((t) => [t.owner, t.lane, t.slot]), [['bid-manager', 0, 0], ['solution-architect', 2, 0]]);
  assert.deepEqual([f.nodes['kick-off-the-bid'].rank, f.nodes['brief-the-client'].rank, f.nodes['brief-the-client'].lane], [1, 1, 1]);
});

test('1.3 a step already in an owner lane at that rank: the joint box takes the next slot there', () => {
  const m = mini(step('a', 'rx', '    next: [b, j]\n') + step('b', 'rx', '    next: []\n') + step('j', '[rx, ry]', '    next: []\n'));
  const f = flow(m, 'p');
  assert.deepEqual(f.nodes.j.twins, [{ owner: 'rx', lane: 0, slot: 1 }, { owner: 'ry', lane: 1, slot: 0 }]);
  assert.deepEqual([f.nodes.b.slot, f.rows.rx, f.rows.ry], [0, 2, 1]);
  assert.equal(f.edges.find((e) => e.to === 'j').toBox.owner, 'rx', 'from rx: the rx box');
});

test('1.3 ties go to the primary owner: a source lane equally near both boxes enters the primary', () => {
  // The far fixture rewired so Account lead (lane 1) flows into the joint step: lanes 0 and 2 are equally near.
  const m = fixture('joint-far');
  const steps = m.elements['main-flow'].steps;
  steps.find((s) => s.id === 'open-the-bid').next = [{ to: 'brief-the-client' }];
  steps.find((s) => s.id === 'brief-the-client').next = [{ to: 'kick-off-the-bid' }];
  steps.find((s) => s.id === 'kick-off-the-bid').next = [];
  const e = flow(m, 'main-flow').edges.find((x) => x.to === 'kick-off-the-bid');
  assert.equal(e.toBox.owner, 'bid-manager');
});

test('1.4 rendering: a box per owner with a Joint pill, one focusable primary, hidden twins, and a dotted tie through no box', () => {
  for (const name of ['joint-basic', 'joint-far']) {
    const { html } = svgOf(fixture(name), 'main-flow');
    const boxes = allBoxes(html);
    const joint = boxes.filter((b) => b.attrs.includes('data-step="kick-off-the-bid"'));
    assert.equal(joint.length, 2, name);
    assert.match(joint[0].attrs, /role="button" tabindex="0" data-testid="step-kick-off-the-bid"/);
    assert.match(joint[1].attrs, /aria-hidden="true" tabindex="-1"/);
    assert.equal(joint[0].x, joint[1].x, 'same column');
    assert.equal((html.match(/>Joint<\/text>/g) || []).length, 2);
    assertTieClear(html, 'kick-off-the-bid', name);
  }
});

// Everything a joint step's tie must keep clear of: other step boxes (6px clear above and below), arrowheads entering
// any box, and connector labels. Its stubs: one into each of its boxes, 12px or more from any arrowhead entering it.
function assertTieClear(html, id, name) {
  const boxes = allBoxes(html);
  const own = boxes.filter((b) => b.attrs.includes(`data-step="${id}"`));
  const unesc = (t) => t.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'");
  const obstacles = boxes.filter((b) => !own.includes(b)).map((b) => ({ what: `box ${b.x},${b.y}`, x: b.x, y: b.y - 6, w: 164, h: 82 }));
  const heads = [...html.matchAll(/<path class="edge[^"]*" d="[^"]* L(-?[\d.]+) (-?[\d.]+)"/g)].map((m) => [+m[1], +m[2]]).filter(([x]) => boxes.some((b) => b.x - 3 === x));
  for (const [x, y] of heads) obstacles.push({ what: `arrowhead ${x},${y}`, x: x - 18, y: y - 9, w: 19, h: 18 });
  for (const m of html.matchAll(/<text class="edge-label[^"]*" x="([\d.]+)" y="([\d.]+)" text-anchor="(end|middle)">(.*?)<\/text>/g)) {
    const lines = m[4].includes('<tspan') ? [...m[4].matchAll(/>([^<]*)<\/tspan>/g)].map((t) => unesc(t[1])) : [unesc(m[4])];
    const w = Math.max(...lines.map(labelWidth));
    obstacles.push({ what: `label "${lines.join(' ')}"`, x: m[3] === 'end' ? +m[1] - w : +m[1] - w / 2, y: +m[2] - 12, w: w + 2.5, h: 15 + (lines.length - 1) * 14 });
  }
  const segs = segments(tieOf(html, id));
  const hit = ([x0, y0, x1, y1], o) => Math.max(x0, x1) >= o.x && Math.min(x0, x1) <= o.x + o.w && Math.max(y0, y1) >= o.y && Math.min(y0, y1) <= o.y + o.h;
  for (const o of obstacles) for (const sg of segs) assert.ok(!hit(sg, o), `${name}: tie segment ${sg} crosses the ${o.what}`);
  const x = own[0].x;
  const stubs = segs.filter(([, y0, x1, y1]) => y0 === y1 && x1 === x);
  assert.equal(stubs.length, own.length, `${name}: a stub into each box`);
  for (const b of own) {
    const stub = stubs.find(([, y]) => y > b.y && y < b.y + 70);
    assert.ok(stub, `${name}: a stub into the box at ${b.y}`);
    for (const [hx, hy] of heads) if (hx === x - 3 && hy > b.y && hy < b.y + 70) assert.ok(Math.abs(hy - stub[1]) >= 12, `${name}: stub at ${stub[1]} under an arrowhead at ${hy}`);
  }
  // The vertical parts run 5px left of the column and, with their breaks, span the stubs.
  const v = segs.filter(([x0, , x1]) => x0 === x1);
  assert.ok(v.length && v.every(([vx]) => vx === x - 5), name);
  assert.deepEqual([Math.min(...v.flatMap(([, a, , c]) => [a, c])), Math.max(...v.flatMap(([, a, , c]) => [a, c]))].map((y) => y >= Math.min(...stubs.map((t) => t[1])) && y <= Math.max(...stubs.map((t) => t[1]))), [true, true]);
}

test('1.4 a stressed tie: labelled connectors into the step between the boxes and two labelled entries into one box', () => {
  const STRESS = `---
id: main-flow
type: process
name: Main flow
workstream: main-work
steps:
  - id: open-the-bid
    name: Open the bid
    owner: bid-manager
    raci: { bid-manager: A }
    next: [{ to: kick-off-the-bid, label: Kick off now }, { to: brief-the-client, label: Brief the client before anything else happens }]
  - id: prep
    name: Prepare the room
    owner: bid-manager
    raci: { bid-manager: A }
    next: [{ to: kick-off-the-bid, label: Ready to start }]
  - id: draft
    name: Draft the outline
    owner: solution-architect
    raci: { solution-architect: A }
    next: [{ to: kick-off-the-bid, label: Outline drafted }, { to: brief-the-client, label: Outline }]
  - id: kick-off-the-bid
    name: Kick off the bid together with everyone
    owner: [bid-manager, solution-architect]
    raci: { bid-manager: A }
    next: []
  - id: brief-the-client
    name: Brief the client
    owner: account-lead
    raci: { account-lead: A }
    next: []
---
`;
  const dir = fileURLToPath(new URL('../fixtures/joint-far/', import.meta.url));
  const r = loadModel(readFolder(dir).map((f) => (f.path === 'processes/01-main-flow.md' ? { ...f, data: new TextEncoder().encode(STRESS) } : f)));
  assert.deepEqual(r.messages, []);
  const { html } = svgOf(r.model, 'main-flow');
  assertTieClear(html, 'kick-off-the-bid', 'stress');
});

test('1.4 connectors attach to the nearest box: into the Bid manager box, out of the Solution architect box', () => {
  const { html, edge } = svgOf(fixture('joint-basic'), 'main-flow');
  const [bm, sa] = allBoxes(html).filter((b) => b.attrs.includes('data-step="kick-off-the-bid"'));
  assert.ok(edge('capture-the-lead', 'kick-off-the-bid').endsWith(`L${bm.x - 3} ${bm.y + 35}`), edge('capture-the-lead', 'kick-off-the-bid'));
  assert.ok(edge('kick-off-the-bid', 'plan-the-work').startsWith(`M${sa.x + 164} ${sa.y + 35}`), edge('kick-off-the-bid', 'plan-the-work'));
});

test('a step with no valid owner is left out of the swimlane, bridged over, and the swimlane still renders', () => {
  const dir = fileURLToPath(new URL('../fixtures/joint-basic/', import.meta.url));
  for (const owner of ['[]', '7', '[7]', '[bid-manager, 7]', null]) {
    const text = readFolder(dir).find((f) => f.path === 'processes/01-main-flow.md');
    const src = new TextDecoder().decode(text.data).replace('    owner: [bid-manager, solution-architect]\n', owner === null ? '' : `    owner: ${owner}\n`);
    const r = loadModel(readFolder(dir).map((f) => (f === text || f.path === text.path ? { ...f, data: new TextEncoder().encode(src) } : f)));
    assert.ok(r.messages.some((m) => m.level === 'error'), `owner ${owner}: an error is reported`);
    const f = flow(r.model, 'main-flow');
    if (owner === '[bid-manager, 7]') {
      // The valid owner is kept: a single-owner step in its lane.
      assert.deepEqual([f.nodes['kick-off-the-bid'].lane, f.nodes['kick-off-the-bid'].twins], [f.lanes.indexOf('bid-manager'), undefined]);
    } else {
      assert.ok(!f.nodes['kick-off-the-bid'], `owner ${owner}: left out`);
      assert.deepEqual(pairs(f), ['capture-the-lead>plan-the-work'], 'bridged over');
    }
    assert.doesNotThrow(() => svgOf(r.model, 'main-flow'), `owner ${owner}`);
  }
});
