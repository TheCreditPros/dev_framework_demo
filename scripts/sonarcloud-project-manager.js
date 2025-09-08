#!/usr/bin/env node

/**
 * SonarCloud Project Manager
 * Automatically manages SonarCloud projects via API integration
 *
 * Features:
 * - Check if SonarCloud project exists
 * - Create project if it doesn't exist
 * - Configure project settings for optimal analysis
 * - Generate dynamic project keys based on GitHub repository
 * - Validate SONAR_TOKEN and organization access
 */

const https = require("https");
const { execSync } = require("child_process");

class SonarCloudProjectManager {
  constructor() {
    this.baseUrl = "https://sonarcloud.io/api";
    this.token = process.env.SONAR_TOKEN;
    this.githubToken = process.env.GITHUB_TOKEN;

    if (!this.token) {
      throw new Error("SONAR_TOKEN environment variable is required");
    }
  }

  /**
   * Get repository information from GitHub context or git
   */
  getRepositoryInfo() {
    try {
      // Try GitHub Actions context first
      const owner = process.env.GITHUB_REPOSITORY_OWNER;
      const repo = process.env.GITHUB_REPOSITORY?.split("/")[1];

      if (owner && repo) {
        return { owner, repo, fullName: `${owner}/${repo}` };
      }

      // Fallback to git remote
      const remoteUrl = execSync("git remote get-url origin", {
        encoding: "utf8",
      }).trim();
      const match = remoteUrl.match(/github\.com[:/]([^/]+)\/(.+?)(?:\.git)?$/);

      if (match) {
        return {
          owner: match[1],
          repo: match[2],
          fullName: `${match[1]}/${match[2]}`,
        };
      }

      throw new Error("Could not determine repository information");
    } catch (error) {
      throw new Error(`Failed to get repository info: ${error.message}`);
    }
  }

  /**
   * Generate SonarCloud project key from repository info
   */
  generateProjectKey(owner, repo) {
    // SonarCloud project key format: organization_repository
    return `${owner}_${repo}`;
  }

  /**
   * Make authenticated API request to SonarCloud
   */
  async apiRequest(endpoint, method = "GET", data = null) {
    return new Promise((resolve, reject) => {
      const url = `${this.baseUrl}${endpoint}`;
      const options = {
        method,
        headers: {
          "Authorization": `Bearer ${this.token}`,
          "Content-Type": "application/json",
          "User-Agent": "AI-SDLC-Framework/1.0",
        },
      };

      const req = https.request(url, options, (res) => {
        let body = "";
        res.on("data", (chunk) => (body += chunk));
        res.on("end", () => {
          try {
            const response = body ? JSON.parse(body) : {};
            if (res.statusCode >= 200 && res.statusCode < 300) {
              resolve(response);
            } else {
              reject(
                new Error(
                  `API request failed: ${res.statusCode} - ${response.errors?.[0]?.msg || body}`
                )
              );
            }
          } catch (error) {
            reject(new Error(`Failed to parse API response: ${error.message}`));
          }
        });
      });

      req.on("error", reject);

      if (data) {
        req.write(JSON.stringify(data));
      }

      req.end();
    });
  }

  /**
   * Check if SonarCloud project exists
   */
  async projectExists(projectKey) {
    try {
      await this.apiRequest(`/projects/search?projects=${projectKey}`);
      return true;
    } catch (error) {
      if (error.message.includes("404")) {
        return false;
      }
      throw error;
    }
  }

  /**
   * Get organization information
   */
  async getOrganization(orgKey) {
    try {
      const response = await this.apiRequest(
        `/organizations/search?organizations=${orgKey}`
      );
      return response.organizations?.[0] || null;
    } catch (error) {
      console.warn(
        `Warning: Could not fetch organization info: ${error.message}`
      );
      return null;
    }
  }

  /**
   * Create SonarCloud project
   */
  async createProject(projectKey, projectName, organization, repositoryInfo) {
    console.log(`🔧 Creating SonarCloud project: ${projectKey}`);

    try {
      const createData = {
        project: projectKey,
        name: projectName,
        organization: organization,
      };

      await this.apiRequest("/projects/create", "POST", createData);
      console.log(`✅ Project created successfully: ${projectKey}`);

      // Configure project settings
      await this.configureProject(projectKey, repositoryInfo);

      return true;
    } catch (error) {
      console.error(`❌ Failed to create project: ${error.message}`);
      throw error;
    }
  }

  /**
   * Configure project settings for optimal analysis
   */
  async configureProject(projectKey, repositoryInfo) {
    console.log(`⚙️ Configuring project settings for: ${projectKey}`);

    const settings = [
      // Quality Gate settings
      { key: "sonar.qualitygate.wait", value: "true" },
      { key: "sonar.buildbreaker.skip", value: "false" },

      // Security settings
      { key: "sonar.security.hotspots.enabled", value: "true" },
      { key: "sonar.security.review.enabled", value: "true" },

      // AI CodeFix settings (if available)
      { key: "sonar.ai.codefix.enabled", value: "true" },
      { key: "sonar.ai.codefix.provider", value: "OpenAI" },
      { key: "sonar.ai.codefix.autoApply", value: "false" },
      { key: "sonar.ai.codefix.includeSecurityIssues", value: "true" },

      // Repository binding
      {
        key: "sonar.links.scm",
        value: `https://github.com/${repositoryInfo.fullName}`,
      },
      {
        key: "sonar.links.ci",
        value: `https://github.com/${repositoryInfo.fullName}/actions`,
      },
    ];

    for (const setting of settings) {
      try {
        await this.apiRequest("/settings/set", "POST", {
          component: projectKey,
          key: setting.key,
          value: setting.value,
        });
        console.log(`  ✅ Set ${setting.key} = ${setting.value}`);
      } catch (error) {
        console.warn(`  ⚠️ Could not set ${setting.key}: ${error.message}`);
      }
    }
  }

