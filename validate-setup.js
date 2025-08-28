#!/usr/bin/env node

const { execSync } = require('child_process');

console.log('🔍 Validating AI-SDLC Setup...\n');

const checks = [
  {
    name: 'Git Hooks',
    command:
      "node -e \"const {execSync}=require('child_process');const fs=require('fs');let p='.git/hooks';try{const o=execSync('git config --get core.hookspath').toString().trim();if(o)p=o}catch{};process.exit(fs.existsSync(p + '/pre-commit')?0:1)\"",
    success: 'Pre-commit hooks installed',
  },
  {
    name: 'ESLint',
    command: 'npx eslint --version',
    success: 'ESLint available',
  },
  {
    name: 'Prettier',
    command: 'npx prettier --version',
    success: 'Prettier available',
  },
  {
    name: 'Husky',
    command: 'npx husky --version',
    success: 'Husky available',
  },
];

let passed = 0;
const total = checks.length;

checks.forEach((check) => {
  try {
    execSync(check.command, { stdio: 'ignore' });
    console.log(`✅ ${check.success}`);
    passed++;
  } catch {
    console.log(`❌ ${check.name} not properly configured`);
  }
});

console.log(`\n📊 Validation Results: ${passed}/${total} checks passed`);

if (passed === total) {
  console.log('🎉 All systems ready for AI-powered development!');
} else {
  console.log('⚠️  Some components need attention. Check documentation.');
}
