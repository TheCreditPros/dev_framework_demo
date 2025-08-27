#!/usr/bin/env node
const fs = require('fs').promises;
const path = require('path');
const { Worker } = require('worker_threads');
const os = require('os');

const REPLACEMENTS = [
  { from: /from ['"]jest['"]/, to: 'from "vitest"' },
  { from: /from ["']@jest\/globals["']/, to: 'from "vitest"' },
  { from: /jest\.fn\(\)/g, to: 'vi.fn()' },
  { from: /jest\.mock\(/g, to: 'vi.mock(' },
  { from: /jest\.unmock\(/g, to: 'vi.unmock(' },
  { from: /jest\.spyOn\(/g, to: 'vi.spyOn(' },
  { from: /jest\.clearAllMocks\(\)/g, to: 'vi.clearAllMocks()' },
  { from: /jest\.resetAllMocks\(\)/g, to: 'vi.resetAllMocks()' },
  { from: /jest\.restoreAllMocks\(\)/g, to: 'vi.restoreAllMocks()' },
  { from: /jest\.useFakeTimers\(\)/g, to: 'vi.useFakeTimers()' },
  { from: /jest\.useRealTimers\(\)/g, to: 'vi.useRealTimers()' },
  { from: /jest\.advanceTimersByTime\(/g, to: 'vi.advanceTimersByTime(' },
  { from: /jest\.runAllTimers\(\)/g, to: 'vi.runAllTimers()' },
  { from: /jest\.runOnlyPendingTimers\(\)/g, to: 'vi.runOnlyPendingTimers()' },
  { from: /jest\.clearAllTimers\(\)/g, to: 'vi.clearAllTimers()' },
  { from: /jest\.setTimeout\(/g, to: 'vi.setConfig({ testTimeout: ' },
  { from: /jest\.doMock\(/g, to: 'vi.doMock(' },
  { from: /jest\.dontMock\(/g, to: 'vi.dontMock(' },
  { from: /jest\.setMock\(/g, to: 'vi.setMock(' },
  { from: /jest\.requireActual\(/g, to: 'vi.importActual(' },
  { from: /jest\.requireMock\(/g, to: 'vi.importMock(' },
  { from: /jest\.isolateModules\(/g, to: 'vi.isolateModules(' },
  { from: /jest\.retryTimes\(/g, to: 'vi.retry(' },
  { from: /@jest-mock\/express/g, to: '@vitest-mock/express' },
  { from: /beforeAll\(/g, to: 'beforeAll(' },
  { from: /afterAll\(/g, to: 'afterAll(' },
  { from: /beforeEach\(/g, to: 'beforeEach(' },
  { from: /afterEach\(/g, to: 'afterEach(' }
];

async function findTestFiles(dir, excludeDirs = ['node_modules', '.git', 'dist', 'build']) {
  const testFiles = [];
  
  async function traverse(currentPath) {
    const entries = await fs.readdir(currentPath, { withFileTypes: true });
    
    await Promise.all(
      entries.map(async (entry) => {
        const fullPath = path.join(currentPath, entry.name);
        
        if (entry.isDirectory()) {
          if (!excludeDirs.includes(entry.name)) {
            await traverse(fullPath);
          }
        } else if (entry.isFile()) {
          if (fullPath.match(/\.(test|spec)\.(js|jsx|ts|tsx)$/)) {
            testFiles.push(fullPath);
          }
        }
      })
    );
  }
  
  await traverse(dir);
  return testFiles;
}

async function processFile(filePath) {
  try {
    let content = await fs.readFile(filePath, 'utf-8');
    let modified = false;
    
    const hasJest = content.includes('jest');
    if (!hasJest) return { filePath, modified: false };
    
    if (!content.includes('import { vi') && !content.includes('const { vi') && content.match(/jest\./)) {
      const hasExistingImports = content.includes('import {') && content.includes('} from "vitest"');
      if (hasExistingImports) {
        content = content.replace(/import \{([^}]+)\} from ["']vitest["']/, (match, imports) => {
          if (!imports.includes('vi')) {
            return `import { vi,${imports}} from "vitest"`;
          }
          return match;
        });
      } else if (content.includes('from "vitest"') || content.includes("from 'vitest'")) {
        const vitestImportRegex = /import \{[^}]+\} from ["']vitest["']/;
        content = content.replace(vitestImportRegex, (match) => {
          const imports = match.match(/\{([^}]+)\}/)[1];
          if (!imports.includes('vi')) {
            return match.replace('{', '{ vi, ');
          }
          return match;
        });
      } else {
        const firstImportIndex = content.search(/^import /m);
        if (firstImportIndex !== -1) {
          const lines = content.split('\n');
          let importLineIndex = 0;
          for (let i = 0; i < lines.length; i++) {
            if (lines[i].startsWith('import ')) {
              importLineIndex = i;
              break;
            }
          }
          lines.splice(importLineIndex, 0, 'import { vi } from "vitest";');
          content = lines.join('\n');
        } else {
          content = 'import { vi } from "vitest";\n' + content;
        }
      }
      modified = true;
    }
    
    for (const replacement of REPLACEMENTS) {
      const beforeContent = content;
      content = content.replace(replacement.from, replacement.to);
      if (content !== beforeContent) {
        modified = true;
      }
    }
    
    if (modified) {
      await fs.writeFile(filePath, content, 'utf-8');
      return { filePath, modified: true };
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
  console.log('🔄 Starting Jest to Vitest conversion...\n');
  
  const rootDir = process.cwd();
  console.log('📁 Searching for test files...');
  
  const testFiles = await findTestFiles(rootDir);
  console.log(`📋 Found ${testFiles.length} test files\n`);
  
  if (testFiles.length === 0) {
    console.log('No test files found.');
    return;
  }
  
  const numCPUs = os.cpus().length;
  const chunkSize = Math.max(10, Math.floor(testFiles.length / (numCPUs * 2)));
  
  console.log(`🚀 Processing files (chunk size: ${chunkSize})...\n`);
  const results = await processInChunks(testFiles, chunkSize);
  
  const modifiedFiles = results.filter(r => r.modified);
  const errorFiles = results.filter(r => r.error);
  
  console.log('\n✨ Conversion complete!\n');
  console.log(`📊 Summary:`);
  console.log(`   - Total files scanned: ${results.length}`);
  console.log(`   - Files modified: ${modifiedFiles.length}`);
  console.log(`   - Files with errors: ${errorFiles.length}`);
  
  if (modifiedFiles.length > 0) {
    console.log('\n✅ Modified files:');
    modifiedFiles.forEach(f => console.log(`   - ${path.relative(rootDir, f.filePath)}`));
  }
  
  if (errorFiles.length > 0) {
    console.log('\n⚠️ Files with errors:');
    errorFiles.forEach(f => console.log(`   - ${path.relative(rootDir, f.filePath)}: ${f.error}`));
  }
  
  console.log('\n📝 Next steps:');
  console.log('   1. Update package.json test script to use vitest');
  console.log('   2. Create or update vitest.config.js');
  console.log('   3. Run tests to verify conversion');
}

main().catch(console.error);