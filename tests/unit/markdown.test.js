import { test } from 'node:test';
import assert from 'node:assert/strict';
import { renderMarkdown } from '../../src/model/markdown.js';

test('headings, lists and bold are formatted', () => {
  const html = renderMarkdown('## Title\n\n- one\n- **two**');
  assert.match(html, /<h2>Title<\/h2>/);
  assert.match(html, /<li><strong>two<\/strong><\/li>/);
});

test('raw HTML is shown as text, never as markup', () => {
  const html = renderMarkdown('<script>alert(1)</script>\n\n<img src=x onerror=alert(1)> [x](javascript:alert(1))');
  assert.doesNotMatch(html, /<script|<img|href="javascript/);
  assert.match(html, /&lt;script&gt;/);
});

test('images in Markdown text are embedded as data URIs in the snapshot, and count as used files', async () => {
  const { loadModel } = await import('../../src/model/load.js');
  const { toSnapshot } = await import('../../src/model/snapshot.js');
  const { useImages } = await import('../../src/model/markdown.js');
  const { files, MODEL } = await import('./helpers.js');
  const png = new Uint8Array([137, 80, 78, 71]);
  const input = [
    ...files({
      'model.md': `${MODEL}See ![The plan](assets/plan.png)`,
      'parties/a.md': '---\nid: a\ntype: party\nname: A\n---\n![Org](./assets/org.png)',
    }),
    { path: 'assets/plan.png', data: png },
    { path: 'assets/org.png', data: png },
    { path: 'assets/unused.png', data: png },
  ];
  const { model, messages } = loadModel(input);
  assert.deepEqual(messages, []);
  const snap = toSnapshot(model);
  assert.deepEqual(Object.keys(snap.assets).sort(), ['assets/org.png', 'assets/plan.png']);
  useImages(snap.assets);
  const html = renderMarkdown(snap.model.body);
  assert.match(html, /<img src="data:image\/png;base64,[^"]+" alt="The plan">/);
  useImages({});
  assert.doesNotMatch(renderMarkdown(snap.model.body), /<img/); // not in the assets: alt text only
});

test('a missing or remote image in Markdown text is an error naming the file', async () => {
  const { loadModel } = await import('../../src/model/load.js');
  const { files, MODEL } = await import('./helpers.js');
  const msgs = loadModel(files({
    'model.md': MODEL,
    'parties/a.md': '---\nid: a\ntype: party\nname: A\n---\n![x](assets/missing.png)',
    'processes/p.md': '---\nid: p\ntype: process\nname: P\nworkstream: w\nsteps:\n  - id: s1\n    name: S\n    owner: r\n    description: "![y](https://example.com/y.png)"\n---\n',
  })).messages.filter((m) => /image/.test(m.problem));
  assert.equal(msgs.length, 2);
  assert.deepEqual([msgs[0].level, msgs[0].file, msgs[0].element], ['error', 'parties/a.md', 'a']);
  assert.match(msgs[0].problem, /"assets\/missing\.png" was not found/);
  assert.deepEqual([msgs[1].file, msgs[1].step], ['processes/p.md', 's1']);
  assert.match(msgs[1].problem, /web address/);
});
