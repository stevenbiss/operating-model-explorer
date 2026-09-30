// Colour maths and party colour resolution (party-brands spec › Readable brand colours, Party colours can be told
// apart, Meaning colours are protected, Parties without a brand; design D1, D3). Fictional colours only.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { colourMessages, contrast, CVD, deltaE, distance, ENGINE, fromOklch, NEUTRALS, oklab, oklch, resolvePartyColours, simulate, T } from '../../src/model/colour.js';
import { loadModel } from '../../src/model/load.js';
import { files, MODEL } from './helpers.js';

// parties: [primary | { primary, secondary?, dark? } | null] -> resolved colours, and the report warnings.
function resolve(list) {
  const parties = list.map((c, i) => ({ id: `p${i + 1}`, name: `Party ${i + 1}`, brand: c ? `b${i + 1}` : undefined }));
  const brands = Object.fromEntries(list.map((c, i) => [`b${i + 1}`, { colours: typeof c === 'string' ? { primary: c } : c }]).filter(([, b]) => b.colours));
  const out = resolvePartyColours(parties, brands);
  return { out, messages: colourMessages(out, (id) => parties.find((p) => p.id === id).name, (id) => ({ element: id })) };
}

// Every text/background pair drawn on a party's colours, light and dark.
function assertAA(r) {
  const pairs = [[r.band, r.bandText], [r.darkBand, r.darkBandText], [r.tint, ENGINE.light.frame.text], [r.darkTint, ENGINE.dark.frame.text]];
  for (const [bg, fg] of pairs) assert.ok(contrast(bg, fg) >= 4.5, `${fg} on ${bg}: ${contrast(bg, fg).toFixed(2)}`);
}

test('contrast uses the WCAG formula', () => {
  assert.equal(contrast('#000000', '#ffffff').toFixed(0), '21');
  assert.equal(contrast('#999999', '#ffffff').toFixed(2), '2.85');
});

