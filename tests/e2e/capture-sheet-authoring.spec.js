// Change add-capture-sheet-authoring, Test tasks 2.1–2.18, 2.31–2.44, 2.49, 2.53 to 2.55, on
// dist/operating-model-explorer.html via file:// and on snapshots exported through the real Export button.
// Existing tests that still cover this change: 2.32 = author-mode.spec.js "2.48 author-mode › Load a zip",
// 2.33 = "2.49 author-mode › Load the bundled sample", 2.37 = "2.54 author-mode › Unused file excluded".
// Node tests: 2.19–2.21 and 2.50 in tests/unit/skill.test.js, 2.45–2.46 in validate-cli.test.js, 2.48 in version.test.js.
//
// "Load capture sheet" reads one file, so a sheet with a logo reports the missing asset when loaded alone. Where the
// scenario needs 0 errors, the Acme sheet is loaded as its folder (or a zip with assets/); single-file loads use
// tests/fixtures/sheet-tiny, which has no logo.
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join } from 'node:path';
import { zipSync } from 'fflate';
import { test, expect, openEngine, loadZip, loadFolder, skipPrompt, go, messages, fixtureDir, useSnapshot, openSnapshot, noHorizontalScroll, SAMPLE_SHEET, SAMPLE_SHEET_DIR } from './helpers.js';

const text = (p) => readFileSync(p, 'utf8');
const BASE = text(join(fixtureDir('sheet-tiny'), 'capture-sheet.md'));
const ACME = text(SAMPLE_SHEET);
const QUESTIONS = text(join(fixtureDir('sheet-open-questions'), 'capture-sheet.md'));
const LOGO = new Uint8Array(readFileSync(join(SAMPLE_SHEET_DIR, 'assets', 'logo.svg')));
const { version } = JSON.parse(text(new URL('../../package.json', import.meta.url)));
const AXE = readFileSync(createRequire(import.meta.url).resolve('axe-core/axe.min.js'), 'utf8');

// Replace text in a fixture, failing loudly if the fixture no longer has it (so a variant can't silently equal the base).
const edit = (src, from, to) => {
  expect(src.includes(from), `fixture contains ${JSON.stringify(from)}`).toBe(true);
  return src.replace(from, to);
};

// "Load capture sheet" and the single-file chooser it opens.
async function loadSheet(page, sheet, name = 'capture-sheet.md') {
  const chooser = page.waitForEvent('filechooser');
  await page.getByRole('button', { name: 'Load capture sheet' }).click();
  await (await chooser).setFiles(typeof sheet === 'string' && sheet.endsWith('.md') && !sheet.includes('\n') ? sheet : { name, mimeType: 'text/markdown', buffer: Buffer.from(sheet) });
  await expect(page.getByTestId('report')).toBeVisible();
}

// A sheet text plus the Acme assets/ folder, through "Load .zip".
async function loadSheetZip(page, sheet, name = 'acme-capture-sheet') {
  const buffer = Buffer.from(zipSync({ [`${name}/capture-sheet.md`]: new TextEncoder().encode(sheet), [`${name}/assets/logo.svg`]: LOGO }));
  const chooser = page.waitForEvent('filechooser');
  await page.getByRole('button', { name: 'Load .zip' }).click();
  await (await chooser).setFiles({ name: `${name}.zip`, mimeType: 'application/zip', buffer });
  await expect(page.getByTestId('report')).toBeVisible();
}

const loadAcmeFolder = (page) => loadFolder(page, 'acme-capture-sheet');
const pv = (page) => page.getByTestId('preview');
const counts = (page) => page.getByTestId('report-counts');
const msg = (page, hasText) => messages(page).filter({ hasText });

async function exportDownload(page, dir) {
  const dl = page.waitForEvent('download');
  await page.getByTestId('export').click();
  const d = await dl;
  const path = join(dir, d.suggestedFilename());
  await d.saveAs(path);
  return { path, name: d.suggestedFilename(), html: readFileSync(path, 'utf8') };
}
const contentOf = (html) => JSON.parse(html.match(/<script id="om-content" type="application\/json">([\s\S]*?)<\/script>/)[1]);

