/**
 * Common test utilities for Playwright tests
 * Use these helpers to keep your tests DRY and maintainable
 */

/**
 * Wait for the page to be fully loaded
 * @param {import('@playwright/test').Page} page
 */
export async function waitForPageLoad(page) {
  await page.waitForLoadState("networkidle");
  await page.waitForLoadState("domcontentloaded");
}

/**
 * Check if an element is visible with a reasonable timeout
 * @param {import('@playwright/test').Page} page
 * @param {string} selector - CSS selector or data-testid
 */
export async function isElementVisible(page, selector) {
  try {
    await page.waitForSelector(selector, { timeout: 5000 });
    return true;
  } catch {
    return false;
  }
}

/**
 * Fill a form field with error handling
 * @param {import('@playwright/test').Page} page
 * @param {string} selector - CSS selector or data-testid
 * @param {string} value - Value to fill
 */
export async function fillField(page, selector, value) {
  await page.fill(selector, value);
  await page.waitForTimeout(100); // Small delay for UI updates
}

/**
 * Click an element with error handling
 * @param {import('@playwright/test').Page} page
 * @param {string} selector - CSS selector or data-testid
 */
export async function clickElement(page, selector) {
  await page.click(selector);
  await page.waitForTimeout(100); // Small delay for UI updates
}

/**
 * Take a screenshot with timestamp
 * @param {import('@playwright/test').Page} page
 * @param {string} name - Screenshot name
 */
export async function takeScreenshot(page, name) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  await page.screenshot({
    path: `screenshots/${name}-${timestamp}.png`,
    fullPage: true,
  });
}

/**
 * Common test data
 */
export const testData = {
  validEmail: "test@example.com",
  invalidEmail: "invalid-email",
  creditScore: 720,
  ssn: "123-45-6789",
  phoneNumber: "(555) 123-4567",
};
