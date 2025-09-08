#!/usr/bin/env node

/**
 * Deployment Readiness Validation Script
 * Final comprehensive check before deploying changes
 */

const fs = require("fs");
const path = require("path");

console.log("🚀 Deployment Readiness Validation");
console.log("===================================\n");

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

// Test 1: Validate Core Framework Files
function testCoreFiles() {
  console.log("\n📁 Testing core framework files...");

  const criticalFiles = [
    "package.json",
    "vitest.config.js",
    "src/test/setup.js",
    ".github/workflows/ci-simplified.yml",
    ".github/workflows/ai-code-review.yml",
    "README.md",
    "JEST_ELIMINATION_REPORT.md",
  ];

  criticalFiles.forEach((file) => {
    if (fs.existsSync(file)) {
      addResult("Core Files", "PASS", `${file} exists`);
    } else {
      addResult(
        "Core Files",
        "FAIL",
        `${file} missing`,
        "Critical file not found"
      );
    }
  });
}

// Test 2: Validate Package.json Configuration
function testPackageConfiguration() {
  console.log("\n📦 Testing package.json configuration...");

  try {
    const packageJson = JSON.parse(fs.readFileSync("package.json", "utf8"));

    // Check test scripts use Vitest
    const testScripts = Object.keys(packageJson.scripts || {}).filter(
      (script) => script.includes("test")
    );

    let vitestScriptCount = 0;
    testScripts.forEach((script) => {
      if (packageJson.scripts[script].includes("vitest")) {
        vitestScriptCount++;
      }
    });

    if (vitestScriptCount > 0) {
      addResult(
        "Test Scripts",
        "PASS",
        `${vitestScriptCount} Vitest scripts configured`
      );
    } else {
      addResult("Test Scripts", "FAIL", "No Vitest test scripts found");
    }

    // Check for Vitest dependencies
    const allDeps = {
      ...(packageJson.dependencies || {}),
      ...(packageJson.devDependencies || {}),
    };

    if (allDeps.vitest) {
      addResult(
        "Vitest Dependency",
        "PASS",
        `Vitest ${allDeps.vitest} configured`
      );
    } else {
      addResult("Vitest Dependency", "FAIL", "Vitest dependency missing");
    }

    // Check for Jest remnants
    const jestDeps = Object.keys(allDeps).filter((dep) => dep.includes("jest"));
    if (jestDeps.length === 0) {
      addResult("Jest Elimination", "PASS", "No Jest dependencies found");
    } else {
      addResult(
        "Jest Elimination",
        "FAIL",
        `Jest dependencies still present: ${jestDeps.join(", ")}`
      );
    }
  } catch (error) {
    addResult(
      "Package Configuration",
      "FAIL",
      "Cannot read package.json",
      error.message
    );
  }
}

// Test 3: Validate Workflow Files
function testWorkflowFiles() {
  console.log("\n⚙️ Testing GitHub workflow files...");

  const workflowDir = ".github/workflows";
  if (!fs.existsSync(workflowDir)) {
    addResult("Workflow Directory", "FAIL", "Workflows directory missing");
    return;
  }

  const activeWorkflows = [
    "ci-simplified.yml",
    "ai-code-review.yml",
    "sonarcloud-analysis.yml",
    "sonarcloud-pr-analysis.yml",
    "dependabot-auto-merge.yml",
  ];

  activeWorkflows.forEach((workflow) => {
    const workflowPath = path.join(workflowDir, workflow);
    if (fs.existsSync(workflowPath)) {
      try {
        const content = fs.readFileSync(workflowPath, "utf8");

        // Basic YAML validation
        if (
          content.includes("name:") &&
          content.includes("on:") &&
          content.includes("jobs:")
        ) {
          addResult(
            "Workflow Syntax",
            "PASS",
            `${workflow} has valid structure`
          );
        } else {
          addResult(
            "Workflow Syntax",
            "FAIL",
            `${workflow} missing required sections`
          );
        }

        // Check for proper Vitest usage in CI
        if (workflow === "ci-simplified.yml" && content.includes("vitest")) {
          addResult("CI Vitest Integration", "PASS", "CI workflow uses Vitest");
        }
      } catch (error) {
        addResult(
          "Workflow Syntax",
          "FAIL",
          `${workflow} read error`,
          error.message
        );
      }
    } else {
      addResult("Workflow Files", "FAIL", `${workflow} missing`);
    }
  });
}

