import { defineConfig, devices } from '@playwright/test';

// Gate E2E by env var; disabled by default for template/demo
const ENABLE_E2E = process.env.ENABLE_E2E === 'true';
const USE_WEBSERVER = ENABLE_E2E && !!process.env.PLAYWRIGHT_WEB_SERVER;

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [['html']],
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  ...(USE_WEBSERVER
    ? {
        webServer: {
          command: process.env.PLAYWRIGHT_WEB_SERVER,
          url: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000',
          reuseExistingServer: !process.env.CI,
        },
      }
    : {}),
});
