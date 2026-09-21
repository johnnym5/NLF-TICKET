const { test, expect } = require('@playwright/test');

test.describe('Attendee Flow', () => {
  test('should show landing page and open auth modal', async ({ page }) => {
    await page.goto('/ticket');
    await expect(page.locator('h1')).toContainText('National Livestock Festival');

    // Find Claim Pass button
    const claimBtn = page.getByRole('button', { name: /Claim Free Pass/i });
    await claimBtn.click();

    // Check if Auth Modal is open
    await expect(page.locator('h2')).toContainText('Claim Your Official Free Pass');
  });
});

test.describe('Scanner Flow', () => {
  test('should require login for scanner route', async ({ page }) => {
    await page.goto('/qrscanner');
    await expect(page.locator('h2')).toContainText('Staff Log In');
  });
});
