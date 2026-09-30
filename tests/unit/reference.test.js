import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { brandSchema, schemas } from '../../src/model/schemas.js';
import { contentReference } from '../../src/model/reference.js';

// The content reference also documents brand packs, which aren't element types (party-brands).
const all = { ...schemas, brand: brandSchema };
const ref = contentReference(all);

test('the reference lists every type with its EDGY concept, fields and an example', () => {
  for (const [type, s] of Object.entries(all)) {
    const section = ref.split(`\n## ${type}\n`)[1]?.split('\n## ')[0];
    assert.ok(section, `section for ${type}`);
    assert.ok(section.includes(`**EDGY concept:** ${s['x-edgy']}`));
    for (const field of Object.keys(s.properties)) assert.ok(section.includes(`| \`${field}\` |`), `${type}.${field}`);
    assert.ok(section.includes('**Example**') && section.includes(s.properties.type ? `type: ${type}` : `id: ${s.examples[0].id}`));
  }
  assert.ok(ref.includes('| `steps[].owner` | Yes |'), 'step fields');
});

test('docs/content-reference.md is up to date with the schemas (run npm run build)', () => {
  assert.equal(readFileSync(new URL('../../docs/content-reference.md', import.meta.url), 'utf8').replace(/\r\n/g, '\n'), ref);
});
