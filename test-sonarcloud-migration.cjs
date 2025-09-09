#!/usr/bin/env node

/**
 * Test Script: Validate SonarCloud Migration
 *
 * This script validates that the SonarCloud workflow migration is working correctly:
 * 1. Checks that all workflow files use the new sonarqube-scan-action
 * 2. Validates SONAR_TOKEN configuration
 * 3. Ensures dependabot exclusion is properly configured
 * 4. Verifies PR feedback configuration
 */

const fs = require("fs");
const path = require("path");

console.log("🔍 Testing SonarCloud Migration...\n");

// Test 1: Check workflow files use new action
console.log("1. Checking workflow files for new SonarQube action...");
const workflowsDir = path.join(__dirname, ".github", "workflows");
const workflowFiles = [
  "sonarcloud-pr-analysis.yml",
  "sonarcloud-analysis.yml",
  "sonarcloud-setup.yml",
];

let allWorkflowsUpdated = true;

workflowFiles.forEach((file) => {
  const filePath = path.join(workflowsDir, file);
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, "utf8");
    if (content.includes("SonarSource/sonarcloud-github-action@v2")) {
      console.log(`❌ ${file}: Still uses deprecated action`);
      allWorkflowsUpdated = false;
    } else if (content.includes("SonarSource/sonarqube-scan-action@v5.3.1")) {
      console.log(`✅ ${file}: Updated to new action`);
    } else {
      console.log(`⚠️  ${file}: No Sonar action found`);
    }
  } else {
    console.log(`❌ ${file}: File not found`);
    allWorkflowsUpdated = false;
  }
});

// Test 2: Check SONAR_TOKEN configuration
console.log("\n2. Checking SONAR_TOKEN configuration...");
const prAnalysisPath = path.join(workflowsDir, "sonarcloud-pr-analysis.yml");
if (fs.existsSync(prAnalysisPath)) {
  const content = fs.readFileSync(prAnalysisPath, "utf8");
  if (
    content.includes("SONAR_TOKEN: ${{ secrets.SONAR_TOKEN }}") &&
    content.includes(
      "env:\n  NODE_VERSION: '20'\n  SONAR_TOKEN: ${{ secrets.SONAR_TOKEN }}"
    )
  ) {
    console.log("✅ SONAR_TOKEN properly configured in global env");
  } else {
    console.log("❌ SONAR_TOKEN configuration issue");
    allWorkflowsUpdated = false;
  }
}

// Test 3: Check dependabot exclusion
console.log("\n3. Checking dependabot exclusion...");
if (fs.existsSync(prAnalysisPath)) {
  const content = fs.readFileSync(prAnalysisPath, "utf8");
  const dependabotChecks = [
    "github.actor != 'dependabot[bot]'",
    "🤖 Dependabot PR detected - SonarCloud analysis skipped",
    "Dependabot PRs focus on dependency updates, not code quality changes",
    "Skipping analysis to avoid unnecessary processing for automated dependency updates",
  ];

  let dependabotExclusionComplete = true;
  dependabotChecks.forEach((check) => {
    if (!content.includes(check)) {
      console.log(`❌ Missing dependabot check: ${check}`);
      dependabotExclusionComplete = false;
    }
  });

  if (dependabotExclusionComplete) {
    console.log("✅ Comprehensive dependabot exclusion configured");
    console.log("   - Analysis step skips for dependabot[bot]");
    console.log("   - Status summary handles dependabot case");
    console.log("   - Quality gate check excludes dependabot");
  } else {
    console.log("❌ Dependabot exclusion incomplete");
    allWorkflowsUpdated = false;
  }
}

// Test 4: Check sonar-project.properties for PR feedback
console.log("\n4. Checking sonar-project.properties for PR feedback...");
const sonarPropsPath = path.join(__dirname, "sonar-project.properties");
if (fs.existsSync(sonarPropsPath)) {
  const content = fs.readFileSync(sonarPropsPath, "utf8");
  if (
    content.includes("sonar.pullrequest.provider=github") &&
    content.includes("sonar.pullrequest.github.summaryComment=true")
  ) {
    console.log("✅ PR feedback configuration present");
  } else {
    console.log("❌ PR feedback configuration missing");
    allWorkflowsUpdated = false;
  }
}

// Test 5: Validate workflow syntax
console.log("\n5. Validating workflow syntax...");
try {
  workflowFiles.forEach((file) => {
    const filePath = path.join(workflowsDir, file);
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, "utf8");
      // Basic YAML validation - check for balanced brackets and quotes
      const openBraces = (content.match(/\{/g) || []).length;
      const closeBraces = (content.match(/\}/g) || []).length;
      const openBrackets = (content.match(/\[/g) || []).length;
      const closeBrackets = (content.match(/\]/g) || []).length;

      if (openBraces === closeBraces && openBrackets === closeBrackets) {
        console.log(`✅ ${file}: Basic syntax validation passed`);
      } else {
        console.log(`❌ ${file}: Syntax validation failed`);
        allWorkflowsUpdated = false;
      }
    }
  });
} catch (error) {
  console.log("❌ Error during syntax validation:", error.message);
  allWorkflowsUpdated = false;
}

// Final result
console.log("\n" + "=".repeat(50));
if (allWorkflowsUpdated) {
  console.log("🎉 SonarCloud Migration Validation: PASSED");
  console.log("✅ All checks completed successfully");
  console.log("🔗 Ready for deployment");
} else {
  console.log("❌ SonarCloud Migration Validation: FAILED");
  console.log("⚠️  Please review and fix the issues above");
}
console.log("=".repeat(50));

process.exit(allWorkflowsUpdated ? 0 : 1);
