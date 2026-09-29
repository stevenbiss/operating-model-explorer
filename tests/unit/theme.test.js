import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadModel } from '../../src/model/load.js';
import { contrast } from '../../src/model/theme-check.js';
import { toSnapshot } from '../../src/model/snapshot.js';
import { article, labeller, themeCss, DEFAULT_PALETTE } from '../../src/viewer/theme.js';
import { formatRoute, parseRoute } from '../../src/viewer/route.js';
import { files, MODEL, readFolder, SAMPLE } from './helpers.js';

const withTheme = (header, extra = {}) => loadModel(files({ 'model.md': MODEL, 'theme.md': `---\ntype: theme\n${header}---\n`, ...extra }));

test('contrast uses the WCAG formula', () => {
  assert.equal(contrast('#000000', '#ffffff').toFixed(0), '21');
  assert.equal(contrast('#999999', '#ffffff').toFixed(2), '2.85');
});

test('low-contrast theme: a warning naming both colours, the ratio and the minimum', () => {
  const [m, ...rest] = withTheme('colors:\n  text: "#999999"\n  background: "#ffffff"\n').messages;
  assert.equal(m.level, 'warning');
  assert.equal(m.file, 'theme.md');
  for (const s of ['#999999', '#ffffff', '2.85:1', '4.5:1']) assert.ok(m.problem.includes(s), s);
  assert.ok(m.fix);
  assert.ok(rest.every((x) => x.level === 'warning'));
});

test('remote font rejected: error explaining fonts must be files in assets/', () => {
  const msgs = withTheme('fonts:\n  body: https://fonts.example.com/brand.woff2\n').messages;
  assert.equal(msgs.length, 1);
  assert.equal(msgs[0].level, 'error');
  assert.match(msgs[0].problem, /Fonts must be files in the assets\/ folder/);
});

test('remote logo rejected', () => {
  const [m] = withTheme('logo: https://example.com/logo.png\n').messages;
  assert.equal(m.level, 'error');
  assert.match(m.problem, /web address/);
});

test('missing asset: error naming the missing file', () => {
  const [m] = withTheme('logo: assets/missing.png\n').messages;
  assert.equal(m.level, 'error');
  assert.match(m.problem, /"assets\/missing\.png" was not found/);
  const font = withTheme('fonts:\n  heading: assets/brand.woff2\n').messages[0];
  assert.match(font.problem, /"assets\/brand\.woff2" was not found/);
  assert.deepEqual(withTheme('fonts:\n  heading: assets/brand.woff2\n', { 'assets/brand.woff2': 'x' }).messages, []);
});

test('no theme file: no theme messages, the default palette and no overrides', () => {
  const { model, messages } = loadModel(files({ 'model.md': MODEL }));
  assert.deepEqual(messages, []);
  const t = themeCss(toSnapshot(model));
  assert.equal(t.css, ':root:root{}');
  assert.deepEqual(t.palette, DEFAULT_PALETTE);
});

test('the sample theme becomes CSS custom properties, and the snapshot keeps only the logo as a data URI', () => {
  const snap = toSnapshot(loadModel(readFolder(SAMPLE)).model);
  assert.deepEqual(Object.keys(snap.assets), ['assets/logo.svg']);
  assert.match(snap.assets['assets/logo.svg'], /^data:image\/svg\+xml;base64,/);
  const { css, palette } = themeCss(snap);
  for (const s of ['--om-primary:#0b1f4d', '--om-on-primary:#ffffff', '--om-bg:#ffffff', '--om-text:#1a1a1a', 'color-scheme:light', '--om-font-heading:Georgia, serif']) assert.ok(css.includes(s), s);
  assert.equal(palette[0], '#3a6ea5');
});

test('a font stack cannot inject CSS', () => {
  const snap = toSnapshot(withTheme('fonts:\n  body: "Arial; } body { display: none"\n').model);
  assert.ok(!themeCss(snap).css.includes('display: none;') && !/[{};]\s*body/.test(themeCss(snap).css.replace(':root:root{', '')));
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
