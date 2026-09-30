import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadModel } from '../../src/model/load.js';
import { toSnapshot } from '../../src/model/snapshot.js';
import { article, labeller } from '../../src/viewer/theme.js';
import { formatRoute, parseRoute } from '../../src/viewer/route.js';
import { files, MODEL, readFolder, SAMPLE } from './helpers.js';

const withTheme = (header, extra = {}) => loadModel(files({ 'model.md': MODEL, 'theme.md': `---\ntype: theme\n${header}---\n`, ...extra }));

// Theme keys retired by add-party-brands (theming spec › Theme file, design D7).
test('2.21 custom colours: "colors" is ignored with one warning saying party colours now come from brand packs', () => {
  const msgs = withTheme('colors:\n  primary: "#0b1f4d"\n  text: "#999999"\n  palette: ["#3a6ea5"]\n').messages;
  assert.equal(msgs.length, 1, 'one warning per retired key, and no contrast check');
  const [m] = msgs;
  assert.deepEqual([m.level, m.file], ['warning', 'theme.md']);
  assert.match(m.problem, /"colors", which is retired, so it is ignored/);
  assert.match(m.problem, /Party colours now come from brand packs/);
  assert.match(m.fix, /^Remove "colors" from theme\.md\. .*brand pack/);
});

test('2.22 logo: ignored with a warning, even when the file is missing or a web address', () => {
  for (const logo of ['assets/logo.svg', 'assets/missing.png', 'https://example.com/logo.png']) {
    const [m, ...rest] = withTheme(`logo: ${logo}\n`).messages;
    assert.equal(rest.length, 0, logo);
    assert.equal(m.level, 'warning');
    assert.match(m.problem, /"logo", which is retired.*party marks from brand packs/);
  }
});

test('2.25 remote font: a retired-key warning, not an error, and no font reaches the snapshot', () => {
  const r = withTheme('fonts:\n  body: https://fonts.example.com/brand.woff2\n  heading: assets/brand.woff2\n', { 'assets/brand.woff2': 'x' });
  const [m, ...rest] = r.messages;
  assert.equal(rest.length, 0);
  assert.equal(m.level, 'warning');
  assert.match(m.problem, /"fonts", which is retired.*No font is fetched or embedded/);
  assert.equal(m.fix, 'Remove "fonts" from theme.md.');
  assert.deepEqual(toSnapshot(r.model).assets, {});
});

test('a palette key: its own warning; every retired key warns once, in a fixed order', () => {
  const msgs = withTheme('palette: ["#3a6ea5"]\nlogo: x.svg\nfonts: { body: Georgia }\ncolors: { primary: "#000000" }\n').messages;
  assert.deepEqual(msgs.map((m) => m.problem.match(/"(\w+)", which is retired/)[1]), ['colors', 'fonts', 'logo', 'palette']);
});

test('2.27 missing asset: a narrative image that is not in assets/ is an error naming the file', () => {
  const [m] = loadModel(files({ 'model.md': MODEL.replace('purpose: A tiny model.', 'purpose: "See ![Plan](assets/missing.png)"') })).messages;
  assert.equal(m.level, 'error');
  assert.match(m.problem, /"assets\/missing\.png" was not found/);
});

test('2.23 no theme file: no theme messages', () => {
  assert.deepEqual(loadModel(files({ 'model.md': MODEL })).messages, []);
});

test('2.20 labels only: no theme messages, and the snapshot carries only the labels and no logo', () => {
  const r = withTheme('labels:\n  workstream: Value stream\n  workstreams: Value streams\n');
  assert.deepEqual(r.messages, []);
  assert.equal(labeller(toSnapshot(r.model).theme)('workstream'), 'Value stream');
  const snap = toSnapshot(loadModel(readFolder(SAMPLE)).model);
  assert.deepEqual(snap.assets, {}, "the sample's old logo is no longer embedded");
  assert.equal(labeller(snap.theme)('workstreams'), 'Value streams');
});

test('labels: overrides replace defaults, unset terms keep them', () => {
  const L = labeller({ labels: { workstream: 'Value stream', workstreams: 'Value streams' } });
  assert.equal(L('workstreams'), 'Value streams');
  assert.equal(L.lower('workstream'), 'value stream');
  assert.equal(L('process'), 'Process');
  assert.equal(labeller(null)('key_messages'), 'Key messages');
  assert.equal(labeller({ labels: { team: 'CRM team' } }).lower('team'), 'CRM team');
});

test('routes round-trip, including persona and change markers', () => {
  for (const h of ['#/', '#/w/presales', '#/p/qualify-opportunity', '#/p/build-proposal/s/review-proposal?persona=acme-account-lead&changes=1', '#/r/account-lead', '#/e/acme', '#/search?q=bid', '#/me?persona=x&only=1']) {
    assert.equal(formatRoute(parseRoute(h)), h);
  }
  assert.deepEqual(parseRoute(''), { view: 'overview', persona: null, changes: false, only: false, q: '' });
  assert.equal(parseRoute('#/p/x/s/y').step, 'y');
});

test('a label renamed in only one form: a warning suggesting the missing form', () => {
  const [m, ...rest] = withTheme('labels:\n  workstream: Value stream\n').messages;
  assert.equal(rest.length, 0);
  assert.equal(m.level, 'warning');
  assert.equal(m.file, 'theme.md');
  assert.match(m.problem, /"workstreams"/);
  assert.match(m.fix, /workstreams: Value streams/);
  assert.match(withTheme('labels:\n  parties: Companies\n').messages[0].fix, /party: Company/);
  assert.match(withTheme('labels:\n  process: Journey\n').messages[0].fix, /processes: Journeys/);
  assert.deepEqual(withTheme('labels:\n  process: Journey\n  processes: Journeys\n').messages, []);
});

test('article: a/an by sound, so no configured term gets the wrong article', () => {
  const cases = { party: 'a', organisation: 'an', persona: 'a', entity: 'an', 'in-house team': 'an', unit: 'a', user: 'a', umbrella: 'an', hour: 'an', 'one-off': 'a', FAQ: 'an', CRM: 'a', 'key message': 'a' };
  for (const [w, a] of Object.entries(cases)) assert.equal(article(w), a, w);
  const L = labeller({ labels: { party: 'Organisation', persona: 'Viewpoint' } });
  assert.equal(L.a('party'), 'an organisation');
  assert.equal(L.a('persona'), 'a viewpoint');
  assert.equal(labeller().a('persona'), 'a persona');
});

test('labeller output is HTML-escaped at the source', () => {
  const L = labeller({ labels: { process: '<img src=x onerror="alert(1)">Proc', party: 'R&D' } });
  assert.equal(L('process'), '&#60;img src=x onerror=&#34;alert(1)&#34;&#62;Proc');
  assert.equal(L.lower('party'), 'r&#38;D');
  assert.ok(!/[<>"]/.test(L.a('process')));
});
