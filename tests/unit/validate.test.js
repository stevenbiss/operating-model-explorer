import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadModel } from '../../src/model/load.js';
import { closest } from '../../src/model/validate.js';
import { files, MODEL, readFolder, SAMPLE } from './helpers.js';

const run = (obj) => loadModel(files({ 'model.md': MODEL, ...obj })).messages;
const only = (msgs) => {
  assert.equal(msgs.length, 1, JSON.stringify(msgs, null, 2));
  return msgs[0];
};
const PARTY = '---\nid: acme\ntype: party\nname: Acme\n---\n';
const ROLES = {
  'parties/acme.md': PARTY,
  'roles/sa.md': '---\nid: solution-architect\ntype: role\nname: SA\nparty: acme\n---\n',
  'roles/al.md': '---\nid: account-lead\ntype: role\nname: AL\nparty: acme\n---\n',
  'workstreams/w.md': '---\nid: presales\ntype: workstream\nname: W\nsummary: S\ndetail: detailed\n---\n',
};
const processWith = (steps) => ({ ...ROLES, 'processes/p.md': `---\nid: qualify\ntype: process\nname: Q\nworkstream: presales\nsteps:\n${steps}---\n` });

test('minimal valid model: only model.md, no messages', () => {
  const { model, messages } = loadModel(files({ 'model.md': MODEL }));
  assert.deepEqual(messages, []);
  assert.equal(model.model.name, 'Mini');
});

test('missing model.md', () => {
  const m = only(loadModel(files({ 'parties/acme.md': PARTY })).messages);
  assert.equal(m.level, 'error');
  assert.equal(m.problem, 'No model.md found at the top of the folder.');
});

test('a wrapping folder (from a zip or folder picker) is not mistaken for a missing model.md', () => {
  assert.deepEqual(loadModel(files({ 'my-model/model.md': MODEL, 'my-model/parties/acme.md': PARTY })).messages, []);
});

test('malformed header: names the file and the line of the YAML error', () => {
  const m = only(run({ 'roles/bad.md': '---\nid: bad\ntype: role\nname: Bad: role\nparty: acme\n---\n' }));
  assert.equal(m.file, 'roles/bad.md');
  assert.equal(m.line, 4);
  assert.match(m.problem, /not valid YAML at line 4/);
  assert.ok(m.fix);
});

test('header with no closing line', () => {
  assert.match(only(run({ 'roles/bad.md': '---\nid: bad\n' })).problem, /no closing ---/);
});

test('file with no header is a warning and is ignored', () => {
  const m = only(run({ 'notes.md': '# Just notes' }));
  assert.equal(m.level, 'warning');
  assert.equal(m.file, 'notes.md');
});

test('missing or unknown type', () => {
  assert.match(only(run({ 'x.md': '---\nid: x\nname: X\n---\n' })).problem, /no "type" field/);
  assert.equal(only(run({ 'x.md': '---\nid: x\ntype: rol\nname: X\n---\n' })).fix, 'Did you mean role?');
});

test('missing required field: names the file and the field', () => {
  const m = only(run({ ...ROLES, 'roles/x.md': '---\nid: x\ntype: role\nparty: acme\n---\n' }));
  assert.deepEqual([m.level, m.file, m.element], ['error', 'roles/x.md', 'x']);
  assert.match(m.problem, /"name"/);
  assert.match(m.fix, /name:/);
});

test('wrong kind of value', () => {
  const m = only(run({ ...ROLES, 'processes/p.md': '---\nid: p\ntype: process\nname: P\nworkstream: presales\nsteps: none\n---\n' }));
  assert.equal(m.problem, '"steps" should be a list, but it is text.');
});

test('id in the wrong format', () => {
  const m = only(run({ 'parties/x.md': '---\nid: Acme Corp\ntype: party\nname: Acme\n---\n' }));
  assert.match(m.problem, /"id" is "Acme Corp", which is not in the right format/);
  assert.match(m.fix, /lower-case/);
});

test('duplicate id: names both files', () => {
  const m = only(run({ ...ROLES, 'roles/dupe.md': '---\nid: account-lead\ntype: role\nname: Dupe\nparty: acme\n---\n' }));
  assert.equal(m.level, 'error');
  assert.ok([m.file, m.problem].join(' ').includes('roles/al.md'));
  assert.ok([m.file, m.problem].join(' ').includes('roles/dupe.md'));
});

test('duplicate step id within a process', () => {
  const m = only(run(processWith('  - {id: a, name: A, owner: account-lead}\n  - {id: a, name: B, owner: account-lead}\n')));
  assert.match(m.problem, /Two steps in this process use the id "a"/);
});

