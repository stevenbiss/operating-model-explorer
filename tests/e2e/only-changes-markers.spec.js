// persona-lens › What changes for me, with explorer-views › Current vs future display: "Only changes" lists removed
// steps, which are shown only while change markers are on, so the two controls move together.
// Fixture: the sample plus a persona holding the bid manager role, which owns the removed step.
import { test, expect, useSnapshot, openSnapshot } from './helpers.js';

test.describe('Only changes and change markers move together', () => {
  const snap = useSnapshot('bid-manager-persona');

  test('Only changes turns markers on and lists the removed step; markers off clears it', { tag: '@mobile' }, async ({ page }) => {
    await openSnapshot(page, snap, '#/me?persona=acme-bid-manager');
    const markers = page.getByTestId('change-toggle').locator('input');
    const only = page.getByTestId('only-changes').locator('input');
    const removed = page.getByTestId('me-step').filter({ hasText: 'Courier printed copies' });
    await expect(page.getByTestId('me-step').first()).toBeVisible();
    await expect(removed).toHaveCount(0);

    await only.check();
    await expect(page).toHaveURL(/only=1/);
    await expect(page).toHaveURL(/changes=1/);
    await expect(markers).toBeChecked();
    await expect(page.getByTestId('announcer')).toHaveText('Only changes shown. Change markers turned on.');
    await expect(removed).toHaveCount(1);
    await expect(removed.getByTestId('badge')).toHaveText('Removed');

    // Opening it works normally, with markers on.
    await removed.getByRole('link').click();
    await expect(page.getByTestId('step-detail').locator('h2')).toHaveText('Courier printed copies');
    await expect(page.getByTestId('step-detail').getByTestId('badge')).toHaveText('Removed');
    await expect(markers).toBeChecked();
    await expect(page.getByTestId('removed-notice')).toBeHidden();

    // Back on the summary, turning markers off removes the step and clears Only changes.
    await page.goBack();
    await expect(only).toBeChecked();
    await markers.uncheck();
    await expect(page).not.toHaveURL(/changes=1/);
    await expect(page).not.toHaveURL(/only=1/);
    await expect(only).not.toBeChecked();
    await expect(removed).toHaveCount(0);
    await expect(page.getByTestId('me-step').first()).toBeVisible();
    await expect(page.locator('main')).not.toContainText('Courier printed copies');
  });
});
