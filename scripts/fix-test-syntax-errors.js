const fs = require("fs");
const path = require("path");

// Common syntax error patterns and their fixes
const syntaxFixes = [
  // Fix missing semicolons after mock objects
  {
    pattern: /(\}\));\s*$/gm,
    replacement: "$1;",
  },
  // Fix missing semicolons after mock function definitions
  {
    pattern: /(\}\)\s*\));\s*$/gm,
    replacement: "$1;",
  },
  // Fix malformed mock return statements
  {
    pattern: /return \{ default: Comp \};\s*(\w+.*?);\s*\}\);$/gm,
    replacement: "return { default: Comp };",
  },
  // Fix broken mock syntax with missing commas
  {
    pattern: /(\w+):\s*\(\s*\{\s*(\w+)\s*\}\s*\)\s*=>\s*<([^>]+)>\s*,\s*$/gm,
    replacement: "$1: ({ $2 }) => <$3>,",
  },
  // Fix broken mock syntax with missing semicolons
  {
    pattern: /(\w+):\s*\(\s*\{\s*(\w+)\s*\}\s*\)\s*=>\s*<([^>]+)>\s*$/gm,
    replacement: "$1: ({ $2 }) => <$3>;",
  },
  // Fix broken mock syntax with missing closing braces
  {
    pattern: /return \{ default: Comp \};\s*(\w+.*?)\s*\}\);$/gm,
    replacement: "return { default: Comp };",
  },
];

function fixSyntaxErrors(filePath) {
  try {
    let content = fs.readFileSync(filePath, "utf8");
    let modified = false;

    // Apply all syntax fixes
    syntaxFixes.forEach((fix) => {
      const newContent = content.replace(fix.pattern, fix.replacement);
      if (newContent !== content) {
        content = newContent;
        modified = true;
      }
    });

    // Fix specific common patterns
    if (content.includes("return { default: Comp };")) {
      // Look for malformed mock structures
      content = content.replace(
        /(\w+):\s*\(\s*\{\s*(\w+)\s*\}\s*\)\s*=>\s*<([^>]+)>\s*,\s*$/gm,
        "$1: ({ $2 }) => <$3>,"
      );
      modified = true;
    }

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

function findTestFiles(dir) {
  const testFiles = [];

  function walkDir(currentPath) {
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
        testFiles.push(fullPath);
      }
    }
  }

  walkDir(dir);
  return testFiles;
}

function main() {
  console.log("🔧 Fixing test file syntax errors...");

  const projectRoot = path.resolve(__dirname, "..");
  const testFiles = findTestFiles(path.join(projectRoot, "src"));

  console.log(`Found ${testFiles.length} test files to process`);

  let fixedCount = 0;

  testFiles.forEach((filePath) => {
    if (fixSyntaxErrors(filePath)) {
      console.log(`✅ Fixed: ${path.relative(projectRoot, filePath)}`);
      fixedCount++;
    }
  });

  console.log(`\n🎉 Fixed ${fixedCount} test files`);
  console.log("Now run: npm run lint:fix && npm run typecheck");
}

main();
