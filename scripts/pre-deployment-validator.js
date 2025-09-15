#!/usr/bin/env node

/**
 * Pre-Deployment Validator
 * Validates repository state before deployment
 */

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

class PreDeploymentValidator {
  constructor() {
    this.errors = [];
    this.warnings = [];
    this.projectRoot = path.resolve(__dirname, "..");
  }

  log(message, type = "info") {
    const timestamp = new Date().toISOString();
    const prefix =
      type === "error"
        ? "❌"
        : type === "warning"
          ? "⚠️"
          : type === "success"
            ? "✅"
            : "ℹ️";
    console.log(`[${timestamp}] ${prefix} ${message}`);
  }

  checkFileExists(filePath, description) {
    const fullPath = path.join(this.projectRoot, filePath);
    if (!fs.existsSync(fullPath)) {
      this.errors.push(`${description} not found: ${filePath}`);
      return false;
    }
    this.log(`${description} found`, "success");
    return true;
  }

  checkCommand(command, description) {
    try {
      execSync(command, {
        cwd: this.projectRoot,
        stdio: "pipe",
        timeout: 30000,
      });
      this.log(`${description} passed`, "success");
      return true;
    } catch (error) {
      this.errors.push(`${description} failed: ${error.message}`);
      return false;
    }
  }

  checkPackageJson() {
    const packagePath = path.join(this.projectRoot, "package.json");
    if (!fs.existsSync(packagePath)) {
      this.errors.push("package.json not found");
      return false;
    }

    try {
      const packageJson = JSON.parse(fs.readFileSync(packagePath, "utf8"));

      // Check required fields
      const requiredFields = ["name", "version", "scripts"];
      for (const field of requiredFields) {
        if (!packageJson[field]) {
          this.errors.push(`package.json missing required field: ${field}`);
        }
      }

      // Check required scripts
      const requiredScripts = ["build", "test:coverage", "lint:ci"];
      for (const script of requiredScripts) {
        if (!packageJson.scripts || !packageJson.scripts[script]) {
          this.warnings.push(`Recommended script not found: ${script}`);
        }
      }

      this.log("package.json validation completed", "success");
      return true;
    } catch (error) {
      this.errors.push(`package.json parsing failed: ${error.message}`);
      return false;
    }
  }

  checkGitStatus() {
    try {
      const status = execSync("git status --porcelain", {
        cwd: this.projectRoot,
        encoding: "utf8",
      });

      if (status.trim()) {
        this.warnings.push("Git working directory is not clean");
        this.log(
          "Git status: working directory has uncommitted changes",
          "warning"
        );
      } else {
        this.log("Git working directory is clean", "success");
      }
      return true;
    } catch (error) {
      this.errors.push(`Git status check failed: ${error.message}`);
      return false;
    }
  }

  async runValidation() {
    console.log("🚀 Pre-Deployment Validation");
    console.log("===========================");
    console.log(`📦 Project: ${path.basename(this.projectRoot)}`);
    console.log(`📁 Path: ${this.projectRoot}`);
    console.log("");

    // File existence checks
    this.checkFileExists("package.json", "Package manifest");
    this.checkFileExists("README.md", "Project documentation");
    this.checkFileExists(".github/workflows/ci-simplified.yml", "CI workflow");

    // Package.json validation
    this.checkPackageJson();

    // Git status
    this.checkGitStatus();

    // Command checks
    this.checkCommand("npm ci --dry-run", "Dependency installation");
    this.checkCommand("npm run build", "Build process");
    this.checkCommand("npm run lint:ci", "Code linting");

    // Summary
    console.log("\n📋 VALIDATION SUMMARY");
    console.log("====================");

    if (this.errors.length > 0) {
      console.log(`❌ ${this.errors.length} error(s) found:`);
      this.errors.forEach((error) => console.log(`   - ${error}`));
    }

    if (this.warnings.length > 0) {
      console.log(`⚠️ ${this.warnings.length} warning(s) found:`);
      this.warnings.forEach((warning) => console.log(`   - ${warning}`));
    }

    if (this.errors.length === 0) {
      console.log("✅ Pre-deployment validation PASSED");
      if (this.warnings.length === 0) {
        console.log("🎉 Repository is ready for deployment!");
      } else {
        console.log("⚠️ Repository is ready for deployment (with warnings)");
      }
      return true;
    } else {
      console.log("❌ Pre-deployment validation FAILED");
      console.log("💡 Fix the errors above before deploying");
      return false;
    }
  }
}

// Main execution
if (require.main === module) {
  const validator = new PreDeploymentValidator();

  validator
    .runValidation()
    .then((success) => {
      process.exit(success ? 0 : 1);
    })
    .catch((error) => {
      console.error("❌ Validation failed with error:", error);
      process.exit(1);
    });
}

module.exports = PreDeploymentValidator;
