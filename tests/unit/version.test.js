// One version across the bundle (authoring-skill spec › Versions match, design D11). package.json is the source.
// SKILL.md and plugin.json are checked once they exist.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const at = (p) => new URL(p, new URL('../../', import.meta.url));
const read = (p) => readFileSync(at(p), 'utf8');
const { version } = JSON.parse(read('package.json'));

test('2.48 versions match: the built engine, the validator, SKILL.md and plugin.json carry package.json\'s version', (t) => {
  const header = spawnSync(process.execPath, ['scripts/validate.mjs'], { cwd: fileURLToPath(at('./')), encoding: 'utf8' }).stdout.split('\n')[0];
  assert.equal(header, `Operating Model Explorer validator ${version}`);

  if (existsSync(at('skills/operating-model-author/SKILL.md'))) assert.match(read('skills/operating-model-author/SKILL.md'), new RegExp(`^Version: ${version.replace(/\./g, '\\.')}$`, 'm'));
  if (existsSync(at('.claude-plugin/plugin.json'))) assert.equal(JSON.parse(read('.claude-plugin/plugin.json')).version, version);

  if (!existsSync(at('dist/operating-model-explorer.html'))) return t.skip('the engine is checked after npm run build');
  const shown = [...read('dist/operating-model-explorer.html').matchAll(/Engine (\d+\.\d+\.\d+\S*?)</g)].map((m) => m[1]);
  assert.equal(shown.length, 2, 'the version is shown in author mode and in the snapshot footer');
  assert.deepEqual([...new Set(shown)], [version], 'rebuild after changing package.json');
});
