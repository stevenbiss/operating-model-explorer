// Author mode (author-mode spec, design D5 and D9): load a content folder, a .zip or the bundled sample,
// show the validation report and a live preview (the real viewer), reload a kept folder, and export a snapshot.
// Nothing is sent anywhere: files are read in the browser and the snapshot is a Blob download.
import { loadModel } from '../model/load.js';
import { readDirectoryHandle, readFileList, readZip } from '../model/read.js';
import { embedJson, toSnapshot } from '../model/snapshot.js';
import { contentReference } from '../model/reference.js';
import { schemas } from '../model/schemas.js';
import { renderMarkdown } from '../model/markdown.js';
import { render } from '../viewer/app.js';
import { esc } from '../viewer/esc.js';
const count = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`;

let app;
const $ = (sel) => app.querySelector(sel);
let current = null; // { result: loadModel(), source, handle, files }

export function startAuthor(el) {
  app = el;
  document.title = 'Operating Model Explorer: author mode';
  app.innerHTML = shell();
  app.addEventListener('click', onClick);
  $('[data-testid="folder-input"]').addEventListener('change', (e) => fromInput(e.target, (f) => readFileList(f), (f) => f[0].webkitRelativePath.split('/')[0]));
  $('[data-testid="zip-input"]').addEventListener('change', (e) => fromInput(e.target, async (f) => readZip(new Uint8Array(await f[0].arrayBuffer())), (f) => f[0].name));
  document.addEventListener('dragover', onDragOver);
  document.addEventListener('dragleave', (e) => e.relatedTarget === null && app.classList.remove('dragging'));
  document.addEventListener('drop', onDrop);
}

function shell() {
  return `<div class="author">
<div class="author-bar" role="region" aria-label="Author tools"><div class="bar-in">
  <p class="author-brand"><span class="mark" aria-hidden="true"><i></i><i></i><i></i></span>Operating Model Explorer <span class="mode">Author mode</span></p>
  <div class="author-actions">
    <p class="source" data-testid="source" hidden></p>
    <button type="button" class="btn" data-act="reload" data-testid="reload" hidden>Reload</button>
    <button type="button" class="btn" data-act="start" data-testid="load-other" hidden>Load other content</button>
    <button type="button" class="btn" data-act="reference" data-testid="content-reference">Content reference</button>
    <button type="button" class="btn btn-export" data-act="export" data-testid="export" hidden>Export snapshot</button>
  </div>
</div></div>
<p class="notice" role="alert" data-testid="notice" hidden></p>

<main class="start" id="om-start" data-testid="start">
  <div class="start-in">
    <section class="start-copy" aria-labelledby="om-start-title">
      <p class="eyebrow">Author mode</p>
      <h1 id="om-start-title" tabindex="-1">Turn your content folder into a model anyone can explore</h1>
      <p class="lead">Load the Markdown files that describe your operating model. The engine checks them, shows you exactly what viewers will see, and exports one HTML file you can email or share.</p>
      <ol class="how">
        <li><span class="num" aria-hidden="true">1</span><div><strong>Load</strong> a content folder or a .zip of it</div></li>
        <li><span class="num" aria-hidden="true">2</span><div><strong>Fix</strong> anything the check reports, then reload</div></li>
        <li><span class="num" aria-hidden="true">3</span><div><strong>Export</strong> a snapshot that opens offline</div></li>
      </ol>
    </section>
    <section class="drop" aria-labelledby="om-drop-title" data-testid="drop-zone">
      <span class="drop-icon" aria-hidden="true"></span>
      <h2 id="om-drop-title">Drop a content folder or .zip here</h2>
      <p class="drop-or">or choose one</p>
      <div class="drop-actions">
        <button type="button" class="btn btn-primary btn-lg" data-act="folder" data-testid="load-folder">Load folder</button>
        <button type="button" class="btn btn-lg" data-act="zip" data-testid="load-zip">Load .zip</button>
      </div>
      <div class="drop-sample"><p>No content yet?</p><button type="button" class="btn btn-quiet" data-act="sample" data-testid="try-sample">Try the sample</button></div>
      <p class="drop-note">Files are read in this browser only. Nothing is uploaded.</p>
    </section>
  </div>
</main>

<div class="workspace" data-testid="workspace" hidden>
  <section class="report" aria-labelledby="om-report-title" data-testid="report"></section>
  <div class="preview-head" role="region" aria-labelledby="om-preview-h"><h2 id="om-preview-h">Preview</h2><p>Exactly what viewers will see. Every view and link works here, including the persona prompt.</p></div>
  <div id="om-preview" class="preview" data-testid="preview"></div>
</div>

<dialog class="sheet sheet-wide" data-testid="reference-dialog" aria-labelledby="om-ref-title">
  <div class="sheet-head"><h2 id="om-ref-title">Content reference</h2><button type="button" class="btn" data-act="close">Close</button></div>
  <div class="prose reference" data-testid="reference"></div>
