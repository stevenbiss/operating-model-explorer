// Capture sheets (capture-sheet spec): sheetToDocs, routing through loadModel, and parity with the sample folder.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { zipSync } from 'fflate';
import { loadModel } from '../../src/model/load.js';
import { isSheet, sheetToDocs, FORMAT } from '../../src/model/sheet.js';
import { readZip } from '../../src/model/read.js';
import { files, readFolder, readSampleSheet, SAMPLE, SAMPLE_SHEET, withoutAccountable } from './helpers.js';
import { PRIVATE_NAMES } from '../private-names.js';

const ROOT = new URL('../../', import.meta.url);
const read = (p) => readFileSync(new URL(p, ROOT), 'utf8');

// A small valid sheet. Sections can be swapped out with with().
const BASE = `# Operating model: Tiny partnership

Format: 1

## Purpose

Why **it** exists.

## Key messages

- One team.
- One plan.

## Parties

| Party | Summary |
|---|---|
| Acme Corp | The client side. |
| Globex | The solution side. |

## Roles

| Role | Party | Summary |
|---|---|---|
| Account lead | Acme Corp | Owns the client. |
| Solution architect | Globex | Designs it. |
| Legal counsel | Acme Corp | Checks terms. |

## Workstreams

| Workstream | Summary | Parties | Detail |
|---|---|---|---|
| Presales | Winning work. | Acme Corp; Globex | Detailed |

## Process: Build the proposal

Workstream: Presales

| # | Step | Owner | Next |
|---|---|---|---|
| 1 | Plan the bid | Account lead | |
| 2 | Design the solution | Solution architect | |
| 3 | Submit the proposal | Account lead | End |

### RACI

| Step | Account lead | Solution architect | Legal counsel |
|---|---|---|---|
| 1 | A | | |
| 2 | | A | |
| 3 | A | | C |
`;

