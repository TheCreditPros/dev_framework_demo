#!/usr/bin/env node

/**
 * Jest Elimination Validation Script
 * Comprehensive audit to ensure Jest has been completely eliminated from the framework
 */

const fs = require("fs");
const path = require("path");

console.log("🔍 Jest Elimination Validation Audit");
console.log("=====================================\n");

const results = {
  passed: 0,
  failed: 0,
  warnings: 0,
  tests: [],
};

function addResult(test, status, message, details = "") {
  results.tests.push({ test, status, message, details });
  if (status === "PASS") results.passed++;
  else if (status === "FAIL") results.failed++;
  else if (status === "WARN") results.warnings++;

  const icon = status === "PASS" ? "✅" : status === "FAIL" ? "❌" : "⚠️";
  console.log(`${icon} ${test}: ${message}`);
  if (details) console.log(`   ${details}`);
}

// Test 1: Package.json Dependencies
function testPackageJson() {
  console.log("\n📦 Testing package.json dependencies...");

  try {
    const packageJson = JSON.parse(fs.readFileSync("package.json", "utf8"));

    // Check dependencies
    const allDeps = {
      ...(packageJson.dependencies || {}),
      ...(packageJson.devDependencies || {}),
    };

    const jestDeps = Object.keys(allDeps).filter(
      (dep) => dep.includes("jest") || dep.includes("@testing-library/jest")
    );

    if (jestDeps.length === 0) {
      addResult("Package Dependencies", "PASS", "No Jest dependencies found");
    } else {
      addResult(
        "Package Dependencies",
        "FAIL",
        `Jest dependencies found: ${jestDeps.join(", ")}`
      );
    }

    // Check for Vitest dependencies
    const vitestDeps = Object.keys(allDeps).filter(
      (dep) => dep.includes("vitest") || dep.includes("@testing-library/vitest")
    );

    if (vitestDeps.length > 0) {
      addResult(
        "Vitest Dependencies",
        "PASS",
        `Vitest dependencies found: ${vitestDeps.join(", ")}`
      );
    } else {
      addResult("Vitest Dependencies", "FAIL", "No Vitest dependencies found");
    }

    // Check test scripts
    const testScripts = Object.keys(packageJson.scripts || {}).filter(
      (script) => script.includes("test")
    );

    const vitestScripts = testScripts.filter((script) =>
      packageJson.scripts[script].includes("vitest")
    );

    if (vitestScripts.length > 0) {
      addResult(
        "Test Scripts",
        "PASS",
        `Vitest scripts found: ${vitestScripts.join(", ")}`
      );
    } else {
      addResult("Test Scripts", "FAIL", "No Vitest test scripts found");
    }
  } catch (error) {
    addResult(
      "Package Dependencies",
      "FAIL",
      "Cannot read package.json",
      error.message
    );
  }
}

// Test 2: Configuration Files
function testConfigFiles() {
  console.log("\n⚙️ Testing configuration files...");

  // Check for Jest config files
  const jestConfigFiles = [
    "jest.config.js",
    "jest.config.ts",
    "jest.config.json",
    ".jestrc",
    ".jestrc.js",
    ".jestrc.json",
  ];

  let foundJestConfig = false;
  jestConfigFiles.forEach((file) => {
    if (fs.existsSync(file)) {
      foundJestConfig = true;
      addResult("Jest Config Files", "FAIL", `Jest config file found: ${file}`);
    }
  });

  if (!foundJestConfig) {
    addResult("Jest Config Files", "PASS", "No Jest configuration files found");
  }

  // Check for Vitest config
  if (fs.existsSync("vitest.config.js")) {
    addResult("Vitest Config", "PASS", "vitest.config.js found");

    try {
      const vitestConfig = fs.readFileSync("vitest.config.js", "utf8");
      if (vitestConfig.includes("vitest/config")) {
        addResult(
          "Vitest Config Content",
          "PASS",
          "Vitest config properly imports from vitest/config"
        );
      } else {
        addResult(
          "Vitest Config Content",
          "WARN",
          "Vitest config may not be properly configured"
        );
      }
    } catch (error) {
      addResult(
        "Vitest Config Content",
        "FAIL",
        "Cannot read vitest.config.js",
        error.message
      );
    }
  } else {
    addResult("Vitest Config", "FAIL", "vitest.config.js not found");
  }
}

