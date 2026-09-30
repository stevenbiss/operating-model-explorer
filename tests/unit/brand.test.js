// Brand packs and party brand references (party-brands spec, content-schema › Brand packs are not elements,
// capture-sheet › Brand column in Parties; design D2, D9). Fictional brands only.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadModel } from '../../src/model/load.js';
import { files, MODEL } from './helpers.js';

const MARK = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><rect width="10" height="10"/></svg>';
const pack = (id, fields = {}, body = 'Use the mark on light backgrounds only. Secret usage note.') => {
  const f = { id, name: 'Globex', version: '"2026.3"', updated: '2026-03-01', colours: '\n  primary: "#3aaa35"', marks: '\n  mark: mark.svg', ...fields };
  const header = Object.entries(f).filter(([, v]) => v !== undefined).map(([k, v]) => `${k}: ${v}`).join('\n');
  return `---\n${header}\n---\n${body}\n`;
};
const party = (id, name, brand) => `---\nid: ${id}\ntype: party\nname: ${name}\n${brand ? `brand: ${brand}\n` : ''}---\n`;
// A folder model with one party using `brand`, and the given files under brands/.
const folder = (brand, extra) => loadModel(files({ 'model.md': MODEL, 'parties/globex.md': party('globex', 'Globex', brand), ...extra }));
const globex = (fields, body) => ({ 'brands/globex/brand.md': pack('globex', fields, body), 'brands/globex/mark.svg': MARK });
const only = (msgs) => {
  assert.equal(msgs.length, 1, JSON.stringify(msgs, null, 1));
  return msgs[0];
};

test('2.1 valid pack: no messages, the party gets the brand, and the notes are dropped', () => {
  const r = folder('globex', globex());
  assert.deepEqual(r.messages, []);
  assert.equal(r.model.elements.globex.brand, 'globex');
  assert.deepEqual(r.model.brands.globex, { id: 'globex', name: 'Globex', version: '2026.3', updated: '2026-03-01', colours: { primary: '#3aaa35' }, marks: { mark: 'brands/globex/mark.svg' } });
  assert.ok(r.model.assets['brands/globex/mark.svg']);
  assert.doesNotMatch(JSON.stringify(r.model), /Secret usage note/);
  assert.equal(r.model.partyColours[0].source, 'brand');
});

test('a version written without quotes is kept as text', () => {
  assert.equal(folder('globex', globex({ version: '2026.3' })).model.brands.globex.version, '2026.3');
});

test('2.30 brand packs are not elements: no unknown-type, no-header or no-type messages for anything under brands/', () => {
  const r = folder(undefined, { ...globex(), 'brands/globex/README.md': '# Notes without a header\n', 'brands/loose.md': 'stray\n' });
  assert.deepEqual(r.messages, []);
  assert.deepEqual(Object.keys(r.model.elements), ['globex']);
});

test('required fields: an error per missing field, naming the pack file', () => {
  const r = folder(undefined, globex({ name: undefined, version: undefined, updated: undefined, colours: undefined, marks: undefined }));
  assert.deepEqual(r.messages.map((m) => [m.level, m.file, m.problem]), ['name', 'version', 'updated', 'colours', 'marks'].map((f) => ['error', 'brands/globex/brand.md', `The required field "${f}" is missing.`]));
  const noPrimary = only(folder(undefined, globex({ colours: '\n  secondary: "#3a6ea5"' })).messages);
  assert.deepEqual([noPrimary.problem, noPrimary.fix], ['The required field "primary" is missing.', 'Add a "primary:" line under "colours".']);
});

test('2.3 invalid colour: an error naming the pack and the field, and explaining that colours are hex values', () => {
  const m = only(folder(undefined, globex({ colours: '\n  primary: red' })).messages);
  assert.deepEqual([m.level, m.file, m.element], ['error', 'brands/globex/brand.md', 'globex']);
  assert.match(m.problem, /"colours\.primary" is "red"/);
  assert.match(m.fix, /Colours must be hex values such as "#0b1f4d"/);
  assert.match(only(folder(undefined, globex({ colours: '\n  primary: "#3aaa35"\n  dark: "#12"' })).messages).problem, /"colours\.dark"/);
});

