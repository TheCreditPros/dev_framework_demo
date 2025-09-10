import { defineConfig, devices } from "@playwright/test";

const isCI = !!process.env.CI;

export default defineConfig({
  testDir: "./tests/e2e",

  // Simple but effective configuration
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 2 : 0,
  workers: isCI ? 1 : undefined,

  // Multiple reporter formats for different needs
  reporter: [
    ["html", { outputFolder: "playwright-report", open: !isCI }],
    ["json", { outputFile: "playwright-results.json" }],
    ...(isCI ? [["github"]] : []),
  ],

  // Timeout configuration
  timeout: 60000,
  expect: {
    timeout: 10000,
  },

  // Browser projects - start simple, expand as needed
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        // Reasonable viewport for most applications
        viewport: { width: 1280, height: 720 },
      },
    },
    // Add mobile testing when your app supports it
    {
      name: "mobile-chrome",
      use: {
        ...devices["Pixel 7"],
      },
    },
  ],

  // Core browser configuration
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || "http://localhost:5173",

    // Essential timeouts
    actionTimeout: 10000,
    navigationTimeout: 30000,

    // Debugging and reporting
    screenshot: "only-on-failure",
    trace: isCI ? "retain-on-failure" : "on-first-retry",
    video: isCI ? "retain-on-failure" : "off",

    // Browser launch options
    launchOptions: {
      headless: isCI,
      slowMo: process.env.PLAYWRIGHT_SLOW_MO
        ? parseInt(process.env.PLAYWRIGHT_SLOW_MO)
        : undefined,
    },
  },

  // Simple web server configuration
  webServer: isCI
    ? undefined
    : {
        command: "npm run dev",
        url: process.env.PLAYWRIGHT_BASE_URL || "http://localhost:5173",
        reuseExistingServer: !isCI,
        timeout: 60000,
      },
});
