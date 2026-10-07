// add-joint-steps test tasks 2.1–2.3 and 2.13–2.17 at the model level: validation and sheet messages, one test per
// scenario. The end-to-end versions (report, export button, swimlane) are in tests/e2e/joint-steps.spec.js.
// Also covered by the build-time tests: validate.test.js (1.1, 1.2), sheet.test.js (1.2), layout.test.js (1.3, 1.4),
// sample.test.js (1.7).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { loadModel } from '../../src/model/load.js';
import { files, readFolder, readSampleSheet, SAMPLE } from './helpers.js';

const dir = (name) => fileURLToPath(new URL(`../fixtures/${name}/`, import.meta.url));
const fixture = (name) => loadModel(readFolder(dir(name)));
const SHEET = readFileSync(`${dir('sheet-joint')}capture-sheet.md`, 'utf8');
const OWNER_CELL = '| 2 | Kick off the bid | bid manager; Solution  Architect |';
const sheetWithOwner = (owner) => {
  assert.ok(SHEET.includes(OWNER_CELL));
  return loadModel(files({ 'capture-sheet.md': SHEET.replace(OWNER_CELL, `| 2 | Kick off the bid | ${owner} |`) }));
};
// joint-basic with the Kick off the bid owner list replaced.
const folderWithOwner = (owner) => {
  const fs = readFolder(dir('joint-basic'));
  const p = fs.find((f) => f.path === 'processes/01-main-flow.md');
  const text = new TextDecoder().decode(p.data);
  assert.ok(text.includes('owner: [bid-manager, solution-architect]'));
  p.data = new TextEncoder().encode(text.replace('owner: [bid-manager, solution-architect]', `owner: ${owner}`));
  return loadModel(fs);
};
const step = (r, id = 'kick-off-the-bid') => r.model.elements['main-flow'].steps.find((s) => s.id === id);

test('Steps with several role owners › Joint step loads', () => {
  const r = sheetWithOwner('Bid manager; Solution architect');
  assert.deepEqual(r.messages, []);
  const steps = r.model.elements['main-flow'].steps;
  assert.equal(steps.filter((s) => s.name === 'Kick off the bid').length, 1, 'one step');
  const s = step(r);
  assert.deepEqual([s.joint, s.owners, s.owner], [true, ['bid-manager', 'solution-architect'], 'bid-manager']);
});

test('Steps with several role owners › Committee among joint owners', () => {
  const m = fixture('joint-invalid').messages.filter((x) => x.step === 'decide-together');
  assert.equal(m.length, 1);
  assert.equal(m[0].level, 'error');
  assert.match(m[0].problem, /"Decide together"/);
  assert.match(m[0].problem, /Joint owners must be roles/);
});

test('Steps with several role owners › Same role twice', () => {
  const r = sheetWithOwner('Bid manager; Bid manager');
  assert.equal(r.messages.length, 1);
  const [m] = r.messages;
  assert.equal(m.level, 'error');
  assert.match(m.problem, /"Kick off the bid" lists Bid manager twice/);
  // The folder form names the step and the repeated role too.
  const f = fixture('joint-invalid').messages.filter((x) => x.step === 'plan-the-bid');
  assert.equal(f.length, 1);
  assert.match(f[0].problem, /"Plan the bid" lists Bid manager twice/);
});

test('Sample joint step › Sample joint step loads', () => {
  for (const [form, r] of [['folder', loadModel(readFolder(SAMPLE))], ['sheet', loadModel(readSampleSheet())]]) {
    assert.deepEqual(r.messages, [], `${form}: 0 errors and 0 warnings`);
    const s = Object.values(r.model.elements).filter((e) => e.type === 'process').flatMap((p) => p.steps).find((x) => x.name === 'Kick off the bid');
    assert.ok(s, `${form}: has Kick off the bid`);
    assert.deepEqual([s.joint, s.owners], [true, ['bid-manager', 'solution-architect']], form);
  }
});

test('Several owners on a step › Owner list in a file', () => {
  const r = fixture('joint-basic');
  assert.deepEqual(r.messages, []);
  assert.deepEqual([step(r).joint, step(r).owners], [true, ['bid-manager', 'solution-architect']]);
});

test('Several owners on a step › Unknown role in an owner list', () => {
  const r = folderWithOwner('[bid-manager, sol-arch]');
  const errs = r.messages.filter((m) => m.level === 'error');
  assert.equal(errs.length, 1);
  const [m] = errs;
  assert.equal(m.step, 'kick-off-the-bid');
  assert.match(`${m.problem}`, /"sol-arch"/);
  assert.equal(m.fix, 'Did you mean solution-architect?');
});

test('Several owners in the Owner cell › Joint owners in a sheet', () => {
  const r = loadModel(readFolder(dir('sheet-joint')));
  assert.equal(SHEET.includes(OWNER_CELL), true, 'the fixture uses `bid manager; Solution  Architect`');
  assert.deepEqual(r.messages, []);
  assert.deepEqual([step(r).joint, step(r).owners], [true, ['bid-manager', 'solution-architect']]);
});

test('Several owners in the Owner cell › Unknown name in the Owner list', () => {
  const r = sheetWithOwner('Bid manager; Sol architect');
  const errs = r.messages.filter((m) => m.level === 'error');
  assert.equal(errs.length, 1);
  const [m] = errs;
  assert.match(m.where, /^Process: Main flow › row 2/);
  assert.match(m.problem, /"Sol architect"/);
  assert.equal(m.fix, 'Did you mean Solution architect?');
});