  /**
   * Validate SONAR_TOKEN and organization access
   */
  async validateAccess(organization) {
    try {
      console.log("🔍 Validating SonarCloud access...");

      // Test API access
      await this.apiRequest("/authentication/validate");
      console.log("✅ SONAR_TOKEN is valid");

      // Check organization access
      const org = await this.getOrganization(organization);
      if (org) {
        console.log(`✅ Organization access confirmed: ${org.name}`);
        return true;
      } else {
        console.warn(
          `⚠️ Organization '${organization}' not found or no access`
        );
        return false;
      }
    } catch (error) {
      console.error(`❌ Access validation failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Generate sonar-project.properties content
   */
  generateProjectProperties(
    projectKey,
    organization,
    projectName,
    repositoryInfo
  ) {
    return `# SonarCloud Configuration - Auto-generated
# Project: ${repositoryInfo.fullName}

# Project identification
sonar.projectKey=${projectKey}
sonar.organization=${organization}
sonar.projectName=${projectName}
sonar.projectVersion=1.0.0

# Source code configuration
sonar.sources=src,scripts,scripts-complex
sonar.tests=tests
sonar.test.inclusions=**/*.test.js,**/*.test.ts,**/*.spec.js,**/*.spec.ts

# Language-specific settings
sonar.javascript.lcov.reportPaths=coverage/lcov.info
sonar.typescript.lcov.reportPaths=coverage/lcov.info
sonar.coverageReportPaths=coverage/lcov.info

# Exclusions - Focus on source code, exclude generated/test files
sonar.exclusions=**/node_modules/**,**/dist/**,**/build/**,**/coverage/**,**/test-results/**,**/playwright-report/**,**/*.min.js,**/*.bundle.js
sonar.coverage.exclusions=**/*.test.js,**/*.test.ts,**/*.spec.js,**/*.spec.ts,**/node_modules/**,**/dist/**,**/build/**,**/coverage/**,**/test-results/**,**/playwright-report/**,**/legacy/**

# Duplication settings
sonar.cpd.exclusions=**/*.test.js,**/*.test.ts,**/*.spec.js,**/*.spec.ts,**/node_modules/**,**/dist/**,**/build/**

# Quality gate settings - Enforce blocking
sonar.qualitygate.wait=true
sonar.qualitygate.timeout=300
sonar.buildbreaker.skip=false

# Security enforcement
sonar.security.hotspots.enabled=true
sonar.security.review.enabled=true
sonar.security.hotspots.inheritFromParent=true

# Performance optimizations
sonar.analysis.mode=publish
sonar.verbose=false

# Security and reliability focus
sonar.security.hotspots.includeAll=true
sonar.reliability.hotspots.includeAll=true

# AI CodeFix Configuration
sonar.ai.codefix.enabled=true
sonar.ai.codefix.provider=OpenAI
sonar.ai.codefix.autoApply=false
sonar.ai.codefix.includeSecurityIssues=true
sonar.ai.codefix.includeDependencyIssues=true

# Repository links
sonar.links.scm=https://github.com/${repositoryInfo.fullName}
sonar.links.ci=https://github.com/${repositoryInfo.fullName}/actions
`;
  }

  /**
   * Main execution method
   */
  async run() {
    try {
      console.log("🚀 SonarCloud Project Manager Starting...\n");

      // Get repository information
      const repoInfo = this.getRepositoryInfo();
      console.log(`📁 Repository: ${repoInfo.fullName}`);

      // Generate project configuration
      const projectKey = this.generateProjectKey(repoInfo.owner, repoInfo.repo);
      const organization = repoInfo.owner.toLowerCase();
      const projectName = `${repoInfo.repo.replace(/[-_]/g, " ")} - AI-SDLC Framework`;

      console.log(`🔑 Project Key: ${projectKey}`);
      console.log(`🏢 Organization: ${organization}`);
      console.log(`📝 Project Name: ${projectName}\n`);

      // Validate access
      await this.validateAccess(organization);

      // Check if project exists
      const exists = await this.projectExists(projectKey);

      if (exists) {
        console.log(`✅ SonarCloud project already exists: ${projectKey}`);
      } else {
        console.log(`❌ SonarCloud project does not exist: ${projectKey}`);
        await this.createProject(
          projectKey,
          projectName,
          organization,
          repoInfo
        );
      }

      // Generate/update sonar-project.properties
      const propertiesContent = this.generateProjectProperties(
        projectKey,
        organization,
        projectName,
        repoInfo
      );

      // Output configuration for use by other scripts
      console.log("\n📊 Generated Configuration:");
      console.log("SONAR_PROJECT_KEY=" + projectKey);
      console.log("SONAR_ORGANIZATION=" + organization);
      console.log("SONAR_PROJECT_NAME=" + projectName);

      // Write properties file if requested
      if (process.argv.includes("--write-properties")) {
        const fs = require("fs");
        fs.writeFileSync("sonar-project.properties", propertiesContent);
        console.log("✅ sonar-project.properties file updated");
      }

      console.log("\n🎉 SonarCloud project management completed successfully!");
      return {
        projectKey,
        organization,
        projectName,
        exists: exists,
        created: !exists,
      };
    } catch (error) {
      console.error(
        `\n❌ SonarCloud project management failed: ${error.message}`
      );
      process.exit(1);
    }
  }
}

// CLI execution
if (require.main === module) {
  const manager = new SonarCloudProjectManager();
  manager.run().catch((error) => {
    console.error("Fatal error:", error.message);
    process.exit(1);
  });
}

module.exports = SonarCloudProjectManager;
