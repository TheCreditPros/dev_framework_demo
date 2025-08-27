const fs = require('fs');
const path = require('path');

function fixCSSModuleMocks(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;

  // Fix CSS module mocks that don't have default exports
  const cssModuleMockPattern = /vi\.mock\(["']@\/styles\/[^"']*\.(?:css|scss)["'],\s*\(\)\s*=>\s*\(\s*\{([^}]*)\}\s*\)/g;
  
  content = content.replace(cssModuleMockPattern, (match, mockContent) => {
    // Check if the mock content already has a default export
    if (!mockContent.includes('default:')) {
      modified = true;
      // Extract the mock properties and wrap them in a default export
      const properties = mockContent.trim();
      return `vi.mock("@/styles/${path.basename(filePath).replace('.test.jsx', '.css')}", () => ({ default: { ${properties} } })`;
    }
    return match;
  });

  // Fix CSS module mocks with virtual: true that don't have default exports
  const virtualCssModuleMockPattern = /vi\.mock\(["']@\/styles\/[^"']*\.(?:css|scss)["'],\s*\(\)\s*=>\s*\(\s*\{([^}]*)\}\s*,\s*\{\s*virtual:\s*true\s*\}\s*\)/g;
  
  content = content.replace(virtualCssModuleMockPattern, (match, mockContent) => {
    if (!mockContent.includes('default:')) {
      modified = true;
      const properties = mockContent.trim();
      return `vi.mock("@/styles/${path.basename(filePath).replace('.test.jsx', '.css')}", () => ({ default: { ${properties} } }), { virtual: true })`;
    }
    return match;
  });

  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ Fixed CSS module mocks: ${filePath}`);
    return true;
  }
  return false;
}

function findTestFiles(dir) {
  const testFiles = [];
  
  function scanDirectory(currentDir) {
    const items = fs.readdirSync(currentDir);
    
    for (const item of items) {
      const fullPath = path.join(currentDir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        scanDirectory(fullPath);
      } else if (item.endsWith('.test.jsx') || item.endsWith('.test.js')) {
        testFiles.push(fullPath);
      }
    }
  }
  
  scanDirectory(dir);
  return testFiles;
}

function fixAllCSSModuleMocks(projectRoot) {
  console.log('🔧 Fixing CSS module mocks...');
  
  const testFiles = findTestFiles(path.join(projectRoot, 'src'));
  let fixedCount = 0;
  
  for (const filePath of testFiles) {
    if (fixCSSModuleMocks(filePath)) {
      fixedCount++;
    }
  }
  
  console.log(`✅ Fixed CSS module mocks in ${fixedCount} files`);
}

const projectRoot = path.resolve(__dirname, '..');
fixAllCSSModuleMocks(projectRoot);
