import { test, expect } from '@playwright/test';

test.describe('Credit Score Display - Broken Selectors Test', () => {
  test('should display credit score with old selectors', async ({ page }) => {
    await page.goto('http://localhost:3000/credit-score');

    // Intentionally broken selectors to test auto-healing
    await page.click('[data-testid=credit-score-button]');
    await page.waitForSelector('[data-testid=score-display]');

    const scoreText = await page.textContent('[data-testid=score-value]');
    expect(parseInt(scoreText)).toBeGreaterThanOrEqual(300);
    expect(parseInt(scoreText)).toBeLessThanOrEqual(850);
  });

  test('should handle credit report loading with timeout issues', async ({
    page,
  }) => {
    await page.goto('http://localhost:3000/credit-report');

    // Short timeout that should be auto-extended
    await page.waitForSelector('[data-testid=credit-report]', {
      timeout: 1000,
    });

    const reportElement = page.locator('#credit-report-container');
    await expect(reportElement).toBeVisible();
  });
});