</dialog>
<input type="file" webkitdirectory multiple hidden data-testid="folder-input">
<input type="file" accept=".zip,application/zip" hidden data-testid="zip-input">
<div class="vh" aria-live="polite" id="om-author-live" data-testid="author-live"></div>
</div>`;
}

// ---------- loading ----------

const say = (text) => ($('#om-author-live').textContent = text);
function notice(text) {
  const n = $('.notice');
  n.textContent = text || '';
  n.hidden = !text;
}

// read() -> [{ path, data }]. handle: a directory handle kept for Reload (Chrome and Edge).
async function load(read, source, handle = null, reload = false) {
  notice('');
  say('Reading files…');
  let files;
  try {
    files = await read();
  } catch {
    say('');
    return notice(`${source || 'That content'} could not be read. If it is a .zip, check that it opens on your computer, then try again.`);
  }
  current = { result: loadModel(files), source, handle, files: files.length };
  if (!reload) history.replaceState(null, '', '#/'); // new content opens at its overview
  show(reload);
}

function fromInput(input, read, name) {
  const list = [...input.files];
  input.value = ''; // so choosing the same file again still loads it
  if (list.length) load(() => read(list), name(list));
}

async function pickFolder() {
  // Feature-detected at call time, so a test can put an in-memory directory handle in its place.
  if (typeof window.showDirectoryPicker !== 'function') return $('[data-testid="folder-input"]').click();
  let dir;
  try {
    dir = await window.showDirectoryPicker({ mode: 'read' });
  } catch (e) {
    if (e && e.name === 'AbortError') return;
    return $('[data-testid="folder-input"]').click();
  }
  load(() => readDirectoryHandle(dir), dir.name, dir);
}

async function reload() {
  const h = current.handle;
  load(
    async () => {
      if (h.queryPermission && (await h.queryPermission({ mode: 'read' })) !== 'granted') await h.requestPermission({ mode: 'read' });
      return readDirectoryHandle(h);
    },
    current.source,
    h,
    true,
  );
}

function sampleFiles() {
  const sample = JSON.parse(document.getElementById('om-sample').textContent);
  return sample.map(({ path, b64 }) => ({ path, data: Uint8Array.from(atob(b64), (c) => c.charCodeAt(0)) }));
}

const hasFiles = (e) => e.dataTransfer && [...e.dataTransfer.types].includes('Files');
function onDragOver(e) {
  if (!hasFiles(e)) return;
  e.preventDefault();
  e.dataTransfer.dropEffect = 'copy';
  app.classList.add('dragging');
}

function onDrop(e) {
  if (!hasFiles(e)) return;
  e.preventDefault();
  app.classList.remove('dragging');
  const item = [...e.dataTransfer.items].find((i) => i.kind === 'file');
  if (!item) return;
  // Both must be taken before any await: the drop data is gone afterwards.
  const file = item.getAsFile();
  const handle = item.getAsFileSystemHandle ? item.getAsFileSystemHandle() : null;
  if (file && /\.zip$/i.test(file.name)) return load(async () => readZip(new Uint8Array(await file.arrayBuffer())), file.name);
  if (!handle) return notice('This browser cannot read a dropped folder. Use "Load folder" or "Load .zip" instead.');
  handle.then(
    (h) => (h.kind === 'directory' ? load(() => readDirectoryHandle(h), h.name, h) : notice('Drop a content folder or a .zip of one.')),
    () => notice('That folder could not be read. Use "Load folder" or "Load .zip" instead.'),
  );
}

// ---------- report, preview and export ----------

function show(reload) {
  const { result, source, handle, files } = current;
  const errors = result.messages.filter((m) => m.level === 'error');
  const warnings = result.messages.filter((m) => m.level === 'warning');
  const counts = `${count(errors.length, 'error')}, ${count(warnings.length, 'warning')}`;

  const src = $('.source');
  src.hidden = false;
  src.innerHTML = `<span class="k">Loaded</span> ${esc(source)}`;
  $('[data-act="reload"]').hidden = !handle;
  $('[data-act="start"]').hidden = false;
  const ex = $('[data-act="export"]');
  ex.hidden = false;
  ex.disabled = errors.length > 0;
  ex.textContent = errors.length ? `Fix ${count(errors.length, 'error')} to export` : 'Export snapshot';

  $('.report').innerHTML = reportHtml(errors, warnings, counts, files, source);
  $('.start').hidden = true;
  $('.workspace').hidden = false;

  const preview = $('#om-preview');
  try {
    render(toSnapshot(result.model), preview);
  } catch {
    preview.innerHTML = '<p class="note preview-note">The preview cannot be shown until the errors above are fixed.</p>';
  }
  document.title = `${(result.model.model && result.model.model.name) || 'Operating Model Explorer'}: author mode`;
  say(`${reload ? 'Reloaded' : 'Loaded'} ${source}: ${counts}.${errors.length ? '' : ' Ready to export.'}`);
  if (!reload && !document.querySelector('dialog:modal')) $('#om-report-title').focus();
}

function reportHtml(errors, warnings, counts, files, source) {
  const ready = !errors.length;
  const item = (m) => {
    const where = [m.line ? `line ${esc(m.line)}` : '', m.element ? `<span class="k">Element</span> ${esc(m.element)}` : '', m.step ? `<span class="k">Step</span> ${esc(m.step)}` : ''].filter(Boolean).join(' · ');
    return `<li class="msg msg-${esc(m.level)}" data-testid="report-message" data-level="${esc(m.level)}">
  <span class="msg-level">${m.level === 'error' ? 'Error' : 'Warning'}</span>
  <div class="msg-body"><p class="msg-where"><code>${esc(m.file)}</code>${where ? ` · ${where}` : ''}</p>
  <p class="msg-problem">${esc(m.problem)}</p>
  <p class="msg-fix"><span class="k">How to fix</span> ${esc(m.fix)}</p></div></li>`;
  };
  return `<div class="report-head">
  <div><p class="eyebrow">Check</p><h2 id="om-report-title" tabindex="-1">Validation report</h2>
  <p class="report-meta">${count(files, 'file')} read from ${esc(source)}</p></div>
  <p class="counts" data-testid="report-counts"><span class="c-err${errors.length ? ' on' : ''}">${count(errors.length, 'error')}</span><span class="vh">, </span><span class="c-warn${warnings.length ? ' on' : ''}">${count(warnings.length, 'warning')}</span></p>
