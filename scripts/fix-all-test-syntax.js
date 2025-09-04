const fs = require("fs");
const path = require("path");

// Find all test files with syntax errors
function findBrokenTestFiles(dir) {
  const brokenFiles = [];

  function walkDir(currentPath) {
    try {
      const entries = fs.readdirSync(currentPath, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(currentPath, entry.name);

        if (entry.isDirectory()) {
          if (
            !["node_modules", ".next", "coverage", ".git"].includes(entry.name)
          ) {
            walkDir(fullPath);
          }
        } else if (entry.isFile() && entry.name.endsWith(".test.jsx")) {
          try {
            // Try to parse the file to check for syntax errors
            const content = fs.readFileSync(fullPath, "utf8");
            if (
              content.includes("return { default: Comp };") ||
              content.includes("const Comp = ({") ||
              content.includes("})View") ||
              content.includes("})Usage")
            ) {
              brokenFiles.push(fullPath);
            }
          } catch {
            brokenFiles.push(fullPath);
          }
        }
      }
    } catch {
      // Skip directories we can't access
    }
  }

  walkDir(dir);
  return brokenFiles;
}

// Fix common syntax patterns
function fixFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, "utf8");
    let modified = false;

    // Fix malformed mock patterns
    const patterns = [
      // Fix broken mock structure
      {
        from: /vi\.mock\(([^)]+),\s*\(\s*\)\s*=>\s*\{\s*const Comp = \(\{([^}]+)\}\);[\s\S]*?return \{ default: Comp \};[\s\S]*?\}\);$/gm,
        to: (match, mockPath, props) =>
          `vi.mock(${mockPath}, () => ({\n\t${props.trim()}\n}));`,
      },
      // Fix broken mock with missing semicolons
      {
        from: /(\w+):\s*\(\s*\{\s*(\w+)\s*\}\s*\)\s*=>\s*<([^>]+)>\s*,\s*$/gm,
        to: "$1: ({ $2 }) => <$3>,",
      },
      // Fix broken mock return statements
      {
        from: /return \{ default: Comp \};[\s\S]*?\}\);$/gm,
        to: "}));",
      },
    ];

    patterns.forEach((pattern) => {
      const newContent = content.replace(pattern.from, pattern.to);
      if (newContent !== content) {
        content = newContent;
        modified = true;
      }
    });

    if (modified) {
      fs.writeFileSync(filePath, content, "utf8");
      return true;
    }
    return false;
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error.message);
    return false;
  }
}

// Main execution
function main() {
  console.log("🔧 Scanning for broken test files...");

  const projectRoot = path.resolve(__dirname, "..");
  const brokenFiles = findBrokenTestFiles(path.join(projectRoot, "src"));

  console.log(`Found ${brokenFiles.length} potentially broken test files`);

  if (brokenFiles.length === 0) {
    console.log("✅ No broken test files found");
    return;
  }

  console.log("\n🔧 Fixing syntax errors...");
  let fixedCount = 0;

  brokenFiles.forEach((filePath) => {
    if (fixFile(filePath)) {
      console.log(`✅ Fixed: ${path.relative(projectRoot, filePath)}`);
      fixedCount++;
    }
  });

  console.log(`\n🎉 Fixed ${fixedCount} test files`);
  console.log("\nNext steps:");
  console.log("1. Run: npm run lint:fix");
  console.log("2. Run: npm run typecheck");
  console.log("3. Run: npm run format:fix");
}

main();
