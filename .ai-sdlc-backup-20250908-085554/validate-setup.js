#!/usr/bin/env node

import { execSync } from "child_process";
import fs from "fs";

console.log("🔍 Validating AI-SDLC Setup...\n");

// Detect repository type
function detectRepositoryType() {
  const cwd = process.cwd();
  const isTmpDir = cwd.includes("/tmp/") || cwd.includes("\\temp\\");
  const isTestDir =
    cwd.includes("test") || cwd.includes("demo") || cwd.includes("example");
  const hasGitRemote = (() => {
    try {
      execSync("git remote -v", { stdio: "pipe" });
      return true;
    } catch {
      return false;
    }
  })();

  if (isTmpDir || isTestDir) {
    return "test";
  } else if (hasGitRemote) {
    return "production";
  } else {
    return "local";
  }
}

const repoType = detectRepositoryType();
console.log(`📁 Repository Type: ${repoType.toUpperCase()}`);

const checks = [
  {
    name: "ESLint",
    command: "npx eslint --version",
    success: "ESLint available",
  },
  {
    name: "Prettier",
    command: "npx prettier --version",
    success: "Prettier available",
  },
  {
    name: "Husky",
    command: "npx husky --version",
    success: "Husky available",
  },
];

// File existence checks
const fileChecks = [
  {
    name: "ESLint Config",
    file: "eslint.config.mjs",
    isDirectory: false,
  },
  {
    name: "Prettier Config",
    file: ".prettierrc",
    isDirectory: false,
  },
  {
    name: "Husky Hooks",
    file: ".husky",
    isDirectory: true,
  },
  {
    name: "Quality Gates Script",
    file: "scripts/local-quality-gates.sh",
    isDirectory: false,
  },
];

// Git hooks check based on repository type
let gitHooksStatus = "skipped";
if (repoType === "production") {
  try {
    const gitHooksPath = execSync("git config core.hooksPath", {
      encoding: "utf8",
    }).trim();
    if (gitHooksPath === ".husky") {
      // Check if Husky hooks are properly installed
      if (
        fs.existsSync(".husky/pre-commit") &&
        fs.existsSync(".husky/commit-msg")
      ) {
        gitHooksStatus = "configured";
        fileChecks.push({
          name: "Git Hooks (Husky)",
          file: ".husky/pre-commit",
          isDirectory: false,
        });
      } else {
        gitHooksStatus = "missing";
      }
    } else {
      gitHooksStatus = "not-configured";
    }
  } catch {
    gitHooksStatus = "error";
  }
} else if (repoType === "test") {
  // For test repositories, just check if Husky directory exists
  if (fs.existsSync(".husky")) {
    gitHooksStatus = "test-mode";
    fileChecks.push({
      name: "Husky Directory (Test Mode)",
      file: ".husky",
      isDirectory: true,
    });
  }
}

let passed = 0;
const total = checks.length + fileChecks.length;

// Command checks
checks.forEach((check) => {
  try {
    execSync(check.command, { stdio: "ignore" });
    console.log(`✅ ${check.success}`);
    passed++;
  } catch {
    console.log(`❌ ${check.name} not properly configured`);
  }
});

// File existence checks
fileChecks.forEach((check) => {
  try {
    const exists = check.isDirectory
      ? fs.statSync(check.file).isDirectory()
      : fs.statSync(check.file).isFile();

    if (exists) {
      console.log(`✅ ${check.name} configured`);
      passed++;
    } else {
      console.log(`❌ ${check.name} missing`);
    }
  } catch {
    console.log(`❌ ${check.name} missing`);
  }
});

// Git hooks status
console.log(`\n🔗 Git Hooks Status: ${gitHooksStatus.toUpperCase()}`);
if (repoType === "test") {
  console.log("ℹ️  Test repository - Git hooks not required");
} else if (repoType === "production") {
  if (gitHooksStatus === "configured") {
    console.log("✅ Git hooks properly configured for production");
  } else {
    console.log("⚠️  Git hooks need configuration for production use");
  }
}

console.log(`\n📊 Validation Results: ${passed}/${total} checks passed`);

if (passed === total) {
  console.log("🎉 All systems ready for AI-powered development!");
  console.log("🤖 AI-SDLC framework configuration active");

  if (repoType === "test") {
    console.log("🧪 Test environment - ready for validation");
  } else if (repoType === "production") {
    console.log("🚀 Production environment - ready for deployment");
  }
} else {
  console.log("⚠️  Some components need attention. Check documentation.");
}
