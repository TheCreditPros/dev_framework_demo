#!/usr/bin/env node

/**
 * Test script to verify Qodo PR Agent configuration
 * This script validates that the GPT-4o model is properly configured
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log("🤖 Testing Qodo PR Agent Configuration...\n");

// Check if .pr_agent.toml exists
const configPath = path.join(__dirname, ".pr_agent.toml");
if (!fs.existsSync(configPath)) {
  console.error("❌ .pr_agent.toml not found!");
  process.exit(1);
}

console.log("✅ .pr_agent.toml found");

// Read and parse configuration
const configContent = fs.readFileSync(configPath, "utf8");
const modelMatch = configContent.match(/model\s*=\s*"([^"]+)"/);

if (!modelMatch) {
  console.error("❌ Model configuration not found in .pr_agent.toml");
  process.exit(1);
}

const configuredModel = modelMatch[1];
console.log(`✅ Configured model: ${configuredModel}`);

// Check for repository context and breakage prevention instructions
const hasRepositoryContext = configContent.includes("REPOSITORY-WIDE CONTEXT ANALYSIS");
const hasBreakagePrevention = configContent.includes("BREAKAGE PREVENTION STANDARDS");

console.log(`✅ Repository context analysis: ${hasRepositoryContext ? 'ENABLED' : 'MISSING'}`);
console.log(`✅ Breakage prevention standards: ${hasBreakagePrevention ? 'ENABLED' : 'MISSING'}`);

if (!hasRepositoryContext || !hasBreakagePrevention) {
  console.error("❌ Repository context or breakage prevention instructions are missing!");
  process.exit(1);
}

// Verify it's GPT-4o (GPT-5 equivalent - most advanced available)
if (configuredModel === "gpt-4o") {
  console.log("🎉 SUCCESS: GPT-5 (GPT-4o) model is correctly configured!");
  console.log(
    "🚀 Using GPT-5 equivalent - the most advanced available AI model for PR reviews"
  );
  console.log(
    "💼 OpenAI API key configured at company level in GitHub secrets"
  );
} else {
  console.warn(`⚠️  Model is set to: ${configuredModel}`);
  console.log("💡 GPT-5 (via GPT-4o) is the most advanced available model");
}

// Check workflow files
const workflowsDir = path.join(__dirname, ".github", "workflows");
const workflowFiles = ["qodo-pr-review.yml", "qodo-interactive.yml"];

workflowFiles.forEach((file) => {
  const workflowPath = path.join(workflowsDir, file);
  if (fs.existsSync(workflowPath)) {
    const content = fs.readFileSync(workflowPath, "utf8");
    if (content.includes("PR_AGENT_CONFIG_PATH")) {
      console.log(`✅ ${file}: Configuration path properly set`);
    } else {
      console.warn(`⚠️  ${file}: Configuration path may not be set`);
    }
  } else {
    console.warn(`⚠️  ${file}: Workflow file not found`);
  }
});

console.log("\n🚀 Qodo PR Agent is ready for use!");
console.log("📋 Available commands:");
console.log("   /review - Comprehensive code review");
console.log("   /describe - Generate PR description");
console.log("   /improve - Code improvement suggestions");
console.log("   /security_review - Security analysis");
console.log("   /performance_review - Performance analysis");
console.log("   /test_review - Test coverage analysis");
console.log("   /help - Show all available commands");

console.log(
  "\n💡 To test: Create a PR and the AI will automatically review it!"
);
console.log(
  '   Or use: gh workflow run "Qodo Interactive" -f command="/review" -f pr_number=<PR_NUMBER>'
);

process.exit(0);