// Replace the "## <heading>" section of BASE (up to the next ##), or append it.
function with_(section, base = BASE) {
  const heading = section.match(/^## .*$/m)[0];
  const at = base.indexOf(`${heading}\n`);
  if (at < 0) return `${base}\n${section}\n`;
  const end = base.indexOf('\n## ', at + 1);
  return base.slice(0, at) + section + (end < 0 ? '\n' : `\n${base.slice(end + 1)}`);
}
const load = (text, extra = {}) => loadModel(files({ 'capture-sheet.md': text, ...extra }));
const only = (msgs) => {
  assert.equal(msgs.length, 1, JSON.stringify(msgs, null, 2));
  return msgs[0];
};
const proc = (m) => m.model.elements['build-the-proposal'];

test('the base sheet loads cleanly, with ids derived from names', () => {
  const r = load(BASE);
  assert.deepEqual(r.messages, []);
  assert.equal(r.model.model.id, 'tiny-partnership');
  assert.equal(r.model.model.name, 'Tiny partnership');
  assert.deepEqual(r.model.order.party, ['acme-corp', 'globex']);
  assert.equal(r.model.elements['account-lead'].party, 'acme-corp');
  assert.deepEqual(r.model.elements.presales.parties, ['acme-corp', 'globex']);
  assert.deepEqual(proc(r).steps.map((s) => s.id), ['plan-the-bid', 'design-the-solution', 'submit-the-proposal']);
  assert.deepEqual(r.meta, { openQuestions: [], sources: [] });
});

test('isSheet: the first heading decides, and comments before it are ignored', () => {
  assert.ok(isSheet('<!-- guide -->\n# Operating model: X\n'));
  assert.ok(isSheet('\n#  operating model:X'));
  assert.ok(!isSheet('---\nid: x\n---\n# Operating model: X'.replace('---\nid: x\n---\n', '## Notes\n')));
  assert.ok(!isSheet('# Notes\n# Operating model: X'));
});

// ---------- sections ----------

test('2.2 missing required section: an error naming the heading to add', () => {
  const text = BASE.replace(/## Roles[\s\S]*?(?=## Workstreams)/, '');
  const m = load(text).messages.find((x) => /no "Roles" section/.test(x.problem));
  assert.equal(m.level, 'error');
  assert.match(m.fix, /## Roles/);
});

test('an unknown section is a warning naming it, with a suggestion', () => {
  const m = only(load(`${BASE}\n## Personnas\n\nText.\n`).messages);
  assert.equal(m.level, 'warning');
  assert.match(m.problem, /## Personnas/);
  assert.equal(m.fix, 'Did you mean Personas?');
});

test('HTML comments are ignored everywhere and never reach the model', () => {
  const text = BASE.replace('Why **it** exists.', 'Why **it** exists. <!-- SECRET-A -->').replace('| Globex | The solution side. |', '<!-- SECRET-B -->\n| Globex | The solution side. |').replace('## Parties', '<!--\n## Personas\nSECRET-C\n-->\n## Parties');
  const r = load(text);
  assert.deepEqual(r.messages, []);
  assert.doesNotMatch(JSON.stringify(r.model), /SECRET/);
});

// ---------- tables ----------

test('2.4 columns in a different order load exactly the same', () => {
  const swapped = with_(`## Roles

| summary | PARTY | Role |
|---|---|---|
| Owns the client. | Acme Corp | Account lead |
| Designs it. | Globex | Solution architect |
| Checks terms. | Acme Corp | Legal counsel |`);
  const plain = (r) => JSON.parse(JSON.stringify({ ...r.model, assets: {} }));
  assert.deepEqual(plain(load(swapped)), plain(load(BASE)));
});

test('2.3 missing required column: an error naming the table and the column', () => {
  const r = load(with_('## Roles\n\n| Role | Summary |\n|---|---|\n| Account lead | x |\n| Solution architect | y |\n| Legal counsel | z |'));
  const m = only(r.messages);
  assert.deepEqual([m.level, m.where], ['error', 'Roles']);
  assert.equal(m.problem, 'The Roles table has no "Party" column.');
});

test('an unknown column is a warning with a suggestion; an empty required cell names the row', () => {
  const r = load(with_('## Roles\n\n| Role | Party | Sumary |\n|---|---|---|\n| Account lead | Acme Corp | x |\n| Solution architect | | y |\n| Legal counsel | Acme Corp | z |'));
  const [warn, err] = [r.messages.find((m) => m.level === 'warning'), r.messages.find((m) => m.level === 'error')];
  assert.match(warn.problem, /"Sumary"/);
  assert.equal(warn.fix, 'Did you mean Summary?');
  assert.equal(err.where, 'Roles › row 2 (Solution architect)');
  assert.equal(err.problem, 'This row has no Party.');
  assert.equal(r.messages.length, 2);
});

test('a table that cannot be read is reported, not skipped silently', () => {
  const m = load(with_('## Parties\n\n| Party | Summary |\n|---|\n| Acme Corp | x |')).messages.find((x) => x.where === 'Parties');
  assert.match(m.problem, /could not be read/);
});

test('optional columns: ID overrides the derived id, and Change/Today give change data', () => {
  const r = load(with_('## Parties\n\n| Party | ID | Change | Today |\n|---|---|---|---|\n| Acme Corp | acme | New | Two contracts. |\n| Globex | | | |'));
  assert.deepEqual(r.messages, []);
  assert.deepEqual(r.model.elements.acme.change, { status: 'new', today: 'Two contracts.' });
  assert.equal(r.model.elements['account-lead'].party, 'acme');
  const bad = load(with_('## Parties\n\n| Party | Today |\n|---|---|\n| Acme Corp | Two contracts. |\n| Globex | |'));
  assert.match(only(bad.messages).problem, /Today is filled in, but Change is empty/);
});

// ---------- names ----------

test('2.5 owner written with different case and spacing: matched, no message', () => {
  const r = load(BASE.replace('| 2 | Design the solution | Solution architect |', '| 2 | Design the solution | solution  Architect |'));
  assert.deepEqual(r.messages, []);
  assert.equal(proc(r).steps[1].owner, 'solution-architect');
});

test('2.6 / 2.16 unknown name: an error naming the process, the row and the name, with a suggestion', () => {
  const r = load(BASE.replace('| 2 | Design the solution | Solution architect |', '| 2 | Design the solution | Sol architect |'));
  const m = only(withoutAccountable(r.messages));
  assert.equal(m.level, 'error');
  assert.equal(m.where, 'Process: Build the proposal › row 2 (Design the solution)');
  assert.match(m.problem, /"Sol architect"/);
  assert.equal(m.fix, 'Did you mean Solution architect?');
});

test('every message about a sheet carries a where, and none carries undefined text', () => {
  const r = load(BASE.replace('Acme Corp; Globex', 'Acme; Globx').replace('| Detailed |', '| Full |').replace('| 3 | A | | C |', '| 3 | A/R | | C |'));
  assert.ok(r.messages.length >= 3);
  for (const m of r.messages) {
    assert.ok(m.where && m.problem && m.fix, JSON.stringify(m));
    assert.doesNotMatch(m.where + m.problem + m.fix, /undefined|\[object/);
  }
  assert.ok(r.messages.some((m) => m.where === 'Workstreams › row 1 (Presales)' && /"detail" is "full"/.test(m.problem)));
});

test('two elements of the same type with the same name are an error', () => {
  const r = load(with_('## Parties\n\n| Party |\n|---|\n| Acme Corp |\n| Globex |\n| acme  corp |'));
  const m = only(r.messages);
  assert.equal(m.where, 'Parties › row 3 (acme  corp)');
  assert.match(m.problem, /already a party called "Acme Corp"/);
});

// ---------- processes ----------

test('2.7 decision with labelled branches, by number and by name', () => {
  const r = load(BASE.replace('| 1 | Plan the bid | Account lead | |', '| 1 | Plan the bid | Account lead | Go: 2; No go: Submit the proposal |'));
  assert.deepEqual(r.messages, []);
  const p = proc(r);
  assert.deepEqual(p.steps[0].next, [{ to: 'design-the-solution', label: 'Go' }, { to: 'submit-the-proposal', label: 'No go' }]);
  assert.deepEqual(p.edges.filter((e) => e.from === 'plan-the-bid').map((e) => e.label), ['Go', 'No go']);
  assert.deepEqual(p.steps[1].next, [{ to: 'submit-the-proposal' }], 'empty Next = the following row');
  assert.deepEqual(p.steps[2].next, [], 'End stops the flow');
});

test('2.8 Next points at a missing step: an error naming the process, the row and the step number', () => {
  const m = only(load(BASE.replace('| 1 | Plan the bid | Account lead | |', '| 1 | Plan the bid | Account lead | 9 |')).messages);
  assert.equal(m.where, 'Process: Build the proposal › row 1 (Plan the bid)');
  assert.match(m.problem, /step 9/);
  assert.match(m.problem, /"Build the proposal"/);
});

test('step columns: lists split by semicolons, description kept as Markdown, Change and Today', () => {
  const r = load(with_(`## Process: Build the proposal

Workstream: presales
Summary: Design and send it.
Change: Changed
Today: It was ad hoc.

| # | Step | Owner | Description | Inputs | Outputs | Systems | KPIs | Change | Today |
|---|---|---|---|---|---|---|---|---|---|
| 1 | Plan the bid | Account lead | Plan **it**; <b>now</b> | Brief | Plan; Task list | Pricing tool | On time; On budget | New | None |

### RACI

| # | Account lead |
|---|---|
| 1 | A |`));
  assert.deepEqual(r.messages, []);
  const p = proc(r);
  assert.deepEqual([p.summary, p.change], ['Design and send it.', { status: 'changed', today: 'It was ad hoc.' }]);
  const s = p.steps[0];
  assert.equal(s.description, 'Plan **it**; <b>now</b>', 'raw Markdown; the viewer escapes HTML');
  assert.deepEqual([s.inputs, s.outputs, s.systems, s.kpis], [['Brief'], ['Plan', 'Task list'], ['Pricing tool'], ['On time', 'On budget']]);
  assert.deepEqual(s.change, { status: 'new', today: 'None' });
});

test('a process without a Workstream line, or without steps, is an error', () => {
  const msgs = load(with_('## Process: Build the proposal\n\nSummary: x\n')).messages;
  assert.ok(msgs.some((m) => /no "Workstream:" line/.test(m.problem)));
  assert.ok(msgs.some((m) => /no step table/.test(m.problem)));
});

test('### Notes becomes the process narrative, with headings shifted to ##', () => {
  const r = load(`${BASE}\n### Notes\n\n#### Why\n\nBecause.\n\n##### Detail\n\nMore.\n`);
  assert.deepEqual(r.messages, []);
  assert.equal(proc(r).body, '## Why\n\nBecause.\n\n### Detail\n\nMore.');
});

// ---------- RACI matrix ----------

test('2.9 matrix becomes RACI', () => {
  const r = load(BASE);
  assert.deepEqual(proc(r).steps[2].raci, { 'account-lead': 'A', 'legal-counsel': 'C' });
});

test('2.10 combined letters rejected: an error naming the step and role, with the R-or-A fix', () => {
  const r = load(BASE.replace('| 1 | A | | |', '| 1 | A/R | | |'));
  const m = only(r.messages);
  assert.equal(m.level, 'error');
  assert.equal(m.where, 'Process: Build the proposal › row 1 (Plan the bid)');
  assert.match(m.problem, /Account lead has "A\/R" on the step "Plan the bid"/);
  assert.equal(m.fix, 'Choose one letter: R if Account lead does the work, or A if Account lead signs the work off.');
});

test('RACI: letters in any case, rows by name, and unknown roles, steps and letters reported', () => {
  const lower = load(BASE.replace('| 3 | A | | C |', '| Submit the proposal | a | | c |'));
  assert.deepEqual(lower.messages, []);
  assert.deepEqual(proc(lower).steps[2].raci, { 'account-lead': 'A', 'legal-counsel': 'C' });

  const role = only(load(BASE.replace('| Step | Account lead | Solution architect | Legal counsel |', '| Step | Account lead | Solution architect | Legal counsl |')).messages.filter((m) => m.level === 'error'));
  assert.equal(role.where, 'Process: Build the proposal › RACI › column 4');
  assert.equal(role.fix, 'Did you mean Legal counsel?');

  const step = only(load(BASE.replace('| 3 | A | | C |', '| 3 | A | | C |\n| Submit the proposl | | | I |')).messages);
  assert.match(step.problem, /This RACI row points to "Submit the proposl"/);
  assert.equal(step.fix, 'Did you mean Submit the proposal?');

  const letter = only(load(BASE.replace('| 3 | A | | C |', '| 3 | A | | X |')).messages);
  assert.match(letter.problem, /Legal counsel is "X", which is not R, A, C or I/);
});

test('RACI warnings apply to sheets too: no A and two As', () => {
  const none = only(load(BASE.replace('| 1 | A | | |', '| 1 | | | |')).messages);
  assert.deepEqual([none.level, none.where], ['warning', 'Process: Build the proposal › row 1 (Plan the bid)']);
  const two = only(load(BASE.replace('| 1 | A | | |', '| 1 | A | A | |')).messages);
  assert.match(two.problem, /Account lead and Solution architect/);
});

// ---------- personas, theme, narrative ----------

test('2.11 personas: roles by name and every kind of Starts at', () => {
  const r = load(`${BASE}\n## Personas\n\n| Persona | Roles | Starts at | Summary |\n|---|---|---|---|\n| Lead | Account lead | Process: Build the proposal | You own it. |\n| Team | Solution architect; Legal counsel | Workstream: presales | |\n| Counsel | Legal counsel | Role: Legal counsel | |\n| New | Account lead | Overview | |\n`);
  assert.deepEqual(r.messages, []);
  const e = r.model.elements;
  assert.deepEqual(e.lead.entry, { view: 'process', id: 'build-the-proposal' });
  assert.deepEqual(e.team.roles, ['solution-architect', 'legal-counsel']);
  assert.deepEqual([e.team.entry, e.counsel.entry, e.new.entry], [{ view: 'workstream', id: 'presales' }, { view: 'role', id: 'legal-counsel' }, { view: 'overview' }]);
  const bad = only(load(`${BASE}\n## Personas\n\n| Persona | Roles | Starts at |\n|---|---|---|\n| Lead | Account lead | The start |\n`).messages);
  assert.match(bad.problem, /"Starts at" is "The start"/);
});

test('2.12 theme lines become the theme, and the logo is read from assets/', () => {
  const logo = '<svg xmlns="http://www.w3.org/2000/svg"/>';
  const r = load(`${BASE}\n## Theme\n\nName: Tiny\nPrimary color: #0b1f4d\nText colour: #1a1a1a\nPalette: #3a6ea5; #2e7d5b\nBody font: Georgia, serif\nLogo: assets/logo.svg\nLabel workstream: Value stream\nLabel workstreams: Value streams\nLabel key message: Big idea\nLabel key messages: Big ideas\n`, { 'assets/logo.svg': logo });
  assert.deepEqual(r.messages, []);
  assert.deepEqual(r.model.theme, {
    type: 'theme',
    name: 'Tiny',
    colors: { primary: '#0b1f4d', text: '#1a1a1a', palette: ['#3a6ea5', '#2e7d5b'] },
    fonts: { body: 'Georgia, serif' },
    logo: 'assets/logo.svg',
    labels: { workstream: 'Value stream', workstreams: 'Value streams', key_message: 'Big idea', key_messages: 'Big ideas' },
  });
  assert.ok(r.model.assets['assets/logo.svg']);
  const missing = only(load(`${BASE}\n## Theme\n\nLogo: assets/logo.svg\nFavourite colour: blue\n`).messages.filter((m) => m.level === 'error'));
  assert.deepEqual([missing.where, missing.problem], ['Theme', 'The logo file "assets/logo.svg" was not found. Images must be files in the assets/ folder.']);
  assert.ok(load(`${BASE}\n## Theme\n\nFavourite colour: blue\n`).messages.some((m) => m.level === 'warning' && /Favourite colour/.test(m.problem)));
});

test('Purpose, Key messages and About this model become the model; Notes attach to the named element', () => {
  const r = load(`${BASE}\n## About this model\n\nFirst line\nsecond line.\n\n### How to read it\n\n<script>x</script> stays text.\n\n## Notes: presales\n\nWhere work is **won**.\n`);
  assert.deepEqual(r.messages, []);
  assert.equal(r.model.model.purpose, 'Why **it** exists.');
  assert.deepEqual(r.model.model.key_messages, ['One team.', 'One plan.']);
  assert.equal(r.model.model.body, 'First line\nsecond line.\n\n## How to read it\n\n<script>x</script> stays text.');
  assert.equal(r.model.elements.presales.body, 'Where work is **won**.');
  const m = only(load(`${BASE}\n## Notes: Presale\n\nText.\n`).messages);
  assert.deepEqual([m.level, m.where, m.fix], ['error', 'Notes: Presale', 'Did you mean Presales?']);
});

// ---------- open questions and sources ----------

test('2.14 open questions: unticked ones are warnings quoting them; ticked ones are ignored', () => {
  const r = load(`${BASE}\n## Open questions\n\n- [ ] Who signs off the price?\n- [x] Does Globex join?\n- [ ] Is legal always consulted?\n\n## Sources\n\n- Kick-off deck\n- Workshop notes\n`);
  assert.equal(r.messages.length, 2);
  assert.ok(r.messages.every((m) => m.level === 'warning' && m.openQuestion));
  assert.deepEqual(r.messages.map((m) => m.problem), ['Open question: Who signs off the price?', 'Open question: Is legal always consulted?']);
  assert.deepEqual(r.meta, { openQuestions: ['Who signs off the price?', 'Is legal always consulted?'], sources: ['Kick-off deck', 'Workshop notes'] });
  assert.doesNotMatch(JSON.stringify(r.model), /signs off the price|Does Globex join|Kick-off deck|Workshop notes/);
});

// ---------- format version (1.17) ----------

test('2.53 newer format: an error saying this engine reads up to the current format', () => {
  const m = only(load(BASE.replace('Format: 1', 'Format: 99')).messages);
  assert.deepEqual([m.level, m.where], ['error', 'Top of the sheet']);
  assert.equal(m.problem, `This sheet uses capture sheet format 99, but this engine reads formats up to ${FORMAT}.`);
  assert.match(m.fix, /newer version of the engine/);
});

test('2.54 missing format line: read as the current format, with a warning', () => {
  const r = load(BASE.replace('Format: 1\n', ''));
  const m = only(r.messages);
  assert.equal(m.level, 'warning');
  assert.match(m.fix, /Format: 1/);
  assert.equal(r.model.order.process.length, 1);
  assert.equal(only(load(BASE.replace('Format: 1', 'Format: one')).messages).level, 'error');
});

test('ID and Version lines under the title', () => {
  const r = load(BASE.replace('Format: 1', 'Format: 1\nID: tiny\nVersion: 2.0'));
  assert.deepEqual(r.messages, []);
  assert.deepEqual([r.model.model.id, r.model.model.version], ['tiny', '2.0']);
});

// ---------- loading (1.6) ----------

test('a sheet loads on its own, or from a folder or zip with assets/ alongside', () => {
  const single = loadModel([{ path: 'capture-sheet.md', data: readFileSync(SAMPLE_SHEET) }]);
  assert.deepEqual(single.messages.map((m) => m.problem), ['The logo file "assets/logo.svg" was not found. Images must be files in the assets/ folder.']);
  const folder = loadModel(readSampleSheet());
  assert.deepEqual(folder.messages, []);
  assert.ok(folder.model.assets['assets/logo.svg']);
  const zip = loadModel(readZip(zipSync(Object.fromEntries(readSampleSheet().map((f) => [`my-model/${f.path}`, f.data])))));
  assert.deepEqual(zip.messages, []);
  const other = loadModel([...readSampleSheet(), ...files({ 'README.md': '# Read me\n' })]);
  assert.deepEqual(other.messages, [], 'a Markdown file without a header is not an element file');
});

test('2.36 mixed formats: a sheet together with element files is an error', () => {
  const r = loadModel([...readFolder(SAMPLE), { path: 'capture-sheet.md', data: readFileSync(SAMPLE_SHEET) }]);
  const m = only(r.messages);
  assert.equal(m.level, 'error');
  assert.match(m.problem, /either one capture sheet or a folder of element files/);
  const two = loadModel([...readSampleSheet(), { path: 'copy.md', data: readFileSync(SAMPLE_SHEET) }]);
  assert.match(only(two.messages).problem, /more than one capture sheet/);
});

test('folders without a sheet load exactly as before', () => {
  assert.deepEqual(loadModel(readFolder(SAMPLE)).meta, undefined);
});

// ---------- parity with the sample folder (1.7, design D9) ----------

// Replace every id with its element's (or step's) name, so models with different ids compare.
function byName(m) {
  const el = m.elements;
  const n = (id) => (el[id] ? el[id].name : id);
  const elements = {};
  for (const e of Object.values(el)) {
    const x = { ...e, id: e.name };
    for (const k of ['party', 'team', 'workstream']) if (x[k]) x[k] = n(x[k]);
    for (const k of ['parties', 'roles', 'processes']) if (x[k]) x[k] = x[k].map(n);
    if (x.entry && x.entry.id) x.entry = { ...x.entry, id: n(x.entry.id) };
    if (x.steps) {
      const names = Object.fromEntries(e.steps.map((s) => [s.id, s.name]));
      const sn = (id) => names[id] || id;
      x.steps = e.steps.map((s) => ({ ...s, id: s.name, owner: n(s.owner), lane: n(s.lane), party: n(s.party), process: n(s.process), raci: Object.entries(s.raci).map(([r, l]) => [n(r), l]), next: s.next.map((t) => ({ ...t, to: sn(t.to) })) }));
      x.edges = e.edges.map((d) => ({ ...d, from: sn(d.from), to: sn(d.to) }));
    }
    elements[`${e.type}: ${e.name}`] = x;
  }
  return { model: { ...m.model, id: undefined }, theme: m.theme, elements, order: Object.fromEntries(Object.entries(m.order).map(([t, ids]) => [t, ids.map(n)])), assets: Object.keys(m.assets) };
}

test('2.1 / 2.17 the Acme capture sheet loads cleanly and gives exactly the sample folder model', () => {
  const sheet = loadModel(readSampleSheet());
  const folder = loadModel(readFolder(SAMPLE));
  assert.deepEqual(sheet.messages, []);
  assert.deepEqual(folder.messages, []);
  assert.deepEqual(byName(sheet.model), byName(folder.model));
});

// ---------- template and format spec (1.8) ----------

test('2.18 the blank template loads without crashing, lists what is missing, and keeps no guidance', () => {
  const r = loadModel([{ path: 'capture-sheet.md', data: readFileSync(new URL('templates/capture-sheet.md', ROOT)) }]);
  const errors = r.messages.filter((m) => m.level === 'error').map((m) => m.where);
  for (const w of ['Title', 'Purpose', 'Key messages', 'Parties', 'Roles']) assert.ok(errors.includes(w), w);
  assert.ok(!r.messages.some((m) => /Format/.test(m.problem)), 'the template has a Format line');
  assert.doesNotMatch(JSON.stringify(r.model), /<!--|Required\.|Optional\./);
});

test('every Markdown example in the format spec parses, inside the spec\'s complete sheet', () => {
  const blocks = [...read('docs/capture-sheet.md').matchAll(/^```markdown\n([\s\S]*?)^```$/gm)].map((m) => m[1]);
  const [base, ...snippets] = blocks;
  assert.ok(isSheet(base) && snippets.length >= 6);
  const errorsOf = (text) => load(text).messages.filter((m) => !m.openQuestion);
  assert.deepEqual(errorsOf(base), []);
  for (const s of snippets) {
    const sheet = s.startsWith('# ') ? s + base.slice(base.indexOf('\n## ')) : s.split(/(?=^## )/m).reduce((acc, sec) => with_(sec.trim(), acc), base);
    assert.deepEqual(errorsOf(sheet), [], s.slice(0, 60));
  }
});

test('sheetToDocs gives documents in the folder reader\'s shape, each with a where', () => {
  const { docs } = sheetToDocs(BASE);
  assert.deepEqual(docs.map((d) => d.header.type), ['model', 'party', 'party', 'role', 'role', 'role', 'workstream', 'process']);
  for (const d of docs) assert.ok(d.file === 'capture-sheet.md' && d.where && typeof d.body === 'string' && d.header);
  assert.equal(docs.at(-1).stepWhere.length, 3);
});

test('the sheet, the template and the format spec contain no real company names', () => {
  if (!PRIVATE_NAMES) return;
  for (const p of ['examples/acme-sample/capture-sheet.md', 'templates/capture-sheet.md', 'docs/capture-sheet.md']) assert.doesNotMatch(read(p), PRIVATE_NAMES, p);
});
