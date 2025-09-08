#!/usr/bin/env node

/**
 * AI-SDLC Framework Installation Validator
 * Tests framework installation in a clean environment
 */

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

console.log("🧪 AI-SDLC Framework Installation Validator");
console.log("==========================================\n");

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

// Test 1: Framework File Structure
function testFrameworkStructure() {
  console.log("\n📁 Testing Framework Structure...");

  const requiredFiles = [
    "../.github/workflows/ci-simplified.yml",
    "../.github/workflows/ai-code-review.yml",
    "../.github/workflows/sonarcloud-analysis.yml",
    "../.github/workflows/sonarcloud-pr-analysis.yml",
    "../.github/workflows/dependabot-auto-merge.yml",
    "../.github/dependabot.yml",
    "../.pr_agent.toml",
    "../sonar-project.properties",
    "../eslint.config.mjs",
    "../vitest.config.js",
    "../package.json",
    "../README.md",
    "../CONTRIBUTING.md",
    "../SECURITY.md",
    "../LICENSE",
  ];

  for (const file of requiredFiles) {
    if (fs.existsSync(path.join(__dirname, file))) {
      addResult("File Structure", "PASS", `${path.basename(file)} exists`);
    } else {
      addResult(
        "File Structure",
        "FAIL",
        `${path.basename(file)} missing`,
        file
      );
    }
  }
}

// Test 2: Workflow Syntax Validation
function testWorkflowSyntax() {
  console.log("\n⚙️ Testing Workflow Syntax...");

  const workflowDir = path.join(__dirname, "../.github/workflows");
  if (!fs.existsSync(workflowDir)) {
    addResult("Workflow Syntax", "FAIL", "Workflows directory missing");
    return;
  }

  const workflowFiles = fs
    .readdirSync(workflowDir)
    .filter((f) => f.endsWith(".yml"));

  for (const file of workflowFiles) {
    try {
      const content = fs.readFileSync(path.join(workflowDir, file), "utf8");

      // Basic YAML structure checks
      if (
        content.includes("name:") &&
        content.includes("on:") &&
        content.includes("jobs:")
      ) {
        addResult("Workflow Syntax", "PASS", `${file} has valid structure`);
      } else {
        addResult(
          "Workflow Syntax",
          "FAIL",
          `${file} missing required sections`
        );
      }

      // Check for deprecated workflows
      if (content.includes("DEPRECATED")) {
        addResult(
          "Workflow Syntax",
          "WARN",
          `${file} is deprecated`,
          "Should only trigger manually"
        );
      }
    } catch (error) {
      addResult(
        "Workflow Syntax",
        "FAIL",
        `${file} syntax error`,
        error.message
      );
    }
  }
}

// Test 3: Configuration File Validation
function testConfiguration() {
  console.log("\n🔧 Testing Configuration Files...");

  // Test package.json
  try {
    const packageJson = JSON.parse(
      fs.readFileSync(path.join(__dirname, "../package.json"))
    );

    if (packageJson.scripts && packageJson.scripts["quality-gates"]) {
      addResult(
        "Configuration",
        "PASS",
        "package.json has quality-gates script"
      );
    } else {
      addResult(
        "Configuration",
        "FAIL",
        "package.json missing quality-gates script"
      );
    }

    if (packageJson.devDependencies && packageJson.devDependencies.vitest) {
      addResult("Configuration", "PASS", "Vitest configured");
    } else {
      addResult("Configuration", "FAIL", "Vitest not configured");
    }
  } catch (error) {
    addResult("Configuration", "FAIL", "package.json invalid", error.message);
  }

  // Test PR Agent config
  try {
    const prAgentConfig = fs.readFileSync(
      path.join(__dirname, "../.pr_agent.toml"),
      "utf8"
    );
    if (prAgentConfig.includes("FCRA")) {
      addResult("Configuration", "PASS", "PR Agent has FCRA compliance config");
    } else {
      addResult(
        "Configuration",
        "WARN",
        "PR Agent config may be missing FCRA settings"
      );
    }
  } catch (error) {
    addResult(
      "Configuration",
      "FAIL",
      "PR Agent config missing or invalid",
      error.message
    );
  }

  // Test SonarCloud config
  try {
    const sonarConfig = fs.readFileSync(
      path.join(__dirname, "../sonar-project.properties"),
      "utf8"
    );
    if (
      sonarConfig.includes("sonar.projectKey") &&
      sonarConfig.includes("sonar.organization")
    ) {
      addResult(
        "Configuration",
        "PASS",
        "SonarCloud config has required fields"
      );
    } else {
      addResult(
        "Configuration",
        "FAIL",
        "SonarCloud config missing required fields"
      );
    }
  } catch (error) {
    addResult(
      "Configuration",
      "FAIL",
      "SonarCloud config missing or invalid",
      error.message
    );
  }
}

