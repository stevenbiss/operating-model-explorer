import { schemas } from './schemas.js';
import { check } from './schema-check.js';

// Every message: { level: 'error'|'warning', file, where?, element?, step?, line?, problem, fix } in plain English.
// `where` is set for capture sheets (a section and row), and is shown instead of the file.

const TYPES = Object.keys(schemas);
const WORDS = { string: 'text', array: 'a list', object: 'a group of fields', number: 'a number', integer: 'a whole number', boolean: 'true or false', null: 'empty' };
const FIXES = {
  string: 'Write it as plain text. Put quotes around it if it contains ": " or starts with a symbol.',
  array: 'Write it as a list: one item per line, each starting with "- ".',
  object: 'Write it as indented "field: value" lines under it.',
  number: 'Write it as a number.',
  integer: 'Write it as a whole number.',
  boolean: 'Write true or false.',
};

function distance(a, b) {
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    for (let j = 1; j <= b.length; j++) cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    prev = cur;
  }
  return prev[b.length];
}

const isSubsequence = (a, b) => {
  let i = 0;
  for (const ch of b) if (ch === a[i]) i++;
  return i === a.length;
};

// The candidate most like `word`: abbreviations (sol-arch -> solution-architect) first, then fewest edits.
// Long strings get no suggestion: the edit distance grows with the product of the two lengths.
export function closest(word, candidates) {
  if (word.length > 100) return undefined;
  let best;
  let bestScore = Infinity;
  for (const c of candidates) {
    if (c.length > 100) continue;
    const score = distance(word, c) - (isSubsequence(word, c) ? 1000 : 0);
    if (score < bestScore) [best, bestScore] = [c, score];
  }
  if (best === undefined) return undefined;
  return bestScore < 0 || bestScore <= Math.max(2, Math.floor(word.length / 2)) ? best : undefined;
}

// More than one RACI letter in a cell, e.g. "A/R" or "RA" (design D6).
export const COMBINED = /^[RACI]{2,}$|[/,+&]/i;

// A document's location, and a step's row when the document came from a capture sheet.
const whereOf = (doc, i) => {
  const w = (i !== undefined && doc.stepWhere && doc.stepWhere[i]) || doc.where;
  return w ? { where: w } : {};
};

const fieldName = (path) => path.reduce((acc, p) => (typeof p === 'number' ? `${acc} item ${p + 1}` : acc ? `${acc}.${p}` : p), '');

function wordIssue(issue, doc) {
  const { header } = doc;
  let path = issue.path;
  let step;
  if (path[0] === 'steps' && typeof path[1] === 'number') {
    const s = header.steps[path[1]];
    step = s && typeof s.id === 'string' ? s.id : `step ${path[1] + 1}`;
    path = path.slice(2);
  }
  const at = { file: doc.file, ...whereOf(doc, path === issue.path ? undefined : issue.path[1]), element: typeof header.id === 'string' ? header.id : undefined, step };
  const subject = path.length ? `"${fieldName(path)}"` : step ? 'This step' : 'The header';
  switch (issue.keyword) {
    case 'required': {
      const field = path[path.length - 1];
      const parent = fieldName(path.slice(0, -1));
      const where = parent ? `under "${parent}"` : step ? 'to this step' : 'to the header';
      return { level: 'error', ...at, problem: `The required field "${field}" is missing.`, fix: `Add a "${field}:" line ${where}.` };
    }
    case 'type': {
      const expected = issue.expected.map((t) => WORDS[t]).join(' or ');
      const fix = issue.actual === 'null' ? 'Fill it in, or remove the line.' : FIXES[issue.expected[0]];
      return { level: 'error', ...at, problem: `${subject} should be ${expected}, but it is ${WORDS[issue.actual]}.`, fix };
    }
    case 'enum':
      return { level: 'error', ...at, problem: `${subject} is ${JSON.stringify(issue.actual)}, which is not an allowed value.`, fix: `Use one of: ${issue.allowed.join(', ')}.` };
    case 'pattern':
      return { level: 'error', ...at, problem: `${subject} is ${JSON.stringify(issue.actual)}, which is not in the right format.`, fix: issue.schema.description };
    case 'additionalProperties':
      return {
        level: 'warning',
        ...at,
        problem: `${subject} is not a field the engine knows ${step ? 'for a step' : `for a ${header.type}`}, so it will be ignored.`,
        fix: `Check the spelling, or remove it if it is not needed. Known fields here: ${issue.known.join(', ')}.`,
      };
  }
}