async function axe(page, where) {
  await page.evaluate(AXE);
  const result = await page.evaluate(() => window.axe.run(document, { resultTypes: ['violations'] }));
  return result.violations
    .filter((v) => ['serious', 'critical'].includes(v.impact) || v.id === 'region')
    .map((v) => `${where}: ${v.id} (${v.impact}) ${v.help} -> ${v.nodes.slice(0, 5).map((n) => n.target.join(' ')).join(' | ')}`);
}

// ---------------------------------------------------------------------------------------------------------------
test.describe('capture-sheet (author mode)', () => {
  test.beforeEach(async ({ page }) => openEngine(page));

  test('2.1 capture-sheet › Acme capture sheet loads cleanly', async ({ page }) => {
    await loadAcmeFolder(page);
    await expect(counts(page)).toHaveText('0 errors, 0 warnings');
    await expect(messages(page)).toHaveCount(0);
    await expect(page.getByTestId('ready')).toContainText('Ready to export');
    await skipPrompt(page);
    await expect(pv(page).getByTestId('model-name')).toHaveText('Acme + Globex partnership');
  });

  test('2.2 capture-sheet › Missing required section', async ({ page }) => {
    await loadSheet(page, edit(BASE, BASE.slice(BASE.indexOf('## Roles'), BASE.indexOf('## Workstreams')), ''));
    const m = msg(page, 'no "Roles" section');
    await expect(m).toHaveCount(1);
    await expect(m).toHaveAttribute('data-level', 'error');
    await expect(m.locator('.msg-fix')).toContainText('## Roles');
    await expect(page.getByTestId('export')).toBeDisabled();
  });

  test('2.3 capture-sheet › Missing required column', async ({ page }) => {
    let s = edit(BASE, '| Role | Party | Summary |\n|---|---|---|', '| Role | Summary |\n|---|---|');
    for (const [r, p] of [['Account lead', 'Acme Corp'], ['Solution architect', 'Globex'], ['Legal counsel', 'Acme Corp']]) s = edit(s, `| ${r} | ${p} |`, `| ${r} |`);
    await loadSheet(page, s);
    await expect(counts(page)).toContainText('1 error');
    const m = msg(page, 'Party');
    await expect(m).toHaveCount(1);
    await expect(m).toHaveAttribute('data-level', 'error');
    await expect(m.locator('.msg-where')).toHaveText('Roles');
    await expect(m.locator('.msg-problem')).toHaveText('The Roles table has no "Party" column.');
  });

  test('2.4 capture-sheet › Columns in a different order', async ({ page }, info) => {
    const reordered = edit(
      BASE,
      '| Role | Party | Summary |\n|---|---|---|\n| Account lead | Acme Corp | Owns the client. |\n| Solution architect | Globex | Designs it. |\n| Legal counsel | Acme Corp | Checks terms. |',
      '| Summary | Party | Role |\n|---|---|---|\n| Owns the client. | Acme Corp | Account lead |\n| Designs it. | Globex | Solution architect |\n| Checks terms. | Acme Corp | Legal counsel |',
    );
    const capture = async (sheet, dir) => {
      await openEngine(page);
      // Start each load from the same state: the viewer remembers explored processes in browser storage.
      await page.evaluate(() => { localStorage.clear(); sessionStorage.clear(); });
      await openEngine(page);
      await loadSheet(page, sheet);
      await skipPrompt(page);
      const out = { counts: await counts(page).textContent(), report: await page.getByTestId('report').innerText(), views: [] };
      for (const h of ['#/', '#/r/account-lead', '#/r/solution-architect', '#/r/legal-counsel', '#/p/build-the-proposal']) {
        await go(page, h);
        await expect(pv(page).locator('main h1')).toBeVisible();
        out.views.push(await pv(page).innerText());
      }
      const { exported, ...content } = contentOf((await exportDownload(page, dir)).html);
      out.content = content;
      return out;
    };
    const original = await capture(BASE, info.outputPath('original'));
    const other = await capture(reordered, info.outputPath('reordered'));
    expect(original.counts).toBe('0 errors, 0 warnings');
    expect(other.report).toBe(original.report);
    expect(other.views).toEqual(original.views);
    expect(other.content).toEqual(original.content);
  });

  test('2.5 capture-sheet › Owner written with different case', async ({ page }) => {
    await loadSheet(page, edit(BASE, '| 2 | Design the solution | Solution architect |', '| 2 | Design the solution | solution  Architect |'));
    await expect(counts(page)).toHaveText('0 errors, 0 warnings');
    await expect(messages(page)).toHaveCount(0);
    await skipPrompt(page);
    await go(page, '#/p/build-the-proposal/s/design-the-solution');
    await expect(pv(page).getByTestId('step-detail').locator('.owner')).toContainText('Owner Solution architect');
  });

  test('2.6 capture-sheet › Unknown name with a suggestion', async ({ page }) => {
    await loadSheet(page, edit(BASE, '| 2 | Design the solution | Solution architect |', '| 2 | Design the solution | Sol architect |'));
    const m = msg(page, 'Sol architect');
    await expect(m).toHaveCount(1);
    await expect(m).toHaveAttribute('data-level', 'error');
    await expect(m.locator('.msg-where')).toContainText('Process: Build the proposal');
    await expect(m.locator('.msg-where')).toContainText('row 2 (Design the solution)');
    await expect(m.locator('.msg-fix')).toContainText('Did you mean Solution architect?');
  });

  test('2.7 capture-sheet › Decision with labelled branches', async ({ page }) => {
    await loadSheet(page, edit(BASE, '| Approved: 4; Needs rework: 5 |', '| Go: 4; No go: 5 |'));
    await expect(counts(page)).toContainText('0 errors');
    await skipPrompt(page);
    await go(page, '#/p/build-the-proposal');
    const svg = pv(page).locator('svg.swimlane').first();
    const edges = svg.locator('path.edge[data-from="review-the-proposal"]');
    await expect(edges).toHaveCount(2);
    expect((await edges.evaluateAll((es) => es.map((e) => e.dataset.to))).sort()).toEqual(['rework-the-proposal', 'submit-the-proposal']);
    expect((await svg.locator('.edge-label').allTextContents()).sort()).toEqual(['Go', 'No go']);
    // Which label leads where: the step detail's Next links carry the branch label and the target step.
    await go(page, '#/p/build-the-proposal/s/review-the-proposal');
    const next = pv(page).getByTestId('step-detail').getByTestId('step-next');
    await expect(next).toHaveCount(2);
    await expect(next.and(pv(page).locator('[data-to="submit-the-proposal"]'))).toContainText('Next · Go');
    await expect(next.and(pv(page).locator('[data-to="rework-the-proposal"]'))).toContainText('Next · No go');
  });

  test('2.8 capture-sheet › Next points at a missing step', async ({ page }) => {
    await loadSheet(page, edit(BASE, '| 5 | Rework the proposal | Solution architect | 3 |', '| 5 | Rework the proposal | Solution architect | 9 |'));
    const m = msg(page, 'step 9');
    await expect(m).toHaveCount(1);
    await expect(m).toHaveAttribute('data-level', 'error');
    await expect(m.locator('.msg-where')).toContainText('Process: Build the proposal');
    await expect(m.locator('.msg-where')).toContainText('row 5');
  });

  test('2.9 capture-sheet › Matrix becomes RACI', async ({ page }) => {
    await loadAcmeFolder(page);
    await skipPrompt(page);
    await go(page, '#/p/build-the-proposal/s/submit-the-proposal');
    const detail = pv(page).getByTestId('step-detail');
    await expect(detail.locator('h2')).toHaveText('Submit the proposal');
    await expect(detail.locator('.raci-table tr', { hasText: 'Legal counsel' })).toContainText('Consulted');
  });

  test('2.10 capture-sheet › Combined letters rejected', async ({ page }) => {
    await loadSheetZip(page, edit(ACME, '| 1 | A | | | | |', '| 1 | A/R | | | | |'));
    await expect(counts(page)).toContainText('1 error');
    const m = msg(page, 'A/R');
    await expect(m).toHaveCount(1);
    await expect(m).toHaveAttribute('data-level', 'error');
    await expect(m).toContainText('Capture the lead');
    await expect(m.locator('.msg-problem')).toContainText('Account lead');
    await expect(m.locator('.msg-fix')).toContainText('R if Account lead does the work');
    await expect(m.locator('.msg-fix')).toContainText('A if Account lead signs the work off');
    await expect(page.getByTestId('export')).toBeDisabled();
  });

  test('2.12 capture-sheet › Theme from the sheet', async ({ page }) => {
    await loadAcmeFolder(page);
    await expect(counts(page)).toHaveText('0 errors, 0 warnings');
    await skipPrompt(page);
    expect(await pv(page).locator('.topbar').evaluate((el) => getComputedStyle(el).backgroundColor)).toBe('rgb(11, 31, 77)');
    const logo = pv(page).getByTestId('logo');
    await expect(logo).toBeVisible();
    expect(await logo.evaluate((img) => img.complete && img.naturalWidth > 0), 'logo image decoded').toBe(true);
    await expect(pv(page).locator('#om-ws-h')).toHaveText('Value streams');
    await go(page, '#/w/presales');
    await expect(pv(page).locator('main .eyebrow').first()).toHaveText('Value stream');
    expect(await pv(page).innerText()).not.toMatch(/workstream/i);
  });

  test('2.13 capture-sheet › Notes for a workstream', async ({ page }) => {
    await loadAcmeFolder(page);
    await skipPrompt(page);
    await go(page, '#/w/presales');
    await expect(pv(page).locator('main h1')).toHaveText('Presales');
    await expect(pv(page).locator('main')).toContainText('Presales is where the partnership is won or lost. Both parties work from one bid plan.');
    await expect(pv(page).locator('main strong', { hasText: 'won or lost' })).toBeVisible();
  });

  test('2.14 capture-sheet › Open questions become warnings', async ({ page }) => {
    await loadSheet(page, edit(QUESTIONS, '- [ ] Who owns the tangerine budget after go-live?\n', ''));
    await expect(counts(page)).toHaveText('0 errors, 2 warnings');
    const q = page.locator('[data-testid="report-message"][data-open-question]');
    await expect(q).toHaveCount(2);
    await expect(q.nth(0)).toContainText('Does the zebra committee approve pricing before submission?');
    await expect(q.nth(1)).toContainText('Is Legal counsel consulted on every bid, or only large ones?');
    for (const item of await q.all()) await expect(item).toHaveAttribute('data-level', 'warning');
    await expect(page.getByTestId('report')).not.toContainText('walrus');
    await expect(page.getByTestId('export')).toBeEnabled();
  });

  test('2.16 capture-sheet › Location in the message', async ({ page }) => {
    await loadSheet(page, join(fixtureDir('sheet-unknown-owner'), 'capture-sheet.md'));
    await expect(messages(page)).toHaveCount(1);
    const where = messages(page).locator('.msg-where');
    await expect(where).toContainText('Process: Build the proposal');
    await expect(where).toContainText('row 2');
    await expect(where).not.toContainText('.md');
  });

  test('2.18 capture-sheet › Blank template loads', async ({ page }) => {
    const template = text(join(SAMPLE_SHEET_DIR, '..', '..', 'templates', 'capture-sheet.md'));
    await loadSheet(page, template, 'capture-sheet.md');
    await expect(page.getByTestId('blocked')).toBeVisible();
    for (const t of ['The Parties table has no parties yet.', 'The Roles table has no roles yet.', 'The Purpose section is empty.', 'The Key messages section has no messages.']) {
      await expect(msg(page, t), t).toHaveCount(1);
      await expect(msg(page, t)).toHaveAttribute('data-level', 'error');
    }
    await expect(page.getByTestId('export')).toBeDisabled();
    // No guidance comment reaches the preview (as text or markup).
    const comments = [...template.matchAll(/<!--([\s\S]*?)-->/g)].map((m) => m[1].trim().split(/\s+/).slice(0, 6).join(' '));
    expect(comments.length).toBeGreaterThan(5);
    const [previewText, previewHtml] = [await pv(page).innerText(), await pv(page).innerHTML()];
    for (const c of comments) {
      expect(previewText.replace(/\s+/g, ' '), c).not.toContain(c);
      expect(previewHtml.replace(/\s+/g, ' '), c).not.toContain(c);
    }
    expect(previewHtml).not.toContain('<!--');
  });

  test('2.53 capture-sheet › Newer format', async ({ page }) => {
    await loadSheet(page, edit(BASE, 'Format: 1', 'Format: 99'));
    await expect(counts(page)).toContainText('1 error');
    const m = msg(page, 'format 99');
    await expect(m).toHaveAttribute('data-level', 'error');
    await expect(m.locator('.msg-problem')).toContainText('this engine reads formats up to 1');
    await expect(m.locator('.msg-fix')).toContainText('newer version of the engine');
    await expect(page.getByTestId('export')).toBeDisabled();
  });

  test('2.54 capture-sheet › Missing format line', async ({ page }) => {
    await loadSheet(page, edit(BASE, 'Format: 1\n', ''));
    await expect(counts(page)).toHaveText('0 errors, 1 warning');
    const m = msg(page, 'Format:');
    await expect(m).toHaveAttribute('data-level', 'warning');
    await expect(m.locator('.msg-problem')).toContainText('read as format 1');
    await expect(m.locator('.msg-fix')).toContainText('Add the line "Format: 1"');
    await expect(page.getByTestId('export')).toBeEnabled();
    await skipPrompt(page);
    await expect(pv(page).getByTestId('model-name')).toHaveText('Tiny partnership');
  });

  test('2.55 capture-sheet › Same name for a workstream and a process', async ({ page }) => {
    await loadSheet(page, join(fixtureDir('sheet-same-name'), 'capture-sheet.md'));
    await expect(counts(page)).toHaveText('0 errors, 0 warnings');
    await expect(page.getByTestId('export')).toBeEnabled();
    await skipPrompt(page);
    await go(page, '#/w/win-the-work');
    await expect(pv(page).locator('main h1')).toHaveText('Win the work');
    await expect(pv(page).locator('main .eyebrow').first()).toHaveText('Workstream');
    await go(page, '#/p/win-the-work-process');
    await expect(pv(page).locator('main h1')).toHaveText('Win the work');
    await expect(pv(page).locator('main .eyebrow').first()).toHaveText('Process · Win the work'); // the process, in the workstream of the same name
  });
});

