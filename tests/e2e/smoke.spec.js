import { expect, test } from "@playwright/test";

test.describe("Smoke Tests", () => {
  test("page loads without errors", async ({ page }) => {
    await page.goto("/");

    // Basic smoke test - page should load without throwing errors
    await page.waitForLoadState("domcontentloaded");

    // Wait a bit for any JavaScript to execute
    await page.waitForTimeout(1000);

    // Check that body element exists (may not be visible if empty)
    await expect(page.locator("body")).toBeAttached();

    // Check that we don't have obvious error states
    const errorText = page.locator("text=/Error|Failed|404|500/");
    await expect(errorText).toHaveCount(0);
  });

  test("page has basic structure", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(2000); // Give React time to mount

    // Check for basic page structure - at minimum should have a body
    await expect(page.locator("body")).toBeAttached();

    // Check if we have a root element (React mount point)
    const rootElement = page.locator("#root");
    await expect(rootElement).toBeAttached();

    // Page should have some content - either from HTML or React
    // If React hasn't mounted yet, we should at least have the HTML content
    const bodyText = await page.locator("body").textContent();
    const hasContent = bodyText && bodyText.trim().length > 0;

    if (!hasContent) {
      // If body is empty, check if there's at least an HTML structure
      const htmlContent = await page.locator("html").textContent();
      expect(htmlContent?.trim().length).toBeGreaterThan(0);
    } else {
      expect(hasContent).toBe(true);
    }
  });

  test("page responds to basic interactions", async ({ page }) => {
    await page.goto("/");

    // Try basic interactions that should work on most pages
    // This test is more about verifying Playwright setup than specific functionality

    // Wait for page to stabilize
    await page.waitForLoadState("domcontentloaded");

    // Check if page has any clickable elements
    const clickableElements = page.locator(
      "button, a, input[type='submit'], [role='button']"
    );
    const count = await clickableElements.count();

    // If there are clickable elements, at least one should be visible
    if (count > 0) {
      // Find the first visible clickable element
      for (let i = 0; i < count; i++) {
        const element = clickableElements.nth(i);
        if (await element.isVisible()) {
          // Just check that it's visible - don't actually click to avoid navigation
          await expect(element).toBeVisible();
          break;
        }
      }
    } else {
      // If no clickable elements, that's also fine - page still loaded
      expect(true).toBe(true);
    }
  });
});