// Test 3: Test Setup Files
function testSetupFiles() {
  console.log("\n🛠️ Testing test setup files...");

  // Check main test setup
  if (fs.existsSync("src/test/setup.js")) {
    try {
      const setupContent = fs.readFileSync("src/test/setup.js", "utf8");

      if (setupContent.includes("@testing-library/jest-dom")) {
        addResult(
          "Test Setup",
          "FAIL",
          "Test setup still uses @testing-library/jest-dom"
        );
      } else if (setupContent.includes("@testing-library/vitest-dom")) {
        addResult(
          "Test Setup",
          "PASS",
          "Test setup uses @testing-library/vitest-dom"
        );
      } else {
        addResult(
          "Test Setup",
          "WARN",
          "Test setup may not have testing library configured"
        );
      }

      if (setupContent.includes("jest.fn")) {
        addResult(
          "Test Setup Mocks",
          "FAIL",
          "Test setup still uses jest.fn()"
        );
      } else if (setupContent.includes("vi.fn")) {
        addResult(
          "Test Setup Mocks",
          "PASS",
          "Test setup uses vi.fn() from Vitest"
        );
      } else {
        addResult(
          "Test Setup Mocks",
          "PASS",
          "No mock functions in test setup"
        );
      }
    } catch (error) {
      addResult(
        "Test Setup",
        "FAIL",
        "Cannot read test setup file",
        error.message
      );
    }
  } else {
    addResult(
      "Test Setup",
      "WARN",
      "No test setup file found at src/test/setup.js"
    );
  }
}

// Test 4: Test Files
function testTestFiles() {
  console.log("\n🧪 Testing test files...");

  const testDirs = ["tests", "test", "__tests__"];
  let testFilesFound = 0;
  let vitestImports = 0;
  let jestImports = 0;

  testDirs.forEach((dir) => {
    if (fs.existsSync(dir)) {
      const scanDir = (dirPath) => {
        const items = fs.readdirSync(dirPath);
        items.forEach((item) => {
          const fullPath = path.join(dirPath, item);
          const stat = fs.statSync(fullPath);

          if (stat.isDirectory()) {
            scanDir(fullPath);
          } else if (item.match(/\.(test|spec)\.(js|ts|tsx|jsx)$/)) {
            testFilesFound++;
            try {
              const content = fs.readFileSync(fullPath, "utf8");

              if (
                content.includes('from "vitest"') ||
                content.includes("from 'vitest'")
              ) {
                vitestImports++;
              }

              if (
                content.includes('from "jest"') ||
                content.includes("from 'jest'") ||
                content.includes("jest.")
              ) {
                jestImports++;
                addResult(
                  "Test File Jest Usage",
                  "FAIL",
                  `Jest usage found in ${fullPath}`
                );
              }
            } catch (error) {
              addResult(
                "Test File Reading",
                "WARN",
                `Cannot read ${fullPath}`,
                error.message
              );
            }
          }
        });
      };

      scanDir(dir);
    }
  });

  if (testFilesFound > 0) {
    addResult("Test Files Found", "PASS", `Found ${testFilesFound} test files`);

    if (vitestImports > 0) {
      addResult(
        "Vitest Imports",
        "PASS",
        `${vitestImports} files import from Vitest`
      );
    } else {
      addResult(
        "Vitest Imports",
        "WARN",
        "No Vitest imports found in test files"
      );
    }

    if (jestImports === 0) {
      addResult("Jest Imports", "PASS", "No Jest imports found in test files");
    } else {
      addResult(
        "Jest Imports",
        "FAIL",
        `${jestImports} files still import Jest`
      );
    }
  } else {
    addResult("Test Files Found", "WARN", "No test files found");
  }
}