// ---------------------------------------------------------------------------------------------------------------
test.describe('capture-sheet (exported Acme sheet)', () => {
  const snap = useSnapshot('acme-capture-sheet');

  test('2.11 capture-sheet › Persona starts at a process', { tag: '@mobile' }, async ({ page }) => {
    expect(snap.name).toBe('acme-sample.html');
    await openSnapshot(page, snap);
    await page.getByTestId('persona-option-acme-account-lead').click();
    await expect(page).toHaveURL(/#\/p\/qualify-an-opportunity\?persona=acme-account-lead$/);
    await expect(page.locator('main h1')).toHaveText('Qualify an opportunity');
    await expect(page.getByTestId('swimlane')).toBeVisible();
  });
});

test.describe('capture-sheet (exported sheet with open questions)', () => {
  const snap = useSnapshot('sheet-open-questions');
  const QUESTION_TEXT = ['zebra committee', 'consulted on every bid', 'tangerine budget', 'walrus'];
  const SOURCE_TEXT = ['periwinkle workshop', 'Draft RACI spreadsheet'];
  const COMMENT_TEXT = ['lighthouse keeper', 'marmalade', 'Guidance comment'];

  test('2.15 capture-sheet › Not in the snapshot', async () => {
    expect(snap.name).toBe('tiny-questions.html');
    for (const t of [...QUESTION_TEXT, ...SOURCE_TEXT]) expect(snap.html, t).not.toContain(t);
    // Nor any other encoding of it in the embedded content.
    const content = JSON.stringify(contentOf(snap.html));
    for (const t of [...QUESTION_TEXT, ...SOURCE_TEXT]) expect(content, t).not.toContain(t);
    expect(content).not.toMatch(/openQuestions|sources/);
  });

  test('2.38 author-mode › Capture-sheet working notes excluded', async ({ page }) => {
    for (const t of [...QUESTION_TEXT, ...SOURCE_TEXT, ...COMMENT_TEXT]) expect(snap.html, t).not.toContain(t);
    // The snapshot still holds the model itself.
    await openSnapshot(page, snap);
    await skipPrompt(page);
    await expect(page.getByTestId('model-name')).toHaveText('Tiny partnership');
    expect(await page.locator('body').innerText()).not.toMatch(/zebra|periwinkle|lighthouse|marmalade/);
  });
});

// ---------------------------------------------------------------------------------------------------------------
// 2.17: the same sample exported from the folder and from the sheet, compared view by view, by name (ids differ).
test.describe('capture-sheet (folder vs sheet snapshots)', () => {
  const folder = useSnapshot('acme-sample');
  const sheet = useSnapshot('acme-capture-sheet');

  async function views(page, snap) {
    const c = contentOf(snap.html);
    const E = c.elements;
    const name = (id) => (E[id] ? E[id].name : id);
    const stepName = {};
    for (const pid of c.order.process) for (const s of E[pid].steps) stepName[s.id] = s.name;
    const out = {};
    const main = async (hash) => {
      await openSnapshot(page, snap, hash);
      await expect(page.locator('main h1').first()).toBeVisible();
      return page.locator('main#om-main').innerText();
    };
    // Same starting state for both: the viewer remembers explored processes in browser storage.
    await openSnapshot(page, snap);
    await page.evaluate(() => { localStorage.clear(); sessionStorage.clear(); });
    await openSnapshot(page, snap);
    await skipPrompt(page);
    out.overview = await page.locator('main#om-main').innerText();
    for (const w of c.order.workstream) out[`workstream ${name(w)}`] = await main(`#/w/${w}`);
    for (const pid of c.order.process) for (const ch of ['', '?changes=1']) {
      out[`process ${name(pid)}${ch}`] = await main(`#/p/${pid}${ch}`);
      const svg = page.locator('svg.swimlane').first();
      out[`swimlane ${name(pid)}${ch}`] = {
        lanes: await page.locator('.lane-heads [data-testid^="lane-"]').allInnerTexts(),
        steps: (await svg.locator('[data-step]').evaluateAll((g) => g.map((n) => n.dataset.step))).map((id) => stepName[id]),
        edges: (await svg.locator('path.edge').evaluateAll((es) => es.map((e) => [e.dataset.from, e.dataset.to, e.getAttribute('class')]))).map(([f, t, cls]) => [stepName[f], stepName[t], cls]),
        labels: await svg.locator('.edge-label').allTextContents(),
      };
      if (ch) for (const s of E[pid].steps) {
        await openSnapshot(page, snap, `#/p/${pid}/s/${s.id}${ch}`);
        out[`step ${s.name}`] = await page.getByTestId('step-detail').innerText();
      }
      if (!ch) for (const per of c.order.persona) {
        await openSnapshot(page, snap, `#/p/${pid}?persona=${per}`);
        await expect(page.getByTestId('swimlane')).toBeVisible();
        out[`persona ${name(per)} on ${name(pid)}`] = {
          mine: (await page.locator('svg.swimlane [data-step].mine').evaluateAll((g) => g.map((n) => n.dataset.step))).map((id) => stepName[id]),
          dim: (await page.locator('svg.swimlane [data-step].dim').evaluateAll((g) => g.map((n) => n.dataset.step))).map((id) => stepName[id]),
          yourLanes: await page.locator('.lane-heads [data-testid^="lane-"]').filter({ hasText: 'Your lane' }).allInnerTexts(),
          labels: await page.locator('svg.swimlane [data-step]').evaluateAll((g) => g.map((n) => n.getAttribute('aria-label'))),
        };
      }
    }
    for (const per of c.order.persona) out[`me ${name(per)}`] = await main(`#/me?persona=${per}`);
    return out;
  }

  test('2.17 capture-sheet › Snapshots match', async ({ page }) => {
    test.slow();
    expect([folder.name, sheet.name]).toEqual(['acme-sample.html', 'acme-sample.html']);
    const a = await views(page, folder);
    const b = await views(page, sheet);
    expect(Object.keys(b)).toEqual(Object.keys(a));
    expect(Object.keys(a).filter((k) => k.startsWith('step ')).length).toBe(11);
    for (const k of Object.keys(a)) expect(b[k], k).toEqual(a[k]);
  });
});

// ---------------------------------------------------------------------------------------------------------------
test.describe('author-mode (capture sheets)', () => {
  test.beforeEach(async ({ page }) => openEngine(page));

  test('2.31 author-mode › First open', async ({ page }) => {
    await expect(page).toHaveTitle(/author mode/);
    for (const name of ['Load capture sheet', 'Load folder', 'Load .zip', 'Try the sample', 'Content reference']) {
      await expect(page.getByRole('button', { name, exact: true })).toBeVisible();
      await expect(page.getByRole('button', { name, exact: true })).toBeEnabled();
    }
    await expect(page.getByTestId('workspace')).toBeHidden();
  });

  test('2.34 author-mode › Load a capture sheet', async ({ page, sink }) => {
    await loadSheet(page, SAMPLE_SHEET);
    await expect(page.getByTestId('source')).toContainText('capture-sheet.md');
    await expect(page.getByTestId('report')).toContainText('1 file read');
    await expect(counts(page)).toBeVisible();
    await expect(pv(page)).toBeVisible();
    await skipPrompt(page);
    await expect(pv(page).getByTestId('model-name')).toHaveText('Acme + Globex partnership');
    expect(sink.requests).toEqual([]);
  });

  test('2.35 author-mode › Keyboard load of a capture sheet', async ({ page }) => {
    // Reference: the same sheet dropped onto the page.
    await page.evaluate((sheet) => {
      const dt = new DataTransfer();
      dt.items.add(new File([sheet], 'capture-sheet.md', { type: 'text/markdown' }));
      document.querySelector('[data-testid="drop-zone"]').dispatchEvent(new DragEvent('drop', { dataTransfer: dt, bubbles: true, cancelable: true }));
    }, BASE);
    await expect(page.getByTestId('report')).toBeVisible();
    await expect(counts(page)).toHaveText('0 errors, 0 warnings');
    await skipPrompt(page);
    const dropped = { report: await page.getByTestId('report').innerText(), preview: await pv(page).innerText(), source: await page.getByTestId('source').innerText() };

    await page.reload();
    await expect(page.getByTestId('start')).toBeVisible();
    const btn = page.getByRole('button', { name: 'Load capture sheet' });
    for (let i = 0; i < 20 && !(await btn.evaluate((b) => b === document.activeElement)); i++) await page.keyboard.press('Tab');
    await expect(btn).toBeFocused();
    await expect(btn).toBeVisible();
    const chooser = page.waitForEvent('filechooser');
    await page.keyboard.press('Enter');
    const fc = await chooser;
    expect(fc.isMultiple(), 'single-file picker').toBe(false);
    await fc.setFiles({ name: 'capture-sheet.md', mimeType: 'text/markdown', buffer: Buffer.from(BASE) });
    await expect(page.getByTestId('report')).toBeVisible();
    await skipPrompt(page);
    expect(await page.getByTestId('report').innerText()).toBe(dropped.report);
    expect(await pv(page).innerText()).toBe(dropped.preview);
    expect(await page.getByTestId('source').innerText()).toBe(dropped.source);
  });

  test('2.36 author-mode › Mixed formats rejected', async ({ page }) => {
    await loadFolder(page, 'sheet-mixed');
    const m = msg(page, 'either one capture sheet or a folder of element files');
    await expect(m).toHaveCount(1);
    await expect(m).toHaveAttribute('data-level', 'error');
    await expect(page.getByTestId('export')).toBeDisabled();
    await expect(page.getByTestId('blocked')).toBeVisible();
  });

  test('2.39 author-mode › Open questions group', async ({ page }) => {
    await loadSheet(page, join(fixtureDir('sheet-open-questions'), 'capture-sheet.md'));
    await expect(counts(page)).toHaveText('0 errors, 3 warnings');
    const group = page.getByTestId('open-questions');
    await expect(group).toBeVisible();
    await expect(group.getByRole('heading', { name: 'Open questions (3)' })).toBeVisible();
    const items = group.getByTestId('report-message');
    await expect(items).toHaveCount(3);
    for (const [i, q] of ['Does the zebra committee approve pricing before submission?', 'Is Legal counsel consulted on every bid, or only large ones?', 'Who owns the tangerine budget after go-live?'].entries()) await expect(items.nth(i)).toContainText(q);
    // Separate from other warnings: none of them is in the main message list.
    await expect(page.locator('[data-testid="report-messages"] [data-open-question]')).toHaveCount(0);
    await expect(page.getByTestId('export')).toBeEnabled();
    await expect(page.getByTestId('export')).toHaveText('Export snapshot');
  });

  test('2.40 author-mode › Report at 768px', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await loadSheet(page, join(fixtureDir('sheet-open-questions'), 'capture-sheet.md'));
    const group = page.getByTestId('open-questions');
    await expect(group).toBeVisible();
    expect(await noHorizontalScroll(page), 'page has no horizontal scroll').toBe(true);
    for (const el of [page.getByTestId('report'), group, group.locator('ol.msgs')]) {
      const box = await el.evaluate((e) => ({ sw: e.scrollWidth, cw: e.clientWidth, right: e.getBoundingClientRect().right }));
      expect(box.sw, 'no horizontal overflow inside').toBeLessThanOrEqual(box.cw);
      expect(box.right, 'inside the 768px viewport').toBeLessThanOrEqual(768);
    }
    for (const item of await group.getByTestId('report-message').all()) {
      await expect(item).toBeVisible();
      const r = await item.evaluate((e) => e.getBoundingClientRect());
      expect(r.left).toBeGreaterThanOrEqual(0);
      expect(r.right).toBeLessThanOrEqual(768);
    }
    // Readable text size.
    expect(parseFloat(await group.locator('.msg-problem').first().evaluate((e) => getComputedStyle(e).fontSize))).toBeGreaterThanOrEqual(14);
  });

  test('2.49 author-mode › Engine shows its version', async ({ page }) => {
    await expect(page.getByTestId('author-engine-version')).toBeVisible();
    await expect(page.getByTestId('author-engine-version')).toHaveText(`Engine ${version}`);
  });

  test('html-deliverable › No serious axe violations in capture-sheet states at 1280 and 768', async ({ page }) => {
    const found = [];
    for (const width of [1280, 768]) {
      await page.setViewportSize({ width, height: 900 });
      await openEngine(page);
      await loadAcmeFolder(page);
      found.push(...(await axe(page, `${width} Acme sheet loaded (persona prompt)`)));
      await skipPrompt(page);
      found.push(...(await axe(page, `${width} Acme sheet loaded`)));
      await openEngine(page);
      await loadSheet(page, join(fixtureDir('sheet-open-questions'), 'capture-sheet.md'));
      await skipPrompt(page);
      await expect(page.getByTestId('open-questions')).toBeVisible();
      found.push(...(await axe(page, `${width} open-questions group`)));
      await openEngine(page);
      await loadSheet(page, edit(BASE, '| 2 | Design the solution | Solution architect |', '| 2 | Design the solution | Sol architect |'));
      found.push(...(await axe(page, `${width} sheet with an error`)));
    }
    expect(found).toEqual([]);
  });
});

