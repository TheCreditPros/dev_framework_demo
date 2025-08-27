#!/usr/bin/env node
const fs = require('fs').promises;
const path = require('path');

const REPLACEMENTS = [
  // Import replacements - more comprehensive
  { from: /from\s+['"]jest['"]/g, to: 'from "vitest"' },
  { from: /from\s+["']@jest\/globals["']/g, to: 'from "vitest"' },
  { from: /require\(['"]jest['"]\)/g, to: 'require("vitest")' },
  { from: /require\(['"]@jest\/globals['"]\)/g, to: 'require("vitest")' },
  
  // Jest object replacements - handle all cases including whitespace
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
  { from: /\bjest\.runOnlyPendingTimers\s*\(\)/g, to: 'vi.runOnlyPendingTimers()' },
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
  { from: /\bjest\.advanceTimersToNextTimer\s*\(/g, to: 'vi.advanceTimersToNextTimer(' },
  { from: /\bjest\.advanceTimersToNextFrame\s*\(/g, to: 'vi.advanceTimersToNextFrame(' },
  { from: /\bjest\.runAllAsyncTimers\s*\(\)/g, to: 'vi.runAllAsyncTimers()' },
  { from: /\bjest\.runAllImmediates\s*\(\)/g, to: 'vi.runAllTicks()' },
  { from: /\bjest\.clearAllMocks/g, to: 'vi.clearAllMocks' },
  { from: /\bjest\.resetAllMocks/g, to: 'vi.resetAllMocks' },
  { from: /\bjest\.restoreAllMocks/g, to: 'vi.restoreAllMocks' },
  { from: /\bjest\.createMockFromModule\s*\(/g, to: 'vi.importMock(' },
  { from: /\bjest\.genMockFromModule\s*\(/g, to: 'vi.importMock(' },
  
  // Special Jest matchers
  { from: /expect\.arrayContaining\(/g, to: 'expect.arrayContaining(' },
  { from: /expect\.objectContaining\(/g, to: 'expect.objectContaining(' },
  { from: /expect\.stringContaining\(/g, to: 'expect.stringContaining(' },
  { from: /expect\.stringMatching\(/g, to: 'expect.stringMatching(' },
  { from: /expect\.any\(/g, to: 'expect.any(' },
  
  // Configuration files
  { from: /jest\.config\./g, to: 'vitest.config.' },
  { from: /jest\.setup\./g, to: 'vitest.setup.' },
  
  // In package.json scripts
  { from: /"test":\s*"jest"/g, to: '"test": "vitest"' },
  { from: /"test:watch":\s*"jest\s+--watch"/g, to: '"test:watch": "vitest --watch"' },
  { from: /"test:coverage":\s*"jest\s+--coverage"/g, to: '"test:coverage": "vitest --coverage"' },
  
  // Jest config in package.json
  { from: /"jest":\s*\{/g, to: '"vitest": {' },
  { from: /'jest':\s*\{/g, to: "'vitest': {" },
  
  // Testing library jest-dom - keep the package but update imports
  { from: /@testing-library\/jest-dom/g, to: '@testing-library/jest-dom' }, // Keep as is for compatibility
  
  // CLI commands
  { from: /npx\s+jest/g, to: 'npx vitest' },
  { from: /yarn\s+jest/g, to: 'yarn vitest' },
  { from: /npm\s+run\s+jest/g, to: 'npm run vitest' },
];

async function findAllFiles(dir, excludeDirs = ['node_modules', '.git', 'dist', 'build', 'coverage', '.next', 'out']) {
  const files = [];
  
  async function traverse(currentPath) {
    try {
      const entries = await fs.readdir(currentPath, { withFileTypes: true });
      
      await Promise.all(
        entries.map(async (entry) => {
          const fullPath = path.join(currentPath, entry.name);
          
          if (entry.isDirectory()) {
            if (!excludeDirs.includes(entry.name) && !entry.name.startsWith('.')) {
              await traverse(fullPath);
            }
          } else if (entry.isFile()) {
            // Include all relevant files
            if (fullPath.match(/\.(js|jsx|ts|tsx|json|md|yaml|yml|sh|mjs|cjs)$/)) {
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
    let content = await fs.readFile(filePath, 'utf-8');
    let modified = false;
    const originalContent = content;
    
    // Special handling for test files - ensure vi import exists
    const isTestFile = filePath.match(/\.(test|spec)\.(js|jsx|ts|tsx)$/);
    
    if (isTestFile && content.match(/\bjest\./)) {
      // Check if vi is already imported
      const hasViImport = content.match(/import\s+.*\bvi\b.*from\s+["']vitest["']/);
      const hasVitestImport = content.match(/from\s+["']vitest["']/);
      
      if (!hasViImport) {
        if (hasVitestImport) {
          // Add vi to existing vitest import
          content = content.replace(
            /import\s+\{([^}]+)\}\s+from\s+["']vitest["']/,
            (match, imports) => {
              const importList = imports.split(',').map(i => i.trim());
              if (!importList.includes('vi')) {
                return `import { vi, ${imports} } from "vitest"`;
              }
              return match;
            }
          );
        } else {
          // Add new import at the beginning
          const lines = content.split('\n');
          let insertIndex = 0;
          
          // Find the first import statement or use beginning of file
          for (let i = 0; i < lines.length; i++) {
            if (lines[i].match(/^import\s+/) || lines[i].match(/^const\s+.*require/)) {
              insertIndex = i;
              break;
            }
          }
          
          lines.splice(insertIndex, 0, 'import { vi } from "vitest";');
          content = lines.join('\n');
        }
        modified = true;
      }
    }
    
    // Apply all replacements
    for (const replacement of REPLACEMENTS) {
      const beforeContent = content;
      content = content.replace(replacement.from, replacement.to);
      if (content !== beforeContent) {
        modified = true;
      }
    }
    
    // Clean up package.json
    if (path.basename(filePath) === 'package.json') {
      // Remove Jest-specific packages
      const jestPackages = [
        /"jest":\s*"[^"]+",?\s*/g,
        /"@types\/jest":\s*"[^"]+",?\s*/g,
        /"ts-jest":\s*"[^"]+",?\s*/g,
        /"babel-jest":\s*"[^"]+",?\s*/g,
        /"jest-environment-jsdom":\s*"[^"]+",?\s*/g,
        /"jest-environment-node":\s*"[^"]+",?\s*/g,
        /"jest-circus":\s*"[^"]+",?\s*/g,
        /"jest-watch-typeahead":\s*"[^"]+",?\s*/g,
      ];
      
      for (const pattern of jestPackages) {
        content = content.replace(pattern, '');
      }
      
      // Clean up trailing commas in JSON
      content = content.replace(/,(\s*[}\]])/g, '$1');
      content = content.replace(/,\s*,/g, ',');
      
      if (content !== originalContent) {
        modified = true;
      }
    }
    
    // Special handling for GitHub Actions and CI/CD files
    if (filePath.match(/\.(yml|yaml)$/) && content.includes('jest')) {
      content = content.replace(/\bjest\b/g, 'vitest');
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
    process.stdout.write(`\rProcessing: ${progress}% (${i + chunk.length}/${files.length} files)`);
  }
  process.stdout.write('\n');
  return results;
}

async function main() {
  console.log('🔄 Starting enhanced Jest to Vitest conversion...\n');
  
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
  
  const modifiedFiles = results.filter(r => r.modified);
  const errorFiles = results.filter(r => r.error);
  
  console.log('\n✨ Conversion complete!\n');
  console.log(`📊 Summary:`);
  console.log(`   - Total files scanned: ${results.length}`);
  console.log(`   - Files modified: ${modifiedFiles.length}`);
  console.log(`   - Files with errors: ${errorFiles.length}`);
  
  if (modifiedFiles.length > 0) {
    console.log('\n✅ Modified files:');
    const grouped = {};
    modifiedFiles.forEach(f => {
      const ext = path.extname(f.filePath);
      if (!grouped[ext]) grouped[ext] = [];
      grouped[ext].push(f);
    });
    
    Object.keys(grouped).sort().forEach(ext => {
      console.log(`\n  ${ext} files (${grouped[ext].length}):`);
      grouped[ext].slice(0, 10).forEach(f => 
        console.log(`   - ${path.relative(rootDir, f.filePath)}`)
      );
      if (grouped[ext].length > 10) {
        console.log(`   ... and ${grouped[ext].length - 10} more`);
      }
    });
  }
  
  if (errorFiles.length > 0) {
    console.log('\n⚠️ Files with errors:');
    errorFiles.forEach(f => console.log(`   - ${path.relative(rootDir, f.filePath)}: ${f.error}`));
  }
  
  console.log('\n📝 Next steps:');
  console.log('   1. Run: npm install (to update dependencies)');
  console.log('   2. Run: npm test (to verify tests work)');
  console.log('   3. Remove Jest packages: npm uninstall jest @types/jest ts-jest babel-jest jest-environment-jsdom');
  console.log('   4. Install Vitest if not already: npm install -D vitest @vitest/ui');
  console.log('   5. Check CI/CD pipelines for any remaining Jest references');
  console.log('   6. Update any vitest.config.js to vitest.config.js if needed');
  
  // Show specific package.json changes needed
  console.log('\n📦 Package.json cleanup commands:');
  console.log('   npm uninstall jest @types/jest ts-jest babel-jest jest-environment-jsdom jest-circus jest-watch-typeahead');
  console.log('   npm install -D vitest @vitest/ui @vitest/coverage-v8');
}

main().catch(console.error);