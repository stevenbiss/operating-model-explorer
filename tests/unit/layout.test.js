import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadModel } from '../../src/model/load.js';
import { flow } from '../../src/model/layout.js';
import { files, MODEL, readFolder, SAMPLE } from './helpers.js';

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
  assert.deepEqual(m.messages, []);
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

test('lanes are grouped by party in content order, including RACI-only roles', () => {
  const f = flow(sample, 'qualify-opportunity');
  assert.deepEqual(
    f.groups.map((g) => [g.party, g.lanes]),
    [
      ['acme', ['account-lead', 'bid-manager', 'delivery-manager']],
      ['globex', ['partner-manager', 'solution-architect']],
    ],
  );
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
