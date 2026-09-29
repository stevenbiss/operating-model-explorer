// Builds dist/operating-model-explorer.html: one self-contained file with the CSS and JS inlined.
// Also regenerates docs/content-reference.md from the schemas.
import { build, transform } from 'esbuild';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { schemas } from '../src/model/schemas.js';
import { contentReference } from '../src/model/reference.js';

const root = new URL('../', import.meta.url);
const read = (p) => readFileSync(new URL(p, root), 'utf8');
const writeIfChanged = (p, text) => read(p) !== text && writeFileSync(new URL(p, root), text);

writeFileSync(new URL('docs/content-reference.md', root), contentReference(schemas));

// One version across the bundle (design D11): package.json is the single source. The engine gets it through
// esbuild's define; SKILL.md's "Version:" line and plugin.json's "version" are stamped when those files exist.
const { version } = JSON.parse(read('package.json'));
if (existsSync(new URL('skills/operating-model-author/SKILL.md', root))) {
  const p = 'skills/operating-model-author/SKILL.md';
  if (!/^Version: .*$/m.test(read(p))) throw new Error(`${p} has no "Version:" line for the build to stamp.`);
  writeIfChanged(p, read(p).replace(/^Version: .*$/m, `Version: ${version}`));
}
if (existsSync(new URL('.claude-plugin/plugin.json', root))) {
  const p = '.claude-plugin/plugin.json';
  writeIfChanged(p, `${JSON.stringify({ ...JSON.parse(read(p)), version }, null, 2)}\n`);
}

// The fictional sample folder for "Try the sample" (design D11), as [{ path, b64 }] in <script id="om-sample">.
// It sits outside the engine script, so exported snapshots (which copy only om-style and om-engine) don't carry it.
const sampleDir = fileURLToPath(new URL('examples/acme-sample/', root));
const sample = readdirSync(sampleDir, { recursive: true, withFileTypes: true })
  .filter((e) => e.isFile())
  .map((e) => ({ path: relative(sampleDir, join(e.parentPath, e.name)).replace(/\\/g, '/'), b64: readFileSync(join(e.parentPath, e.name)).toString('base64') }));

const js = (
  await build({
    entryPoints: [fileURLToPath(new URL('src/main.js', root))],
    bundle: true,
    format: 'iife',
    minify: true,
    write: false,
    charset: 'utf8',
    define: { OM_VERSION: JSON.stringify(version) },
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
  // The capture sheet format spec for the content reference, also a data block that snapshots don't copy.
  .replace('<script id="om-sheet-format" type="application/json"></script>', () => `<script id="om-sheet-format" type="application/json">${JSON.stringify(read('docs/capture-sheet.md').replace(/\r\n/g, '\n')).replace(/</g, '\\u003c')}</script>`)
  .replace('<script id="om-engine"></script>', () => `<script id="om-engine">${engine}</script>`);

mkdirSync(new URL('dist/', root), { recursive: true });
writeFileSync(new URL('dist/operating-model-explorer.html', root), html);
console.log(`dist/operating-model-explorer.html ${(html.length / 1024).toFixed(1)} KB`);
