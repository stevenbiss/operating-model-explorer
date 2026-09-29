// content-schema scenarios (tasks 2.1–2.14). Author mode on the engine, plus the exported sample for 2.3.
import { test, expect, openEngine, loadZip, loadFolder, trySample, skipPrompt, messages, go, useSnapshot, openSnapshot, exportSnapshot } from './helpers.js';

const preview = (page) => page.getByTestId('preview');

test.describe('content-schema (author mode)', () => {
  test.beforeEach(async ({ page }) => openEngine(page));

  test('2.1 content-schema › Minimal valid model', async ({ page }) => {
    await loadFolder(page, 'minimal-model');
    await expect(page.getByTestId('report-counts')).toContainText('0 errors, 0 warnings');
    await expect(page.locator('[data-testid="report-message"][data-level="error"]')).toHaveCount(0);
    await expect(page.getByTestId('ready')).toContainText('Ready to export');
    await expect(preview(page).getByTestId('model-name')).toHaveText('Minimal model');
    await expect(preview(page).getByTestId('purpose')).toContainText('Only a model file.');
  });

  test('2.2 content-schema › Missing model file', async ({ page }) => {
    await loadZip(page, 'missing-model');
    await expect(messages(page).filter({ hasText: 'No model.md found at the top of the folder' })).toHaveCount(1);
    await expect(messages(page).first()).toHaveAttribute('data-level', 'error');
    await expect(page.getByTestId('export')).toBeDisabled();
  });

  test('2.4 content-schema › Script in content is not executed', async ({ page, browser, sink }, info) => {
    await loadZip(page, 'script-in-body');
    await expect(page.getByTestId('report-counts')).toContainText('0 errors');
    const check = async (p) => {
      await go(p, '#/p/flow/s/start');
      await expect(p.getByTestId('step-detail')).toBeVisible();
      const scope = p.locator('main#om-main');
      // Shown literally (escaped), never as live elements.
      await expect(scope.locator('.about .prose')).toContainText('<script>alert(1)</script>');
      await expect(scope.getByTestId('step-detail')).toContainText('<script>alert(3)</script>');
      expect(await scope.locator('script').count()).toBe(0);
      expect(await scope.locator('img[onerror], [onerror]').count()).toBe(0);
      await p.waitForTimeout(300);
      expect(sink.dialogs).toEqual([]);
    };
    await check(page);
    // And in the snapshot a viewer receives.
    const snap = await exportSnapshot(browser, 'script-in-body', info.outputPath('snap'));
    await openSnapshot(page, snap, '#/p/flow');
    await check(page);
  });

  test('2.5 content-schema › Malformed header', async ({ page }) => {
    await loadZip(page, 'malformed-yaml');
    const m = messages(page).filter({ hasText: 'not valid YAML' });
    await expect(m).toHaveCount(1);
    await expect(m.locator('.msg-where')).toContainText('roles/solution-architect.md');
    await expect(m).toContainText('line 4');
  });

  test('2.6 content-schema › Sample exercises every type', async ({ page }) => {
    await trySample(page);
    await expect(page.getByTestId('report-counts')).toContainText('0 errors');
    const pv = preview(page);
    // persona (the prompt offers them), then model, party, workstream on the overview
    await expect(pv.locator('[data-testid^="persona-option-"]')).toHaveCount(3);
    await skipPrompt(page);
    await expect(pv.getByTestId('model-name')).toHaveText('Acme + Globex partnership');
    await expect(pv.locator('[data-testid^="party-card-"]')).toHaveCount(2);
    await expect(pv.locator('[data-testid^="workstream-card-"]')).toHaveCount(2);
    // process and role
    await go(page, '#/w/presales');
    await expect(pv.locator('[data-testid^="process-card-"]')).toHaveCount(2);
    await expect(pv.locator('.chips a[href^="#/r/"]').first()).toBeVisible();
    // team
    await go(page, '#/e/acme');
    await expect(pv.locator('.chips a[href="#/e/acme-sales"]')).toBeVisible();
    // decision step with two labelled branches
    await go(page, '#/p/qualify-opportunity');
    await expect(pv.locator('svg.swimlane path.edge[data-from="go-no-go"]')).toHaveCount(2);
    await expect(pv.locator('.edge-label', { hasText: /^Go$/ })).toHaveCount(1);
    await expect(pv.locator('.edge-label', { hasText: /^No go$/ })).toHaveCount(1);
  });

  test('2.7 content-schema › Missing required field', async ({ page }) => {
    await loadZip(page, 'missing-name');
    const m = messages(page).filter({ hasText: 'roles/solution-architect.md' });
    await expect(m).toHaveCount(1);
    await expect(m).toHaveAttribute('data-level', 'error');
    await expect(m.locator('.msg-problem')).toContainText('"name"');
  });

  test('2.8 content-schema › Duplicate id', async ({ page }) => {
    await loadZip(page, 'duplicate-id');
    const m = messages(page).filter({ hasText: 'account-lead' });
    await expect(m).toHaveCount(1);
    await expect(m).toHaveAttribute('data-level', 'error');
    await expect(m).toContainText('roles/account-lead.md');
    await expect(m).toContainText('roles/account-lead-copy.md');
  });

  test('2.9 content-schema › Unknown owner', async ({ page }) => {
    await loadZip(page, 'unknown-owner');
    const m = messages(page).filter({ hasText: 'sol-arch' });
    await expect(m).toHaveCount(1);
    await expect(m).toHaveAttribute('data-level', 'error');
    await expect(m.locator('.msg-where')).toContainText('processes/01-flow.md');
    await expect(m.locator('.msg-where')).toContainText('Step design');
    await expect(m).toContainText('Did you mean solution-architect?');
  });

  test('2.10 content-schema › Model without change data', async ({ page }) => {
    await loadZip(page, 'tiny');
    const pv = preview(page);
    for (const hash of ['#/', '#/w/main-ws', '#/p/flow', '#/p/flow/s/start', '#/r/account-lead', '#/search?q=a']) {
      await go(page, hash);
      await expect(pv.locator('main h1')).toBeVisible();
      await expect(pv.getByTestId('change-toggle')).toHaveCount(0);
      await expect(pv.locator('#om-changes')).toHaveCount(0);
      await expect(pv.getByTestId('badge')).toHaveCount(0);
      await expect(pv.getByTestId('today')).toHaveCount(0);
      await expect(pv).not.toContainText(/Show changes|Only changes/);
    }
  });

  test('2.11 content-schema › Invalid change status', async ({ page }) => {
    await loadZip(page, 'invalid-change-status');
    const m = messages(page).filter({ hasText: 'maybe' });
    await expect(m).toHaveCount(1);
    await expect(m).toHaveAttribute('data-level', 'error');
    await expect(m).toContainText('new, changed, removed, unchanged');
  });

  test('2.12 content-schema › Unknown field', async ({ page }) => {
    await loadZip(page, 'unknown-field');
    const m = messages(page).filter({ hasText: 'location' });
    await expect(m).toHaveCount(1);
    await expect(m).toHaveAttribute('data-level', 'warning');
    await expect(page.getByTestId('report-counts')).toContainText('0 errors, 1 warning');
    await expect(page.getByTestId('export')).toBeEnabled();
    await expect(page.getByTestId('export')).toHaveText('Export snapshot');
  });

  test('2.13 content-schema › Reference reachable from author mode', async ({ page, context }) => {
    await context.setOffline(true);
    await page.getByRole('button', { name: 'Content reference' }).click();
    const dlg = page.getByTestId('reference-dialog');
    await expect(dlg).toBeVisible();
    for (const type of ['model', 'party', 'team', 'role', 'persona', 'workstream', 'process']) {
      await expect(dlg.getByRole('heading', { name: type, exact: true })).toBeVisible();
    }
    // Fields, with required and EDGY concept columns.
    for (const f of ['key_messages', 'owner', 'raci', 'next', 'entry', 'detail', 'party']) await expect(dlg.locator('code', { hasText: new RegExp(`(^|\\.)${f}$`) }).first()).toBeAttached();
    await expect(dlg.locator('table').first()).toContainText('Required');
    await expect(dlg).toContainText('EDGY concept');
  });

  test('2.14 content-schema › Message format', async ({ page }) => {
    await loadZip(page, 'one-error-one-warning');
    await expect(page.getByTestId('report-counts')).toContainText('1 error, 1 warning');
    await expect(messages(page)).toHaveCount(2);
    for (const m of await messages(page).all()) {
      await expect(m.locator('.msg-where code')).toHaveText(/\.md$/);
      await expect(m.locator('.msg-fix')).toContainText(/How to fix\s+\S+/);
      await expect(m).not.toContainText(/Error:|at \w+ \(|stack|undefined|\[object/);
    }
    const ex = page.getByTestId('export');
    await expect(ex).toBeDisabled();
    await expect(ex).toHaveText('Fix 1 error to export');
    // Fixing the error (the same folder with the role's name added) enables export; the warning stays.
    await page.getByTestId('load-other').click();
    await loadZip(page, 'unknown-field');
    await expect(page.getByTestId('report-counts')).toContainText('0 errors, 1 warning');
    await expect(ex).toBeEnabled();
  });
});

test.describe('content-schema (exported sample)', () => {
  const snap = useSnapshot('sample');

  test('2.3 content-schema › Narrative rendered', async ({ page }) => {
    await openSnapshot(page, snap, '#/p/qualify-opportunity');
    const prose = page.locator('.about .prose');
    await expect(prose.getByRole('heading', { name: 'Why this matters' })).toBeVisible();
    await expect(prose.locator('ul > li')).toHaveCount(3);
    await expect(prose.locator('strong', { hasText: 'before they started' })).toBeVisible();
    expect(await prose.locator('strong').evaluate((el) => getComputedStyle(el).fontWeight)).toMatch(/^(bold|[6-9]00)$/);
    await expect(prose).not.toContainText('**');
    await expect(prose).not.toContainText('## ');
  });
});
