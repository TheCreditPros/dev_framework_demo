#!/usr/bin/env node

/**
 * FCRA Compliance Validator for AI-SDLC Framework
 * Scans source code for potential sensitive data patterns
 */

const fs = require('fs');
const path = require('path');

console.log('🏦 Running FCRA compliance validation...');

const complianceIssues = [];

// Basic source scan for sensitive patterns
const sensitivePatterns = [
  { pattern: /\b\d{3}-\d{2}-\d{4}\b/g, description: 'Potential SSN pattern' },
  {
    pattern: /4[0-9]{12}(?:[0-9]{3})?/g,
    description: 'Potential credit card pattern',
  },
  {
    pattern: /(?:password|secret|key)\s*[:=]\s*['"][^'"\s]+/gi,
    description: 'Potential credential exposure',
  },
];

function scanDirectory(dir) {
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        // Skip common directories that shouldn't contain sensitive data
        const skipDirs = [
          'node_modules',
          'vendor',
          '.git',
          'coverage',
          'dist',
          'build',
          '.next',
          'out',
        ];
        if (!skipDirs.includes(entry.name)) {
          scanDirectory(fullPath);
        }
      } else if (entry.isFile()) {
        // Only scan relevant file types
        if (/\.(js|ts|tsx|jsx|php|py|java|cs|rb|go)$/.test(entry.name)) {
          scanFile(fullPath);
        }
      }
    }
  } catch (error) {
    // Skip directories we can't read
    console.log(`⚠️  Skipping ${dir}: ${error.message}`);
  }
}

function scanFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');

    for (const { pattern, description } of sensitivePatterns) {
      const matches = content.match(pattern);
      if (matches) {
        complianceIssues.push(
          `${filePath}: ${description} - Found ${matches.length} occurrence(s)`
        );
      }
    }
  } catch (error) {
    // Skip files we can't read
    console.log(`⚠️  Skipping ${filePath}: ${error.message}`);
  }
}

// Start scanning from current directory
scanDirectory('.');

// Report results
if (complianceIssues.length > 0) {
  console.log('❌ FCRA compliance issues detected:');
  complianceIssues.forEach((issue) => console.log(`  - ${issue}`));
  console.log(
    '\n⚠️  Please review and remediate these potential compliance issues before deployment.'
  );
  process.exit(1);
}

if (!process.env.SONAR_TOKEN) {
  console.log(
    'ℹ️  SONAR_TOKEN not set; skipped Sonar quality gate enforcement'
  );
}

console.log(
  '✅ FCRA compliance validation passed - No sensitive data patterns detected'
);
process.exit(0);
