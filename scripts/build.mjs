// Builds dist/operating-model-explorer.html: one self-contained file with the CSS and JS inlined.
// Also regenerates docs/content-reference.md from the schemas, the generated files in the skill folder
// skills/operating-model-author/, dist/operating-model-author.zip and dist/SHA256SUMS.
// Files are written only when their content changes, so a second build changes nothing.
import { build, transform } from 'esbuild';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { unzipSync, zipSync } from 'fflate';
import { join, relative } from 'node:path';
import { schemas } from '../src/model/schemas.js';
import { contentReference } from '../src/model/reference.js';

const root = new URL('../', import.meta.url);
const read = (p) => readFileSync(new URL(p, root), 'utf8');
const bytes = (p) => readFileSync(new URL(p, root));
const writeIfChanged = (p, data) => {
  const buf = Buffer.from(data);
  if (existsSync(new URL(p, root)) && bytes(p).equals(buf)) return;
  mkdirSync(new URL('./', new URL(p, root)), { recursive: true });
  writeFileSync(new URL(p, root), buf);
};

writeIfChanged('docs/content-reference.md', contentReference(schemas));

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

writeIfChanged('dist/operating-model-explorer.html', html);
console.log(`dist/operating-model-explorer.html ${(html.length / 1024).toFixed(1)} KB`);

// The skill folder (authoring-skill spec › Installable skill package, design D8). SKILL.md is hand-written; the rest
// is generated here and committed, because Claude Code installs the plugin from the repo's files (D11).
const skill = 'skills/operating-model-author/';
const note = (src) => `<!-- Generated by npm run build from ${src}. Do not edit this copy; edit the source. -->\n\n`;
for (const [src, to] of [
  ['docs/capture-sheet.md', 'capture-sheet-format.md'],
  ['templates/capture-sheet.md', 'capture-sheet-template.md'],
  ['examples/acme-capture-sheet/capture-sheet.md', 'example-capture-sheet.md'],
  ['docs/interview-guide.md', 'interview-guide.md'],
]) writeIfChanged(`${skill}references/${to}`, note(src) + read(src));
// The example sheet's logo, so the example validates from references/ as it does from examples/.
writeIfChanged(`${skill}references/assets/logo.svg`, bytes('examples/acme-capture-sheet/assets/logo.svg'));

// The validator as one self-contained file: js-yaml, markdown-it and fflate inlined, so it needs only Node.
const validator = (
  await build({
    entryPoints: [fileURLToPath(new URL('scripts/validate.mjs', root))],
    bundle: true,
    platform: 'node',
    format: 'esm',
    minify: true,
    write: false,
    charset: 'utf8',
    legalComments: 'none',
    banner: { js: `// Generated by npm run build from scripts/validate.mjs (Operating Model Explorer ${version}). Do not edit.\n// Usage: node validate.mjs <capture-sheet.md | content folder | .zip>` },
    define: { OM_VERSION: JSON.stringify(version) },
  })
).outputFiles[0].text;
writeIfChanged(`${skill}scripts/validate.mjs`, validator);
// The matching engine, byte for byte (no note: it must equal the standalone engine attached to a release).
writeIfChanged(`${skill}engine/operating-model-explorer.html`, html);

// dist/operating-model-author.zip: the skill folder under operating-model-author/, in a fixed order and with a
// fixed date, so the same sources always give the same zip and checksum.
const skillDir = fileURLToPath(new URL(skill, root));
const entries = readdirSync(skillDir, { recursive: true, withFileTypes: true })
  .filter((e) => e.isFile())
  .map((e) => relative(skillDir, join(e.parentPath, e.name)).replace(/\\/g, '/'))
  .sort();
const zip = zipSync(Object.fromEntries(entries.map((p) => [`operating-model-author/${p}`, bytes(skill + p)])), { level: 9, mtime: new Date(2026, 0, 1) });
if (!Buffer.from(unzipSync(zip)['operating-model-author/engine/operating-model-explorer.html']).equals(Buffer.from(html))) {
  throw new Error('The engine inside the skill zip differs from dist/operating-model-explorer.html.');
}
writeIfChanged('dist/operating-model-author.zip', zip);
console.log(`dist/operating-model-author.zip ${(zip.length / 1024).toFixed(1)} KB (${entries.length} files)`);

// dist/SHA256SUMS for the release notes: the release assets that exist (the demo snapshot is exported by hand).
const sums = ['operating-model-author.zip', 'operating-model-explorer.html', 'acme-sample.html']
  .filter((f) => existsSync(new URL(`dist/${f}`, root)))
  .map((f) => `${createHash('sha256').update(bytes(`dist/${f}`)).digest('hex')}  ${f}\n`)
  .join('');
writeIfChanged('dist/SHA256SUMS', sums);