test('2.4 id does not match its folder: an error naming the folder and the id', () => {
  const m = only(folder(undefined, { 'brands/globex/brand.md': pack('globex-corp'), 'brands/globex/mark.svg': MARK }).messages);
  assert.equal(m.level, 'error');
  assert.match(m.problem, /brands\/globex\/ has the id "globex-corp"/);
  assert.match(m.problem, /must match/);
  assert.match(m.fix, /Change the id to "globex", or rename the folder to brands\/globex-corp\//);
});

test('2.2 missing mark: an error naming the pack and the missing file', () => {
  const m = only(folder(undefined, { 'brands/globex/brand.md': pack('globex') }).messages);
  assert.equal(m.level, 'error');
  assert.equal(m.problem, 'The mark file "mark.svg" was not found in the brand pack\'s folder, brands/globex/.');
  const full = only(folder(undefined, globex({ marks: '\n  mark: mark.svg\n  full: logo.svg' })).messages);
  assert.match(full.problem, /full logo file "logo\.svg" was not found/);
});

test('2.26 remote mark, and marks outside the pack: an error saying marks must be files in the pack\'s folder', () => {
  for (const [path, what] of [['https://example.com/mark.svg', 'is a web address'], ['../acme/mark.svg', 'points outside'], ['/mark.svg', 'points outside'], ['C:\\\\marks\\\\mark.svg', 'points outside'], ['file:///C:/mark.svg', 'is a web address'], ['sub/../../x.svg', 'points outside']]) {
    const m = only(folder(undefined, globex({ marks: `\n  mark: "${path}"` }), { 'brands/acme/mark.svg': MARK }).messages);
    assert.equal(m.level, 'error', path);
    assert.match(m.problem, new RegExp(what), path);
    assert.match(m.problem, /Marks must be files in the brand pack's folder/, path);
  }
  // A mark in a subfolder of the pack is fine.
  assert.deepEqual(folder(undefined, { 'brands/globex/brand.md': pack('globex', { marks: '\n  mark: ./img/mark.svg' }), 'brands/globex/img/mark.svg': MARK }).messages, []);
});

test('a fonts field: a warning that brand fonts are not used', () => {
  const m = only(folder(undefined, globex({ fonts: '\n  body: Brand Sans' })).messages);
  assert.equal(m.level, 'warning');
  assert.match(m.problem, /sets "fonts", but brand fonts are not used/);
});

test('a mark over 200 KB: a warning', () => {
  const big = `<svg xmlns="http://www.w3.org/2000/svg"><!--${'x'.repeat(210 * 1024)}--></svg>`;
  const m = only(folder(undefined, { 'brands/globex/brand.md': pack('globex'), 'brands/globex/mark.svg': big }).messages);
  assert.equal(m.level, 'warning');
  assert.match(m.problem, /is 211 KB\. Marks should be under 200 KB/);
  assert.deepEqual(folder(undefined, { 'brands/globex/brand.md': pack('globex'), 'brands/globex/mark.svg': 'x'.repeat(200 * 1024) }).messages, []);
});

test('a brand.md without a header, or with bad YAML: an error, and the pack is not used', () => {
  assert.match(only(folder(undefined, { 'brands/globex/brand.md': '# Globex\n' }).messages).problem, /brands\/globex\/ has no header/);
  const bad = only(folder('globex', { 'brands/globex/brand.md': '---\nid: [globex\n---\n' }).messages.filter((m) => m.file === 'brands/globex/brand.md'));
  assert.match(bad.problem, /not valid YAML/);
});

test('2.5 unknown brand: an error naming the party and "Did you mean globex?"', () => {
  const m = only(folder('globx', globex()).messages);
  assert.deepEqual([m.level, m.file, m.element], ['error', 'parties/globex.md', 'globex']);
  assert.match(m.problem, /The party "Globex" uses the brand "globx", which does not match any brand pack/);
  assert.equal(m.fix, 'Did you mean globex?');
  const none = only(folder('initech').messages);
  assert.match(none.fix, /Copy the brand pack from the brand library into brands\/initech\/ next to model\.md/);
  assert.equal(folder('initech').model.partyColours[0].source, 'neutral', 'an unknown brand falls back to a neutral colour');
});

// ---------- capture sheet ----------

const SHEET = (brands) => `# Operating model: Tiny partnership

Format: 1

## Purpose

Why it exists.

## Key messages

- One team.

## Parties

| Party | Brand | Summary |
|---|---|---|
| Acme Corp | ${brands[0]} | The client side. |
| Globex | ${brands[1]} | The solution side. |
| Client Team | | No brand. |

## Roles

| Role | Party |
|---|---|
| Account lead | Acme Corp |
`;
const ACME = { 'brands/acme/brand.md': pack('acme', { name: 'Acme Corp', colours: '\n  primary: "#0b1f4d"' }), 'brands/acme/mark.svg': MARK };
const sheet = (brands, extra = {}) => loadModel(files({ 'capture-sheet.md': SHEET(brands), ...extra }));

test('2.33 Brand column: ids or names, matched forgivingly, become pack ids; an empty cell means no brand', () => {
  const r = sheet(['Acme Corp', 'GLOBEX'], { ...ACME, ...globex() });
  assert.deepEqual(r.messages, []);
  const e = r.model.elements;
  assert.deepEqual([e['acme-corp'].brand, e.globex.brand, e['client-team'].brand], ['acme', 'globex', undefined]);
  assert.deepEqual(r.model.partyColours.map((c) => c.source), ['brand', 'brand', 'neutral']);
});

test('Brand column: an unknown brand is an error at its row, with "Did you mean"', () => {
  const m = only(sheet(['acme', 'Globx'], { ...ACME, ...globex() }).messages);
  assert.deepEqual([m.level, m.where], ['error', 'Parties › row 2 (Globex)']);
  assert.match(m.problem, /The party "Globex" uses the brand "Globx"/);
  assert.equal(m.fix, 'Did you mean globex?');
});

test('2.7 sheet loaded without its brands: an error for each missing brand, suggesting loading the folder', () => {
  const r = sheet(['acme', 'globex']);
  assert.equal(r.messages.length, 2);
  r.messages.forEach((m, i) => {
    assert.equal(m.level, 'error');
    assert.equal(m.where, `Parties › row ${i + 1} (${['Acme Corp', 'Globex'][i]})`);
    assert.match(m.problem, /no brand packs were loaded\. Brand packs are read from the brands\/ folder next to the capture sheet\./);
    assert.match(m.fix, /Load the sheet's folder \(or a \.zip of it\).*instead of the sheet on its own/);
  });
});

test('the brand.md example in docs/brand-packs.md and the party example in the authoring guide load with no messages', () => {
  const read = (p) => readFileSync(new URL(`../../${p}`, import.meta.url), 'utf8').replace(/\r\n/g, '\n');
  const example = read('docs/brand-packs.md').match(/^```markdown\n(---\nid: acme[\s\S]*?)^```$/m)[1];
  const partyFile = read('docs/authoring-guide.md').match(/^```yaml\n(---\nid: acme\ntype: party[\s\S]*?)^```$/m)[1];
  const r = loadModel(files({ 'model.md': MODEL, 'parties/acme.md': partyFile, 'brands/acme/brand.md': example, 'brands/acme/mark.svg': MARK }));
  assert.deepEqual(r.messages, []);
  assert.equal(r.model.elements.acme.brand, 'acme');
  assert.equal(r.model.brands.acme.version, '2026.1');
});

test('the validator reads brands/ next to a sheet file, as it does assets/', () => {
  const dir = mkdtempSync(join(tmpdir(), 'om-brands-'));
  for (const [p, text] of Object.entries({ 'capture-sheet.md': SHEET(['acme', 'globex']), ...ACME, ...globex() })) {
    mkdirSync(dirname(join(dir, p)), { recursive: true });
    writeFileSync(join(dir, p), text);
  }
  const root = fileURLToPath(new URL('../../', import.meta.url));
  const r = spawnSync(process.execPath, ['scripts/validate.mjs', join(dir, 'capture-sheet.md')], { cwd: root, encoding: 'utf8' });
  assert.equal(r.stdout.trim().split('\n').at(-1), '0 errors, 0 warnings', r.stdout);
});
