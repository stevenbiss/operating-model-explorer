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

test('comments are removed in one pass: an unclosed <!-- runs to the end of the file, and 40,000 of them parse quickly', () => {
  const r = load(`${BASE}\n<!-- never closed\n## Personas\nSECRET-D\n`);
  assert.deepEqual(r.messages, []);
  assert.doesNotMatch(JSON.stringify(r.model), /SECRET/);
  assert.deepEqual(load(`${BASE}<!-- a --> <!-- b -->\n`).messages, [], 'two comments alone on a line go with the line');

  const start = performance.now();
  sheetToDocs(`${BASE}\n${'<!-- open\n'.repeat(40000)}`);
  assert.ok(performance.now() - start < 1000, `took ${Math.round(performance.now() - start)} ms`);
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

test('2.55 a workstream and a process with the same name: no message, the later one gets its type appended to its id', () => {
  const text = BASE.replace('| Presales | Winning work.', '| Win the work | Winning work.').replace('## Process: Build the proposal\n\nWorkstream: Presales', '## Process: Win the work\n\nWorkstream: win the WORK');
  const r = load(text);
  assert.deepEqual(r.messages, []);
  assert.equal(r.model.elements['win-the-work'].type, 'workstream');
  assert.equal(r.model.elements['win-the-work-process'].name, 'Win the work');
  assert.equal(r.model.elements['win-the-work-process'].workstream, 'win-the-work');
  // References by name find the right one: a persona starting at the process, and one at the workstream.
  const personas = load(`${text}\n## Personas\n\n| Persona | Roles | Starts at |\n|---|---|---|\n| P | Account lead | Process: Win the work |\n| W | Account lead | Workstream: Win the work |\n`);
  assert.deepEqual(personas.messages, []);
  assert.deepEqual(personas.model.elements.p.entry, { view: 'process', id: 'win-the-work-process' });
  assert.deepEqual(personas.model.elements.w.entry, { view: 'workstream', id: 'win-the-work' });
});

test('an explicit ID that clashes with another id is an error naming both, in sheet terms', () => {
  const r = load(BASE.replace('Workstream: Presales', 'Workstream: Presales\nID: presales'));
  const m = only(r.messages);
  assert.equal(m.level, 'error');
  assert.equal(m.where, 'Process: Build the proposal');
  assert.match(m.problem, /"presales", and so does Workstreams › row 1 \(Presales\)/);
  assert.match(m.fix, /different id: an ID column in its table, or an "ID:" line/);
  assert.doesNotMatch(m.problem + m.fix, /capture-sheet\.md|two files/);
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
  assert.equal(m.where, 'Process: Build the proposal › RACI › row 1 (Plan the bid)', 'at the RACI row, where the letters are written');
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

test('2.12 / 2.31 theme: Label lines become the theme labels, with no theme messages', () => {
  const r = load(`${BASE}\n## Theme\n\nLabel workstream: Value stream\nLabel workstreams: Value streams\nLabel key message: Big idea\nLabel key messages: Big ideas\n`);
  assert.deepEqual(r.messages, []);
  assert.deepEqual(r.model.theme, { type: 'theme', labels: { workstream: 'Value stream', workstreams: 'Value streams', key_message: 'Big idea', key_messages: 'Big ideas' } });
});

test('2.32 retired theme lines: one warning each, naming the line and what replaces it; nothing is applied', () => {
  const lines = ['Primary colour: #0b1f4d', 'Text color: #1a1a1a', 'Palette: #3a6ea5; #2e7d5b', 'Body font: Georgia, serif', 'Logo: assets/logo.svg'];
  const r = load(`${BASE}\n## Theme\n\n${lines.join('\n')}\nLabel workstream: Value stream\nLabel workstreams: Value streams\n`);
  assert.equal(r.messages.length, lines.length);
  r.messages.forEach((m, i) => {
    assert.deepEqual([m.level, m.where], ['warning', 'Theme']);
    assert.ok(m.problem.startsWith(`The Theme line "${lines[i]}" is ignored, because `), m.problem);
    assert.match(m.problem, /retired/);
    assert.match(m.fix, /^Remove the line\./);
  });
  assert.match(r.messages[0].problem, /Party colours now come from brand packs/);
  assert.match(r.messages[0].fix, /brand pack/);
  assert.match(r.messages[3].problem, /own fonts/);
  assert.match(r.messages[4].problem, /party marks from brand packs/);
  assert.deepEqual(r.model.theme, { type: 'theme', labels: { workstream: 'Value stream', workstreams: 'Value streams' } });
  // No logo file needed any more, and a line that was never a theme key is still the usual "not understood" warning.
  const other = only(load(`${BASE}\n## Theme\n\nFavourite colour: blue\n`).messages);
  assert.equal(other.level, 'warning');
  assert.match(other.problem, /"Favourite colour: blue" is not one the engine understands/);
  assert.match(other.fix, /Label <term>/);
  assert.match(only(load(`${BASE}\n## Theme\n\nName: Tiny\n`).messages).problem, /"Name: Tiny" is not one the engine understands/);
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

test('a sheet loads on its own, or from a folder or zip with brands/ alongside', () => {
  // On its own, the sheet can't see its brand packs: one error per brand, with the load-the-folder hint (party-brands spec).
  const single = loadModel([{ path: 'capture-sheet.md', data: readFileSync(SAMPLE_SHEET) }]);
  assert.deepEqual(single.messages.map((m) => [m.level, m.element]), [['error', 'acme-corp'], ['error', 'globex']]);
  for (const m of single.messages) assert.match(m.fix, /Load the sheet's folder/);
  const folder = loadModel(readSampleSheet());
  assert.deepEqual(folder.messages, []);
  assert.ok(folder.model.assets['brands/acme/mark.svg']);
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

// ---------- structure sections (capture-sheet spec › Structure sections, design D4) ----------

const STRUCTURE = `## Structure: Partnership

Kind: Partnership
Summary: Who leads what.
Main: yes
Related: Delivery map
Workstreams: Presales

### Bands

| Band | Inside | Opens |
|---|---|---|
| Leadership | | |
| Delivery | | |
| Harbour | Delivery | Delivery map |

### Boxes

| Band | Role | Team | Name | Note | Change | Today |
|---|---|---|---|---|---|---|
| Leadership | Account lead | | Sam Example | Grade: Director | | |
| Harbour | Solution architect | | | | New | |
| Harbour | | Globex Solutions | | | | |

### Lines

| From band | From party | To band | To party | Label |
|---|---|---|---|---|
| Leadership | Acme Corp | Leadership | Globex | Joint steering |

### Notes

#### How it fits

Text.
`;
const OTHER = '## Structure: Delivery map\n\n### Bands\n\n| Band |\n|---|\n| One |\n\n### Boxes\n\n| Band | Role |\n|---|---|\n| One | Legal counsel |\n';
const TEAMS = '## Teams\n\n| Team | Party |\n|---|---|\n| Globex Solutions | Globex |\n';
const sheetWith = (structure = STRUCTURE, other = OTHER) => [TEAMS, structure, other].reduce((acc, s) => with_(s, acc), BASE);

test('2.46 / 2.50 a Structure section is recognised and read: sub-band inside its band, boxes, a labelled line, relations by name', () => {
  const r = load(sheetWith());
  assert.deepEqual(withoutAccountable(r.messages), []);
  const s = r.model.elements.partnership;
  assert.deepEqual([s.kind, s.summary, s.main, s.related, s.workstreams], ['Partnership', 'Who leads what.', true, ['delivery-map'], ['presales']]);
  assert.deepEqual(s.bands, [{ id: 'leadership', name: 'Leadership', bands: [] }, { id: 'delivery', name: 'Delivery', bands: [{ id: 'harbour', name: 'Harbour', opens: 'delivery-map' }] }]);
  assert.deepEqual(s.boxes, [
    { band: 'leadership', role: 'account-lead', name: 'Sam Example', note: 'Grade: Director', party: 'acme-corp' },
    { band: 'harbour', role: 'solution-architect', change: { status: 'new' }, party: 'globex' },
    { band: 'harbour', team: 'globex-solutions', party: 'globex' },
  ]);
  assert.deepEqual(s.lines, [{ from: { band: 'leadership', party: 'acme-corp' }, to: { band: 'leadership', party: 'globex' }, label: 'Joint steering' }]);
  assert.equal(s.body, '## How it fits\n\nText.');
  assert.deepEqual(r.model.elements['delivery-map'].relatedAll, ['partnership']);
});

test('a structure named like the model (often the main diagram) gets an id of its own, with no message', () => {
  const r = load(sheetWith(STRUCTURE.replace('## Structure: Partnership', '## Structure: Tiny partnership')));
  assert.deepEqual(withoutAccountable(r.messages), []);
  assert.equal(r.model.model.id, 'tiny-partnership');
  assert.ok(r.model.elements['tiny-partnership-structure']);
});

test('2.51 unknown band name in a box: an error naming the structure, the Boxes row and a suggestion', () => {
  const m = only(withoutAccountable(load(sheetWith(STRUCTURE.replace('| Harbour | Solution architect |', '| Harbr | Solution architect |'))).messages));
  assert.equal(m.where, 'Structure: Partnership › Boxes › row 2 (Harbr)');
  assert.equal(m.fix, 'Did you mean Harbour?');
});

test('2.52 Role and Team both filled: an error naming the structure and the row, saying to fill in only one', () => {
  const m = only(withoutAccountable(load(sheetWith(STRUCTURE.replace('| Harbour | | Globex Solutions |', '| Harbour | Account lead | Globex Solutions |'))).messages));
  assert.equal(m.where, 'Structure: Partnership › Boxes › row 3 (Harbour)');
  assert.match(m.fix, /only one of the Role and Team columns/);
});

test('2.53 missing Bands subsection: an error naming the structure and the subsection', () => {
  const msgs = withoutAccountable(load(sheetWith(STRUCTURE.replace(/### Bands[\s\S]*?(?=### Boxes)/, ''))).messages);
  const m = msgs.find((x) => /Bands/.test(x.problem));
  assert.deepEqual([m.level, m.where], ['error', 'Structure: Partnership']);
  assert.match(m.problem, /no "### Bands" subsection/);
});

test('2.49 Lines table missing a column: an error naming the structure\'s Lines table and the column', () => {
  const text = STRUCTURE.replace('| From band | From party | To band | To party | Label |\n|---|---|---|---|---|', '| From band | From party | To band | Label |\n|---|---|---|---|').replace('| Leadership | Globex | Joint steering |', '| Leadership | Joint steering |');
  const m = withoutAccountable(load(sheetWith(text)).messages).find((x) => /To party/.test(x.problem));
  assert.deepEqual([m.level, m.where, m.problem], ['error', 'Structure: Partnership › Lines', 'The Lines table has no "To party" column.']);
});

test('structure sections: bands nested too deep, duplicate band names, unknown Opens, and Main other than yes or no', () => {
  const text = STRUCTURE.replace('Main: yes', 'Main: maybe')
    .replace('| Harbour | Delivery | Delivery map |', '| Harbour | Delivery | Delivry map |\n| Pier | Harbour | |\n| leadership | | |');
  const msgs = withoutAccountable(load(sheetWith(text)).messages).map((m) => `${m.where}: ${m.problem} ${m.fix}`);
  assert.ok(msgs.some((m) => /^Structure: Partnership: "Main: maybe" is not yes or no\./.test(m)), msgs.join('\n'));
  assert.ok(msgs.some((m) => /Bands › row 3 \(Harbour\): .*"Delivry map".*Did you mean Delivery map\?/.test(m)));
  assert.ok(msgs.some((m) => /Bands › row 4 \(Pier\): .*nested only one level deep/.test(m)));
  assert.ok(msgs.some((m) => /Bands › row 5 \(leadership\): There is already a band called "Leadership"/.test(m)));
  assert.ok(msgs.some((m) => /None of the structures is marked as the main diagram/.test(m)), 'no main, once Main is not yes');
});



// Replace every id with its element's (or step's) name, so models with different ids compare.
function byName(m) {
  const el = m.elements;
  const n = (id) => (el[id] ? el[id].name : id);
  const elements = {};
  for (const e of Object.values(el)) {
    const x = { ...e, id: e.name };
    for (const k of ['party', 'team', 'workstream']) if (x[k]) x[k] = n(x[k]);
    for (const k of ['parties', 'roles', 'processes', 'structures', 'related', 'relatedAll', 'workstreams']) if (x[k]) x[k] = x[k].map(n);
    // Structures: band ids are their names in both forms; what they refer to is compared by name.
    if (e.type === 'structure') {
      const opens = (b) => ({ ...b, opens: b.opens && n(b.opens), ...(b.bands && { bands: b.bands.map(opens) }) });
      x.bands = e.bands.map(opens);
      x.rows = e.rows.map(opens);
      x.boxes = e.boxes.map((b) => ({ ...b, role: b.role && n(b.role), team: b.team && n(b.team), party: n(b.party) }));
      x.lines = e.lines.map((l) => ({ ...l, from: { ...l.from, party: n(l.from.party) }, to: { ...l.to, party: n(l.to.party) } }));
    }
    if (x.entry && x.entry.id) x.entry = { ...x.entry, id: n(x.entry.id) };
    if (x.steps) {
      const names = Object.fromEntries(e.steps.map((s) => [s.id, s.name]));
      const sn = (id) => names[id] || id;
      x.steps = e.steps.map((s) => ({ ...s, id: s.name, owner: n(s.owner), lane: n(s.lane), party: n(s.party), process: n(s.process), raci: Object.entries(s.raci).map(([r, l]) => [n(r), l]), next: s.next.map((t) => ({ ...t, to: sn(t.to) })) }));
      x.edges = e.edges.map((d) => ({ ...d, from: sn(d.from), to: sn(d.to) }));
    }
    elements[`${e.type}: ${e.name}`] = x;
  }
  return { model: m.model, theme: m.theme, elements, order: Object.fromEntries(Object.entries(m.order).map(([t, ids]) => [t, ids.map(n)])), assets: Object.keys(m.assets) };
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
  // The complete sheet names the acme and globex brands, so it loads with the example sheet's brands/ folder.
  const brands = Object.fromEntries(readSampleSheet().filter((f) => f.path.startsWith('brands/')).map((f) => [f.path, new TextDecoder().decode(f.data)]));
  assert.match(base, /\| Globex \| The solution partner\. \| globex \|/);
  const errorsOf = (text) => load(text, brands).messages.filter((m) => !m.openQuestion);
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
  for (const p of ['examples/acme-capture-sheet/capture-sheet.md', 'templates/capture-sheet.md', 'docs/capture-sheet.md']) assert.doesNotMatch(read(p), PRIVATE_NAMES, p);
});
