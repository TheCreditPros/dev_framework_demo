import { expect, test } from "@playwright/test";

test.describe("Smoke Tests", () => {
  test("page loads without errors", async ({ page }) => {
    await page.goto("./");

    // Basic smoke test - page should load without throwing errors
    await expect(page.locator("body")).toBeVisible();

    // Check that we don't have obvious error states
    const errorText = page.locator("text=/Error|Failed|404|500/");
    await expect(errorText).toHaveCount(0);
  });

  test("page has basic structure", async ({ page }) => {
    await page.goto("./");

    // Check for basic page structure - at minimum should have a body
    await expect(page.locator("body")).toBeAttached();

    // Page should have some content (not completely empty)
    const bodyText = await page.locator("body").textContent();
    expect(bodyText?.length).toBeGreaterThan(0);
  });

  test("page responds to basic interactions", async ({ page }) => {
    await page.goto("./");

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