// Test 4: Documentation Completeness
function testDocumentation() {
  console.log("\n📖 Testing Documentation...");

  const docs = [
    {
      file: "../README.md",
      required: ["installation", "Quick Start", "What This Framework Enforces"],
    },
    {
      file: "../CONTRIBUTING.md",
      required: ["Quality Gates", "AI Commands", "FCRA Compliance"],
    },
    {
      file: "../SECURITY.md",
      required: ["Security Policy", "Reporting", "FCRA"],
    },
  ];

  for (const doc of docs) {
    try {
      const content = fs
        .readFileSync(path.join(__dirname, doc.file), "utf8")
        .toLowerCase();

      let foundSections = 0;
      for (const section of doc.required) {
        if (content.includes(section.toLowerCase())) {
          foundSections++;
        }
      }

      if (foundSections === doc.required.length) {
        addResult(
          "Documentation",
          "PASS",
          `${path.basename(doc.file)} complete`
        );
      } else {
        addResult(
          "Documentation",
          "WARN",
          `${path.basename(doc.file)} missing ${doc.required.length - foundSections} sections`
        );
      }
    } catch (error) {
      addResult(
        "Documentation",
        "FAIL",
        `${path.basename(doc.file)} missing or invalid`,
        error.message
      );
    }
  }
}

// Test 5: Installation Dependencies
function testDependencies() {
  console.log("\n📦 Testing Installation Dependencies...");

  try {
    const packageJson = JSON.parse(
      fs.readFileSync(path.join(__dirname, "../package.json"))
    );

    const criticalDeps = ["vitest", "eslint", "prettier", "husky"];
    const missingDeps = criticalDeps.filter(
      (dep) =>
        !packageJson.devDependencies?.[dep] && !packageJson.dependencies?.[dep]
    );

    if (missingDeps.length === 0) {
      addResult("Dependencies", "PASS", "All critical dependencies present");
    } else {
      addResult(
        "Dependencies",
        "FAIL",
        `Missing dependencies: ${missingDeps.join(", ")}`
      );
    }
  } catch (error) {
    addResult(
      "Dependencies",
      "FAIL",
      "Cannot validate dependencies",
      error.message
    );
  }
}

// Test 6: Security Configuration
function testSecurity() {
  console.log("\n🔒 Testing Security Configuration...");

  try {
    // Check .gitignore
    const gitignore = fs.readFileSync(
      path.join(__dirname, "../.gitignore"),
      "utf8"
    );
    const securityPatterns = [".env", "*secret*", "*key*", "*token*"];

    let foundPatterns = 0;
    for (const pattern of securityPatterns) {
      if (gitignore.includes(pattern)) {
        foundPatterns++;
      }
    }

    if (foundPatterns >= 3) {
      addResult("Security", "PASS", "Gitignore has security patterns");
    } else {
      addResult(
        "Security",
        "WARN",
        "Gitignore may be missing security patterns"
      );
    }
  } catch (error) {
    addResult(
      "Security",
      "FAIL",
      "Cannot validate security config",
      error.message
    );
  }

  // Check workflows don't have hardcoded secrets
  const workflowDir = path.join(__dirname, "../.github/workflows");
  if (fs.existsSync(workflowDir)) {
    const workflowFiles = fs
      .readdirSync(workflowDir)
      .filter((f) => f.endsWith(".yml"));
    let hardcodedSecrets = 0;

    for (const file of workflowFiles) {
      const content = fs.readFileSync(path.join(workflowDir, file), "utf8");
      // Basic check for potential hardcoded secrets (very simple regex)
      if (/[A-Za-z0-9]{20,}/.test(content) && !content.includes("secrets.")) {
        hardcodedSecrets++;
      }
    }

    if (hardcodedSecrets === 0) {
      addResult("Security", "PASS", "No hardcoded secrets detected");
    } else {
      addResult(
        "Security",
        "WARN",
        `Potential hardcoded values in ${hardcodedSecrets} workflows`
      );
    }
  }
}

