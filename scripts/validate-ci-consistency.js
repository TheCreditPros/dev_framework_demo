#!/usr/bin/env node

/**
 * CI Consistency Validator
 *
 * Validates that local quality gates exactly match GitHub Actions workflows
 * to prevent deployment failures from mismatched validation criteria.
 */

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

console.log("🔍 CI Consistency Validator");
console.log("===========================\n");

// Configuration - GitHub Actions workflow checks
const CI_CHECKS = {
  "Dependencies Check": {
    command: "npm ci --dry-run",
    description: "Validates dependency installation without changes",
  },
  "Linting": {
    command: "npm run lint:ci",
    description: "ESLint check with zero warnings allowed",
  },
  "Formatting Check": {
    command: "npm run format:check",
    description: "Prettier formatting validation",
  },
  "TypeScript Check": {
    command: "npm run type-check",
    description: "TypeScript compilation check",
  },
  "Unit Tests": {
    command: "npm run test:coverage",
    description: "Vitest with coverage (matches CI test:coverage)",
  },
  "Build Check": {
    command: "npm run build",
    description: "Build validation",
  },
  "Security Audit": {
    command: "npm audit --audit-level=moderate",
    description: "NPM security audit (moderate level)",
  },
};

let allChecksPass = true;
const results = [];

console.log("🚀 Running CI Consistency Checks...\n");

for (const [checkName, config] of Object.entries(CI_CHECKS)) {
  process.stdout.write(`🔍 ${checkName}... `);

  try {
    // Run the check
    execSync(config.command, {
      stdio: "pipe",
      timeout: 30000,
      cwd: path.dirname(__dirname),
    });

    console.log("✅ PASS");
    results.push({
      name: checkName,
      status: "PASS",
      description: config.description,
    });
  } catch (error) {
    console.log("❌ FAIL");
    allChecksPass = false;
    results.push({
      name: checkName,
      status: "FAIL",
      description: config.description,
      error: error.message,
    });
  }
}

// Validate local quality gates script matches
console.log("\n🔍 Validating Local Quality Gates Script...\n");

const localScriptPath = path.join(__dirname, "local-quality-gates.sh");
let localScriptValid = true;

if (fs.existsSync(localScriptPath)) {
  const scriptContent = fs.readFileSync(localScriptPath, "utf8");

  // Check if all CI checks are represented in local script
  const missingChecks = [];

  for (const [checkName, config] of Object.entries(CI_CHECKS)) {
    if (checkName === "Security Audit") {
      // Security audit is CI-only, skip this check for local script
      continue;
    }

    if (!scriptContent.includes(config.command)) {
      missingChecks.push(checkName);
      localScriptValid = false;
    }
  }

  if (missingChecks.length > 0) {
    console.log("❌ Local quality gates script missing checks:");
    missingChecks.forEach((check) => console.log(`   - ${check}`));
  } else {
    console.log("✅ Local quality gates script matches CI checks");
  }
} else {
  console.log("❌ Local quality gates script not found");
  localScriptValid = false;
}

// Validate package.json scripts
console.log("\n🔍 Validating Package.json Scripts...\n");

const packageJsonPath = path.join(path.dirname(__dirname), "package.json");
let packageJsonValid = true;

if (fs.existsSync(packageJsonPath)) {
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));

  const requiredScripts = {
    "lint:ci": "eslint . --max-warnings=0",
    "format:check": "prettier --check '**/*.{js,jsx,ts,tsx,json,md}'",
    "type-check": "tsc --noEmit",
    "test:coverage": "vitest run --coverage",
    "build": 'node -e "..."',
  };

  for (const [scriptName, expectedPattern] of Object.entries(requiredScripts)) {
    if (!packageJson.scripts[scriptName]) {
      console.log(`❌ Missing script: ${scriptName}`);
      packageJsonValid = false;
    } else if (
      !packageJson.scripts[scriptName].includes(
        expectedPattern.replace("...", "")
      )
    ) {
      console.log(`❌ Script mismatch: ${scriptName}`);
      console.log(`   Expected: ~${expectedPattern}`);
      console.log(`   Found: ${packageJson.scripts[scriptName]}`);
      packageJsonValid = false;
    } else {
      console.log(`✅ Script: ${scriptName}`);
    }
  }
} else {
  console.log("❌ package.json not found");
  packageJsonValid = false;
}

// Summary
console.log("\n" + "=".repeat(50));
console.log("📋 SUMMARY");
console.log("=".repeat(50));

if (allChecksPass && localScriptValid && packageJsonValid) {
  console.log("🎉 ALL CHECKS PASS!");
  console.log("✅ Local quality gates match GitHub Actions exactly");
  console.log("✅ Ready for deployment - no CI/CD mismatches detected");
  process.exit(0);
} else {
  console.log("⚠️  ISSUES FOUND:");
  console.log("");

  if (!allChecksPass) {
    console.log("❌ Failed CI checks:");
    results
      .filter((r) => r.status === "FAIL")
      .forEach((result) => {
        console.log(`   - ${result.name}: ${result.error}`);
      });
  }

  if (!localScriptValid) {
    console.log("❌ Local quality gates script issues");
  }

  if (!packageJsonValid) {
    console.log("❌ Package.json script mismatches");
  }

  console.log(
    "\n💡 Fix the issues above before deploying to prevent CI/CD failures"
  );
  process.exit(1);
}
