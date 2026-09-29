import { readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

export const SAMPLE = fileURLToPath(new URL('../../examples/acme-sample/', import.meta.url));
export const SAMPLE_SHEET = join(SAMPLE, 'capture-sheet.md');

// A content folder on disk -> [{ path, data }], as the browser readers produce. The sample folder holds the
// same model twice (element files and capture-sheet.md), so its folder form leaves the sheet out.
export function readFolder(root) {
  return readdirSync(root, { recursive: true, withFileTypes: true })
    .filter((e) => e.isFile() && !(root === SAMPLE && join(e.parentPath, e.name) === SAMPLE_SHEET))
    .map((e) => ({ path: relative(root, join(e.parentPath, e.name)).replace(/\\/g, '/'), data: new Uint8Array(readFileSync(join(e.parentPath, e.name))) }));
}

// The sample capture sheet with its assets/, as a folder or zip containing a sheet gives them.
export const readSampleSheet = () => [{ path: 'capture-sheet.md', data: new Uint8Array(readFileSync(SAMPLE_SHEET)) }, ...readFolder(SAMPLE).filter((f) => f.path.startsWith('assets/'))];

// { 'model.md': 'text', ... } -> [{ path, data }]
export const files = (obj) => Object.entries(obj).map(([path, text]) => ({ path, data: new TextEncoder().encode(text) }));

export const MODEL = `---
id: mini
type: model
name: Mini
purpose: A tiny model.
key_messages: [One]
---
`;

// Leaves out the one-A-per-step warnings (tested in validate.test.js), for tests about something else
// whose small models don't mark an accountable role.
export const withoutAccountable = (msgs) => msgs.filter((m) => !/accountable role|is accountable \(A\)/.test(m.problem));
