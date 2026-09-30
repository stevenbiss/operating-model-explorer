// npm run validate -- <path>: checks a capture sheet, a content folder or a .zip with the engine's own checks
// (content-schema spec › Command-line validation, design D7). Exits with code 1 when there are errors.
/* global OM_VERSION */
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { basename, dirname, join, relative } from 'node:path';
import { loadModel } from '../src/model/load.js';
import { readZip } from '../src/model/read.js';

// OM_VERSION is set by esbuild when this script is bundled into the skill (design D8); otherwise package.json.
const version = typeof OM_VERSION === 'string' ? OM_VERSION : JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8')).version;
// Sheet text is untrusted: control characters (such as ESC, which starts terminal escape sequences) are replaced
// before printing, so a sheet can't clear the screen or change the terminal title.
const clean = (s) => String(s).replace(/[\u0000-\u001f\u007f-\u009f]/g, '\uFFFD');
const count = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`;

const walk = (dir) =>
  readdirSync(dir, { recursive: true, withFileTypes: true })
    .filter((e) => e.isFile())
    .map((e) => ({ path: relative(dir, join(e.parentPath, e.name)).replace(/\\/g, '/'), data: new Uint8Array(readFileSync(join(e.parentPath, e.name))) }));

// A sheet file is read with the assets/ and brands/ folders next to it, as a folder holding the sheet would be.
function read(path) {
  if (statSync(path).isDirectory()) return walk(path);
  const data = new Uint8Array(readFileSync(path));
  if (/\.zip$/i.test(path)) return readZip(data);
  const beside = ['assets', 'brands'].map((d) => [d, join(dirname(path), d)]).filter(([, dir]) => existsSync(dir));
  return [{ path: basename(path), data }, ...beside.flatMap(([d, dir]) => walk(dir).map((f) => ({ ...f, path: `${d}/${f.path}` })))];
}

const path = process.argv[2];
console.log(`Operating Model Explorer validator ${version}`);
if (!path) {
  console.log('Give the path of a capture sheet, a content folder or a .zip, e.g. npm run validate -- examples/acme-capture-sheet/capture-sheet.md');
  process.exit(1);
}
let files;
try {
  files = read(path);
} catch {
  console.log(`${clean(path)} could not be read. Check the path, and that a .zip opens on your computer.`);
  process.exit(1);
}

const { messages } = loadModel(files);
const errors = messages.filter((m) => m.level === 'error');
const warnings = messages.filter((m) => m.level === 'warning');
console.log(`Checking ${clean(path)} (${count(files.length, 'file')})`);
for (const [title, list] of [['Errors', errors], ['Warnings', warnings]]) {
  if (!list.length) continue;
  console.log(`\n${title} (${list.length})`);
  for (const m of list) {
    const at = m.where || [m.file, m.element && `element ${m.element}`, m.step && `step ${m.step}`].filter(Boolean).join(' · ');
    console.log(`\n  ${m.level} · ${clean(at)}\n    Problem: ${clean(m.problem)}\n    Fix: ${clean(m.fix)}`);
  }
}
console.log(`\n${count(errors.length, 'error')}, ${count(warnings.length, 'warning')}`);
process.exitCode = errors.length ? 1 : 0;
