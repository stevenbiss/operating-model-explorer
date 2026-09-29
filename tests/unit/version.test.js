// One version across the bundle (authoring-skill spec › Versions match, design D11). package.json is the source.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const at = (p) => new URL(p, new URL('../../', import.meta.url));
const read = (p) => readFileSync(at(p), 'utf8');
const { version } = JSON.parse(read('package.json'));
const header = (script) => spawnSync(process.execPath, [script], { cwd: fileURLToPath(at('./')), encoding: 'utf8' }).stdout.split('\n')[0];
const engineVersions = (p) => [...read(p).matchAll(/Engine (\d+\.\d+\.\d+\S*?)</g)].map((m) => m[1]);

test('2.48 versions match: plugin.json, SKILL.md, both validators and both engines carry package.json\'s version', (t) => {
  assert.equal(header('scripts/validate.mjs'), `Operating Model Explorer validator ${version}`);
  assert.equal(header('skills/operating-model-author/scripts/validate.mjs'), `Operating Model Explorer validator ${version}`, 'the bundled validator: rebuild');
  assert.match(read('skills/operating-model-author/SKILL.md'), new RegExp(`^Version: ${version.replace(/\./g, '\.')}$`, 'm'));
  assert.equal(JSON.parse(read('.claude-plugin/plugin.json')).version, version);

  // The skill's engine copy is committed, so it is always there; the standalone engine only after a build.
  for (const p of ['skills/operating-model-author/engine/operating-model-explorer.html', 'dist/operating-model-explorer.html']) {
    if (!existsSync(at(p))) {
      t.diagnostic(`${p} is checked after npm run build`);
      continue;
    }
    const shown = engineVersions(p);
    assert.equal(shown.length, 2, `${p}: the version is shown in author mode and in the snapshot footer`);
    assert.deepEqual([...new Set(shown)], [version], `${p}: rebuild after changing package.json`);
  }
});
