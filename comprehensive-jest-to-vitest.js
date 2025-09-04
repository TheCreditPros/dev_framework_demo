#!/usr/bin/env node
const fs = require("fs").promises;
const path = require("path");

const REPLACEMENTS = [
  // Import replacements
  { from: /from ['"]jest['"]/, to: 'from "vitest"' },
  { from: /from ["']@jest\/globals["']/, to: 'from "vitest"' },

  // Jest object replacements
  { from: /jest\.fn\(\)/g, to: "vi.fn()" },
  { from: /jest\.mock\(/g, to: "vi.mock(" },
  { from: /jest\.unmock\(/g, to: "vi.unmock(" },
  { from: /jest\.spyOn\(/g, to: "vi.spyOn(" },
  { from: /jest\.clearAllMocks\(\)/g, to: "vi.clearAllMocks()" },
  { from: /jest\.resetAllMocks\(\)/g, to: "vi.resetAllMocks()" },
  { from: /jest\.restoreAllMocks\(\)/g, to: "vi.restoreAllMocks()" },
  { from: /jest\.useFakeTimers\(\)/g, to: "vi.useFakeTimers()" },
  { from: /jest\.useRealTimers\(\)/g, to: "vi.useRealTimers()" },
  { from: /jest\.advanceTimersByTime\(/g, to: "vi.advanceTimersByTime(" },
  { from: /jest\.runAllTimers\(\)/g, to: "vi.runAllTimers()" },
  { from: /jest\.runOnlyPendingTimers\(\)/g, to: "vi.runOnlyPendingTimers()" },
  { from: /jest\.clearAllTimers\(\)/g, to: "vi.clearAllTimers()" },
  { from: /jest\.setTimeout\(/g, to: "vi.setConfig({ testTimeout: " },
  { from: /jest\.doMock\(/g, to: "vi.doMock(" },
  { from: /jest\.dontMock\(/g, to: "vi.dontMock(" },
  { from: /jest\.setMock\(/g, to: "vi.setMock(" },
  { from: /jest\.requireActual\(/g, to: "vi.importActual(" },
  { from: /jest\.requireMock\(/g, to: "vi.importMock(" },
  { from: /jest\.isolateModules\(/g, to: "vi.isolateModules(" },
  { from: /jest\.retryTimes\(/g, to: "vi.retry(" },
  { from: /jest\.mocked\(/g, to: "vi.mocked(" },
  { from: /jest\.getRealSystemTime\(\)/g, to: "vi.getRealSystemTime()" },
  { from: /jest\.getTimerCount\(\)/g, to: "vi.getTimerCount()" },
  { from: /jest\.setSystemTime\(/g, to: "vi.setSystemTime(" },
  { from: /jest\.runAllTicks\(\)/g, to: "vi.runAllTicks()" },
  {
    from: /jest\.advanceTimersToNextTimer\(/g,
    to: "vi.advanceTimersToNextTimer(",
  },

  // Package references in text/comments/configs
  { from: /@jest-mock\/express/g, to: "@vitest-mock/express" },
  { from: /jest\.config\./g, to: "vitest.config." },
  { from: /jest-dom/g, to: "jest-dom" }, // Keep jest-dom as is (it's a testing library package)

  // Configuration and documentation
  { from: /\"jest\":\s*\{/g, to: '"vitest": {' },
  { from: /\'jest\':\s*\{/g, to: "'vitest': {" },
  { from: /test:\s*['"]jest['"]/g, to: 'test: "vitest"' },
  {
    from: /test:watch:\s*['"]jest\s+--watch['"]/g,
    to: 'test:watch: "vitest --watch"',
  },
  {
    from: /test:coverage:\s*['"]jest\s+--coverage['"]/g,
    to: 'test:coverage: "vitest --coverage"',
  },
];

async function findAllFiles(
  dir,
  excludeDirs = ["node_modules", ".git", "dist", "build", "coverage"]
) {
  const files = [];

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
          // Include all JS/TS files, JSON, MD, YAML, YML files
          if (
            fullPath.match(
              /\.(js|jsx|ts|tsx|json|md|yaml|yml|sh|config\.js|config\.ts)$/
            )
          ) {
            files.push(fullPath);
          }
        }
      })
    );
  }

  await traverse(dir);
  return files;
}

async function processFile(filePath) {
  try {
    let content = await fs.readFile(filePath, "utf-8");
    let modified = false;
    const originalContent = content;

    // Check if file contains Jest references
    const hasJest = content.toLowerCase().includes("jest");
    if (!hasJest) return { filePath, modified: false };

    // Special handling for test files - add vi import if needed
    if (filePath.match(/\.(test|spec)\.(js|jsx|ts|tsx)$/)) {
      if (
        !content.includes("import { vi") &&
        !content.includes("const { vi") &&
        content.match(/jest\./)
      ) {
        const hasExistingVitestImport =
          content.includes('from "vitest"') ||
          content.includes("from 'vitest'");
        if (hasExistingVitestImport) {
          // Add vi to existing import
          content = content.replace(
            /import \{([^}]+)\} from ["']vitest["']/,
            (match, imports) => {
              if (!imports.includes("vi")) {
                return `import { vi,${imports}} from "vitest"`;
              }
              return match;
            }
          );
        } else {
          // Add new import at the beginning
          const firstImportIndex = content.search(/^import /m);
          if (firstImportIndex !== -1) {
            const lines = content.split("\n");
            let importLineIndex = 0;
            for (let i = 0; i < lines.length; i++) {
              if (lines[i].startsWith("import ")) {
                importLineIndex = i;
                break;
              }
            }
            lines.splice(importLineIndex, 0, 'import { vi } from "vitest";');
            content = lines.join("\n");
          } else {
            content = 'import { vi } from "vitest";\n' + content;
          }
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

    // Special case: Replace Jest in package.json devDependencies
    if (path.basename(filePath) === "package.json") {
      // Remove Jest packages
      content = content.replace(/"jest":\s*"[^"]+",?\s*/g, "");
      content = content.replace(/"@types\/jest":\s*"[^"]+",?\s*/g, "");
      content = content.replace(/"ts-jest":\s*"[^"]+",?\s*/g, "");
      content = content.replace(/"babel-jest":\s*"[^"]+",?\s*/g, "");

      // Clean up trailing commas in JSON
      content = content.replace(/,(\s*[}\]])/g, "$1");

      if (content !== originalContent) {
        modified = true;
      }
    }

    // Special case: Replace Jest in scripts
    if (filePath.endsWith(".sh") || filePath.endsWith("auto-setup.sh")) {
      content = content.replace(/npm install.*jest[^"'\s]*/g, (match) => {
        return match.replace(/jest/g, "vitest");
      });
      content = content.replace(/yarn add.*jest[^"'\s]*/g, (match) => {
        return match.replace(/jest/g, "vitest");
      });
      if (content !== originalContent) {
        modified = true;
      }
    }

    if (modified) {
      await fs.writeFile(filePath, content, "utf-8");
      return { filePath, modified: true };
    }

    return { filePath, modified: false };
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error.message);
    return { filePath, modified: false, error: error.message };
  }
}

async function processInChunks(files, chunkSize = 20) {
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
  process.stdout.write("\n");
  return results;
}

async function main() {
  console.log("🔄 Starting comprehensive Jest to Vitest conversion...\n");

  const rootDir = process.cwd();
  console.log("📁 Searching for all files...");

  const allFiles = await findAllFiles(rootDir);
  console.log(`📋 Found ${allFiles.length} files to check\n`);

  if (allFiles.length === 0) {
    console.log("No files found.");
    return;
  }

  console.log("🚀 Processing files...\n");
  const results = await processInChunks(allFiles, 20);

  const modifiedFiles = results.filter((r) => r.modified);
  const errorFiles = results.filter((r) => r.error);

  console.log("\n✨ Conversion complete!\n");
  console.log("📊 Summary:");
  console.log(`   - Total files scanned: ${results.length}`);
  console.log(`   - Files modified: ${modifiedFiles.length}`);
  console.log(`   - Files with errors: ${errorFiles.length}`);

  if (modifiedFiles.length > 0) {
    console.log("\n✅ Modified files:");
    const grouped = {};
    modifiedFiles.forEach((f) => {
      const ext = path.extname(f.filePath);
      if (!grouped[ext]) grouped[ext] = [];
      grouped[ext].push(f);
    });

    Object.keys(grouped).forEach((ext) => {
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
    console.log("\n⚠️ Files with errors:");
    errorFiles.forEach((f) =>
      console.log(`   - ${path.relative(rootDir, f.filePath)}: ${f.error}`)
    );
  }

  console.log("\n📝 Next steps:");
  console.log("   1. Run: npm install (to update dependencies)");
  console.log("   2. Run: npm test (to verify tests work)");
  console.log(
    "   3. Remove Jest packages: npm uninstall jest @types/jest ts-jest babel-jest"
  );
  console.log("   4. Check CI/CD pipelines for Jest references");
}

main().catch(console.error);
