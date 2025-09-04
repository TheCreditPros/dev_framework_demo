import { test, expect } from "@playwright/test";

// Intentionally fragile selectors to trigger auto-heal learnings
const BASE = process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000";

test.describe("Dirty Auto-Heal Validation", () => {
  test("uses outdated selectors to trigger learnings", async ({ page }) => {
    try {
      await page.goto(BASE);
      await page.click("#old-nonexistent-button");
      await page.waitForTimeout(300);
      // Expectation is not strict; this test is allowed to fail in CI (|| true)
      expect(true).toBe(true);
    } catch (error) {
      // Expected to fail - this is intentional for auto-healing
      console.log("Expected failure for auto-healing:", error.message);
      expect(true).toBe(true);
    }
  });
});
