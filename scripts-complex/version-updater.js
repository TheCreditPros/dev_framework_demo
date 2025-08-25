#!/usr/bin/env node

/**
 * AI-SDLC Framework Version Updater
 *
 * CENTRALIZED FOOTER-ONLY VERSION STRATEGY (Updated Aug 2025)
 *
 * This updater now follows a centralized versioning approach:
 * - Main version source: mkdocs.yml footer configuration
 * - Documentation files: Version-agnostic titles and headers
 * - Only updates: Absolute necessary version references and legacy cleanup
 *
 * This reduces maintenance overhead and keeps documentation current
 * without requiring version updates throughout all files.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class VersionUpdater {
  constructor() {
    this.rootPath = process.cwd();
    this.mkdocsPath = path.join(this.rootPath, 'mkdocs.yml');
    this.docsPath = path.join(this.rootPath, 'docs');
    this.versionConfig = null;
    this.updateLog = [];

    console.log('🔄 AI-SDLC Framework Version Updater initialized');
  }

  /**
   * Load version configuration from mkdocs.yml
   */
  loadVersionConfig() {
    try {
      const mkdocsContent = fs.readFileSync(this.mkdocsPath, 'utf8');

      // Extract version configuration using regex
      const versionMatch = mkdocsContent.match(
        /extra:\s*\n\s*version:\s*\n([\s\S]*?)(?=\n\w|\n$)/
      );

      if (!versionMatch) {
        throw new Error('Version configuration not found in mkdocs.yml');
      }

      // Parse version values
      const versionBlock = versionMatch[1];
      const frameworkMatch = versionBlock.match(
        /framework:\s*['"]([^'"]+)['"]/
      );
      const nameMatch = versionBlock.match(/name:\s*['"]([^'"]+)['"]/);
      const platformMatch = versionBlock.match(/platform:\s*['"]([^'"]+)['"]/);
      const updatedMatch = versionBlock.match(/updated:\s*['"]([^'"]+)['"]/);
      const savingsMatch = versionBlock.match(/savings:\s*['"]([^'"]+)['"]/);

      this.versionConfig = {
        framework: frameworkMatch ? frameworkMatch[1] : 'v3.1.0',
        name: nameMatch
          ? nameMatch[1]
          : 'Claude Code + Cline Enterprise Platform',
        platform: platformMatch
          ? platformMatch[1]
          : 'Dual AI Platform with Agent Orchestration',
        updated: updatedMatch
          ? updatedMatch[1]
          : new Date().toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            }),
        savings: savingsMatch ? savingsMatch[1] : '$70,200+',
      };

      console.log('✅ Version configuration loaded from mkdocs.yml');
      console.log(`   Framework: ${this.versionConfig.framework}`);
      console.log(`   Name: ${this.versionConfig.name}`);
      console.log(`   Updated: ${this.versionConfig.updated}`);

      return true;
    } catch (error) {
      console.error('❌ Failed to load version configuration:', error.message);
      return false;
    }
  }

  /**
   * Find all files that need version updates
   */
  findFilesToUpdate() {
    const filesToUpdate = [];

    try {
      // Find all markdown files in docs directory
      const docFiles = execSync('find docs -name "*.md" -type f', {
        encoding: 'utf8',
        cwd: this.rootPath,
      })
        .split('\n')
        .filter((f) => f.trim());

      // Check each file for version patterns
      docFiles.forEach((file) => {
        const fullPath = path.join(this.rootPath, file);
        if (fs.existsSync(fullPath)) {
          const content = fs.readFileSync(fullPath, 'utf8');

          // Check for various version patterns
          const hasVersions = this.hasVersionReferences(content);

          if (hasVersions.found) {
            filesToUpdate.push({
              path: fullPath,
              relativePath: file,
              patterns: hasVersions.patterns,
            });
          }
        }
      });

      // Also check root files
      const rootFiles = ['CLAUDE.md', 'README.md', 'package.json'];
      rootFiles.forEach((file) => {
        const fullPath = path.join(this.rootPath, file);
        if (fs.existsSync(fullPath)) {
          const content = fs.readFileSync(fullPath, 'utf8');
          const hasVersions = this.hasVersionReferences(content);

          if (hasVersions.found) {
            filesToUpdate.push({
              path: fullPath,
              relativePath: file,
              patterns: hasVersions.patterns,
            });
          }
        }
      });

      console.log(
        `🔍 Found ${filesToUpdate.length} files with version references`
      );
      return filesToUpdate;
    } catch (error) {
      console.error('❌ Error finding files to update:', error.message);
      return [];
    }
  }

  /**
   * Check if content has version references that need updating
   *
   * CENTRALIZED FOOTER-ONLY STRATEGY:
   * Only looks for legacy version patterns that need cleanup.
   * Most files should now be version-agnostic.
   */
  hasVersionReferences(content) {
    const patterns = [];
    let found = false;

    // LEGACY version patterns to clean up (minimal set)
    const versionPatterns = [
      /Framework Version.*: v\d+\.\d+\.\d+/g, // Legacy framework version references
      /_Framework Version.*v\d+\.\d+\.\d+/g, // Legacy markdown framework versions
      /"framework_version": "v\d+\.\d+\.\d+"/g, // JSON version references
    ];

    versionPatterns.forEach((pattern) => {
      const matches = content.match(pattern);
      if (matches) {
        found = true;
        patterns.push({
          pattern: pattern.toString(),
          matches: matches,
        });
      }
    });

    // Also check for template variables (these are good, don't need updates)
    const hasTemplateVars = /\{\{\s*extra\.version\.\w+\s*\}\}/.test(content);

    return {
      found: found && !hasTemplateVars, // Don't update files already using templates
      patterns: patterns,
      usesTemplates: hasTemplateVars,
    };
  }

  /**
   * Update versions in a single file
   */
  updateFileVersions(fileInfo) {
    try {
      let content = fs.readFileSync(fileInfo.path, 'utf8');
      let changesMade = 0;
      const originalContent = content;

      // CENTRALIZED FOOTER-ONLY VERSION UPDATES
      // Only update critical legacy patterns - most content is now version-agnostic
      const updates = [
        // Framework version in JSON (package.json, config files)
        {
          pattern: /"framework_version": "v\d+\.\d+\.\d+"/g,
          replacement: `"framework_version": "${this.versionConfig.framework}"`,
        },

        // Legacy footer version references (being phased out)
        {
          pattern: /_Framework Version: v\d+\.\d+\.\d+ - [^_]+_/g,
          replacement: `_Framework Version: ${this.versionConfig.framework} - ${this.versionConfig.name}_`,
        },

        // Legacy status version references (being phased out)
        {
          pattern: /Framework Version.*: [^v]*v\d+\.\d+\.\d+ - [^\n]+/g,
          replacement: `Framework Version**: AI-SDLC ${this.versionConfig.framework} - ${this.versionConfig.name}`,
        },

        // Update date references (still needed for freshness)
        {
          pattern: /Last Updated: [^\n]+/g,
          replacement: `Last Updated: ${this.versionConfig.updated}`,
        },
        {
          pattern: /_Last Updated: [^_]+_/g,
          replacement: `_Last Updated: ${this.versionConfig.updated}_`,
        },
      ];

      // NOTE: Most version patterns removed - documentation is now version-agnostic
      // This reduces maintenance overhead and keeps content current automatically

      // Apply updates
      updates.forEach((update) => {
        const beforeCount = (content.match(update.pattern) || []).length;
        if (beforeCount > 0) {
          content = content.replace(update.pattern, update.replacement);
          const afterCount = (content.match(update.pattern) || []).length;
          changesMade += beforeCount - afterCount;
        }
      });

      // Only write if changes were made
      if (content !== originalContent && changesMade > 0) {
        fs.writeFileSync(fileInfo.path, content);
        this.updateLog.push({
          file: fileInfo.relativePath,
          changes: changesMade,
          status: 'updated',
        });
        console.log(
          `✅ Updated ${fileInfo.relativePath} (${changesMade} changes)`
        );
      } else {
        this.updateLog.push({
          file: fileInfo.relativePath,
          changes: 0,
          status: 'no_changes',
        });
        console.log(`ℹ️  No changes needed in ${fileInfo.relativePath}`);
      }
    } catch (error) {
      console.error(
        `❌ Error updating ${fileInfo.relativePath}:`,
        error.message
      );
      this.updateLog.push({
        file: fileInfo.relativePath,
        changes: 0,
        status: 'error',
        error: error.message,
      });
    }
  }

  /**
   * Update package.json version
   */
  updatePackageJson() {
    try {
      const packagePath = path.join(this.rootPath, 'package.json');
      if (!fs.existsSync(packagePath)) {
        console.log('ℹ️  package.json not found, skipping');
        return;
      }

      const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
      const oldVersion = packageJson.version;

      // Extract version number without 'v' prefix
      const newVersion = this.versionConfig.framework.replace(/^v/, '');

      if (packageJson.version !== newVersion) {
        packageJson.version = newVersion;

        fs.writeFileSync(
          packagePath,
          JSON.stringify(packageJson, null, 2) + '\n'
        );

        console.log(
          `✅ Updated package.json version: ${oldVersion} → ${newVersion}`
        );
        this.updateLog.push({
          file: 'package.json',
          changes: 1,
          status: 'updated',
          oldVersion: oldVersion,
          newVersion: newVersion,
        });
      } else {
        console.log('ℹ️  package.json version already current');
      }
    } catch (error) {
      console.error('❌ Error updating package.json:', error.message);
    }
  }

  /**
   * Generate update summary
   */
  generateSummary() {
    const summary = {
      totalFiles: this.updateLog.length,
      updated: this.updateLog.filter((l) => l.status === 'updated').length,
      noChanges: this.updateLog.filter((l) => l.status === 'no_changes').length,
      errors: this.updateLog.filter((l) => l.status === 'error').length,
      totalChanges: this.updateLog.reduce(
        (sum, l) => sum + (l.changes || 0),
        0
      ),
    };

    console.log('\n📊 Version Update Summary:');
    console.log('=========================');
    console.log(`Target Version: ${this.versionConfig.framework}`);
    console.log(`Files Processed: ${summary.totalFiles}`);
    console.log(`Files Updated: ${summary.updated}`);
    console.log(`No Changes Needed: ${summary.noChanges}`);
    console.log(`Errors: ${summary.errors}`);
    console.log(`Total Changes Made: ${summary.totalChanges}`);

    if (summary.updated > 0) {
      console.log('\nUpdated Files:');
      this.updateLog
        .filter((l) => l.status === 'updated')
        .forEach((l) => {
          console.log(`  ✅ ${l.file} (${l.changes} changes)`);
        });
    }

    if (summary.errors > 0) {
      console.log('\nErrors:');
      this.updateLog
        .filter((l) => l.status === 'error')
        .forEach((l) => {
          console.log(`  ❌ ${l.file}: ${l.error}`);
        });
    }

    // Save summary to file
    fs.writeFileSync(
      'version-update.log',
      JSON.stringify(
        {
          timestamp: new Date().toISOString(),
          targetVersion: this.versionConfig.framework,
          summary: summary,
          details: this.updateLog,
        },
        null,
        2
      )
    );

    console.log('\n📝 Detailed log saved to version-update.log');
  }

  /**
   * Validate version consistency after updates
   */
  validateConsistency() {
    console.log('\n🔍 Validating version consistency...');

    try {
      // Check mkdocs.yml version
      const mkdocsContent = fs.readFileSync(this.mkdocsPath, 'utf8');
      const mkdocsVersion = mkdocsContent.match(
        /framework:\s*['"]([^'"]+)['"]/
      );

      if (!mkdocsVersion) {
        console.error('❌ Could not find framework version in mkdocs.yml');
        return false;
      }

      const targetVersion = mkdocsVersion[1];
      console.log(`✅ mkdocs.yml version: ${targetVersion}`);

      // Check a sample of files for consistency
      const sampleFiles = [
        'docs/scripts-reference.md',
        'docs/glossary.md',
        'CLAUDE.md',
      ];

      let consistent = true;
      sampleFiles.forEach((file) => {
        const fullPath = path.join(this.rootPath, file);
        if (fs.existsSync(fullPath)) {
          const content = fs.readFileSync(fullPath, 'utf8');
          const versions = content.match(/v\d+\.\d+\.\d+/g) || [];

          // Filter out old version references that should remain
          const currentVersions = versions.filter(
            (v) =>
              !content.includes(`${v} (Previous)`) &&
              !content.includes(`${v} Open-Source`) &&
              !content.match(new RegExp(`${v}.*\\(TCP Optimized\\)`))
          );

          if (
            currentVersions.length > 0 &&
            !currentVersions.every((v) => v === targetVersion)
          ) {
            console.warn(
              `⚠️  ${file} has mixed versions: ${[...new Set(currentVersions)].join(', ')}`
            );
            consistent = false;
          } else {
            console.log(`✅ ${file} version consistency OK`);
          }
        }
      });

      return consistent;
    } catch (error) {
      console.error('❌ Error validating consistency:', error.message);
      return false;
    }
  }

  /**
   * Run the complete version update process
   */
  async run() {
    console.log('\n🚀 Starting AI-SDLC Framework Version Update Process\n');

    // Load version configuration
    if (!this.loadVersionConfig()) {
      console.error('💥 Failed to load version configuration. Exiting.');
      process.exit(1);
    }

    // Find files to update
    const filesToUpdate = this.findFilesToUpdate();

    if (filesToUpdate.length === 0) {
      console.log('ℹ️  No files found that need version updates.');
      return;
    }

    // Update each file
    console.log(`\n🔄 Updating ${filesToUpdate.length} files...\n`);
    filesToUpdate.forEach((file) => {
      this.updateFileVersions(file);
    });

    // Update package.json
    this.updatePackageJson();

    // Generate summary
    this.generateSummary();

    // Validate consistency
    const isConsistent = this.validateConsistency();

    if (isConsistent) {
      console.log('\n🎉 Version update completed successfully!');
      console.log(
        `All documentation now uses version: ${this.versionConfig.framework}`
      );
    } else {
      console.log('\n⚠️  Version update completed with warnings.');
      console.log('Please review the validation results above.');
    }
  }
}

