// Structure diagram line geometry (structure-diagrams spec › Lines, design D5).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { lineGeometry } from '../../src/model/structure.js';

// Two party columns (acme at x 100-300, globex at x 340-540) and three rows: lead (y 0-80), then the sub-bands
// harbour (y 100-180) and summit (y 200-280) inside the band accounts.
const cell = (band, parent, party, row) => ({ band, parent, party, x: party === 'acme' ? 100 : 340, y: row * 100, w: 200, h: 80 });
const CELLS = [
  cell('lead', null, 'acme', 0), cell('lead', null, 'globex', 0),
  cell('harbour', 'accounts', 'acme', 1), cell('harbour', 'accounts', 'globex', 1),
  cell('summit', 'accounts', 'acme', 2), cell('summit', 'accounts', 'globex', 2),
];
const line = (fb, fp, tb, tp, label) => ({ from: { band: fb, party: fp }, to: { band: tb, party: tp }, label });
const one = (l) => lineGeometry(CELLS, [l])[0];

test('cells in the same row join edge to edge horizontally, with the label at the midpoint', () => {
  assert.deepEqual(one(line('lead', 'acme', 'lead', 'globex', 'Joint steering')), { x1: 300, y1: 40, x2: 340, y2: 40, lx: 320, ly: 40, label: 'Joint steering' });
});

test('the ends can be given in either order: a line has no direction', () => {
  const [a, b] = lineGeometry(CELLS, [line('lead', 'acme', 'lead', 'globex'), line('lead', 'globex', 'lead', 'acme')]);
  assert.deepEqual([a.x1, a.y1, a.x2, a.y2], [b.x1, b.y1, b.x2, b.y2]);
});

test('cells in the same column join edge to edge vertically', () => {
  assert.deepEqual(one(line('lead', 'acme', 'summit', 'acme')), { x1: 200, y1: 80, x2: 200, y2: 200, lx: 200, ly: 140, label: undefined });
});

test('any other pair: a straight segment between the facing edge midpoints', () => {
  const g = one(line('lead', 'acme', 'harbour', 'globex'));
  // 40 apart sideways and 20 apart vertically: the side edges face each other.
  assert.deepEqual([g.x1, g.y1, g.x2, g.y2], [300, 40, 340, 140]);
  assert.deepEqual([g.lx, g.ly], [320, 90]);
});

test('a parent band is the union of its sub-band cells in that column', () => {
  const across = one(line('accounts', 'acme', 'harbour', 'globex'));
  // The union spans y 100-280; the shared rows are harbour's (100-180), so the line runs at its middle.
  assert.deepEqual([across.x1, across.y1, across.x2, across.y2], [300, 140, 340, 140]);
  const down = one(line('lead', 'globex', 'accounts', 'globex'));
  assert.deepEqual([down.x1, down.y1, down.x2, down.y2], [440, 80, 440, 100]);
});

test('no segment for an unknown cell, or for a parent band and its own sub-band in one column', () => {
  assert.deepEqual(lineGeometry(CELLS, [line('nowhere', 'acme', 'lead', 'acme'), line('lead', 'acme', 'lead', 'initech'), line('accounts', 'acme', 'harbour', 'acme')]), [null, null, null]);
});
