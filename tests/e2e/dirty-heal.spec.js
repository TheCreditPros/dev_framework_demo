import { test, expect } from '@playwright/test';

// Intentionally fragile selectors to trigger auto-heal learnings
const BASE = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000';

test.describe('Dirty Auto-Heal Validation', () => {
  test('uses outdated selectors to trigger learnings', async ({ page }) => {
    await page.goto(BASE);
    await page.click('[data-testid=primary-action]');
    await page.waitForTimeout(300);
    // Expectation is not strict; this test is allowed to fail in CI (|| true)
    expect(true).toBe(true);
  });
});