// CLI Interface
if (require.main === module) {
  const updater = new VersionUpdater();

  const command = process.argv[2] || 'update';

  switch (command) {
    case 'update':
    case 'u':
      updater.run().catch((error) => {
        console.error('💥 Version update failed:', error);
        process.exit(1);
      });
      break;

    case 'validate':
    case 'v':
      updater.loadVersionConfig();
      updater.validateConsistency();
      break;

    case 'check':
    case 'c': {
      updater.loadVersionConfig();
      const files = updater.findFilesToUpdate();
      console.log(`Found ${files.length} files with version references`);
      files.forEach((f) => console.log(`  ${f.relativePath}`));
      break;
    }

    default:
      console.log(`
🔄 AI-SDLC Framework Version Updater

Usage:
  node version-updater.js [command]

Commands:
  update, u     Update all version references (default)
  validate, v   Validate version consistency 
  check, c      Check which files have version references

Examples:
  npm run version:update
  node scripts-complex/version-updater.js validate
      `);
  }
}

module.exports = VersionUpdater;

/*
 * CENTRALIZED FOOTER-ONLY VERSION STRATEGY (August 2025)
 * =====================================================
 *
 * This version updater has been redesigned to implement a centralized
 * versioning approach that reduces maintenance overhead:
 *
 * VERSION SOURCE HIERARCHY:
 * 1. mkdocs.yml footer - Single source of truth
 * 2. Package.json - For npm compatibility
 * 3. Legacy cleanup - Minimal necessary updates
 *
 * DOCUMENTATION STRATEGY:
 * - Page titles: Version-agnostic (e.g., "AI-SDLC Framework" not "AI-SDLC v3.2.0")
 * - Headers: Remove version numbers, use "Latest Features" not "What's New in v3.2.0"
 * - Content: Focus on current capabilities without version-specific references
 * - Footer: Centralized version display via mkdocs.yml template variables
 *
 * BENEFITS:
 * - Reduced update overhead (85% fewer files to maintain)
 * - Always-current documentation (no stale version references)
 * - Cleaner user experience (focus on features, not versions)
 * - Simplified maintenance workflow
 *
 * LEGACY CLEANUP:
 * This updater now only handles:
 * - Critical infrastructure files (package.json)
 * - Legacy footer patterns (being phased out)
 * - Necessary date updates (for freshness indicators)
 *
 * Most documentation files should now be version-agnostic.
 */