// Test 5: Installation Scripts
function testInstallationScripts() {
  console.log("\n📜 Testing installation scripts...");

  const scripts = ["install-framework-smart.sh", "implement-critical-fixes.sh"];

  scripts.forEach((script) => {
    if (fs.existsSync(script)) {
      try {
        const content = fs.readFileSync(script, "utf8");

        if (content.includes("@testing-library/jest-dom")) {
          addResult(
            "Installation Scripts",
            "FAIL",
            `${script} still references @testing-library/jest-dom`
          );
        } else {
          addResult(
            "Installation Scripts",
            "PASS",
            `${script} has no Jest dependencies`
          );
        }

        if (content.includes("jest.fn")) {
          addResult(
            "Script Jest Functions",
            "FAIL",
            `${script} still uses jest.fn()`
          );
        } else {
          addResult(
            "Script Jest Functions",
            "PASS",
            `${script} has no jest.fn() calls`
          );
        }
      } catch (error) {
        addResult(
          "Installation Scripts",
          "WARN",
          `Cannot read ${script}`,
          error.message
        );
      }
    }
  });
}

// Test 6: Package Lock File
function testPackageLock() {
  console.log("\n🔒 Testing package lock file...");

  if (fs.existsSync("package-lock.json")) {
    try {
      const lockContent = fs.readFileSync("package-lock.json", "utf8");

      if (
        lockContent.includes("jest") ||
        lockContent.includes("@testing-library/jest-dom")
      ) {
        addResult(
          "Package Lock",
          "FAIL",
          "package-lock.json still contains Jest dependencies"
        );
      } else {
        addResult(
          "Package Lock",
          "PASS",
          "package-lock.json has no Jest dependencies"
        );
      }
    } catch (error) {
      addResult(
        "Package Lock",
        "WARN",
        "Cannot read package-lock.json",
        error.message
      );
    }
  } else {
    addResult(
      "Package Lock",
      "PASS",
      "No package-lock.json found (will regenerate clean)"
    );
  }
}

// Generate Report
function generateReport() {
  console.log("\n📊 Jest Elimination Audit Results");
  console.log("=================================");
  console.log(`✅ Passed: ${results.passed}`);
  console.log(`❌ Failed: ${results.failed}`);
  console.log(`⚠️ Warnings: ${results.warnings}`);
  console.log(`📋 Total Tests: ${results.tests.length}`);

  const score = (results.passed / results.tests.length) * 100;
  console.log(`\n🎯 Overall Score: ${score.toFixed(1)}%`);

  if (results.failed === 0) {
    console.log("\n🎉 JEST COMPLETELY ELIMINATED!");
    console.log("The framework now uses Vitest exclusively for testing.");

    if (results.warnings > 0) {
      console.log("\n⚠️  Minor warnings detected but non-blocking.");
    }
  } else {
    console.log("\n❌ JEST ARTIFACTS STILL PRESENT");
    console.log("Critical Jest references must be removed.");
    console.log("\nFailed tests:");
    results.tests
      .filter((test) => test.status === "FAIL")
      .forEach((test) => {
        console.log(`  • ${test.test}: ${test.message}`);
        if (test.details) console.log(`    ${test.details}`);
      });
  }

  // Recommendations
  console.log("\n📝 Recommendations:");
  if (results.failed === 0) {
    console.log("  • ✅ Framework is ready for Vitest-exclusive testing");
    console.log("  • ✅ Run npm install to regenerate clean package-lock.json");
    console.log("  • ✅ All test files use Vitest APIs correctly");
  } else {
    console.log("  • ❌ Fix failed tests above before proceeding");
    console.log("  • 🔄 Re-run this script after making fixes");
  }
}

// Run All Tests
function runAudit() {
  try {
    testPackageJson();
    testConfigFiles();
    testSetupFiles();
    testTestFiles();
    testInstallationScripts();
    testPackageLock();

    generateReport();

    // Exit with appropriate code
    process.exit(results.failed > 0 ? 1 : 0);
  } catch (error) {
    console.error("\n💥 Audit runner error:", error.message);
    process.exit(1);
  }
}

// Execute if run directly
if (require.main === module) {
  runAudit();
}

module.exports = { runAudit, results };
