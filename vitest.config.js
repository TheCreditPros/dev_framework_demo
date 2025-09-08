import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./src/test/setup.js"],
    exclude: [
      "**/node_modules/**",
      "**/dist/**",
      "**/build/**",
      "**/e2e/**",
      "**/*.e2e.*",
      "**/tests/e2e/**",
    ],
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov", "html"],
      reportsDirectory: "./coverage",
    },
    outputFile: {
      junit: "./test-results/junit.xml",
    },
  },
});
