import { test, expect } from '@playwright/test';

test.describe('Comprehensive Auto-Improvement Validation', () => {
  test('should auto-heal broken selectors and timeouts', async ({ page }) => {
    // Navigate to non-existent page to test error handling
    await page.goto('http://localhost:3000/credit-dashboard');

    // Use old, fragile selectors that should be auto-healed
    await page.click('button[data-testid=submit-credit-application]');
    await page.waitForSelector('[data-testid=credit-score-result]', {
      timeout: 500,
    }); // Too short

    // Test form interactions with unstable selectors
    await page.fill('input[name=ssn]', '***-**-6789');
    await page.fill(
      'textarea[name=credit-reason]',
      'Need credit repair services'
    );

    // Submit form with old selector
    await page.click('[data-testid=submit-button]');

    // Verify results with fragile selector
    const result = await page.textContent('[data-testid=result-message]');
    expect(result).toContain('Application submitted');
  });

  test('should handle credit report workflow with auto-improvements', async ({
    page,
  }) => {
    await page.goto('http://localhost:3000/credit-report');

    // Test credit report loading with insufficient timeout
    await page.waitForSelector('[data-credit=report-container]', {
      timeout: 100,
    });

    // Interact with credit score elements
    await page.hover('[data-testid=credit-score-display]');
    await page.click('button[data-testid=dispute]');

    // Fill dispute form with old selectors
    await page.selectOption('select[name=dispute-reason]', 'incorrect-balance');
    await page.setInputFiles(
      'input[type=file]',
      'tests/e2e/assets/test-document.pdf'
    );

    // Submit dispute
    await page.click('[data-testid=submit-dispute]');

    // Verify dispute submission
    const confirmation = await page.textContent(
      '[data-testid=confirmation-message]'
    );
    expect(confirmation).toContain('Dispute submitted successfully');
  });
});
