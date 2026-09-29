// explorer-views › Current vs future display, in search: removed steps appear only while change markers are on
// (then with a "Removed" badge), and opening a result never changes the markers setting.
import { test, expect, useSnapshot, openSnapshot, skipPrompt } from './helpers.js';

test.describe('search respects change markers', () => {
  const snap = useSnapshot('sample');

  test('removed step hidden from search while markers are off', { tag: '@mobile' }, async ({ page }) => {
    await openSnapshot(page, snap);
    await skipPrompt(page);
    await page.getByTestId('search-input').fill('courier');
    await expect(page.getByTestId('search-count')).toHaveText('0 results');
    await expect(page.getByRole('link', { name: 'Courier printed copies' })).toHaveCount(0);
    // A search that hits other steps still leaves the removed one out.
    await page.getByTestId('search-input').fill('copies');
    await expect(page.getByTestId('search-result').filter({ hasText: 'Courier printed copies' })).toHaveCount(0);
  });

  test('removed step shown with a Removed badge while markers are on; opening it keeps markers on', { tag: '@mobile' }, async ({ page }) => {
    await openSnapshot(page, snap, '#/search?q=courier');
    await skipPrompt(page);
    await expect(page.getByTestId('search-count')).toHaveText('0 results');
    await page.getByTestId('change-toggle').locator('input').check();
    await expect(page).toHaveURL(/changes=1/);
    const item = page.getByTestId('search-group-step').locator('li').filter({ hasText: 'Courier printed copies' });
    await expect(item).toHaveCount(1);
    await expect(item.getByTestId('badge')).toHaveText('Removed');
    await item.getByRole('link').click();
    await expect(page.getByTestId('step-detail').locator('h2')).toHaveText('Courier printed copies');
    await expect(page).toHaveURL(/changes=1/);
    await expect(page.getByTestId('change-toggle').locator('input')).toBeChecked();
  });

  test('opening a result with markers off leaves them off', { tag: '@mobile' }, async ({ page }) => {
    await openSnapshot(page, snap, '#/search?q=proposal');
    await skipPrompt(page);
    const results = page.getByTestId('search-result');
    const n = await results.count();
    expect(n).toBeGreaterThan(0);
    for (let i = 0; i < n; i++) {
      await openSnapshot(page, snap, '#/search?q=proposal');
      await skipPrompt(page);
      await page.getByTestId('search-result').nth(i).click();
      await expect(page).not.toHaveURL(/search/);
      await expect(page).not.toHaveURL(/changes=1/);
      await expect(page.getByTestId('change-toggle').locator('input')).not.toBeChecked();
      await expect(page.getByTestId('badge')).toHaveCount(0);
    }
  });
});
