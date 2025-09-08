const { defineConfig } = require("vitest/config");

module.exports = defineConfig({
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./src/test/setup.js"],
    include: ["tests/unit/**/*.{test,spec}.{js,ts,jsx,tsx}"],
    testTimeout: 10000, // 10 second timeout per test
    hookTimeout: 10000, // 10 second timeout for hooks
    teardownTimeout: 10000, // 10 second timeout for teardown
    coverage: {
      reporter: ["text", "json", "html", "lcov"],
    },
  },
});
