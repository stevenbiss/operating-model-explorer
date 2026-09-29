// Builds dist/operating-model-explorer.html: one self-contained file with the CSS and JS inlined.
// Also regenerates docs/content-reference.md from the schemas.
import { build, transform } from 'esbuild';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { schemas } from '../src/model/schemas.js';
import { contentReference } from '../src/model/reference.js';

const root = new URL('../', import.meta.url);
const read = (p) => readFileSync(new URL(p, root), 'utf8');

writeFileSync(new URL('docs/content-reference.md', root), contentReference(schemas));

// The fictional sample folder for "Try the sample" (design D11), as [{ path, b64 }] in <script id="om-sample">.
// It sits outside the engine script, so exported snapshots (which copy only om-style and om-engine) don't carry it.
// The folder also holds the same model as capture-sheet.md, which is left out: a model is one format or the other.
const sampleDir = fileURLToPath(new URL('examples/acme-sample/', root));
const sample = readdirSync(sampleDir, { recursive: true, withFileTypes: true })
  .filter((e) => e.isFile() && join(e.parentPath, e.name) !== join(sampleDir, 'capture-sheet.md'))
  .map((e) => ({ path: relative(sampleDir, join(e.parentPath, e.name)).replace(/\\/g, '/'), b64: readFileSync(join(e.parentPath, e.name)).toString('base64') }));

const js = (
  await build({
    entryPoints: [fileURLToPath(new URL('src/main.js', root))],
    bundle: true,
    format: 'iife',
    minify: true,
    write: false,
    charset: 'utf8',
  })
).outputFiles[0].text;

if (/\beval\s*\(|new\s+Function\s*\(/.test(js)) throw new Error('The bundle uses eval or new Function, which is not allowed.');

const css = (await transform(read('src/styles.css'), { loader: 'css', minify: true })).code;

// Inline safely: "</script" or "</style" inside the code would otherwise end the element early.
const engine = js.replace(/<\/script/gi, '<\\/script').replace(/<!--/g, '<\\!--');
// The CSP allows only this exact script, by hash: no inline event handlers, javascript: URLs or injected scripts.
// Exported snapshots copy the CSP and this script unchanged, so the hash holds there too. om-sample and om-content
// are JSON data blocks, which never run.
const hash = `'sha256-${createHash('sha256').update(engine, 'utf8').digest('base64')}'`;
const page = read('src/index.html');
if (!page.includes("'om-engine-hash'")) throw new Error("The CSP in src/index.html has no 'om-engine-hash' placeholder.");
const html = page
  .replace("'om-engine-hash'", () => hash)
  .replace('<style id="om-style"></style>', () => `<style id="om-style">${css.replace(/<\/style/gi, '<\\/style')}</style>`)
  .replace('<script id="om-sample" type="application/json"></script>', () => `<script id="om-sample" type="application/json">${JSON.stringify(sample).replace(/</g, '\\u003c')}</script>`)
  .replace('<script id="om-engine"></script>', () => `<script id="om-engine">${engine}</script>`);

mkdirSync(new URL('dist/', root), { recursive: true });
writeFileSync(new URL('dist/operating-model-explorer.html', root), html);
console.log(`dist/operating-model-explorer.html ${(html.length / 1024).toFixed(1)} KB`);
