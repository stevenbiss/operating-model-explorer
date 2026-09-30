import { parseFile } from './parse.js';
import { brandSchema, schemas } from './schemas.js';
import { check } from './schema-check.js';
import { closest, validate, wordIssue } from './validate.js';
import { checkTheme, isUrl } from './theme-check.js';
import { imageRefs, markdownTexts } from './markdown.js';
import { isSheet, nameKey, sheetToDocs, toId } from './sheet.js';
import { colourMessages, resolvePartyColours } from './colour.js';

const ELEMENT_TYPES = ['party', 'team', 'role', 'persona', 'workstream', 'process'];
const decoder = new TextDecoder();
const MARK_KB = 200;

// Clean up paths from any reader: forward slashes, no hidden or OS junk files, and no
// wrapping folder (a zip or folder picker usually adds the folder's own name). Content order = path order.
export function normalisePaths(files) {
  let list = files
    .map((f) => ({ ...f, path: f.path.replace(/\\/g, '/').replace(/^(\.?\/)+/, '') }))
    .filter((f) => !f.path.split('/').some((s) => s.startsWith('.') || s === '__MACOSX'));
  const tops = new Set(list.map((f) => f.path.split('/')[0]));
  if (!list.some((f) => f.path === 'model.md') && tops.size === 1 && list.every((f) => f.path.includes('/'))) {
    list = list.map((f) => ({ ...f, path: f.path.slice(f.path.indexOf('/') + 1) }));
  }
  return list.sort((a, b) => a.path.localeCompare(b.path, 'en', { numeric: true }));
}

// files: [{ path, data: Uint8Array }] -> { model, messages, meta? }. Pure: works in Node and the browser.
// A folder of element files, or one capture sheet (a single file, or a folder with a sheet and assets/; design D3).
// Either can have brand packs in brands/<id>/ (design D2): brand.md is read only as a pack, never as an element,
// and the pack's other files are kept in assets under their full path.
// meta ({ openQuestions, sources }) is only set for a capture sheet, and never goes into the model.
export function loadModel(files) {
  const texts = [];
  const assets = {};
  const packs = [];
  for (const f of normalisePaths(files)) {
    const pack = f.path.match(/^brands\/([^/]+)\/(.+)$/);
    if (pack && pack[2] === 'brand.md') packs.push({ folder: pack[1], file: f.path, text: decoder.decode(f.data) });
    else if (pack) assets[f.path] = f.data;
    else if (f.path.startsWith('brands/')) continue; // not inside a pack's folder
    else if (f.path.startsWith('assets/')) assets[f.path] = f.data;
    else if (f.path.toLowerCase().endsWith('.md')) texts.push({ file: f.path, text: decoder.decode(f.data) });
  }
  const brands = readBrands(packs, assets);
  const sheets = texts.filter((f) => isSheet(f.text));
  if (!sheets.length) return checked(texts.map((f) => ({ file: f.file, ...parseFile(f.text) })), assets, brands);

  const [sheet] = sheets;
  const { docs, messages, meta } = sheetToDocs(sheet.text, sheet.file);
  const mixed = [];
  for (const f of sheets.slice(1)) mixed.push({ level: 'error', file: f.file, problem: `There is more than one capture sheet: ${sheet.file} and ${f.file}.`, fix: 'A model is one capture sheet. Keep one, and remove or merge the others.' });
  const element = texts.find((f) => !sheets.includes(f) && !parseFile(f.text).none);
  if (element) {
    mixed.push({
      level: 'error',
      file: element.file,
      problem: `This has both a capture sheet (${sheet.file}) and element files such as ${element.file}. A model is either one capture sheet or a folder of element files, not both.`,
      fix: `Keep one format: remove the element files to use the capture sheet, or remove ${sheet.file} to use the files.`,
    });
  }
  const out = checked(docs, assets, brands);
  return { ...out, messages: [...mixed, ...messages, ...out.messages], meta };
}

function checked(parsed, assets, brands) {
  const { docs, messages: links } = linkBrands(parsed, brands.packs);
  const model = buildModel(docs, assets, brands.packs);
  const doc = (id) => docs.find((d) => d.header && d.header.type === 'party' && d.header.id === id) || {};
  const at = (id) => ({ file: doc(id).file, ...(doc(id).where && { where: doc(id).where }), element: id });
  const colours = colourMessages(model.partyColours, (id) => model.elements[id].name || id, at);
  return { model, messages: [...validate(docs), ...brands.messages, ...links, ...checkTheme(docs), ...checkImages(docs, assets), ...colours] };
}

