// persona-lens scenarios (tasks 2.38–2.46), on the sample snapshot exported through the real Export button.
import { test, expect, useSnapshot, openSnapshot } from './helpers.js';

const PERSONAS = [
  ['acme-account-lead', 'Acme account lead', 'You own the client. Start with how an opportunity is qualified.'],
  ['acme-delivery-manager', 'Acme delivery manager', 'You deliver what is sold. Start with where you are consulted.'],
  ['globex-solution-team', 'Globex solution team', 'You design and price the solution. Start with the whole presales value stream.'],
];
const svg = (page) => page.locator('svg.swimlane').first();
const yourLanes = (page) => page.locator('.lane-heads [data-testid^="lane-"]').filter({ hasText: 'Your lane' });
const counts = (page) =>
  page.evaluate(() => ({
    lanes: document.querySelectorAll('.lane-heads [data-testid^="lane-"]').length,
    steps: document.querySelectorAll('svg.swimlane .node').length,
    connectors: document.querySelectorAll('svg.swimlane path.edge').length,
    labels: document.querySelectorAll('svg.swimlane .edge-label').length,
  }));

test.describe('persona-lens (exported sample)', () => {
  const snap = useSnapshot('sample');

  test('2.38 persona-lens › Arrival', { tag: '@mobile' }, async ({ page }) => {
    await openSnapshot(page, snap);
    const prompt = page.getByTestId('persona-prompt');
    await expect(prompt).toBeVisible();
    for (const [id, name, summary] of PERSONAS) {
      const door = prompt.getByTestId(`persona-option-${id}`);
      await expect(door).toBeVisible();
      await expect(door.locator('.door-name')).toHaveText(name);
      await expect(door.locator('.door-text')).toHaveText(summary);
    }
    await expect(prompt.locator('[data-testid^="persona-option-"]')).toHaveCount(3);
    const skip = prompt.getByRole('button', { name: 'Explore without a persona' });
    await expect(skip).toBeVisible();
    await skip.click();
    await expect(prompt).toBeHidden();
    await expect(page.getByTestId('model-name')).toBeVisible();
  });

  test('2.39 persona-lens › Change persona later', async ({ page }) => {
    await openSnapshot(page, snap, '#/p/qualify-opportunity?persona=acme-account-lead');
    await expect(yourLanes(page)).toHaveCount(1);
    await expect(page.getByTestId('lane-account-lead')).toContainText('Your lane');
    await page.getByTestId('persona-select').selectOption('globex-solution-team');
    await expect(page).toHaveURL(/#\/p\/qualify-opportunity\?persona=globex-solution-team$/);
    await expect(page.locator('main h1')).toHaveText('Qualify an opportunity');
    await expect(page.getByTestId('lane-solution-architect')).toContainText('Your lane');
    await expect(page.getByTestId('lane-account-lead')).not.toContainText('Your lane');
    await expect(page.getByTestId('step-assess-fit')).toHaveClass(/\bmine\b/);
    await expect(page.getByTestId('step-capture-lead')).toHaveClass(/\bdim\b/);
  });

  test('2.40 persona-lens › Enter at a process', { tag: '@mobile' }, async ({ page }) => {
    await openSnapshot(page, snap);
    await page.getByTestId('persona-option-acme-account-lead').click();
    await expect(page).toHaveURL(/#\/p\/qualify-opportunity\?persona=acme-account-lead$/);
    await expect(page.locator('main h1')).toHaveText('Qualify an opportunity');
    await expect(page.getByTestId('swimlane')).toBeVisible();
    await expect(page.getByTestId('breadcrumb').locator('li')).toHaveText(['Acme + Globex partnership', 'Presales', 'Qualify an opportunity']);
  });

  test('2.41 persona-lens › Highlighted lanes', async ({ page }) => {
    await openSnapshot(page, snap, '#/p/qualify-opportunity?persona=acme-account-lead');
    await expect(yourLanes(page)).toHaveCount(1);
    await expect(page.getByTestId('lane-account-lead')).toContainText('Your lane');
    for (const id of ['capture-lead', 'decline']) {
      await expect(page.getByTestId(`step-${id}`)).toHaveClass(/\bmine\b/);
      await expect(page.getByTestId(`step-${id}`)).toHaveAttribute('aria-label', /Your step\./);
    }
    // go-no-go: decided by the bid board, which marks the account lead A.
    await expect(page.getByTestId('step-go-no-go')).toHaveClass(/\bmine\b/);
    await expect(page.getByTestId('step-go-no-go')).toHaveAttribute('aria-label', /You: A\./);
    // assess-fit: the account lead is consulted, so it is emphasised with "You: C".
    await expect(page.getByTestId('step-assess-fit')).toHaveClass(/\bmine\b/);
    await expect(page.getByTestId('step-assess-fit')).toHaveAttribute('aria-label', /You: C\./);
    // Everything else stays visible and can be opened.
    const other = page.getByTestId('step-kick-off-bid');
    await expect(other).toHaveClass(/\bdim\b/);
    await expect(other).toBeVisible();
    expect(Number(await other.evaluate((g) => getComputedStyle(g).opacity))).toBeGreaterThan(0.3);
    await expect(page.getByTestId('lane-bid-manager')).toBeVisible();
    await other.click();
    await expect(page.getByTestId('step-detail').locator('h2')).toHaveText('Kick off the bid');
    // Handoffs into and out of the lane are emphasised.
    await expect(svg(page).locator('path.edge[data-from="capture-lead"]')).toHaveClass(/\bmine\b/);
    await expect(page.getByTestId('legend')).toContainText('Your lane');
  });

  test('2.42 persona-lens › Nothing hidden', async ({ page }) => {
    for (const process of ['qualify-opportunity', 'build-proposal']) {
      const seen = [];
      for (const persona of ['acme-account-lead', 'globex-solution-team', '']) {
        await openSnapshot(page, snap, `#/p/${process}${persona ? `?persona=${persona}` : ''}`);
        await expect(page.getByTestId('swimlane')).toBeVisible();
        seen.push(await counts(page));
      }
      expect(seen[0].steps).toBeGreaterThan(0);
      expect(seen[1], `${process}: persona B vs A`).toEqual(seen[0]);
      expect(seen[2], `${process}: no persona vs A`).toEqual(seen[0]);
    }
  });

  test('2.43 persona-lens › Summary contents', { tag: '@mobile' }, async ({ page }) => {
    await openSnapshot(page, snap, '#/p/qualify-opportunity?persona=acme-account-lead');
    await page.getByTestId('me-link').click();
    await expect(page.locator('main h1')).toHaveText('What matters for me');
    const groups = page.locator('[data-testid^="me-group-"]');
    await expect(groups.locator('h2')).toHaveText(['Qualify an opportunity', 'Build the proposal']);
    const rows = await page.getByTestId('me-step').evaluateAll((lis) => lis.map((li) => ({ name: li.querySelector('a').textContent, href: li.querySelector('a').getAttribute('href'), letter: li.querySelector('abbr') && li.querySelector('abbr').textContent })));
    expect(rows).toEqual([
      { name: 'Capture the lead', href: '#/p/qualify-opportunity/s/capture-lead?persona=acme-account-lead', letter: 'A' },
      { name: 'Assess solution fit', href: '#/p/qualify-opportunity/s/assess-fit?persona=acme-account-lead', letter: 'C' },
      { name: 'Go or no-go', href: '#/p/qualify-opportunity/s/go-no-go?persona=acme-account-lead', letter: 'A' },
      { name: 'Decline politely', href: '#/p/qualify-opportunity/s/decline?persona=acme-account-lead', letter: 'A' },
      { name: 'Review the proposal', href: '#/p/build-proposal/s/review-proposal?persona=acme-account-lead', letter: 'A' },
      { name: 'Submit the proposal', href: '#/p/build-proposal/s/submit-proposal?persona=acme-account-lead', letter: 'A' },
    ]);
    await page.getByTestId('me-step').filter({ hasText: 'Review the proposal' }).getByRole('link').click();
    await expect(page.getByTestId('step-detail').locator('h2')).toHaveText('Review the proposal');
  });

  test('2.44 persona-lens › What changes for me', async ({ page }) => {
    for (const [persona, all, name, badge] of [
      ['acme-account-lead', 6, 'Decline politely', 'New'],
      ['globex-solution-team', 6, 'Kick off the bid', 'Changed'], // includes Go or no-go, where the bid board consults the solution architect
    ]) {
      await openSnapshot(page, snap, `#/me?persona=${persona}`);
      await expect(page.getByTestId('me-step')).toHaveCount(all);
      await page.getByTestId('only-changes').locator('input').check();
      await expect(page).toHaveURL(/only=1/);
      await expect(page.getByTestId('me-step')).toHaveCount(1);
      await expect(page.getByTestId('me-step').getByRole('link')).toHaveText(name);
      await expect(page.getByTestId('me-step').getByTestId('badge')).toHaveText(badge);
    }
  });

  test('2.45 persona-lens › Link as persona', async ({ page }) => {
    await openSnapshot(page, snap, '#/?persona=globex-solution-team');
    await expect(page.getByTestId('model-name')).toBeVisible();
    await page.waitForTimeout(300);
    await expect(page.getByTestId('persona-prompt')).toBeHidden();
    await expect(page.getByTestId('persona-select')).toHaveValue('globex-solution-team');
    await expect(page.getByTestId('me-link')).toBeVisible();
    await openSnapshot(page, snap, '#/p/build-proposal?persona=globex-solution-team');
    await expect(page.getByTestId('persona-prompt')).toBeHidden();
    await expect(page.getByTestId('lane-solution-architect')).toContainText('Your lane');
    await expect(page.getByTestId('lane-pricing-analyst')).toContainText('Your lane');
    await expect(yourLanes(page)).toHaveCount(2);
    await expect(page.getByTestId('step-price-solution')).toHaveClass(/\bmine\b/);
  });

  test('2.46 persona-lens › Keyboard switch', async ({ page }) => {
    await openSnapshot(page, snap, '#/w/presales');
    const select = page.getByTestId('persona-select');
    await expect(select).toHaveAccessibleName('Persona');
    // Reach the control by keyboard.
    await page.locator('main h1').focus();
    for (let i = 0; i < 25 && !(await select.evaluate((s) => s === document.activeElement)); i++) await page.keyboard.press('Shift+Tab');
    await expect(select).toBeFocused();
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');
    await expect(select).toHaveValue('acme-account-lead');
    await expect(page).toHaveURL(/persona=acme-account-lead/);
    await expect(page.getByTestId('announcer')).toHaveAttribute('aria-live', 'polite');
    await expect(page.getByTestId('announcer')).toHaveText('Now viewing as Acme account lead');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');
    await expect(page.getByTestId('announcer')).toHaveText('Now viewing as Acme delivery manager');
  });
});
