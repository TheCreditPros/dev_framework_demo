import fs from "fs";
import path from "path";

/**
 * Global teardown for Playwright tests
 * Runs once after all test suites complete
 */
async function globalTeardown(config) {
  console.log("🧹 Starting Playwright global teardown...");

  const testStartTime = process.env.TEST_START_TIME;
  const testEndTime = new Date().toISOString();

  if (testStartTime) {
    const duration = new Date(testEndTime) - new Date(testStartTime);
    const minutes = Math.floor(duration / 60000);
    const seconds = Math.floor((duration % 60000) / 1000);

    console.log(`⏱️  Test suite duration: ${minutes}m ${seconds}s`);
  }

  // Clean up temporary files if not in CI and CLEANUP env var is set
  if (!process.env.CI && process.env.CLEANUP_TEMP_FILES === "true") {
    console.log("🗑️  Cleaning up temporary test files...");

    const tempDirs = ["har-files", "videos"];
    const tempFiles = ["playwright-results.json"];

    tempDirs.forEach((dir) => {
      const dirPath = path.join(process.cwd(), dir);
      if (fs.existsSync(dirPath)) {
        try {
          fs.rmSync(dirPath, { recursive: true, force: true });
          console.log(`🗑️  Removed directory: ${dir}`);
        } catch (error) {
          console.log(`⚠️  Failed to remove ${dir}:`, error.message);
        }
      }
    });

    tempFiles.forEach((file) => {
      const filePath = path.join(process.cwd(), file);
      if (fs.existsSync(filePath)) {
        try {
          fs.unlinkSync(filePath);
          console.log(`🗑️  Removed file: ${file}`);
        } catch (error) {
          console.log(`⚠️  Failed to remove ${file}:`, error.message);
        }
      }
    });
  }

  // Generate test summary if results file exists
  const resultsPath = path.join(process.cwd(), "playwright-results.json");
  if (fs.existsSync(resultsPath)) {
    try {
      const results = JSON.parse(fs.readFileSync(resultsPath, "utf8"));
      console.log("📊 Test Summary:");
      console.log(`   Total: ${results.stats?.total || 0}`);
      console.log(`   Passed: ${results.stats?.expected || 0}`);
      console.log(`   Failed: ${results.stats?.unexpected || 0}`);
      console.log(`   Skipped: ${results.stats?.skipped || 0}`);
    } catch (error) {
      console.log("⚠️  Could not read test results:", error.message);
    }
  }

  console.log("✅ Global teardown completed");
}

export default globalTeardown;