// [{ folder, file, text }] for each brands/<folder>/brand.md -> { packs: { id: pack }, messages }.
// A pack: { id, name, version, updated, colours, marks }, where marks hold full paths (brands/acme/mark.svg).
// Usage notes (the Markdown text) are dropped.
export function readBrands(list, assets) {
  const packs = Object.create(null); // keyed by folder name, so a folder called __proto__ is just a key
  const messages = [];
  for (const { folder, file, text } of list) {
    const parsed = parseFile(text);
    const at = { file, element: folder };
    const say = (level, problem, fix) => messages.push({ level, ...at, problem, fix });
    if (parsed.none) {
      say('error', `The brand pack in brands/${folder}/ has no header, so it can't be used.`, 'Start brand.md with a --- line, then the header fields (id, name, version, updated, colours and marks), then another --- line.');
      continue;
    }
    if (parsed.error) {
      messages.push({ level: 'error', ...at, line: parsed.error.line, problem: parsed.error.problem, fix: parsed.error.fix });
      continue;
    }
    const h = parsed.header;
    for (const issue of check(h, brandSchema)) {
      if (issue.keyword === 'additionalProperties' && issue.path.join('.') === 'fonts') {
        say('warning', `The brand pack ${folder} sets "fonts", but brand fonts are not used, so it is ignored. The engine always uses its own fonts.`, 'Remove "fonts" from brand.md.');
      } else messages.push(wordIssue(issue, { file, header: { ...h, type: 'brand', id: folder } }));
    }
    if (typeof h.id === 'string' && h.id !== folder) {
      say('error', `The brand pack in the folder brands/${folder}/ has the id "${h.id}". A pack's id and its folder name must match.`, `Change the id to "${folder}", or rename the folder to brands/${h.id}/.`);
    }
    const marks = {};
    const m = h.marks && typeof h.marks === 'object' ? h.marks : {};
    for (const key of ['mark', 'mono', 'full']) {
      const v = m[key];
      if (typeof v !== 'string') continue;
      const word = { mark: 'mark', mono: 'mono mark', full: 'full logo' }[key];
      const path = `brands/${folder}/${v.trim().replace(/^\.\//, '')}`;
      if (isUrl(v) || /^[\\/]/.test(v.trim()) || v.split(/[\\/]/).includes('..')) {
        const what = isUrl(v) && !/^[a-z]:[\\/]/i.test(v.trim()) ? 'is a web address' : "points outside the pack's folder";
        say('error', `The ${word} "${v}" in the brand pack ${folder} ${what}. Marks must be files in the brand pack's folder, so the model works offline.`, `Put the file in brands/${folder}/ and write its name, e.g. "mark.svg".`);
      } else if (!assets[path]) {
        // Only the mark is drawn, so a missing mono mark or full logo doesn't block export.
        say(key === 'mark' ? 'error' : 'warning', `The ${word} file "${v}" was not found in the brand pack's folder, brands/${folder}/.`, `Add the file to brands/${folder}/, or correct its name in brand.md.`);
      } else {
        marks[key] = path;
        // TextDecoder drops a leading byte-order mark.
        if (!/^\s*<(svg|\?xml)\b/i.test(decoder.decode(assets[path].subarray(0, 512)))) say('warning', `The ${word} "${v}" in the brand pack ${folder} doesn't look like an SVG file: it doesn't start with <svg or <?xml, so it may not show.`, 'Use the SVG version of the mark from the brand library.');
        const kb = Math.ceil(assets[path].length / 1024);
        if (kb > MARK_KB) say('warning', `The ${word} "${v}" in the brand pack ${folder} is ${kb} KB. Marks should be under ${MARK_KB} KB, because they are embedded in every snapshot.`, 'Use a simplified or optimised version of the mark.');
      }
    }
    packs[folder] = {
      id: folder,
      name: typeof h.name === 'string' ? h.name : folder,
      version: typeof h.version === 'number' ? String(h.version) : h.version,
      updated: h.updated,
      colours: h.colours && typeof h.colours === 'object' ? h.colours : {},
      marks,
    };
  }
  return { packs, messages };
}

