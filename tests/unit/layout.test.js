import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadModel } from '../../src/model/load.js';
import { flow } from '../../src/model/layout.js';
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
