import { test } from 'node:test';
import assert from 'node:assert/strict';
import { zipSync } from 'fflate';
import { loadModel } from '../../src/model/load.js';
import { readDirectoryHandle, readZip } from '../../src/model/read.js';
import { readFolder, SAMPLE } from './helpers.js';
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
  for (const t of ['party', 'team', 'role', 'persona', 'workstream', 'process']) assert.ok(model.order[t].length, t);
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

test('the sample has change data: new, changed and removed, each with today', () => {
  const changes = [...allSteps, ...Object.values(el)].filter((x) => x.change);
  for (const status of ['new', 'changed', 'removed']) assert.ok(changes.some((c) => c.change.status === status && c.change.today), status);
});

test('the sample theme has a logo in assets/ and label overrides', () => {
  assert.ok(model.assets[model.theme.logo]);
  assert.equal(model.theme.labels.workstream, 'Value stream');
});

test('steps are resolved to owner, lane and party, and edges are precomputed (D4)', () => {
  const q = el['qualify-opportunity'];
  const assess = q.steps.find((s) => s.id === 'assess-fit');
  assert.deepEqual([assess.process, assess.lane, assess.party], ['qualify-opportunity', 'solution-architect', 'globex']);
  assert.deepEqual(q.steps[0].next, [{ to: 'assess-fit' }], 'default next is the following step');
  assert.deepEqual(q.steps.find((s) => s.id === 'decline').next, [], 'next: [] ends the flow');
  const e = q.edges.find((x) => x.from === 'capture-lead');
  assert.deepEqual([e.handoff, e.crossParty], [true, true]);
  const same = q.edges.find((x) => x.from === 'go-no-go' && x.to === 'decline');
  assert.deepEqual([same.label, same.handoff, same.crossParty], ['No go', false, false]);
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