// Test 7: Auto-Healing Components
function testAutoHealing() {
  console.log("\n🔄 Testing Auto-Healing Components...");

  // Check for auto-healing scripts
  const autoHealingFiles = [
    "../scripts-complex/playwright-auto-healing.js",
    "../scripts-complex/apply-auto-heal-learnings.js",
    "../.github/workflows/ai-generate-learnings.yml",
  ];

  let foundFiles = 0;
  for (const file of autoHealingFiles) {
    if (fs.existsSync(path.join(__dirname, file))) {
      foundFiles++;
      addResult("Auto-Healing", "PASS", `${path.basename(file)} exists`);
    }
  }

  if (foundFiles === 0) {
    addResult("Auto-Healing", "WARN", "No auto-healing components found");
  }

  // Check README for consolidated auto-healing docs
  try {
    const readme = fs.readFileSync(
      path.join(__dirname, "../README.md"),
      "utf8"
    );
    if (
      readme.includes("Auto-Healing Test Features") ||
      readme.includes("Self-Healing")
    ) {
      addResult("Auto-Healing", "PASS", "Auto-healing documented in README");
    } else {
      addResult(
        "Auto-Healing",
        "WARN",
        "Auto-healing documentation may be missing"
      );
    }
  } catch (error) {
    addResult(
      "Auto-Healing",
      "FAIL",
      "Cannot validate auto-healing docs",
      error.message
    );
  }
}

// Test 8: Installation Readiness
function testInstallationReadiness() {
  console.log("\n🚀 Testing Installation Readiness...");

  // Check for bootstrap script
  if (fs.existsSync(path.join(__dirname, "../scripts/bootstrap.sh"))) {
    addResult("Installation", "PASS", "Bootstrap script exists");
  } else {
    addResult("Installation", "FAIL", "Bootstrap script missing");
  }

  // Check for teardown script
  if (fs.existsSync(path.join(__dirname, "../scripts/teardown.sh"))) {
    addResult("Installation", "PASS", "Teardown script exists");
  } else {
    addResult("Installation", "WARN", "Teardown script missing");
  }

  // Check deployment validation
  if (
    fs.existsSync(path.join(__dirname, "../DEPLOYMENT_VALIDATION_REPORT.md"))
  ) {
    addResult("Installation", "PASS", "Deployment validation report exists");
  } else {
    addResult("Installation", "WARN", "Deployment validation report missing");
  }
}

// Generate Test Report
function generateReport() {
  console.log("\n📊 Test Results Summary");
  console.log("======================");
  console.log(`✅ Passed: ${results.passed}`);
  console.log(`❌ Failed: ${results.failed}`);
  console.log(`⚠️ Warnings: ${results.warnings}`);
  console.log(`📋 Total Tests: ${results.tests.length}`);

  const score = (results.passed / results.tests.length) * 100;
  console.log(`\n🎯 Overall Score: ${score.toFixed(1)}%`);

  if (results.failed === 0 && results.warnings <= 3) {
    console.log("\n🎉 FRAMEWORK INSTALLATION READY!");
    console.log("The framework is ready for deployment to new repositories.");
  } else if (results.failed === 0) {
    console.log("\n⚠️  FRAMEWORK MOSTLY READY");
    console.log("Framework can be deployed but has some warnings to address.");
  } else {
    console.log("\n❌ FRAMEWORK NEEDS FIXES");
    console.log("Critical issues must be resolved before deployment.");
  }

  // Write detailed results
  const reportDir = path.join(__dirname, "test-results");
  if (!fs.existsSync(reportDir)) {
    fs.mkdirSync(reportDir, { recursive: true });
  }

  fs.writeFileSync(
    path.join(reportDir, "installation-validation.json"),
    JSON.stringify(results, null, 2)
  );

  console.log(
    "\n📄 Detailed results saved to: test-results/installation-validation.json"
  );
}

// Run All Tests
async function runTests() {
  try {
    testFrameworkStructure();
    testWorkflowSyntax();
    testConfiguration();
    testDocumentation();
    testDependencies();
    testSecurity();
    testAutoHealing();
    testInstallationReadiness();

    generateReport();
  } catch (error) {
    console.error("\n💥 Test runner error:", error.message);
    process.exit(1);
  }
}

// Execute if run directly
if (require.main === module) {
  runTests();
}

module.exports = { runTests, results };
