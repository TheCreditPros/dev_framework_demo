import { chromium } from "@playwright/test";
import fs from "fs";
import path from "path";

/**
 * Global setup for Playwright tests
 * Runs once before all test suites
 */
async function globalSetup(config) {
  console.log("🚀 Starting Playwright global setup...");

  // Create necessary directories
  const dirs = [
    "test-results",
    "playwright-report",
    "har-files",
    "videos",
    "screenshots",
  ];

  dirs.forEach((dir) => {
    const dirPath = path.join(process.cwd(), dir);
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
      console.log(`📁 Created directory: ${dir}`);
    }
  });

  // Pre-warm browser if not in CI
  if (!process.env.CI) {
    console.log("🌐 Pre-warming browser...");
    const browser = await chromium.launch();
    const page = await browser.newPage();

    try {
      // Quick navigation to warm up the browser
      await page.goto(
        process.env.PLAYWRIGHT_BASE_URL || "http://localhost:5173",
        {
          waitUntil: "domcontentloaded",
          timeout: 5000,
        }
      );
      console.log("✅ Browser pre-warmed successfully");
    } catch (error) {
      console.log(
        "⚠️  Browser pre-warm failed (expected in development):",
        error.message
      );
    } finally {
      await browser.close();
    }
  }

  // Setup environment variables for tests
  process.env.TEST_START_TIME = new Date().toISOString();
  process.env.TEST_ENVIRONMENT = process.env.NODE_ENV || "development";

  console.log("✅ Global setup completed");
}

export default globalSetup;
