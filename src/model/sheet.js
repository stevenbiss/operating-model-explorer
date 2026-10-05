// Capture sheet -> the same documents the folder reader produces (design D2), so validation, the viewer and
// export are shared. Reads the markdown-it token stream (D1). Pure: works in Node and the browser.
// The format is described in docs/capture-sheet.md.
import MarkdownIt from 'markdown-it';
import { closest, COMBINED, nameKey } from './validate.js';
import { schemas } from './schemas.js';
import { RETIRED, retiredFix } from './theme-check.js';

export const FORMAT = 1; // the newest capture sheet format this engine reads (D11)

const md = new MarkdownIt(); // html: false, GFM tables on

// Names match ignoring case, spaces and punctuation (D4); ids are the name in lower case with hyphens.
export { nameKey };
export const toId = (s) => s.normalize('NFKD').replace(/\p{M}/gu, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
// HTML comments are dropped in one pass, so the time grows with the sheet's length only. A comment runs to the next
// "-->", or to the end of the file when it is never closed. A comment on lines of its own goes with its line breaks,
// so a comment between table rows doesn't split the table.
function noComments(text) {
  const rest = /[ \t]*(\r?\n|$)/y; // only spaces or tabs up to the end of the line
  let out = '';
  let i = 0;
  let blank = true; // the current line of out holds only spaces or tabs
  for (let s; (s = text.indexOf('<!--', i)) !== -1; ) {
    const gap = text.slice(i, s);
    const nl = gap.lastIndexOf('\n');
    blank = (nl !== -1 || blank) && /^[ \t]*$/.test(gap.slice(nl + 1));
    out += gap;
    const e = text.indexOf('-->', s + 4);
    i = e === -1 ? text.length : e + 3;
    rest.lastIndex = i;
    const after = blank && rest.exec(text);
    if (after) {
      let k = out.length;
      while (k && (out[k - 1] === ' ' || out[k - 1] === '\t')) k--;
      out = out.slice(0, k);
      i += after[0].length;
    }
  }
  return out + text.slice(i);
}

// A capture sheet's first heading is "# Operating model: <name>" (D3).
export function isSheet(text) {
  const first = noComments(String(text)).match(/^ {0,3}#{1,6}[ \t].*$/m);
  return !!first && /^ {0,3}#[ \t]+Operating model\s*:/i.test(first[0]);
}

// [heading, field, required] per table. Column headers match by nameKey, in any order.
const CHANGE = [['Change', 'status'], ['Today', 'today'], ['ID', 'id']];
const TABLES = {
  party: [['Party', 'name', 1], ['Summary', 'summary'], ['Brand', 'brand'], ...CHANGE],
  team: [['Team', 'name', 1], ['Party', 'party', 1], ['Summary', 'summary'], ...CHANGE],
  role: [['Role', 'name', 1], ['Party', 'party', 1], ['Team', 'team'], ['Summary', 'summary'], ...CHANGE],
  committee: [['Committee', 'name', 1], ['Members', 'members', 1], ['Summary', 'summary'], ...CHANGE],
  workstream: [['Workstream', 'name', 1], ['Summary', 'summary', 1], ['Parties', 'parties'], ['Detail', 'detail', 1], ...CHANGE],
  persona: [['Persona', 'name', 1], ['Roles', 'roles', 1], ['Starts at', 'entry', 1], ['Summary', 'summary'], ...CHANGE],
  step: [['#', 'num', 1], ['Step', 'name', 1], ['Owner', 'owner', 1], ['Description', 'description'], ['Inputs', 'inputs'], ['Outputs', 'outputs'], ['Systems', 'systems'], ['KPIs', 'kpis'], ['Next', 'next'], ...CHANGE],
  // A structure's tables (design D4). Boxes and lines have no name of their own, so they are keyed by their band.
  band: [['Band', 'name', 1], ['Inside', 'inside'], ['Opens', 'opens']],
  box: [['Band', 'band', 1], ['Role', 'role'], ['Team', 'team'], ['Name', 'name'], ['Note', 'note'], ['Change', 'status'], ['Today', 'today']],
  line: [['From band', 'fromBand', 1], ['From party', 'fromParty', 1], ['To band', 'toBand', 1], ['To party', 'toParty', 1], ['Label', 'label']],
};
const SECTION = { party: 'Parties', team: 'Teams', role: 'Roles', committee: 'Committees', workstream: 'Workstreams', persona: 'Personas' };
const SECTIONS = ['Purpose', 'Key messages', 'About this model', 'Parties', 'Teams', 'Roles', 'Committees', 'Workstreams', 'Personas', 'Theme', 'Open questions', 'Sources'];
const REQUIRED = ['Purpose', 'Key messages', 'Parties', 'Roles'];
const WORD = { party: 'party', team: 'team', role: 'role', committee: 'committee', workstream: 'workstream', process: 'process', structure: 'structure', persona: 'persona' };
const HOME = { process: 'a "## Process:" section', structure: 'a "## Structure:" section' };
const LABELS = Object.keys(schemas.theme.properties.labels.properties);

const colKey = (h) => (h.trim() === '#' ? '#' : nameKey(h));
const list = (v) => v.split(';').map((s) => s.trim()).filter(Boolean);
const oneLine = (s) => s.replace(/\s*\n\s*/g, ' ').trim();
// Drops empty values, so the documents look exactly like parsed content files.
const compact = (o) => Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined && v !== '' && !(Array.isArray(v) && !v.length)));
const rowLabel = (where, n, name) => `${where} › row ${n}${name ? ` (${name})` : ''}`;