</div>
<div class="status ${ready ? 'status-ready' : 'status-blocked'}" data-testid="${ready ? 'ready' : 'blocked'}">
  <span class="status-icon" aria-hidden="true">${ready ? '✓' : '!'}</span>
  <div><strong>${ready ? 'Ready to export' : `Fix ${count(errors.length, 'error')} to export`}</strong>
  <p>${ready ? (warnings.length ? "The warnings below are worth a look, but they don't stop the export." : 'No problems found. Check the preview, then export the snapshot.') : 'Errors stop the export. Warnings don\'t. Fix the files, then load or reload them.'}</p></div>
</div>
${errors.length + warnings.length ? `<ol class="msgs" data-testid="report-messages" tabindex="0" aria-label="Validation messages">${[...errors, ...warnings].map(item).join('')}</ol>` : ''}`;
}

// Design D5: a new document from the doctype, #om-style, #om-engine and a new #om-content. The live DOM
// (author UI, rendered views), the bundled sample and the validation report are never copied.
export function snapshotHtml(snap) {
  const part = (id) => document.getElementById(id).outerHTML;
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
${document.querySelector('meta[http-equiv="Content-Security-Policy"]').outerHTML}
<title>${esc(snap.model.name)}</title>
${part('om-style')}
</head>
<body>
<div id="app"><noscript><p>This operating model needs JavaScript. Open it in a current browser such as Chrome, Edge, Safari or Firefox.</p></noscript></div>
<script id="om-content" type="application/json">${embedJson(snap)}</script>
${part('om-engine')}
</body>
</html>
`;
}

function exportSnapshot() {
  const { model } = current.result;
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([snapshotHtml(toSnapshot(model, { exported: new Date().toISOString() }))], { type: 'text/html' }));
  a.download = `${model.model.id}.html`;
  a.hidden = true;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 60000);
  say(`Exported ${a.download}. Look for it in your downloads.`);
}

function onClick(e) {
  const act = e.target.closest && e.target.closest('[data-act]');
  if (!act) return;
  const a = act.dataset.act;
  if (a === 'folder') pickFolder();
  else if (a === 'zip') $('[data-testid="zip-input"]').click();
  else if (a === 'sample') load(async () => sampleFiles(), 'the sample (Acme + Globex)');
  else if (a === 'reload') reload();
  else if (a === 'export') exportSnapshot();
  else if (a === 'close') act.closest('dialog').close();
  else if (a === 'reference') {
    const ref = $('.reference');
    if (!ref.innerHTML) ref.innerHTML = renderMarkdown(contentReference(schemas).replace(/^# Content reference$|^_Generated .*$/gm, '')); // the dialog has its own title
    $('[data-testid="reference-dialog"]').showModal();
  } else if (a === 'start') {
    notice('');
    for (const x of ['.source', '[data-act="reload"]', '[data-act="start"]', '[data-act="export"]', '.workspace']) $(x).hidden = true;
    $('.start').hidden = false;
    $('#om-start-title').focus();
  }
}