// Test 4: Validate Test Files
function testTestFiles() {
  console.log("\n🧪 Testing test file configuration...");

  const testDirs = ["tests", "test"];
  let testFilesFound = 0;
  let vitestImports = 0;
  let playwrightImports = 0;
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

              if (content.includes('from "@playwright/test"')) {
                playwrightImports++;
              }

              if (
                content.includes('from "jest"') ||
                content.includes("jest.")
              ) {
                jestImports++;
                addResult(
                  "Jest in Tests",
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
    addResult("Test Files", "PASS", `Found ${testFilesFound} test files`);

    if (vitestImports > 0) {
      addResult(
        "Vitest Integration",
        "PASS",
        `${vitestImports} files use Vitest`
      );
    }

    if (playwrightImports > 0) {
      addResult(
        "Playwright Integration",
        "PASS",
        `${playwrightImports} files use Playwright`
      );
    }

    if (jestImports === 0) {
      addResult("Jest Elimination", "PASS", "No Jest usage in test files");
    }
  } else {
    addResult("Test Files", "WARN", "No test files found");
  }
}

// Test 5: Validate Documentation
function testDocumentation() {
  console.log("\n📖 Testing documentation completeness...");

  const docs = [
    {
      file: "README.md",
      required: [
        "Jest Elimination",
        "Installation Testing",
        "Deployment Guide",
      ],
    },
    {
      file: "JEST_ELIMINATION_REPORT.md",
      required: ["Status", "COMPLETE", "Vitest Exclusive"],
    },
    {
      file: "NEW_REPOSITORY_DEPLOYMENT_GUIDE.md",
      required: ["Step 1", "Step 2", "GitHub Secrets"],
    },
  ];

  docs.forEach((doc) => {
    if (fs.existsSync(doc.file)) {
      try {
        const content = fs.readFileSync(doc.file, "utf8");
        let foundSections = 0;

        doc.required.forEach((section) => {
          if (content.includes(section)) {
            foundSections++;
          }
        });

        if (foundSections === doc.required.length) {
          addResult("Documentation", "PASS", `${doc.file} complete`);
        } else {
          addResult(
            "Documentation",
            "WARN",
            `${doc.file} missing ${doc.required.length - foundSections} required sections`
          );
        }
      } catch (error) {
        addResult(
          "Documentation",
          "FAIL",
          `Cannot read ${doc.file}`,
          error.message
        );
      }
    } else {
      addResult("Documentation", "FAIL", `${doc.file} missing`);
    }
  });
}

// Test 6: Validate Installation Scripts
function testInstallationScripts() {
  console.log("\n📜 Testing installation scripts...");

  const scripts = ["install-framework-smart.sh", "implement-critical-fixes.sh"];

  scripts.forEach((script) => {
    if (fs.existsSync(script)) {
      try {
        const content = fs.readFileSync(script, "utf8");

        // Check for Jest remnants
        if (content.includes("@testing-library/jest-dom")) {
          addResult(
            "Installation Scripts",
            "FAIL",
            `${script} still references Jest`
          );
        } else {
          addResult("Installation Scripts", "PASS", `${script} is Jest-free`);
        }

        // Check for Vitest references
        if (content.includes("vitest-dom") || content.includes("vi.fn")) {
          addResult("Vitest Integration", "PASS", `${script} uses Vitest`);
        }
      } catch (error) {
        addResult(
          "Installation Scripts",
          "WARN",
          `Cannot read ${script}`,
          error.message
        );
      }
    } else {
      addResult("Installation Scripts", "WARN", `${script} not found`);
    }
  });
}

// Generate Final Report
function generateReport() {
  console.log("\n📊 Deployment Readiness Report");
  console.log("==============================");
  console.log(`✅ Passed: ${results.passed}`);
  console.log(`❌ Failed: ${results.failed}`);
  console.log(`⚠️ Warnings: ${results.warnings}`);
  console.log(`📋 Total Tests: ${results.tests.length}`);

  const score = (results.passed / results.tests.length) * 100;
  console.log(`\n🎯 Overall Score: ${score.toFixed(1)}%`);

  if (results.failed === 0) {
    console.log("\n🚀 READY FOR DEPLOYMENT!");
    console.log("All validation checks passed successfully.");

    if (results.warnings > 0) {
      console.log(`\n⚠️  ${results.warnings} warnings detected (non-blocking)`);
    }
  } else {
    console.log("\n❌ DEPLOYMENT BLOCKED");
    console.log("Critical issues must be resolved before deployment.");

    console.log("\nFailed tests:");
    results.tests
      .filter((test) => test.status === "FAIL")
      .forEach((test) => {
        console.log(`  • ${test.test}: ${test.message}`);
        if (test.details) console.log(`    ${test.details}`);
      });
  }

  // Post-deployment monitoring guidance
  console.log("\n📈 Post-Deployment Monitoring:");
  console.log("  • Monitor GitHub Actions tab for workflow execution");
  console.log("  • Verify all workflows complete within expected timeframes");
  console.log("  • Check for any error messages in workflow logs");
  console.log("  • Confirm AI features and SonarCloud integration work");
  console.log("  • Test a sample PR to verify AI code review functionality");

  console.log("\n🎯 Expected Results:");
  console.log("  • CI/CD workflows: < 15 minutes");
  console.log("  • AI code reviews: < 10 minutes");
  console.log("  • SonarCloud analysis: < 10 minutes");
  console.log("  • All workflows show green checkmarks");

  return results.failed === 0;
}

// Run All Validations
function runValidation() {
  try {
    testCoreFiles();
    testPackageConfiguration();
    testWorkflowFiles();
    testTestFiles();
    testDocumentation();
    testInstallationScripts();

    const isReady = generateReport();
    process.exit(isReady ? 0 : 1);
  } catch (error) {
    console.error("\n💥 Validation error:", error.message);
    process.exit(1);
  }
}

// Execute if run directly
if (require.main === module) {
  runValidation();
}

module.exports = { runValidation, results };