// Party brand references (design D2, D9) -> { docs, messages }. A folder party's brand: is a pack id. A capture
// sheet's Brand cell matches a pack's id or name, ignoring case and punctuation, and becomes that pack's id.
export function linkBrands(docs, packs) {
  const ids = Object.keys(packs);
  const messages = [];
  const out = docs.map((d) => {
    const h = d.header;
    if (!h || h.type !== 'party' || typeof h.brand !== 'string') return d;
    const raw = h.brand;
    const sheet = !!d.where;
    const hit = sheet ? ids.find((id) => nameKey(id) === nameKey(raw)) || ids.find((id) => nameKey(packs[id].name) === nameKey(raw)) : ids.find((id) => id === raw);
    if (hit) return hit === raw ? d : { ...d, header: { ...h, brand: hit } };
    const who = typeof h.name === 'string' ? h.name : h.id;
    const id = sheet ? toId(raw) : raw;
    const guess = closest(id, ids);
    const at = { level: 'error', file: d.file, ...(d.where && { where: d.where }), element: typeof h.id === 'string' ? h.id : undefined };
    if (sheet && !ids.length) {
      messages.push({ ...at, problem: `The party "${who}" uses the brand "${raw}", but no brand packs were loaded. Brand packs are read from the brands/ folder next to the capture sheet.`, fix: `Load the sheet's folder (or a .zip of it), with the pack in brands/${id}/, instead of the sheet on its own.` });
    } else {
      const where = sheet ? 'next to the capture sheet' : 'next to model.md';
      messages.push({ ...at, problem: `The party "${who}" uses the brand "${raw}", which does not match any brand pack in brands/.`, fix: guess ? `Did you mean ${guess}?` : `Copy the brand pack from the brand library into brands/${id}/ ${where}, or use the id of a pack that is there.` });
    }
    return sheet ? { ...d, header: { ...h, brand: id } } : d;
  });
  return { docs: out, messages };
}

// Images in Markdown text must be files in assets/, so they can be embedded.
export function checkImages(docs, assets) {
  const out = [];
  for (const doc of docs) {
    const { file, header, body } = doc;
    if (!header || typeof header !== 'object') continue;
    const element = typeof header.id === 'string' ? header.id : undefined;
    for (const { text, step } of markdownTexts({ ...header, body })) {
      for (const src of imageRefs(text)) {
        if (src.startsWith('assets/') && assets[src]) continue;
        const i = step && Array.isArray(header.steps) ? header.steps.findIndex((s) => s && s.id === step) : -1;
        const where = (doc.stepWhere && doc.stepWhere[i]) || doc.where;
        const at = { level: 'error', file, ...(where && { where }), element, step };
        out.push(
          isUrl(src)
            ? { ...at, problem: `The image "${src}" is a web address. Images must be files in the assets/ folder, so the model works offline.`, fix: 'Put the image in the assets/ folder and write its path, e.g. ![Plan](assets/plan.png).' }
            : { ...at, problem: `The image file "${src}" was not found. Images must be files in the assets/ folder.`, fix: 'Add the file to the assets/ folder, or correct the path.' },
        );
      }
    }
  }
  return out;
}

// The normalised in-memory model (design D4). Tolerates invalid content so a preview can still render.
// brands: the packs from readBrands. partyColours: each party's resolved colours, in party order (design D3).
export function buildModel(docs, assets = {}, brands = {}) {
  const out = { model: null, theme: null, elements: {}, order: Object.fromEntries(ELEMENT_TYPES.map((t) => [t, []])), assets, brands };
  for (const { header: h, body } of docs) {
    if (!h || !schemas[h.type]) continue;
    if (h.type === 'model') out.model ??= { ...h, body };
    else if (h.type === 'theme') out.theme ??= { ...h };
    else if (typeof h.id === 'string' && !out.elements[h.id]) {
      out.elements[h.id] = { ...h, body };
      out.order[h.type].push(h.id);
    }
  }
  const el = out.elements;
  for (const id of out.order.workstream) el[id].processes = out.order.process.filter((p) => el[p].workstream === id);
  for (const id of out.order.process) resolveSteps(el[id], el);
  out.partyColours = resolvePartyColours(out.order.party.map((id) => el[id]), brands);
  return out;
}

function resolveSteps(p, el) {
  const list = (Array.isArray(p.steps) ? p.steps : []).filter((s) => s && typeof s === 'object');
  const partyOf = (role) => (el[role] && el[role].type === 'role' ? el[role].party : null);
  p.steps = list.map((s, i) => ({
    ...s,
    process: p.id,
    lane: s.owner,
    party: partyOf(s.owner),
    raci: s.raci && typeof s.raci === 'object' ? s.raci : {},
    // Without "next", a step flows to the following step in the list.
    next: Array.isArray(s.next)
      ? s.next.map((n) => (typeof n === 'string' ? { to: n } : { to: n && n.to, label: n && n.label }))
      : list[i + 1] ? [{ to: list[i + 1].id }] : [],
  }));
  const byId = Object.fromEntries(p.steps.map((s) => [s.id, s]));
  p.edges = p.steps.flatMap((s) =>
    s.next
      .filter((n) => byId[n.to])
      .map((n) => ({ from: s.id, to: n.to, label: n.label, handoff: s.owner !== byId[n.to].owner, crossParty: s.party !== byId[n.to].party })),
  );
}
