import { test } from 'node:test';
import assert from 'node:assert/strict';
import { zipSync } from 'fflate';
import { loadModel } from '../../src/model/load.js';
import { readDirectoryHandle, readZip } from '../../src/model/read.js';
import { readFolder, readSampleSheet, SAMPLE } from './helpers.js';
import { PRIVATE_NAMES } from '../private-names.js';

const files = readFolder(SAMPLE);
const { model, messages } = loadModel(files);
const el = model.elements;
const allSteps = model.order.process.flatMap((p) => el[p].steps);

test('the sample loads with 0 errors and 0 warnings', () => {
  assert.deepEqual(messages, []);
});

test('the sample has every element type', () => {
  assert.equal(model.model.id, 'acme-sample');
  assert.ok(model.theme);
  for (const t of ['party', 'team', 'role', 'committee', 'persona', 'workstream', 'process', 'structure']) assert.ok(model.order[t].length, t);
  assert.ok(allSteps.length);
  assert.equal(model.order.party.length, 2);
  assert.ok(model.order.role.length >= 6);
});

test('the sample has 3 personas with different entry points', () => {
  const entries = model.order.persona.map((p) => el[p].entry.view);
  assert.equal(entries.length, 3);
  assert.equal(new Set(entries).size, 3);
});

test('the sample has one detailed workstream with 2 processes and one outline workstream', () => {
  const ws = model.order.workstream.map((w) => el[w]);
  assert.deepEqual(ws.map((w) => w.detail), ['detailed', 'outline']);
  assert.equal(ws[0].processes.length, 2);
  assert.equal(ws[1].processes.length, 0);
});

test('the sample has a decision with two labelled branches and a rework loop', () => {
  assert.ok(allSteps.some((s) => s.next.length === 2 && s.next.every((n) => n.label)));
  const back = model.order.process.some((p) => {
    const ids = el[p].steps.map((s) => s.id);
    return el[p].edges.some((e) => ids.indexOf(e.to) < ids.indexOf(e.from));
  });
  assert.ok(back, 'a back-edge');
});

test('2.34 the sample diagrams: a main one and a related one, covering every structure feature', () => {
  const st = model.order.structure.map((id) => el[id]);
  const main = st.filter((s) => s.main);
  assert.equal(main.length, 1);
  assert.ok(main[0].relatedAll.length, 'a related diagram');
  const all = (f) => st.some(f);
  assert.ok(all((s) => s.bands.some((b) => b.bands.length)), 'sub-bands');
  assert.ok(all((s) => s.rows.some((r) => r.opens && el[r.opens])), 'a band that opens another diagram');
  assert.ok(all((s) => s.boxes.some((b) => b.team)), 'a team box');
  assert.ok(all((s) => s.boxes.some((b) => b.name && b.note)), 'a box with name and note text');
  assert.ok(all((s) => s.lines.some((l) => l.label)), 'a labelled line');
  assert.ok(all((s) => s.workstreams.length), 'a related workstream');
  assert.ok(all((s) => s.boxes.some((b) => b.change)), 'a box with a change');
});

test('the sample has change data: new, changed and removed, each with today', () => {
  const changes = [...allSteps, ...Object.values(el)].filter((x) => x.change);
  for (const status of ['new', 'changed', 'removed']) assert.ok(changes.some((c) => c.change.status === status && c.change.today), status);
});

test('the sample theme is labels only (theme colours, fonts and logo are retired)', () => {
  assert.deepEqual(model.theme, { type: 'theme', labels: { workstream: 'Value stream', workstreams: 'Value streams' } });
});

test('steps are resolved to owner, lane and party, and edges are precomputed (D4)', () => {
  const q = el['qualify-opportunity'];
  const assess = q.steps.find((s) => s.id === 'assess-fit');
  assert.deepEqual([assess.process, assess.lane, assess.party], ['qualify-opportunity', 'solution-architect', 'globex']);
  assert.deepEqual(q.steps[0].next, [{ to: 'assess-fit' }], 'default next is the following step');
  assert.deepEqual(q.steps.find((s) => s.id === 'decline').next, [], 'next: [] ends the flow');
  const e = q.edges.find((x) => x.from === 'capture-lead');
  assert.deepEqual([e.handoff, e.crossParty], [true, true]);
  // Out of the bid board (Acme and Globex members) into an Acme step: a cross-party handoff.
  const out = q.edges.find((x) => x.from === 'go-no-go' && x.to === 'decline');
  assert.deepEqual([out.label, out.handoff, out.crossParty], ['No go', true, true]);
  const same = el['build-proposal'].edges.find((x) => x.from === 'review-proposal' && x.to === 'submit-proposal');
  assert.deepEqual([same.label, same.handoff, same.crossParty], ['Approved, ready to submit', false, false]);
  assert.ok(q.body.includes('## Why this matters'), 'body kept as raw Markdown');
});

test('loading a .zip of the folder gives the same model', () => {
  const zip = zipSync(Object.fromEntries(files.map((f) => [`acme-sample/${f.path}`, f.data])));
  const fromZip = loadModel(readZip(zip));
  assert.deepEqual(fromZip.messages, []);
  const plain = (m) => JSON.parse(JSON.stringify({ ...m, assets: Object.keys(m.assets) }));
  assert.deepEqual(plain(fromZip.model), plain(model));
});

// In-memory stand-in for a FileSystemDirectoryHandle (showDirectoryPicker can't be automated; see design D9).
function fakeDir(list, prefix = '') {
  const names = new Set(list.filter((f) => f.path.startsWith(prefix)).map((f) => f.path.slice(prefix.length).split('/')[0]));
  return {
    kind: 'directory',
    async *entries() {
      for (const name of names) {
        const file = list.find((f) => f.path === prefix + name);
        yield [name, file ? { kind: 'file', getFile: async () => new Blob([file.data]) } : fakeDir(list, `${prefix}${name}/`)];
      }
    },
  };
}

test('a folder handle is read, and re-reading it picks up edits (Reload)', async () => {
  const list = files.map((f) => ({ ...f }));
  const dir = fakeDir(list);
  assert.deepEqual(loadModel(await readDirectoryHandle(dir)).messages, []);
  const role = list.find((f) => f.path === 'roles/account-lead.md');
  role.data = new TextEncoder().encode(new TextDecoder().decode(role.data).replace('name: Account lead', 'name: Client lead'));
  assert.equal(loadModel(await readDirectoryHandle(dir)).model.elements['account-lead'].name, 'Client lead');
});

test('the sample contains no real company names', () => {
  const text = files.map((f) => new TextDecoder().decode(f.data)).join('\n');
  if (PRIVATE_NAMES) assert.doesNotMatch(text, PRIVATE_NAMES);
});

test('1.7 both sample forms make Kick off the bid a joint step of Bid manager and Solution architect, with 0 messages', () => {
  for (const r of [loadModel(readSampleSheet()), loadModel(files)]) {
    assert.deepEqual(r.messages, []);
    const s = r.model.order.process.flatMap((p) => r.model.elements[p].steps).find((x) => x.name === 'Kick off the bid');
    assert.deepEqual([s.owners, s.joint, s.raci], [['bid-manager', 'solution-architect'], true, { 'solution-architect': 'R', 'bid-manager': 'A', 'delivery-manager': 'I' }]);
  }
});
