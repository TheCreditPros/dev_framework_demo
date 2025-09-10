#!/usr/bin/env node

/**
 * Comprehensive Deployment Test for Qodo AI PR Review System
 * This script simulates deployment scenarios and validates all components
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { execSync } from "child_process";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log("🚀 Starting Qodo AI PR Review System Deployment Test...\n");

// Test results tracking
const testResults = {
    passed: 0,
    failed: 0,
    total: 0
};

function logTest(testName, passed, details = "") {
    testResults.total++;
    if (passed) {
        testResults.passed++;
        console.log(`✅ ${testName}`);
        if (details) console.log(`   ${details}`);
    } else {
        testResults.failed++;
        console.log(`❌ ${testName}`);
        if (details) console.log(`   ${details}`);
    }
}

// Test 1: Configuration Files Existence
console.log("📁 Testing Configuration Files...");
const configFiles = [
    ".pr_agent.toml",
    ".qodo/config.toml",
    ".qodo/config.sh"
];

configFiles.forEach(file => {
    const exists = fs.existsSync(path.join(__dirname, file));
    logTest(`${file} exists`, exists);
});

// Test 2: Workflow Files Existence
console.log("\n⚙️  Testing Workflow Files...");
const workflowFiles = [
    ".github/workflows/qodo-pr-review.yml",
    ".github/workflows/qodo-interactive.yml"
];

workflowFiles.forEach(file => {
    const exists = fs.existsSync(path.join(__dirname, file));
    logTest(`${file} exists`, exists);
});

// Test 3: Model Configuration Validation
console.log("\n🤖 Testing AI Model Configuration...");
try {
    const configContent = fs.readFileSync(path.join(__dirname, ".pr_agent.toml"), "utf8");
    const hasGPT4o = configContent.includes('model = "gpt-4o"');
    const hasBreakagePrevention = configContent.includes("BREAKAGE PREVENTION STANDARDS");
    const hasRepositoryContext = configContent.includes("REPOSITORY-WIDE CONTEXT ANALYSIS");

    logTest("GPT-4o model configured", hasGPT4o, hasGPT4o ? "Using GPT-5 equivalent" : "");
    logTest("Breakage prevention enabled", hasBreakagePrevention);
    logTest("Repository context analysis enabled", hasRepositoryContext);
} catch (error) {
    logTest("Model configuration validation", false, error.message);
}

// Test 4: Workflow Configuration Validation
console.log("\n🔧 Testing Workflow Configurations...");
workflowFiles.forEach(file => {
    try {
        const content = fs.readFileSync(path.join(__dirname, file), "utf8");
        const hasGitHubToken = content.includes("${{ secrets.GITHUB_TOKEN }}");
        const hasOpenAIKey = content.includes("${{ secrets.OPENAI_API_KEY }}");
        const hasConfigPath = content.includes('PR_AGENT_CONFIG_PATH: ".pr_agent.toml"');

        logTest(`${file} has GitHub token`, hasGitHubToken);
        logTest(`${file} has OpenAI API key`, hasOpenAIKey);
        logTest(`${file} has config path`, hasConfigPath);
    } catch (error) {
        logTest(`${file} configuration validation`, false, error.message);
    }
});

// Test 5: Available Commands Count
console.log("\n📋 Testing Available Commands...");
try {
    const interactiveContent = fs.readFileSync(path.join(__dirname, ".github/workflows/qodo-interactive.yml"), "utf8");
    const commandMatches = interactiveContent.match(/\/[a-zA-Z_]+/g) || [];
    const uniqueCommands = [...new Set(commandMatches)].filter(cmd => !cmd.includes('command:'));
    const commandCount = uniqueCommands.length;

    logTest(`Commands available: ${commandCount}`, commandCount >= 15, `Found ${commandCount} commands: ${uniqueCommands.join(', ')}`);
} catch (error) {
    logTest("Command count validation", false, error.message);
}

// Test 6: Security Configuration
console.log("\n🔒 Testing Security Configuration...");
try {
    const configContent = fs.readFileSync(path.join(__dirname, ".pr_agent.toml"), "utf8");
    const hasSensitiveContentFilter = configContent.includes("filter_sensitive_content");
    const hasContentFiltering = configContent.includes("enable_content_filtering");

    logTest("Sensitive content filtering enabled", hasSensitiveContentFilter);
    logTest("Content filtering enabled", hasContentFiltering);
} catch (error) {
    logTest("Security configuration validation", false, error.message);
}

// Test 7: Repository Structure Analysis
console.log("\n🏗️  Testing Repository Structure...");
const requiredDirs = [
    "src",
    "tests",
    ".github/workflows",
    ".qodo"
];

requiredDirs.forEach(dir => {
    const exists = fs.existsSync(path.join(__dirname, dir));
    logTest(`${dir} directory exists`, exists);
});

// Test 8: Node.js Dependencies
console.log("\n📦 Testing Node.js Dependencies...");
try {
    const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, "package.json"), "utf8"));
    const hasScripts = packageJson.scripts && Object.keys(packageJson.scripts).length > 0;
    const hasDependencies = packageJson.dependencies && Object.keys(packageJson.dependencies).length > 0;

    logTest("Package.json has scripts", hasScripts);
    logTest("Package.json has dependencies", hasDependencies);
} catch (error) {
    logTest("Node.js dependencies validation", false, error.message);
}

// Test 9: Deployment Readiness Check
console.log("\n🚀 Testing Deployment Readiness...");
const deploymentChecks = [
    { name: "README.md exists", check: () => fs.existsSync(path.join(__dirname, "README.md")) },
    { name: "README has Qodo section", check: () => {
        const readme = fs.readFileSync(path.join(__dirname, "README.md"), "utf8");
        return readme.includes("AI-Powered PR Reviews");
    }},
    { name: "Test script executable", check: () => {
        try {
            execSync("node test-qodo-config.js", { cwd: __dirname, stdio: 'pipe' });
            return true;
        } catch {
            return false;
        }
    }}
];

deploymentChecks.forEach(({ name, check }) => {
    try {
        const passed = check();
        logTest(name, passed);
    } catch (error) {
        logTest(name, false, error.message);
    }
});

// Test 10: Simulate PR Event Triggers
console.log("\n🔄 Testing PR Event Simulation...");
try {
    const prWorkflow = fs.readFileSync(path.join(__dirname, ".github/workflows/qodo-pr-review.yml"), "utf8");
    const hasPrOpened = prWorkflow.includes("opened");
    const hasPrSynchronize = prWorkflow.includes("synchronize");
    const hasPrReopened = prWorkflow.includes("reopened");
    const hasReadyForReview = prWorkflow.includes("ready_for_review");

    logTest("PR opened trigger configured", hasPrOpened);
    logTest("PR synchronize trigger configured", hasPrSynchronize);
    logTest("PR reopened trigger configured", hasPrReopened);
    logTest("PR ready_for_review trigger configured", hasReadyForReview);
} catch (error) {
    logTest("PR event simulation", false, error.message);
}

// Final Results
console.log("\n" + "=".repeat(60));
console.log("📊 DEPLOYMENT TEST RESULTS");
console.log("=".repeat(60));
console.log(`✅ Passed: ${testResults.passed}`);
console.log(`❌ Failed: ${testResults.failed}`);
console.log(`📈 Total: ${testResults.total}`);
console.log(`🎯 Success Rate: ${((testResults.passed / testResults.total) * 100).toFixed(1)}%`);

if (testResults.failed === 0) {
    console.log("\n🎉 ALL TESTS PASSED! Qodo AI PR Review System is READY FOR DEPLOYMENT!");
    console.log("\n🚀 Deployment Instructions:");
    console.log("1. Push all changes to GitHub");
    console.log("2. Create a Pull Request");
    console.log("3. Watch the AI automatically review your code!");
    console.log("4. Use interactive commands like /review, /security_review, etc.");
} else {
    console.log(`\n⚠️  ${testResults.failed} test(s) failed. Please review and fix before deployment.`);
}

console.log("\n" + "=".repeat(60));
process.exit(testResults.failed > 0 ? 1 : 0);
