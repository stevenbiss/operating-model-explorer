import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { check, unsupportedKeywords } from '../../src/model/schema-check.js';

const dir = new URL('../../schema/', import.meta.url);
const names = readdirSync(dir).filter((f) => f.endsWith('.schema.json'));
const load = (f) => JSON.parse(readFileSync(new URL(f, dir), 'utf8'));

test('there is a schema for every type', () => {
  assert.deepEqual(names.map((f) => f.split('.')[0]).sort(), ['model', 'party', 'persona', 'process', 'role', 'team', 'theme', 'workstream']);
});

for (const f of names) {
  test(`${f} parses, uses only supported keywords, has an EDGY mapping and a valid example`, () => {
    const s = load(f);
    assert.equal(s.title, f.split('.')[0]);
    assert.deepEqual(unsupportedKeywords(s), []);
    assert.ok(s['x-edgy'], 'x-edgy mapping');
    assert.ok(s.examples?.length, 'example');
    for (const ex of s.examples) assert.deepEqual(check(ex, s), []);
  });
}

test('the guard catches unsupported keywords, however deep', () => {
  const s = { type: 'object', properties: { a: { oneOf: [] }, b: { type: 'array', items: { minItems: 1 } } }, $ref: 'x' };
  assert.deepEqual(unsupportedKeywords(s).sort(), ['$ref', 'a.oneOf', 'b.items.minItems']);
});

test('every "change" definition is identical', () => {
  const defs = [];
  for (const f of names) {
    const s = load(f);
    if (s.properties.change) defs.push(s.properties.change);
    if (s.properties.steps) defs.push(s.properties.steps.items.properties.change);
  }
  assert.equal(defs.length, 8);
  for (const d of defs) assert.deepEqual(d, defs[0]);
});