// ---------------------------------------------------------------------------------------------------------------
test.describe('content-schema (RACI rules, author mode)', () => {
  test.beforeEach(async ({ page }) => openEngine(page));

  test('2.41 content-schema › Combined letter in a folder', async ({ page }) => {
    await loadFolder(page, 'raci-combined');
    await expect(counts(page)).toHaveText('1 error, 0 warnings');
    const m = msg(page, 'A/R');
    await expect(m).toHaveAttribute('data-level', 'error');
    await expect(m.locator('.msg-problem')).toContainText('Account lead');
    await expect(m.locator('.msg-problem')).toContainText('Start the work');
    await expect(m.locator('.msg-fix')).toHaveText('How to fix Choose one letter: R if Account lead does the work, or A if Account lead signs the work off.');
    await expect(page.getByText('is not one of')).toHaveCount(0);
  });

  test('2.42 content-schema › No accountable role', async ({ page }) => {
    await loadFolder(page, 'raci-no-accountable');
    await expect(counts(page)).toHaveText('0 errors, 1 warning');
    const m = messages(page);
    await expect(m).toHaveAttribute('data-level', 'warning');
    await expect(m.locator('.msg-problem')).toContainText('Start the work');
    await expect(m.locator('.msg-fix')).toContainText('Who signs this step off?');
    await expect(page.getByTestId('export')).toBeEnabled();
  });

  test('2.43 content-schema › Two accountable roles', async ({ page }) => {
    await loadFolder(page, 'raci-two-accountable');
    await expect(counts(page)).toHaveText('0 errors, 1 warning');
    const m = messages(page);
    await expect(m).toHaveAttribute('data-level', 'warning');
    await expect(m.locator('.msg-problem')).toContainText('Start the work');
    await expect(m.locator('.msg-problem')).toContainText('Account lead');
    await expect(m.locator('.msg-problem')).toContainText('Bid manager');
    await expect(page.getByTestId('export')).toBeEnabled();
  });

  test('2.44 content-schema › Sample stays clean', async ({ page }, info) => {
    await loadZip(page, 'acme-sample');
    await expect(counts(page)).toHaveText('0 errors, 0 warnings');
    await expect(messages(page)).toHaveCount(0);
    await skipPrompt(page);
    const c = contentOf((await exportDownload(page, info.outputPath())).html);
    const steps = c.order.process.flatMap((p) => c.elements[p].steps);
    expect(steps.length).toBe(11);
    for (const s of steps) expect(Object.entries(s.raci).filter(([, l]) => l === 'A').map(([r]) => r), s.name).toHaveLength(1);
  });
});
