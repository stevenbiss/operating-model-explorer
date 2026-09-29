import { parseFile } from './parse.js';
import { schemas } from './schemas.js';
import { validate } from './validate.js';
import { checkTheme, isUrl } from './theme-check.js';
import { imageRefs, markdownTexts } from './markdown.js';
import { isSheet, sheetToDocs } from './sheet.js';

const ELEMENT_TYPES = ['party', 'team', 'role', 'persona', 'workstream', 'process'];
const decoder = new TextDecoder();

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
// meta ({ openQuestions, sources }) is only set for a capture sheet, and never goes into the model.
export function loadModel(files) {
  const texts = [];
  const assets = {};
  for (const f of normalisePaths(files)) {
    if (f.path.startsWith('assets/')) assets[f.path] = f.data;
    else if (f.path.toLowerCase().endsWith('.md')) texts.push({ file: f.path, text: decoder.decode(f.data) });
  }
  const sheets = texts.filter((f) => isSheet(f.text));
  if (!sheets.length) return checked(texts.map((f) => ({ file: f.file, ...parseFile(f.text) })), assets);

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
  const out = checked(docs, assets);
  return { ...out, messages: [...mixed, ...messages, ...out.messages], meta };
}

const checked = (docs, assets) => ({ model: buildModel(docs, assets), messages: [...validate(docs), ...checkTheme(docs, assets), ...checkImages(docs, assets)] });

// Images in Markdown text must be files in assets/, so they can be embedded.
export function checkImages(docs, assets) {
  const out = [];
  for (const doc of docs) {
    const { file, header, body } = doc;
    if (!header || typeof header !== 'object') continue;
    const element = typeof header.id === 'string' ? header.id : undefined;
    for (const { text, step } of markdownTexts({ ...header, body })) {
      for (const src of imageRefs(text)) {
        if (assets[src]) continue;
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
export function buildModel(docs, assets = {}) {
  const out = { model: null, theme: null, elements: {}, order: Object.fromEntries(ELEMENT_TYPES.map((t) => [t, []])), assets };
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
