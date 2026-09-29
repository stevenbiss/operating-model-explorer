// npm run validate (content-schema spec › Command-line validation, design D7): scripts/validate.mjs run as a process.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { zipSync } from 'fflate';
import { readSampleSheet } from './helpers.js';

const ROOT = fileURLToPath(new URL('../../', import.meta.url));
const { version } = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8'));
const run = (path) => {
  const r = spawnSync(process.execPath, ['scripts/validate.mjs', path], { cwd: ROOT, encoding: 'utf8' });
  return { code: r.status, out: r.stdout, last: r.stdout.trim().split('\n').at(-1) };
};

test('2.45 clean sheet: prints "0 errors, 0 warnings" and exits 0', () => {
  const r = run('examples/acme-capture-sheet/capture-sheet.md');
  assert.equal(r.last, '0 errors, 0 warnings');
  assert.equal(r.code, 0);
  assert.match(r.out, new RegExp(`^Operating Model Explorer validator ${version.replace(/\./g, '\\.')}$`, 'm'));
});

test('2.46 errors fail the command: level, location, problem and "Did you mean …?", exit 1', () => {
  const r = run('tests/fixtures/sheet-unknown-owner/capture-sheet.md');
  assert.equal(r.code, 1);
  assert.match(r.out, /^Errors \(1\)$/m);
  assert.match(r.out, /error · Process: Build the proposal › row 2/);
  assert.match(r.out, /Problem: The owner "Sol architect" does not match any role\./);
  assert.match(r.out, /Fix: Did you mean Solution architect\?/);
  assert.equal(r.last, '1 error, 0 warnings');
});

test('a content folder, a folder error fixture and a .zip', () => {
  assert.deepEqual([run('examples/acme-sample').last, run('examples/acme-sample').code], ['0 errors, 0 warnings', 0]);
  const bad = run('tests/fixtures/unknown-owner');
  assert.equal(bad.code, 1);
  assert.match(bad.out, /error · processes\/01-flow\.md · element flow · step design\n {4}Problem: .*sol-arch.*\n {4}Fix: Did you mean solution-architect\?/);
  const zip = join(mkdtempSync(join(tmpdir(), 'om-validate-')), 'sheet.zip');
  writeFileSync(zip, zipSync(Object.fromEntries(readSampleSheet().map((f) => [`acme/${f.path}`, f.data]))));
  assert.deepEqual([run(zip).last, run(zip).code], ['0 errors, 0 warnings', 0]);
});

test('open questions are reported as warnings and do not fail the command', () => {
  const r = run('tests/fixtures/sheet-open-questions/capture-sheet.md');
  assert.equal(r.code, 0);
  assert.equal(r.last, '0 errors, 3 warnings');
  assert.equal(r.out.match(/warning · Open questions › item \d/g).length, 3);
  assert.match(r.out, /Open question: Does the zebra committee approve pricing before submission\?/);
  assert.doesNotMatch(r.out, /walrus/, 'ticked questions are ignored');
});

test('a missing or unreadable path says so and exits 1', () => {
  assert.equal(run('no/such/path.md').code, 1);
  assert.match(run('no/such/path.md').out, /could not be read/);
});
