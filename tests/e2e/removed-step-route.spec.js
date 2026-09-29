// explorer-views › Current vs future display: "Removed steps SHALL be shown only while change markers are on".
// With markers off, a route to a removed step resolves to its process with a dismissible notice (fix loop 2).
import { test, expect, useSnapshot, openSnapshot } from './helpers.js';

const STEP = '#/p/build-proposal/s/courier-copies';
const NOTICE = 'Step “Courier printed copies” was removed in this model. Turn on Show changes to see it.';

// The removed step is nowhere in the process view: not in the swimlane (or list), not in the detail panel.
async function expectHidden(page) {
  await expect(page).toHaveURL(/#\/p\/build-proposal$/);
  await expect(page.locator('main h1')).toHaveText('Build the proposal');
  await expect(page.getByTestId('swimlane')).toBeVisible();
  await expect(page.getByTestId('step-courier-copies')).toHaveCount(0);
  await expect(page.getByTestId('swimlane')).not.toContainText('Courier printed copies');
  await expect(page.getByTestId('step-detail')).toHaveCount(0);
  await expect(page.getByTestId('change-toggle').locator('input')).not.toBeChecked();
  await expect(page.getByTestId('removed-notice')).toBeVisible();
  await expect(page.getByTestId('removed-notice').locator('p')).toHaveText(NOTICE);
  await expect(page.getByTestId('announcer')).toHaveText(NOTICE);
}

test.describe('removed step routes while change markers are off', () => {
  const snap = useSnapshot('sample');

  test('turning markers off while the removed step is open closes it to the process with a notice', { tag: '@mobile' }, async ({ page }) => {
    await openSnapshot(page, snap, '#/p/build-proposal?changes=1');
    await page.getByTestId('step-courier-copies').click();
    await expect(page.getByTestId('step-detail').locator('h2')).toHaveText('Courier printed copies');
    const toggle = page.getByTestId('change-toggle').locator('input');
    await toggle.uncheck();
    await expectHidden(page);
    await expect(toggle).toBeFocused();
    // Back never returns to the hidden step.
    await page.goBack();
    await expect(page).not.toHaveURL(/courier-copies/);
    await expect(page.getByTestId('step-detail')).toHaveCount(0);
  });

  test('a deep link without changes=1 resolves to the process with a notice', { tag: '@mobile' }, async ({ page }) => {
    await openSnapshot(page, snap, STEP);
    await expectHidden(page);
    // Keyboard dismissal: the button, then focus lands on the page heading.
    await page.getByTestId('removed-notice-dismiss').focus();
    await page.keyboard.press('Enter');
    await expect(page.getByTestId('removed-notice')).toBeHidden();
    await expect(page.locator('main h1')).toBeFocused();
    // Escape dismisses it too.
    await openSnapshot(page, snap, STEP);
    await expect(page.getByTestId('removed-notice')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByTestId('removed-notice')).toBeHidden();
    // The role profile of its owner leaves it out as well.
    await openSnapshot(page, snap, '#/r/bid-manager');
    await expect(page.locator('main h1')).toBeVisible();
    await expect(page.locator('main')).not.toContainText('Courier printed copies');
    await expect(page.getByTestId('removed-notice')).toBeHidden();
  });

  test('a deep link with changes=1 still opens the removed step with markers on', { tag: '@mobile' }, async ({ page }) => {
    await openSnapshot(page, snap, `${STEP}?changes=1`);
    await expect(page.getByTestId('step-detail').locator('h2')).toHaveText('Courier printed copies');
    await expect(page.getByTestId('step-detail').getByTestId('badge')).toHaveText('Removed');
    await expect(page.getByTestId('change-toggle').locator('input')).toBeChecked();
    await expect(page.getByTestId('removed-notice')).toBeHidden();
    await expect(page).toHaveURL(/courier-copies\?changes=1$/);
  });
});
