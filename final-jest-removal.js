#!/usr/bin/env node
const fs = require('fs').promises;
const path = require('path');

const REPLACEMENTS = [
  // All Jest API replacements - comprehensive list
  { from: /\bjest\.fn\(\)/g, to: 'vi.fn()' },
  { from: /\bjest\.fn\s*\(/g, to: 'vi.fn(' },
  { from: /\bjest\.mock\s*\(/g, to: 'vi.mock(' },
  { from: /\bjest\.unmock\s*\(/g, to: 'vi.unmock(' },
  { from: /\bjest\.spyOn\s*\(/g, to: 'vi.spyOn(' },
  { from: /\bjest\.clearAllMocks\s*\(\)/g, to: 'vi.clearAllMocks()' },
  { from: /\bjest\.resetAllMocks\s*\(\)/g, to: 'vi.resetAllMocks()' },
  { from: /\bjest\.restoreAllMocks\s*\(\)/g, to: 'vi.restoreAllMocks()' },
  { from: /\bjest\.useFakeTimers\s*\(\)/g, to: 'vi.useFakeTimers()' },
  { from: /\bjest\.useRealTimers\s*\(\)/g, to: 'vi.useRealTimers()' },
  { from: /\bjest\.advanceTimersByTime\s*\(/g, to: 'vi.advanceTimersByTime(' },
  { from: /\bjest\.runAllTimers\s*\(\)/g, to: 'vi.runAllTimers()' },
  {
    from: /\bjest\.runOnlyPendingTimers\s*\(\)/g,
    to: 'vi.runOnlyPendingTimers()',
  },
  { from: /\bjest\.clearAllTimers\s*\(\)/g, to: 'vi.clearAllTimers()' },
  { from: /\bjest\.setTimeout\s*\(/g, to: 'vi.setConfig({ testTimeout: ' },
  { from: /\bjest\.doMock\s*\(/g, to: 'vi.doMock(' },
  { from: /\bjest\.dontMock\s*\(/g, to: 'vi.dontMock(' },
  { from: /\bjest\.setMock\s*\(/g, to: 'vi.setMock(' },
  { from: /\bjest\.requireActual\s*\(/g, to: 'vi.importActual(' },
  { from: /\bjest\.requireMock\s*\(/g, to: 'vi.importMock(' },
  { from: /\bjest\.isolateModules\s*\(/g, to: 'vi.isolateModules(' },
  { from: /\bjest\.retryTimes\s*\(/g, to: 'vi.retry(' },
  { from: /\bjest\.mocked\s*\(/g, to: 'vi.mocked(' },
  { from: /\bjest\.getRealSystemTime\s*\(\)/g, to: 'vi.getRealSystemTime()' },
  { from: /\bjest\.getTimerCount\s*\(\)/g, to: 'vi.getTimerCount()' },
  { from: /\bjest\.setSystemTime\s*\(/g, to: 'vi.setSystemTime(' },
  { from: /\bjest\.runAllTicks\s*\(\)/g, to: 'vi.runAllTicks()' },
  {
    from: /\bjest\.advanceTimersToNextTimer\s*\(/g,
    to: 'vi.advanceTimersToNextTimer(',
  },
  {
    from: /\bjest\.advanceTimersToNextFrame\s*\(/g,
    to: 'vi.advanceTimersToNextFrame(',
  },
  { from: /\bjest\.runAllAsyncTimers\s*\(\)/g, to: 'vi.runAllAsyncTimers()' },
  { from: /\bjest\.runAllImmediates\s*\(\)/g, to: 'vi.runAllTicks()' },
  { from: /\bjest\.createMockFromModule\s*\(/g, to: 'vi.importMock(' },
  { from: /\bjest\.genMockFromModule\s*\(/g, to: 'vi.importMock(' },
  { from: /\bjest\.resetModules\s*\(\)/g, to: 'vi.resetModules()' },
  { from: /\bjest\.now\s*\(\)/g, to: 'Date.now()' },
  { from: /\bjest\.isMockFunction\s*\(/g, to: 'vi.isMockFunction(' },

  // Handle jest in comments and documentation
  { from: /(\s+)jest\.mock/g, to: '$1vi.mock' },
  { from: /before jest\.mock/g, to: 'before vi.mock' },
  { from: /after jest\.mock/g, to: 'after vi.mock' },
  { from: /using vitest/gi, to: 'using vitest' },
  { from: /with vitest/gi, to: 'with vitest' },
  { from: /Vitest testing/gi, to: 'Vitest testing' },
  { from: /vitest framework/gi, to: 'vitest framework' },

  // Import statement replacements
  { from: /from\s+['"]jest['"]/g, to: 'from "vitest"' },
  { from: /from\s+["']@jest\/globals["']/g, to: 'from "vitest"' },
  { from: /require\(['"]jest['"]\)/g, to: 'require("vitest")' },
  { from: /require\(['"]@jest\/globals['"]\)/g, to: 'require("vitest")' },

  // Configuration replacements
  { from: /jest\.config\./g, to: 'vitest.config.' },
  { from: /jest\.setup\./g, to: 'vitest.setup.' },
  {
    from: /"testEnvironment":\s*"jest-environment-jsdom"/g,
    to: '"testEnvironment": "jsdom"',
  },
  {
    from: /"testEnvironment":\s*"jest-environment-node"/g,
    to: '"testEnvironment": "node"',
  },

  // Package.json script replacements
  { from: /"test":\s*"jest"/g, to: '"test": "vitest"' },
  {
    from: /"test:watch":\s*"jest\s+--watch"/g,
    to: '"test:watch": "vitest --watch"',
  },
  {
    from: /"test:coverage":\s*"jest\s+--coverage"/g,
    to: '"test:coverage": "vitest --coverage"',
  },
  { from: /jest\s+--/g, to: 'vitest --' },

  // CLI commands
  { from: /npx\s+jest/g, to: 'npx vitest' },
  { from: /yarn\s+jest/g, to: 'yarn vitest' },
  { from: /npm\s+run\s+jest/g, to: 'npm run vitest' },
  { from: /pnpm\s+jest/g, to: 'pnpm vitest' },
];

// Special handling for specific patterns that need context
const CONTEXT_REPLACEMENTS = [
  {
    // Replace Jest in error messages and logs
    pattern: /console\.(log|error|warn)\([^)]*jest[^)]*\)/gi,
    replace: (match) => match.replace(/jest/gi, 'vitest'),
  },
  {
    // Replace in test descriptions
    pattern: /(describe|it|test)\([^)]*jest[^)]*\)/gi,
    replace: (match) => match.replace(/jest/gi, 'vitest'),
  },
];

async function findAllFiles(
  dir,
  excludeDirs = [
    'node_modules',
    '.git',
    'dist',
    'build',
    'coverage',
    '.next',
    'out',
    '.cache',
  ]
) {
  const files = [];

  async function traverse(currentPath) {
    try {
      const entries = await fs.readdir(currentPath, { withFileTypes: true });

      await Promise.all(
        entries.map(async (entry) => {
          const fullPath = path.join(currentPath, entry.name);

          if (entry.isDirectory()) {
            // Skip excluded directories and hidden directories (except .husky)
            if (
              !excludeDirs.includes(entry.name) &&
              (entry.name === '.husky' || !entry.name.startsWith('.'))
            ) {
              await traverse(fullPath);
            }
          } else if (entry.isFile()) {
            // Include all relevant files
            if (
              fullPath.match(/\.(js|jsx|ts|tsx|json|md|yaml|yml|sh|mjs|cjs)$/)
            ) {
              files.push(fullPath);
            }
          }
        })
      );
    } catch (error) {
      console.error(`Error reading directory ${currentPath}:`, error.message);
    }
  }

  await traverse(dir);
  return files;
}

async function processFile(filePath) {
  try {
    // Skip migration scripts themselves
    if (
      filePath.includes('jest-to-vitest') ||
      filePath.includes('jest-conversion')
    ) {
      return { filePath, modified: false, skipped: true };
    }

    let content = await fs.readFile(filePath, 'utf-8');
    let modified = false;
    const originalContent = content;

    // Check if file contains jest references (case insensitive for broader match)
    if (!content.toLowerCase().includes('jest')) {
      return { filePath, modified: false };
    }

    // Special handling for test files - ensure vi import exists
    const isTestFile = filePath.match(/\.(test|spec)\.(js|jsx|ts|tsx)$/);

    if (isTestFile) {
      // Check if file uses any jest. references
      if (content.match(/\bjest\./)) {
        // Check if vi is already imported
        const hasViImport = content.match(
          /import\s+.*\bvi\b.*from\s+["']vitest["']/
        );
        const hasVitestImport = content.match(/from\s+["']vitest["']/);

        if (!hasViImport) {
          if (hasVitestImport) {
            // Add vi to existing vitest import
            content = content.replace(
              /import\s+\{([^}]+)\}\s+from\s+["']vitest["']/,
              (match, imports) => {
                const importList = imports.split(',').map((i) => i.trim());
                if (!importList.includes('vi')) {
                  return `import { vi, ${imports} } from "vitest"`;
                }
                return match;
              }
            );
          } else {
            // Add new import at the beginning after any existing imports
            const lines = content.split('\n');
            let insertIndex = 0;
            let lastImportIndex = -1;

            // Find the last import statement
            for (let i = 0; i < lines.length; i++) {
              if (
                lines[i].match(/^import\s+/) ||
                lines[i].match(/^const\s+.*=\s*require/)
              ) {
                lastImportIndex = i;
              }
            }

            // Insert after last import or at beginning
            insertIndex = lastImportIndex >= 0 ? lastImportIndex + 1 : 0;
            lines.splice(insertIndex, 0, 'import { vi } from "vitest";');
            content = lines.join('\n');
          }
          modified = true;
        }
      }
    }

    // Apply all standard replacements
    for (const replacement of REPLACEMENTS) {
      const beforeContent = content;
      content = content.replace(replacement.from, replacement.to);
      if (content !== beforeContent) {
        modified = true;
      }
    }

    // Apply context-aware replacements
    for (const contextRepl of CONTEXT_REPLACEMENTS) {
      const beforeContent = content;
      content = content.replace(contextRepl.pattern, contextRepl.replace);
      if (content !== beforeContent) {
        modified = true;
      }
    }

    // Clean up package.json
    if (path.basename(filePath) === 'package.json') {
      try {
        const pkg = JSON.parse(content);
        let pkgModified = false;

        // Remove Jest packages from dependencies and devDependencies
        const jestPackages = [
          'jest',
          '@types/jest',
          'ts-jest',
          'babel-jest',
          'jest-environment-jsdom',
          'jest-environment-node',
          'jest-circus',
          'jest-watch-typeahead',
          'jest-resolve',
          'jest-runner',
          'jest-cli',
          'jest-config',
        ];

        for (const section of ['dependencies', 'devDependencies']) {
          if (pkg[section]) {
            for (const jestPkg of jestPackages) {
              if (pkg[section][jestPkg]) {
                delete pkg[section][jestPkg];
                pkgModified = true;
              }
            }
          }
        }

        // Update jest configuration to vitest
        if (pkg.jest) {
          pkg.vitest = pkg.jest;
          delete pkg.jest;
          pkgModified = true;
        }

        if (pkgModified) {
          content = JSON.stringify(pkg, null, 2) + '\n';
          modified = true;
        }
      } catch (e) {
        // If JSON parsing fails, continue with regex replacements
      }
    }

    // Special handling for GitHub Actions and CI/CD files
    if (filePath.match(/\.(yml|yaml)$/)) {
      // Replace jest commands in CI files
      content = content.replace(/run:\s*jest/g, 'run: vitest');
      content = content.replace(
        /npm\s+test\s+--\s+jest/g,
        'npm test -- vitest'
      );
      content = content.replace(/yarn\s+test\s+jest/g, 'yarn test vitest');

      if (content !== originalContent) {
        modified = true;
      }
    }

    if (modified) {
      await fs.writeFile(filePath, content, 'utf-8');
      return { filePath, modified: true, changes: true };
    }

    return { filePath, modified: false };
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error.message);
    return { filePath, modified: false, error: error.message };
  }
}

async function processInChunks(files, chunkSize = 10) {
  const results = [];
  for (let i = 0; i < files.length; i += chunkSize) {
    const chunk = files.slice(i, i + chunkSize);
    const chunkResults = await Promise.all(chunk.map(processFile));
    results.push(...chunkResults);

    const progress = Math.round(((i + chunk.length) / files.length) * 100);
    process.stdout.write(
      `\rProcessing: ${progress}% (${i + chunk.length}/${files.length} files)`
    );
  }
  process.stdout.write('\n');
  return results;
}

async function verifyNoJestReferences(rootDir) {
  console.log('\n🔍 Verifying vitest removal...');

  const testFiles = await findAllFiles(rootDir);
  const jestReferences = [];

  for (const file of testFiles) {
    // Skip node_modules and migration scripts
    if (
      file.includes('node_modules') ||
      file.includes('jest-to-vitest') ||
      file.includes('jest-conversion') ||
      file.includes('jest-removal')
    ) {
      continue;
    }

    try {
      const content = await fs.readFile(file, 'utf-8');

      // Look for any remaining jest references (excluding jest-dom which is compatible)
      const jestMatches = content.match(/\bjest\b(?!-dom)/gi);
      if (jestMatches && jestMatches.length > 0) {
        // Filter out false positives (comments about migration, etc.)
        const realMatches = jestMatches.filter((match) => {
          const index = content.indexOf(match);
          const line = content.substring(
            content.lastIndexOf('\n', index) + 1,
            content.indexOf('\n', index)
          );

          // Skip if it's in a comment about the migration
          if (line.includes('//') && line.includes('migration')) return false;
          if (line.includes('//') && line.includes('converted')) return false;
          if (line.includes('//') && line.includes('replaced')) return false;

          return true;
        });

        if (realMatches.length > 0) {
          jestReferences.push({
            file: path.relative(rootDir, file),
            count: realMatches.length,
          });
        }
      }
    } catch (error) {
      // Skip files that can't be read
    }
  }

  return jestReferences;
}

async function main() {
  console.log('🔄 Starting FINAL vitest to Vitest conversion...\n');
  console.log('This will remove ALL vitest references from your codebase.\n');

  const rootDir = process.cwd();
  console.log(`📁 Scanning directory: ${rootDir}`);
  console.log('📁 Searching for all files...');

  const allFiles = await findAllFiles(rootDir);
  console.log(`📋 Found ${allFiles.length} files to check\n`);

  if (allFiles.length === 0) {
    console.log('No files found.');
    return;
  }

  console.log(`🚀 Processing files...\n`);
  const results = await processInChunks(allFiles, 10);

  const modifiedFiles = results.filter((r) => r.modified);
  const skippedFiles = results.filter((r) => r.skipped);
  const errorFiles = results.filter((r) => r.error);

  console.log('\n✨ Conversion complete!\n');
  console.log(`📊 Summary:`);
  console.log(`   - Total files scanned: ${results.length}`);
  console.log(`   - Files modified: ${modifiedFiles.length}`);
  console.log(`   - Files skipped (migration scripts): ${skippedFiles.length}`);
  console.log(`   - Files with errors: ${errorFiles.length}`);

  if (modifiedFiles.length > 0) {
    console.log('\n✅ Modified files:');
    const grouped = {};
    modifiedFiles.forEach((f) => {
      const ext = path.extname(f.filePath);
      if (!grouped[ext]) grouped[ext] = [];
      grouped[ext].push(f);
    });

    Object.keys(grouped)
      .sort()
      .forEach((ext) => {
        console.log(`\n  ${ext} files (${grouped[ext].length}):`);
        grouped[ext]
          .slice(0, 10)
          .forEach((f) =>
            console.log(`   - ${path.relative(rootDir, f.filePath)}`)
          );
        if (grouped[ext].length > 10) {
          console.log(`   ... and ${grouped[ext].length - 10} more`);
        }
      });
  }

  if (errorFiles.length > 0) {
    console.log('\n⚠️ Files with errors:');
    errorFiles.forEach((f) =>
      console.log(`   - ${path.relative(rootDir, f.filePath)}: ${f.error}`)
    );
  }

  // Verify no Jest references remain
  const remainingJest = await verifyNoJestReferences(rootDir);

  if (remainingJest.length > 0) {
    console.log('\n⚠️ WARNING: Some vitest references may still remain in:');
    remainingJest.forEach((ref) => {
      console.log(`   - ${ref.file} (${ref.count} references)`);
    });
    console.log(
      '\nThese may be in comments or documentation. Please review manually.'
    );
  } else {
    console.log('\n✅ SUCCESS: No vitest references found in source code!');
  }

  console.log('\n📝 Final steps:');
  console.log('   1. Run: npm install (to update dependencies)');
  console.log('   2. Run: npm test (to verify all tests work)');
  console.log(
    '   3. Commit changes: git add -A && git commit -m "chore: complete vitest to Vitest migration"'
  );
  console.log('   4. Update CI/CD pipelines if needed');
  console.log(
    '   5. Update documentation to reference Vitest instead of vitest'
  );

  console.log('\n🎉 vitest to Vitest migration is complete!');
}

main().catch(console.error);