const removed = (x) => !!(x.change && typeof x.change === 'object' && x.change.status === 'removed');

export function validate(docs) {
  const messages = [];
  const add = (m) => messages.push(m);
  const typed = [];

  // Exactly one model document: model.md in a folder, or the title of a capture sheet.
  if (!docs.some((d) => d.file === 'model.md' || (d.header && d.header.type === 'model'))) {
    add({ level: 'error', file: 'model.md', problem: 'No model.md found at the top of the folder.', fix: 'Add a model.md file at the top level of the folder, with "type: model" in its header.' });
  }

  for (const doc of docs) {
    const { file, header } = doc;
    if (doc.none) {
      add({ level: 'warning', file, problem: 'This file has no header, so it was ignored.', fix: 'If it is content, start it with a --- line, then the header fields, then another --- line. Otherwise move it out of the folder.' });
      continue;
    }
    if (doc.error) {
      add({ level: 'error', file, line: doc.error.line, problem: doc.error.problem, fix: doc.error.fix });
      continue;
    }
    const element = typeof header.id === 'string' ? header.id : undefined;
    if (!('type' in header)) {
      add({ level: 'error', file, element, problem: 'The header has no "type" field, so the engine cannot tell what this file describes.', fix: `Add a "type:" line. Allowed types: ${TYPES.join(', ')}.` });
      continue;
    }
    if (!TYPES.includes(header.type)) {
      const guess = typeof header.type === 'string' && closest(header.type, TYPES);
      add({ level: 'error', file, element, problem: `The type ${JSON.stringify(header.type)} is not one the engine knows.`, fix: guess ? `Did you mean ${guess}?` : `Use one of: ${TYPES.join(', ')}.` });
      continue;
    }
    if (file === 'model.md' && header.type !== 'model') {
      add({ level: 'error', file, element, problem: `model.md should describe the model, but its type is "${header.type}".`, fix: 'Set "type: model" in model.md, and move this content to its own file.' });
    }
    for (const issue of check(header, schemas[header.type])) {
      if (doc.where && issue.keyword === 'required') continue; // the capture sheet reader reports empty cells itself
      if (issue.keyword === 'enum' && issue.path[2] === 'raci' && COMBINED.test(String(issue.actual).trim())) continue; // worded below
      add(wordIssue(issue, doc));
    }
    typed.push(doc);
  }

  // Ids are unique across the model; there is one model and at most one theme.
  const byId = new Map();
  const single = {};
  for (const doc of typed) {
    const { file, header } = doc;
    if (header.type === 'model' || header.type === 'theme') {
      if (single[header.type]) add({ level: 'error', file, ...whereOf(doc), element: header.id, problem: `There is already a ${header.type} in ${single[header.type]}.`, fix: `Keep only one ${header.type} file, and remove or merge the other.` });
      else single[header.type] = file;
    }
    if (header.type === 'theme' || typeof header.id !== 'string') continue;
    const first = byId.get(header.id);
    // In a capture sheet both are in the same file, so name the other section or row instead.
    if (first && doc.where && first.where && first.file === file) add({ level: 'error', file, ...whereOf(doc), element: header.id, problem: `This has the id "${header.id}", and so does ${first.where}.`, fix: 'Ids must be unique across the whole model. Give one of them a different id: an ID column in its table, or an "ID:" line under its heading.' });
    else if (first) add({ level: 'error', file, ...whereOf(doc), element: header.id, problem: `The id "${header.id}" is also used by ${first.file}.`, fix: 'Ids must be unique across the whole model. Change the id in one of the two files.' });
    else byId.set(header.id, { file, where: doc.where, type: header.type, name: header.name, removed: removed(header) });
  }

  const idsOf = (type) => [...byId].filter(([, v]) => v.type === type).map(([id]) => id);
  const nameOf = (id) => (byId.get(id) && typeof byId.get(id).name === 'string' ? byId.get(id).name : id);
  const checkRef = (at, label, value, type, pool = idsOf(type)) => {
    if (typeof value !== 'string' || pool.includes(value)) return;
    const other = type !== 'step' && byId.get(value);
    const problem = other
      ? `The ${label} "${value}" is a ${other.type}, not a ${type}.`
      : `The ${label} "${value}" does not match any ${type}${type === 'step' ? ' in this process' : ''}.`;
    const guess = closest(value, pool);
    add({ level: 'error', ...at, problem, fix: guess ? `Did you mean ${guess}?` : `Use the id of an existing ${type}, or add a ${type} with this id.` });
  };
  const list = (v) => (Array.isArray(v) ? v : []);

  for (const doc of typed) {
    const h = doc.header;
    const at = { file: doc.file, ...whereOf(doc), element: typeof h.id === 'string' ? h.id : undefined };
    // A capture sheet refers by name, and its reader has already matched and reported every name.
    const ref = doc.where ? () => {} : checkRef;
    switch (h.type) {
      case 'team':
        ref(at, 'party', h.party, 'party');
        break;
      case 'role':
        ref(at, 'party', h.party, 'party');
        ref(at, 'team', h.team, 'team');
        break;
      case 'workstream':
        for (const p of list(h.parties)) ref(at, 'party', p, 'party');
        break;
      case 'persona':
        if (Array.isArray(h.roles) && !h.roles.length) add({ level: 'error', ...at, problem: 'This persona has no roles.', fix: 'List at least one role id under "roles".' });
        for (const r of list(h.roles)) ref(at, 'role', r, 'role');
        if (h.entry && typeof h.entry === 'object' && ['workstream', 'process', 'role'].includes(h.entry.view)) {
          if (h.entry.id === undefined) add({ level: 'error', ...at, problem: `The entry point opens a ${h.entry.view} but does not say which one.`, fix: `Add "id:" under "entry" with the id of the ${h.entry.view}.` });
          else ref(at, 'entry point', h.entry.id, h.entry.view);
        }
        break;
      case 'process': {
        ref(at, 'workstream', h.workstream, 'workstream');
        const steps = list(h.steps);
        const stepIds = steps.map((s) => s && s.id).filter((id) => typeof id === 'string');
        const seen = new Set();
        steps.forEach((s, i) => {
          if (!s || typeof s !== 'object') return;
          const sat = { ...at, ...whereOf(doc, i), step: typeof s.id === 'string' ? s.id : undefined };
          if (seen.has(s.id)) add({ level: 'error', ...sat, problem: `Two steps in this process use the id "${s.id}".`, fix: 'Give each step in a process its own id.' });
          seen.add(s.id);
          ref(sat, 'owner', s.owner, 'role');
          const owner = byId.get(s.owner);
          if (owner && owner.type === 'role' && owner.removed && !removed(s)) {
            add({ level: 'warning', ...sat, problem: `This step is owned by the role "${s.owner}", which is marked as removed.`, fix: 'Give the step an owner that stays, or mark the step as removed too (change: status: removed).' });
          }
          if (s.raci && typeof s.raci === 'object') for (const r of Object.keys(s.raci)) ref(sat, 'RACI role', r, 'role');
          for (const n of list(s.next)) ref(sat, 'next step', typeof n === 'string' ? n : n && n.to, 'step', stepIds);
          // A capture sheet's combined letter is reported at its RACI table row, where it is written.
          raciChecks(s, sat, doc.raciWhere && doc.raciWhere[i] ? { ...sat, where: doc.raciWhere[i] } : sat);
        });
        break;
      }
    }
  }
  return messages;

  // One letter per cell, and exactly one A per step (design D6). The owner counts as R when it has no letter.
  function raciChecks(s, sat, cellAt) {
    const raci = s.raci && typeof s.raci === 'object' && !Array.isArray(s.raci) ? s.raci : {};
    const step = typeof s.name === 'string' ? s.name : s.id;
    let combined = false;
    for (const [r, v] of Object.entries(raci)) {
      if (typeof v !== 'string' || !COMBINED.test(v.trim())) continue;
      combined = true;
      const who = nameOf(r);
      add({ level: 'error', ...cellAt, problem: `${who} has "${v}" on the step "${step}". A role can have only one RACI letter per step.`, fix: `Choose one letter: R if ${who} does the work, or A if ${who} signs the work off.` });
    }
    if (combined) return;
    const accountable = Object.keys(raci).filter((r) => raci[r] === 'A');
    if (!accountable.length) add({ level: 'warning', ...sat, problem: `No role is accountable (A) for the step "${step}".`, fix: 'Who signs this step off? Mark that role A in the RACI.' });
    else if (accountable.length > 1) {
      add({ level: 'warning', ...sat, problem: `The step "${step}" has more than one accountable role (A): ${new Intl.ListFormat('en').format(accountable.map(nameOf))}.`, fix: 'Keep A for the one role that signs the step off, and change the others to R, C or I.' });
    }
  }
}