test('OKLab and OKLCH: reference values and round trips', () => {
  const [L, a, b] = oklab('#ffffff');
  assert.ok(Math.abs(L - 1) < 1e-4 && Math.abs(a) < 1e-4 && Math.abs(b) < 1e-4);
  assert.ok(Math.abs(oklab('#000000')[0]) < 1e-6);
  // Published OKLab of sRGB red: L 0.6280, a 0.2249, b 0.1258.
  oklab('#ff0000').forEach((v, i) => assert.ok(Math.abs(v - [0.628, 0.2249, 0.1258][i]) < 1e-3));
  for (const hex of ['#0b1f4d', '#ffd23f', '#d6281e', '#3aaa35', '#7b5a68']) assert.equal(fromOklch(oklch(hex)), hex);
  assert.equal(deltaE('#123456', '#123456'), 0);
  // Out-of-gamut OKLCH is brought into sRGB by reducing chroma.
  assert.match(fromOklch([0.7, 0.5, 140]), /^#[0-9a-f]{6}$/);
});

test('colour-vision simulation (Machado 2009, severity 1): greys are unchanged, reds and greens collapse', () => {
  for (const kind of Object.keys(CVD)) for (const grey of ['#000000', '#777777', '#ffffff']) assert.ok(deltaE(simulate(grey, kind), grey) < 0.01, `${kind} ${grey}`);
  assert.ok(deltaE('#d62728', '#2ca02c') > 0.2, 'red and green are far apart in normal vision');
  assert.ok(deltaE(simulate('#d62728', 'deuteranopia'), simulate('#2ca02c', 'deuteranopia')) < deltaE('#d62728', '#2ca02c') / 2, 'and much closer for deuteranopia');
  assert.ok(distance('#d62728', '#2ca02c') <= deltaE('#d62728', '#2ca02c'));
});

test('the engine colours in colour.js match the tokens in styles.css, light and dark', () => {
  const css = readFileSync(new URL('../../src/styles.css', import.meta.url), 'utf8');
  const block = (start) => css.slice(css.indexOf(start), css.indexOf('}', css.indexOf(start)));
  const light = block(':root, #om-preview {');
  const dark = block('@media (prefers-color-scheme: dark) {\n  :root, #om-preview {');
  const token = (text, name) => text.match(new RegExp(`--om-${name}:\\s*(#[0-9a-f]{6})`, 'i'))?.[1];
  const tokens = { surface: 'surface', text: 'text', accent: 'accent', new: 'new', changed: 'changed', removed: 'removed' };
  for (const [scheme, text] of [['light', light], ['dark', dark]]) {
    const e = ENGINE[scheme];
    for (const [k, t] of Object.entries(tokens)) assert.equal((e.frame[k] || e.meaning[k]).toLowerCase(), token(text, t), `${scheme} ${k}`);
  }
  // Focus rings use --om-link: the primary colour in light mode, its own value in dark mode.
  assert.equal(ENGINE.light.meaning.focus, token(light, 'primary'));
  assert.equal(ENGINE.dark.meaning.focus, token(dark, 'link'));
  assert.match(css, /:focus-visible \{ outline: 3px solid var\(--om-link\)/);
});

test('2.10 light brand colour: #ffd23f keeps its colour and takes dark text, at 4.5:1 or more', () => {
  const { out, messages } = resolve(['#ffd23f']);
  const [r] = out;
  assert.deepEqual([r.band, r.bandText], ['#ffd23f', '#111111']);
  assert.ok(contrast(r.band, r.bandText) >= 4.5);
  assert.equal(r.darkBandText, '#111111');
  assertAA(r);
  // Its derived dark variant sits close to the dark "Changed" amber, so dark mode is shifted in lightness (design D3a):
  // it stays yellow, darker than the author's colour, and the warning quotes the author's colour first.
  const [L, C, h] = oklch(r.darkBand);
  assert.ok(Math.abs(h - oklch('#ffd23f')[2]) < 3 && C > 0.1, `${r.darkBand} is still yellow`);
  assert.ok(L < oklch('#ffd23f')[0], 'and darker');
  assert.equal(messages.length, 1);
  assert.match(messages[0].problem, /^Party 1's colour #ffd23f, adapted to #[0-9a-f]{6} for dark mode, is too close to the colour of the "Changed" badge and notices in dark mode/);
});

test('adjustments change lightness before hue, light and dark (design D3a)', () => {
  for (const list of [['#d6281e', '#c92d25'], ['#b8261c'], ['#ffd23f']]) {
    const r = resolve(list).out.at(-1);
    const hue = (x) => oklch(x)[2];
    for (const [from, to] of [[list.at(-1), r.band], [r.dark, r.darkBand]]) assert.ok(Math.abs(hue(from) - hue(to)) < 5, `${from} -> ${to} keeps its hue`);
  }
});

test('a crowded model: a clash no shade resolves is reported as unresolved, naming both parties', () => {
  const { out, messages } = resolve(Array(14).fill('#d6281e'));
  const a = out.flatMap((r) => r.adjusted).find((x) => x.how === 'unresolved');
  assert.ok(a, 'some clash is unresolved');
  const m = messages.find((x) => x.problem.startsWith('Unresolved:'));
  assert.match(m.problem, /^Unresolved: Party \d+'s colour #d6281e is close to Party \d+'s colour.*no clearly different shade was found/);
  assert.match(m.problem, /the names and marks of Party \d+ and Party \d+ still tell them apart\.$/);
  // Every unresolved clash is reported as unresolved, never as "shifted".
  assert.equal(messages.filter((x) => x.problem.startsWith('Unresolved:')).length, out.flatMap((r) => r.adjusted).filter((x) => x.how === 'unresolved').length);
  out.forEach(assertAA);
});

test('brand lookups use own keys only: a party whose brand is "__proto__" or "constructor" is unbranded', () => {
  const out = resolvePartyColours([{ id: 'a', brand: '__proto__' }, { id: 'b', brand: 'constructor' }], {});
  assert.deepEqual(out.map((r) => r.source), ['neutral', 'neutral']);
});

test('2.12 two similar reds: the second party is drawn in its secondary colour, and the report names both', () => {
  const { out, messages } = resolve(['#d6281e', { primary: '#c92d25', secondary: '#1f5fbf' }]);
  assert.deepEqual([out[0].band, out[0].adjusted], ['#d6281e', []], 'the first party keeps its colour');
  assert.equal(out[1].band, '#1f5fbf');
  assert.deepEqual(out[1].adjusted, [{ scheme: 'light', from: '#c92d25', to: '#1f5fbf', how: 'secondary', reason: 'party', other: 'p1' }]);
  const m = messages.find((x) => x.element === 'p2');
  assert.equal(m.level, 'warning');
  assert.equal(m.problem, "Party 2's colour #c92d25 is too close to Party 1's colour, so Party 2 is drawn in its brand's secondary colour, #1f5fbf.");
  assert.match(m.fix, /clearly different from Party 1's/);
  // In dark mode the second party follows its secondary colour too, so no second warning.
  assert.equal(messages.length, 1);
  out.forEach(assertAA);
});

test('two similar reds without a secondary colour: a shifted shade, still at least T apart for every simulation', () => {
  const { out } = resolve(['#d6281e', '#c92d25']);
  assert.equal(out[1].adjusted[0].how, 'shade');
  for (const s of ['band', 'darkBand']) assert.ok(distance(out[0][s], out[1][s]) >= T, s);
});

test('2.13 distinct colours: a dark navy and a green are used as given, with no warning', () => {
  const { out, messages } = resolve(['#0b1f4d', '#3aaa35']);
  assert.deepEqual(out.map((r) => r.band), ['#0b1f4d', '#3aaa35']);
  assert.deepEqual(out.map((r) => r.adjusted), [[], []]);
  assert.deepEqual(messages, []);
  out.forEach(assertAA);
});

test('2.14 brand close to "Removed": a shifted shade, the badge keeps its colour, and the warning names "Removed"', () => {
  const before = JSON.stringify(ENGINE);
  const { out, messages } = resolve(['#b8261c']);
  assert.notEqual(out[0].band, '#b8261c');
  assert.ok(deltaE(out[0].band, ENGINE.light.meaning.removed) >= T);
  assert.equal(JSON.stringify(ENGINE), before);
  const m = messages[0];
  assert.match(m.problem, /^Party 1's colour #b8261c is too close to the colour of the "Removed" badge and errors, so Party 1 is drawn in a shifted shade, #[0-9a-f]{6}, so it can't be mistaken for "Removed"\.$/);
});

test('the pack\'s dark colour is used in dark mode when given; otherwise a variant is derived', () => {
  const [given] = resolve([{ primary: '#5f259f', dark: '#b48be8' }]).out;
  assert.equal(given.darkBand, '#b48be8');
  // A pack dark colour is still checked: next to the dark focus-ring blue, it is shifted.
  assert.notEqual(resolve([{ primary: '#0b1f4d', dark: '#8fa9e0' }]).out[0].darkBand, '#8fa9e0');
  const [derived] = resolve(['#0b1f4d']).out;
  assert.notEqual(derived.darkBand, '#0b1f4d');
  assert.ok(oklch(derived.darkBand)[0] >= 0.62 - 1e-3);
  assertAA(derived);
});

test('a brand colour no ink reaches 4.5:1 on is shifted in lightness until one does, with a warning', () => {
  const { out, messages } = resolve(['#ff3b6b']);
  assertAA(out[0]);
  if (out[0].band !== '#ff3b6b') assert.match(messages[0].problem, /WCAG AA contrast of 4\.5:1/);
});

test('AA on every derived pair, light and dark, for a spread of brand colours', () => {
  const hexes = [];
  for (let h = 0; h < 360; h += 30) for (const L of [0.3, 0.55, 0.8, 0.95]) hexes.push(fromOklch([L, 0.15, h]));
  for (let i = 0; i < hexes.length; i += 4) resolve(hexes.slice(i, i + 4)).out.forEach(assertAA);
});

test('2.15 unbranded parties: neutral colours, distinct from each other, and no messages', () => {
  const { out, messages } = resolve([null, null, null]);
  assert.deepEqual(out.map((r) => [r.source, r.band]), NEUTRALS.slice(0, 3).map((n) => ['neutral', n]));
  assert.deepEqual(out.map((r) => r.adjusted), [[], [], []]);
  assert.deepEqual(messages, []);
  out.forEach(assertAA);
  // Shifted neutrals (e.g. next to a brand) are never reported: the author chose no colour.
  assert.deepEqual(resolve(['#0b1f4d', null, null, null, null, null, null]).messages, []);
});

test('deterministic: the same parties always give the same colours', () => {
  const list = ['#d6281e', { primary: '#c92d25', secondary: '#1f5fbf' }, null, '#ffd23f', '#b8261c'];
  assert.deepEqual(resolve(list).out, resolve(list).out);
});

test('loadModel: partyColours in party order, and colour warnings located at the party', () => {
  const pack = (id, primary, secondary) => `---\nid: ${id}\nname: ${id}\nversion: "1"\nupdated: 2026-01-01\ncolours:\n  primary: "${primary}"\n${secondary ? `  secondary: "${secondary}"\n` : ''}marks:\n  mark: mark.svg\n---\n`;
  const party = (id, name, brand) => `---\nid: ${id}\ntype: party\nname: ${name}\nbrand: ${brand}\n---\n`;
  const r = loadModel(files({
    'model.md': MODEL,
    'parties/1-acme.md': party('acme', 'Acme Corp', 'acme'),
    'parties/2-globex.md': party('globex', 'Globex', 'globex'),
    'brands/acme/brand.md': pack('acme', '#d6281e'),
    'brands/acme/mark.svg': '<svg/>',
    'brands/globex/brand.md': pack('globex', '#c92d25', '#1f5fbf'),
    'brands/globex/mark.svg': '<svg/>',
  }));
  assert.deepEqual(r.model.partyColours.map((c) => [c.party, c.band]), [['acme', '#d6281e'], ['globex', '#1f5fbf']]);
  const [m] = r.messages;
  assert.equal(r.messages.length, 1);
  assert.deepEqual([m.level, m.file, m.element], ['warning', 'parties/2-globex.md', 'globex']);
  assert.equal(m.problem, "Globex's colour #c92d25 is too close to Acme Corp's colour, so Globex is drawn in its brand's secondary colour, #1f5fbf.");
});