// text -> { docs, messages, meta: { openQuestions, sources } }. Every message has a `where` in the sheet.
export function sheetToDocs(text, file = 'capture-sheet.md') {
  const src = noComments(String(text).replace(/^﻿/, '').replace(/\r\n?/g, '\n'));
  const lines = src.split('\n');
  const tokens = md.parse(src, {});
  const messages = [];
  const say = (level, where, problem, fix, extra) => messages.push({ level, file, where, problem, fix, ...extra });
  const meta = { openQuestions: [], sources: [] };

  // ---------- split into the title, the lines under it and the ## sections ----------
  let title;
  const top = [];
  const sections = [];
  let blocks = top;
  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i];
    if (t.type === 'heading_open' && t.level === 0 && (t.tag === 'h2' || (t.tag === 'h1' && title === undefined))) {
      const name = tokens[i + 1].content.trim();
      if (t.tag === 'h1') title = name;
      else sections.push({ name, blocks: (blocks = []) });
      i += 2;
      continue;
    }
    blocks.push(t);
  }

  const one = {};
  const named = { process: [], structure: [], notes: [] };
  for (const s of sections) {
    const m = s.name.match(/^(process|structure|notes)\s*:\s*(.*)$/i);
    if (m) {
      named[m[1].toLowerCase()].push({ ...s, target: m[2].trim() });
      continue;
    }
    const known = SECTIONS.find((k) => nameKey(k) === nameKey(s.name));
    if (!known) {
      const guess = closest(nameKey(s.name), SECTIONS.map(nameKey));
      say('warning', s.name, `"## ${s.name}" is not a section the engine knows, so it is ignored.`, guess ? `Did you mean ${SECTIONS.find((k) => nameKey(k) === guess)}?` : `Use one of: ${SECTIONS.join(', ')}, Process: <name>, Structure: <name> or Notes: <name>.`);
    } else if (one[known]) say('warning', known, `There are two "${known}" sections, so the second is ignored.`, `Merge them into one "## ${known}" section.`);
    else one[known] = s;
  }
  for (const r of REQUIRED) if (!one[r]) say('error', 'Sheet', `The sheet has no "${r}" section.`, `Add a "## ${r}" heading${r === 'Parties' || r === 'Roles' ? ' with a table under it' : ''}.`);

  // ---------- helpers over a section's tokens ----------

  // "Key: value" lines in paragraphs. known(key, line) -> true if the key is understood.
  function keyLines(blocks, where, known, fix) {
    const out = {};
    blocks.forEach((t, i) => {
      if (t.type !== 'inline' || !blocks[i - 1] || blocks[i - 1].type !== 'paragraph_open') return;
      for (const line of t.content.split('\n')) {
        const m = line.match(/^\s*([^:]+?)\s*:\s*(.*)$/);
        const k = m && m[1].toLowerCase().replace(/\s+/g, ' ');
        if (k && known(k, line.trim())) out[k] = m[2].trim();
        else if (line.trim()) say('warning', where, `The line "${line.trim()}" is not one the engine understands here, so it is ignored.`, fix);
      }
    });
    return out;
  }

  // The Markdown source of a narrative section. Headings are written one level below the section's own
  // heading, and become ## in the narrative, so they display exactly as in a content file.
  function textOf(blocks, shift) {
    const tops = blocks.filter((t) => t.level === 0 && t.map);
    if (!tops.length) return '';
    const start = tops[0].map[0];
    const out = lines.slice(start, tops[tops.length - 1].map[1]);
    for (const t of tops) {
      if (t.type === 'heading_open') out[t.map[0] - start] = out[t.map[0] - start].replace(/^(\s*)(#+)/, (_, sp, h) => sp + '#'.repeat(Math.max(1, h.length - shift)));
    }
    return out.join('\n').trim();
  }

  // Top-level list items, as one line of text each.
  const items = (blocks) => blocks.filter((t) => t.type === 'inline' && t.level === 3).map((t) => oneLine(t.content));

  // The first table: { head: [text], rows: [[text]] }.
  function tableOf(blocks, where) {
    let table;
    let row;
    let head = false;
    for (const t of blocks) {
      if (t.type === 'table_open') {
        if (table) break;
        table = { head: [], rows: [] };
      } else if (!table) {
        if (t.type === 'inline' && t.content.trim().startsWith('|')) {
          say('error', where, 'This looks like a table, but it could not be read.', 'Check the table: it needs a header row, then a row of dashes (|---|---|) with the same number of columns, and one row per item.');
          return;
        }
      } else if (t.type === 'thead_open') head = true;
      else if (t.type === 'thead_close') head = false;
      else if (t.type === 'tr_open') row = [];
      else if (t.type === 'inline') row.push(t.content.trim());
      else if (t.type === 'tr_close') (head ? table.head.push(...row) : table.rows.push(row));
    }
    return table;
  }

  // The ### subsections of a Process or Structure section: { main: [tokens before the first ###], <Name>: [tokens] }.
  function partsOf(s, where, word, known, fix) {
    const parts = { main: [] };
    let part = parts.main;
    for (let i = 0; i < s.blocks.length; i++) {
      const t = s.blocks[i];
      if (t.type === 'heading_open' && t.level === 0 && t.tag === 'h3') {
        const name = s.blocks[i + 1].content.trim();
        const k = known.find((x) => nameKey(x) === nameKey(name));
        if (!k) say('warning', where, `"### ${name}" is not a part of a ${word} the engine knows, so it is ignored.`, fix);
        parts[k || name] = part = [];
        i += 2;
      } else part.push(t);
    }
    return parts;
  }

  // Table rows as { n, where, get(field) }, with columns found by name, or undefined if there is no table.
  // Reports unknown and missing columns, and empty required cells. Empty rows, and rows without a key cell, are skipped.
  function rowsOf(blocks, where, spec, label, key = 'name') {
    const table = tableOf(blocks, where);
    if (!table) return undefined;
    const at = {};
    table.head.forEach((h, i) => {
      const c = spec.find(([name]) => colKey(name) === colKey(h));
      if (c) at[c[1]] ??= i;
      else if (h) {
        const guess = closest(colKey(h), spec.map(([name]) => colKey(name)));
        say('warning', where, `The ${label} table has a column "${h}" that the engine doesn't know, so it is ignored.`, guess ? `Did you mean ${spec.find(([name]) => colKey(name) === guess)[0]}?` : `Known columns: ${spec.map(([name]) => name).join(', ')}.`);
      }
    });
    for (const [name, field, req] of spec) if (req && at[field] === undefined) say('error', where, `The ${label} table has no "${name}" column.`, `Add a "${name}" column to the table's header row.`);
    const rows = [];
    table.rows.forEach((cells, r) => {
      if (cells.every((c) => !c)) return;
      const get = (field) => (at[field] === undefined ? '' : cells[at[field]] || '');
      const row = { n: r + 1, get, where: rowLabel(where, r + 1, get(key)) };
      for (const [name, field, req] of spec) if (req && at[field] !== undefined && !get(field)) say('error', row.where, `This row has no ${name}.`, `Fill in the ${name} column.`);
      if (get(key)) rows.push(row);
    });
    return rows;
  }

  // Current vs future state from the Change and Today columns (or lines).
  function changeOf(status, today, where) {
    if (!status) {
      if (today) say('error', where, 'Today is filled in, but Change is empty.', 'Set Change to new, changed or removed, or clear Today.');
      return undefined;
    }
    return compact({ status: status.toLowerCase(), today });
  }

  // ---------- names ----------
  const names = Object.fromEntries(Object.keys(WORD).map((t) => [t, new Map()]));
  // The model's id is taken first, so a structure named like the model (often the main diagram) gets an id of its own.
  const head = keyLines(top, 'Top of the sheet', (k) => ['format', 'id', 'version'].includes(k), 'Under the title, only "Format:", "ID:" and "Version:" lines are read. Put the purpose under "## Purpose".');
  const tm = title !== undefined && title.match(/^Operating model\s*:\s*(.*)$/i);
  const name = tm ? tm[1].trim() : '';
  const taken = new Set([head.id || toId(name)]);
  function register(type, name, id, where) {
    const key = nameKey(name);
    if (names[type].has(key)) {
      say('error', where, `There is already a ${WORD[type]} called "${names[type].get(key).name}".`, `Give each ${WORD[type]} its own name, or remove one of them.`);
      return undefined;
    }
    // A derived id that is already taken (e.g. a process named like its workstream) gets its type appended.
    // Explicit ids are kept as written; a clash between them is reported by validate().
    if (!id) id = taken.has(toId(name)) ? `${toId(name)}-${type}` : toId(name);
    taken.add(id);
    names[type].set(key, { id, name });
    return id;
  }
  // A name -> its id. An unknown name is an error with a suggestion; its id is then derived from the name.
  function find(type, raw, where, what) {
    if (!raw) return undefined;
    const hit = names[type].get(nameKey(raw));
    if (hit) return hit.id;
    const guess = closest(nameKey(raw), [...names[type].keys()]);
    const home = HOME[type] || `the ${SECTION[type]} section`;
    say('error', where, `The ${what} "${raw}" does not match any ${WORD[type]}.`, guess ? `Did you mean ${names[type].get(guess).name}?` : `Use the name of a ${WORD[type]} from ${home}, or add it there.`);
    return toId(raw);
  }

  // An Owner names a role or a committee (design D7). A role and a committee with the same name are reported by validate().
  function findOwner(raw, where) {
    if (!raw) return undefined;
    const hit = names.role.get(nameKey(raw)) || names.committee.get(nameKey(raw));
    if (hit) return hit.id;
    const all = [...names.role.values(), ...names.committee.values()];
    const guess = closest(nameKey(raw), all.map((x) => nameKey(x.name)));
    say('error', where, `The owner "${raw}" does not match any role or committee.`, guess ? `Did you mean ${all.find((x) => nameKey(x.name) === guess).name}?` : 'Use the name of a role from the Roles section or a committee from the Committees section, or add it there.');
    return toId(raw);
  }

  // ---------- read every table first, so names can refer forwards ----------
  const rows = {};
  for (const type of ['party', 'team', 'role', 'committee', 'workstream', 'persona']) {
    const s = one[SECTION[type]];
    rows[type] = (s && rowsOf(s.blocks, SECTION[type], TABLES[type], SECTION[type])) || [];
    for (const r of rows[type]) r.id = register(type, r.get('name'), r.get('id'), r.where);
    if (s && REQUIRED.includes(SECTION[type]) && !rows[type].length) say('error', SECTION[type], `The ${SECTION[type]} table has no ${SECTION[type].toLowerCase()} yet.`, `Add one row per ${WORD[type]} to the table.`);
  }

  const procs = named.process.map((s) => {
    const where = s.target ? `Process: ${s.target}` : 'Process (no name)';
    const parts = partsOf(s, where, 'process', ['RACI', 'Notes'], 'Use "### RACI" for the RACI matrix and "### Notes" for the narrative.');
    const main = parts.main;
    const kv = keyLines(main, where, (k) => ['workstream', 'summary', 'id', 'change', 'today'].includes(k), 'A process section has "Workstream:", "Summary:", "Change:" and "Today:" lines, then the step table. Put narrative under "### Notes".');
    if (!s.target) say('error', where, 'This process heading has no name.', 'Write the name after "Process:", e.g. "## Process: Qualify an opportunity".');
    const id = s.target ? register('process', s.target, kv.id, where) : undefined;
    const steps = rowsOf(main, where, TABLES.step, 'step');
    if (!steps) say('error', where, 'This process has no step table.', 'Add a table with the columns #, Step and Owner, and one row per step.');
    else if (!steps.length) say('error', where, 'This process has no steps yet.', 'Add one row per step to the step table.');
    for (const st of steps || []) st.id = st.get('id') || toId(st.get('name'));
    return { s, where, parts, kv, id, steps: steps || [] };
  });

  // Structures register their names first too, so Related and Opens can name a later structure (design D4).
  const structs = named.structure.map((s) => {
    const where = s.target ? `Structure: ${s.target}` : 'Structure (no name)';
    const parts = partsOf(s, where, 'structure', ['Bands', 'Boxes', 'Lines', 'Notes'], 'Use "### Bands", "### Boxes" and "### Lines" for the tables and "### Notes" for the narrative.');
    const kv = keyLines(parts.main, where, (k) => ['kind', 'summary', 'main', 'related', 'workstreams', 'change', 'today', 'id'].includes(k), 'A structure section has "Kind:", "Summary:", "Main:", "Related:", "Workstreams:", "Change:" and "Today:" lines, then the ### Bands, ### Boxes and ### Lines tables. Put narrative under "### Notes".');
    if (!s.target) say('error', where, 'This structure heading has no name.', 'Write the name after "Structure:", e.g. "## Structure: Partnership".');
    const id = s.target ? register('structure', s.target, kv.id, where) : undefined;
    return { s, where, parts, kv, id };
  });

  // ---------- build the documents ----------
  const docs = [];
  const doc = (type, where, header, body = '', extra) => docs.push({ file, where, header: { type, ...header }, body, ...extra });

  // The model: the title, the lines under it, Purpose, Key messages and About this model.
  if (!tm) say('error', 'Title', 'The sheet does not start with an "# Operating model: <name>" heading.', 'Make the first heading "# Operating model: " followed by the model\'s name.');
  else if (!tm[1]) say('error', 'Title', 'The title has no model name.', 'Write the model\'s name after "Operating model:".');
  if (!('format' in head)) say('warning', 'Top of the sheet', `The sheet has no "Format:" line, so it is read as format ${FORMAT}.`, `Add the line "Format: ${FORMAT}" under the title.`);
  else if (!/^\d+$/.test(head.format)) say('error', 'Top of the sheet', `"Format: ${head.format}" is not a format number.`, `Write "Format: ${FORMAT}".`);
  else if (Number(head.format) > FORMAT) say('error', 'Top of the sheet', `This sheet uses capture sheet format ${head.format}, but this engine reads formats up to ${FORMAT}.`, `Open the sheet with a newer version of the engine that reads format ${head.format}, e.g. the one that came with the sheet.`);
  const purpose = one.Purpose ? textOf(one.Purpose.blocks, 1) : '';
  if (one.Purpose && !purpose) say('error', 'Purpose', 'The Purpose section is empty.', 'Write a sentence or two on why this operating model exists.');
  const keys = one['Key messages'] ? items(one['Key messages'].blocks) : [];
  if (one['Key messages'] && !keys.length) say('error', 'Key messages', 'The Key messages section has no messages.', 'Add each key message as a list item starting with "- ".');
  doc('model', 'Top of the sheet', { ...compact({ id: head.id || toId(name), name, version: head.version }), purpose, key_messages: keys }, one['About this model'] ? textOf(one['About this model'].blocks, 1) : '');

  const base = (r) => compact({ id: r.id, name: r.get('name'), summary: r.get('summary'), change: changeOf(r.get('status'), r.get('today'), r.where) });
  // Brand: a pack id, matched to brands/ by loadModel, which can see the packs.
  for (const r of rows.party) doc('party', r.where, compact({ ...base(r), brand: r.get('brand') }));
  for (const r of rows.team) doc('team', r.where, compact({ ...base(r), party: find('party', r.get('party'), r.where, 'party') }));
  for (const r of rows.role) {
    doc('role', r.where, compact({ ...base(r), party: find('party', r.get('party'), r.where, 'party'), team: find('team', r.get('team'), r.where, 'team') }));
  }
  // Members: "Account lead (A); Partner manager (A)". A member without exactly one letter is reported here and left out.
  for (const r of rows.committee) {
    const members = {};
    for (const item of list(r.get('members'))) {
      const m = item.match(/^(.*?)\s*\(([^()]*)\)$/);
      const who = m ? m[1] : item;
      const id = find('role', who, r.where, 'member');
      const v = m ? m[2].trim().toUpperCase() : '';
      if (id && Object.hasOwn(members, id)) {
        say('error', r.where, `${who} is listed twice in Members.`, `List each member once, with one letter: A if they share the decision, C if consulted, I if informed, R if they do the work.`);
        continue;
      }
      if (/^[RACI]$/.test(v)) {
        members[id] = v;
        continue;
      }
      const problem = !m ? `${who} has no RACI letter.` : COMBINED.test(v) ? `${who} has "${m[2]}". A member can have only one RACI letter.` : `${who} has "${m[2]}", which is not R, A, C or I.`;
      say('error', r.where, problem, `Write one letter in brackets after the name: A if they share the decision, C if consulted, I if informed, R if they do the work, e.g. "${who} (A)".`);
    }
    doc('committee', r.where, compact({ ...base(r), members: Object.keys(members).length ? members : undefined }));
  }
  for (const r of rows.workstream) {
    const parties = list(r.get('parties')).map((p) => find('party', p, r.where, 'party'));
    doc('workstream', r.where, compact({ ...base(r), parties, detail: r.get('detail').toLowerCase() }));
  }

  for (const { s, where, parts, kv, id, steps } of procs) {
    const numbered = (ref) => steps.find((st) => st.get('num').replace(/\.$/, '') === ref);
    const stepFind = (ref) => (/^\d+$/.test(ref) ? numbered(ref) : steps.find((st) => nameKey(st.get('name')) === nameKey(ref)));
    // A step by # or name, within this process.
    const stepRef = (ref, at, what) => {
      const hit = stepFind(ref);
      if (hit) return hit.id;
      if (/^\d+$/.test(ref)) say('error', at, `${what} points to step ${ref}, but "${s.target}" has no step ${ref}.`, 'Use the # or the name of a step in this process.');
      else {
        const guess = closest(nameKey(ref), steps.map((st) => nameKey(st.get('name'))));
        say('error', at, `${what} points to "${ref}", which does not match any step in "${s.target}".`, guess ? `Did you mean ${steps.find((st) => nameKey(st.get('name')) === guess).get('name')}?` : 'Use the # or the name of a step in this process.');
      }
      return toId(ref);
    };
    const header = steps.map((st) => {
      const next = st.get('next');
      const out = compact({
        id: st.id,
        name: st.get('name'),
        owner: findOwner(st.get('owner'), st.where),
        description: st.get('description'),
        inputs: list(st.get('inputs')),
        outputs: list(st.get('outputs')),
        systems: list(st.get('systems')),
        kpis: list(st.get('kpis')),
        change: changeOf(st.get('status'), st.get('today'), st.where),
      });
      // Empty Next = the following row; "End" = the flow stops here; otherwise "3; Name; Label: 4".
      if (/^end$/i.test(next)) out.next = [];
      else if (next) {
        out.next = list(next).map((part) => {
          const m = !stepFind(part) && part.match(/^(.+?)\s*:\s*(.+)$/);
          return m ? { to: stepRef(m[2], st.where, 'Next'), label: m[1] } : { to: stepRef(part, st.where, 'Next') };
        });
      }
      return out;
    });

    const raciWhere = [];
    if (parts.RACI) {
      const rw = `${where} › RACI`;
      const table = tableOf(parts.RACI, rw);
      if (table) {
        const roleIds = table.head.slice(1).map((h, c) => h && find('role', h, `${rw} › column ${c + 2}`, 'role'));
        table.rows.forEach((cells, r) => {
          if (cells.every((c) => !c) || !cells[0]) return;
          const hit = stepFind(cells[0]);
          const at = rowLabel(rw, r + 1, hit ? hit.get('name') : cells[0]);
          if (!hit) return stepRef(cells[0], at, 'This RACI row');
          const step = header[steps.indexOf(hit)];
          raciWhere[steps.indexOf(hit)] = at;
          cells.slice(1).forEach((cell, c) => {
            const v = cell.trim().toUpperCase();
            if (!v || !roleIds[c]) return;
            if (!/^[RACI]$/.test(v) && !COMBINED.test(v)) return say('error', at, `The RACI cell for ${table.head[c + 1]} is "${cell}", which is not R, A, C or I.`, 'Use one letter: R (responsible), A (accountable), C (consulted) or I (informed), or leave the cell empty.');
            (step.raci ??= {})[roleIds[c]] = /^[RACI]$/.test(v) ? v : cell.trim();
          });
        });
      }
    }

    if (!kv.workstream) say('error', where, 'This process has no "Workstream:" line.', 'Add a line such as "Workstream: Presales" under the process heading.');
    doc(
      'process',
      where,
      { ...compact({ id, name: s.target, workstream: find('workstream', kv.workstream, where, 'workstream'), summary: kv.summary, change: changeOf(kv.change, kv.today, where) }), steps: header },
      parts.Notes ? textOf(parts.Notes, 2) : '',
      { stepWhere: steps.map((st) => st.where), raciWhere },
    );
  }

  for (const { s, where, parts, kv, id } of structs) {
    // Bands by name, unique within the structure; a band's id is its name in lower case with hyphens.
    const bw = `${where} › Bands`;
    const bandRows = parts.Bands && rowsOf(parts.Bands, bw, TABLES.band, 'Bands');
    if (!parts.Bands) say('error', where, 'This structure has no "### Bands" subsection.', 'Add a "### Bands" heading with a table with the columns Band, Inside and Opens: one row per band, top to bottom.');
    else if (!bandRows) say('error', bw, 'The Bands subsection has no table.', 'Add a table with a Band column: one row per band, top to bottom.');
    const byName = new Map();
    const bandWhere = {};
    for (const r of bandRows || []) {
      const k = nameKey(r.get('name'));
      if (byName.has(k)) {
        say('error', r.where, `There is already a band called "${byName.get(k).band.name}" in this structure.`, 'Give each band in a structure its own name.');
        continue;
      }
      const band = compact({ id: toId(r.get('name')), name: r.get('name'), opens: find('structure', r.get('opens'), r.where, 'structure to open') });
      byName.set(k, { band, row: r });
      bandWhere[band.id] = r.where;
    }
    const bandRef = (raw, at, what) => {
      if (!raw) return undefined;
      const hit = byName.get(nameKey(raw));
      if (hit) return hit.band.id;
      const guess = closest(nameKey(raw), [...byName.keys()]);
      say('error', at, `The ${what} "${raw}" does not match any band in "${s.target}".`, guess ? `Did you mean ${byName.get(guess).band.name}?` : 'Use the name of a band from the Bands table, or add it there.');
      return toId(raw);
    };
    // Inside names a top-level band. Anything else is reported, and the band stays at the top level.
    const bands = [];
    for (const { band, row } of byName.values()) {
      const inside = row.get('inside');
      const parent = inside && byName.get(nameKey(inside));
      if (parent && parent.band !== band && !parent.row.get('inside')) (parent.band.bands ??= []).push(band);
      else {
        bands.push(band);
        if (!inside) continue;
        if (!parent) bandRef(inside, row.where, 'Inside band');
        else if (parent.band === band) say('error', row.where, `The band "${band.name}" is inside itself.`, 'Clear its Inside cell, or name another band.');
        else say('error', row.where, `The band "${band.name}" is inside "${parent.band.name}", which is itself inside another band. Bands can be nested only one level deep.`, `Put "${band.name}" inside a band that is not a sub-band, or clear its Inside cell.`);
      }
    }

    const boxRows = parts.Boxes && rowsOf(parts.Boxes, `${where} › Boxes`, TABLES.box, 'Boxes', 'band');
    if (!parts.Boxes) say('error', where, 'This structure has no "### Boxes" subsection.', 'Add a "### Boxes" heading with a table with the columns Band, Role, Team, Name and Note: one row per box.');
    else if (!boxRows) say('error', `${where} › Boxes`, 'The Boxes subsection has no table.', 'Add a table with the columns Band, Role, Team, Name and Note: one row per box.');
    // Both or neither of Role and Team is reported by validate(), at this row.
    const boxes = (boxRows || []).map((r) => compact({
      band: bandRef(r.get('band'), r.where, 'band'),
      role: find('role', r.get('role'), r.where, 'role'),
      team: find('team', r.get('team'), r.where, 'team'),
      name: r.get('name'),
      note: r.get('note'),
      change: changeOf(r.get('status'), r.get('today'), r.where),
    }));
    const lineRows = (parts.Lines && rowsOf(parts.Lines, `${where} › Lines`, TABLES.line, 'Lines', 'fromBand')) || [];
    const end = (r, side) => compact({ band: bandRef(r.get(`${side}Band`), r.where, `${side === 'from' ? 'From' : 'To'} band`), party: find('party', r.get(`${side}Party`), r.where, `${side === 'from' ? 'From' : 'To'} party`) });
    const lines = lineRows.map((r) => compact({ from: end(r, 'from'), to: end(r, 'to'), label: r.get('label') }));

    let main;
    if (/^yes$/i.test(kv.main || '')) main = true;
    else if (kv.main && !/^no$/i.test(kv.main)) say('error', where, `"Main: ${kv.main}" is not yes or no.`, 'Write "Main: yes" for the main diagram, or leave the line out.');
    const header = compact({
      id,
      name: s.target,
      kind: kv.kind,
      summary: kv.summary,
      main,
      related: list(kv.related || '').map((x) => find('structure', x, where, 'related structure')),
      workstreams: list(kv.workstreams || '').map((x) => find('workstream', x, where, 'workstream')),
      change: changeOf(kv.change, kv.today, where),
    });
    doc('structure', where, { ...header, bands, boxes, ...(lines.length && { lines }) }, parts.Notes ? textOf(parts.Notes, 2) : '', { bandWhere, boxWhere: (boxRows || []).map((r) => r.where), lineWhere: lineRows.map((r) => r.where) });
  }

  for (const r of rows.persona) {
    const roles = list(r.get('roles')).map((x) => find('role', x, r.where, 'role'));
    const v = r.get('entry');
    const m = v.match(/^(workstream|process|role)\s*:\s*(.+)$/i);
    let entry;
    if (/^overview$/i.test(v)) entry = { view: 'overview' };
    else if (m) entry = { view: m[1].toLowerCase(), id: find(m[1].toLowerCase(), m[2].trim(), r.where, m[1].toLowerCase()) };
    else if (v) say('error', r.where, `"Starts at" is "${v}", which the engine doesn't understand.`, 'Write Overview, or Workstream:, Process: or Role: followed by a name, e.g. "Process: Qualify an opportunity".');
    doc('persona', r.where, compact({ ...base(r), roles, entry }));
  }

  // ---------- theme: Label lines only; lines for the retired keys warn (design D9) ----------
  if (one.Theme) {
    const labels = {};
    const RETIRED_WORD = { colors: 'theme colours are', fonts: 'theme fonts are', logo: 'the theme logo is', palette: 'the theme palette is' };
    const retired = (k) => (/^(primary|accent|background|surface|text) colou?r$/.test(k) ? 'colors' : /^(body|heading) font$/.test(k) ? 'fonts' : ['logo', 'palette'].includes(k) ? k : undefined);
    const label = (k) => {
      const l = k.match(/^label (.+)$/);
      return l && LABELS.includes(l[1].replace(/ /g, '_')) ? l[1].replace(/ /g, '_') : undefined;
    };
    const kv = keyLines(one.Theme.blocks, 'Theme', (k, line) => {
      if (label(k)) return true;
      if (retired(k)) say('warning', 'Theme', `The Theme line "${line}" is ignored, because ${RETIRED_WORD[retired(k)]} retired. ${RETIRED[retired(k)]}`, retiredFix(retired(k), 'Remove the line.'));
      return !!retired(k);
    }, 'The Theme section holds only "Label <term>: <word>" lines, e.g. "Label workstream: Value stream". See the format spec for every term.');
    for (const [k, v] of Object.entries(kv)) if (v && label(k)) labels[label(k)] = v;
    doc('theme', 'Theme', Object.keys(labels).length ? { labels } : {});
  }

  // ---------- narratives for named elements ----------
  for (const n of named.notes) {
    const where = `Notes: ${n.target}`;
    const hits = Object.keys(WORD).filter((t) => names[t].has(nameKey(n.target)));
    if (hits.length > 1) {
      say('error', where, `"${n.target}" is the name of more than one kind of thing (${hits.map((t) => WORD[t]).join(' and ')}), so the engine can't tell which one these notes are for.`, 'Rename one of them so each name is used once.');
      continue;
    }
    if (!hits.length) {
      const all = Object.keys(WORD).flatMap((t) => [...names[t].values()]);
      const guess = closest(nameKey(n.target), all.map((x) => nameKey(x.name)));
      say('error', where, `These notes are for "${n.target}", which does not match the name of anything in the sheet.`, guess ? `Did you mean ${all.find((x) => nameKey(x.name) === guess).name}?` : 'Write the exact name of a party, team, role, committee, workstream, process, structure or persona after "Notes:".');
      continue;
    }
    const id = names[hits[0]].get(nameKey(n.target)).id;
    const d = docs.find((x) => x.header.type === hits[0] && x.header.id === id);
    if (d) d.body = [d.body, textOf(n.blocks, 1)].filter(Boolean).join('\n\n');
  }

  // ---------- working notes: never part of the model ----------
  if (one['Open questions']) {
    items(one['Open questions'].blocks).forEach((item, i) => {
      const m = item.match(/^\[([ xX])\]\s*(.*)$/);
      if (m && m[1] !== ' ') return;
      const q = m ? m[2] : item;
      meta.openQuestions.push(q);
      say('warning', `Open questions › item ${i + 1}`, `Open question: ${q}`, 'Answer it in the sheet, then tick it (- [x]) or remove it.', { openQuestion: true });
    });
  }
  if (one.Sources) meta.sources.push(...items(one.Sources.blocks));

  return { docs, messages, meta };
}