test('unknown owner: names the process file, the step, the id and a suggestion', () => {
  const m = only(run(processWith('  - {id: scope, name: Scope, owner: sol-arch}\n')));
  assert.deepEqual([m.level, m.file, m.element, m.step], ['error', 'processes/p.md', 'qualify', 'scope']);
  assert.match(m.problem, /sol-arch/);
  assert.equal(m.fix, 'Did you mean solution-architect?');
});

test('unknown next step, RACI role, party, workstream and persona role are all checked', () => {
  const msgs = run({
    ...processWith('  - {id: a, name: A, owner: account-lead, raci: {acount-lead: C}, next: [{to: bb, label: Yes}]}\n  - {id: b, name: B, owner: account-lead}\n'),
    'roles/x.md': '---\nid: x\ntype: role\nname: X\nparty: acm\n---\n',
    'personas/p.md': '---\nid: p\ntype: persona\nname: P\nroles: [account-led]\nentry: {view: process, id: qualfy}\n---\n',
  });
  const fixes = msgs.map((m) => m.fix).sort();
  assert.deepEqual(fixes, ['Did you mean account-lead?', 'Did you mean account-lead?', 'Did you mean acme?', 'Did you mean b?', 'Did you mean qualify?']);
});

test('a reference to the wrong type of element says so', () => {
  const m = only(run(processWith('  - {id: a, name: A, owner: acme}\n')));
  assert.equal(m.problem, 'The owner "acme" is a party, not a role.');
});

test('persona entry point without an id, and persona without roles', () => {
  const msgs = run({ ...ROLES, 'personas/p.md': '---\nid: p\ntype: persona\nname: P\nroles: []\nentry: {view: role}\n---\n' });
  assert.equal(msgs.length, 2);
  assert.ok(msgs.some((m) => /no roles/.test(m.problem)));
  assert.ok(msgs.some((m) => /does not say which one/.test(m.problem)));
});

test('invalid change status: lists the allowed values', () => {
  const m = only(run(processWith('  - {id: a, name: A, owner: account-lead, change: {status: maybe}}\n')));
  assert.equal(m.step, 'a');
  assert.match(m.problem, /"change.status" is "maybe"/);
  assert.equal(m.fix, 'Use one of: new, changed, removed, unchanged.');
});

test('unknown field is a warning, not an error', () => {
  const m = only(run({ ...ROLES, 'roles/x.md': '---\nid: x\ntype: role\nname: X\nparty: acme\nlocation: London\n---\n' }));
  assert.equal(m.level, 'warning');
  assert.match(m.problem, /"location" is not a field the engine knows for a role/);
  assert.match(m.fix, /Known fields here: id, type, name, party/);
});

test('only one model and one theme', () => {
  const theme = '---\ntype: theme\n---\n';
  const msgs = run({ 'other.md': MODEL.replace('id: mini', 'id: other'), 'theme.md': theme, 'theme2.md': theme });
  assert.equal(msgs.length, 2);
  assert.ok(msgs.every((m) => /There is already a (model|theme)/.test(m.problem)));
});

test('message format: every message is plain English with file, problem and fix', () => {
  const sample = readFolder(SAMPLE);
  const broken = sample.map((f) => (f.path === 'roles/legal-counsel.md' ? { ...f, data: new TextEncoder().encode('---\nid: legal-counsel\ntype: role\nname: Legal\nparty: acme\nlocation: London\n---\n') } : f));
  broken.push(...files({ 'roles/x.md': '---\nid: x\ntype: role\nparty: acme\n---\n' }));
  const msgs = loadModel(broken).messages;
  assert.equal(msgs.filter((m) => m.level === 'error').length, 1);
  assert.equal(msgs.filter((m) => m.level === 'warning').length, 1);
  for (const m of msgs) {
    assert.ok(m.file && m.problem && m.fix, JSON.stringify(m));
    assert.doesNotMatch(m.problem + m.fix, /undefined|\[object|Error:|at .*\.js/);
  }
});

test('closest id prefers abbreviations, and gives up when nothing is similar', () => {
  assert.equal(closest('sol-arch', ['account-lead', 'solution-architect', 'bid-manager']), 'solution-architect');
  assert.equal(closest('acount-lead', ['account-lead', 'bid-manager']), 'account-lead');
  assert.equal(closest('zzzzzz', ['account-lead', 'bid-manager']), undefined);
});

test('a step that stays but is owned by a removed role is a warning; a removed step is not', () => {
  const removedRole = { 'roles/al.md': '---\nid: account-lead\ntype: role\nname: AL\nparty: acme\nchange: {status: removed}\n---\n' };
  const m = only(run({ ...processWith('  - {id: a, name: A, owner: account-lead}\n  - {id: b, name: B, owner: account-lead, change: {status: removed}}\n'), ...removedRole }));
  assert.deepEqual([m.level, m.file, m.element, m.step], ['warning', 'processes/p.md', 'qualify', 'a']);
  assert.match(m.problem, /owned by the role "account-lead", which is marked as removed/);
  assert.ok(m.fix);
});
