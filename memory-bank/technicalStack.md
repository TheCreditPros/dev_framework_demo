# Technical Stack & Dependencies

## Core Framework Components

### Testing Infrastructure

- **Vitest**: v3.2.4 - Primary testing framework
- **@testing-library/react**: v16.3.0 - React component testing
- **@testing-library/jest-dom**: v6.8.0 - DOM matchers (Vitest compatible)
- **@testing-library/user-event**: v14.6.1 - User interaction simulation
- **@vitest/ui**: v3.2.4 - Interactive test UI

### Code Quality & Linting

- **ESLint**: v8.57.1 - JavaScript/TypeScript linting
- **@eslint/js**: v9.34.0 - ESLint JavaScript configuration
- **Prettier**: v3.6.2 - Code formatting
- **@typescript-eslint/parser**: v7.18.0 - TypeScript parsing for ESLint
- **@typescript-eslint/eslint-plugin**: v7.18.0 - TypeScript ESLint rules

### Git Hooks & Automation

- **Husky**: v9.1.7 - Git hooks management
- **lint-staged**: v16.1.5 - Run linters on staged files
- **@commitlint/cli**: v19.8.1 - Commit message linting
- **@commitlint/config-conventional**: v18.0.0 - Conventional commit config

### Build Tools

- **Vite**: (via Vitest) - Build tool and dev server
- **@vitejs/plugin-react**: v4.0.0 - React plugin for Vite
- **TypeScript**: (via Next.js) - Type safety
- **Next.js**: v14.x - React framework (portal2-admin-refactor)

---

## Repository-Specific Configurations

### ai-sdlc-docs-1 (Main Repository)

```json
{
  "name": "ai-sdlc-framework",
  "version": "3.3.0",
  "type": "module" (recommended),
  "engines": {
    "node": ">=18.0.0",
    "npm": ">=9.0.0"
  }
}
```

**ESLint Configuration:**

- Flat config format (ESLint v9)
- Test globals configured
- Browser globals configured
- TypeScript support enabled

### portal2-admin-refactor

```json
{
  "name": "@devias-kit-pro/nextjs-starter",
  "version": "8.0.1",
  "private": true,
  "dependencies": {
    "next": "14.x",
    "react": "18.x",
    "@mui/material": "5.x"
  }
}
```

**Test Configuration:**

- Vitest v1.6.1 (needs update to v3.2.4)
- jsdom environment
- 775+ test files
- Next.js integration

### dev_framework_demo

```json
{
  "name": "ai-sdlc-framework",
  "version": "3.3.0",
  "description": "Demo implementation"
}
```

**Framework Components:**

- Validation scripts
- Setup automation
- Documentation examples

---

## Configuration Files

### ESLint Configuration (eslint.config.js)

```javascript
import js from '@eslint/js';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';

export default [
  js.configs.recommended,
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/build/**',
      '**/.next/**',
      '**/coverage/**',
    ],
  },
  {
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
      globals: {
        // Test globals
        describe: 'readonly',
        it: 'readonly',
        test: 'readonly',
        expect: 'readonly',
        vi: 'readonly',
        // Browser globals
        fetch: 'readonly',
        document: 'readonly',
        window: 'readonly',
      },
    },
  },
];
```

### Lint-staged Configuration (.lintstagedrc.js)

```javascript
module.exports = {
  '*.{js,jsx,ts,tsx}': ['eslint --fix', 'prettier --write'],
  '*.{json,md,yml,yaml}': ['prettier --write'],
};
```

### Commitlint Configuration (commitlint.config.js)

```javascript
module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      [
        'feat',
        'fix',
        'docs',
        'style',
        'refactor',
        'test',
        'chore',
        'perf',
        'ci',
      ],
    ],
  },
};
```

### Vitest Configuration (vitest.config.js)

```javascript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.js'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
    },
  },
});
```

---

## NPM Scripts

### Testing Scripts

```json
{
  "test": "vitest",
  "test:watch": "vitest --watch",
  "test:coverage": "vitest --coverage",
  "test:ui": "vitest --ui",
  "test:ci": "vitest run --coverage",
  "test:e2e": "playwright test"
}
```

### Quality Scripts

```json
{
  "lint": "eslint . --fix",
  "lint:check": "eslint .",
  "format": "prettier --write .",
  "format:check": "prettier --check .",
  "typecheck": "tsc --noEmit"
}
```

### Framework Scripts

```json
{
  "framework:validate": "node validate-setup.js",
  "framework:setup": "./setup.sh",
  "prepare": "husky install"
}
```

### AI-SDLC Scripts

```json
{
  "ai:setup": "node scripts-complex/multi-stack-detector.js",
  "ai:quality-check": "node scripts-complex/quality-gate-notifier.js",
  "ai:test-generate": "node scripts-complex/real-ai-test-generator.js"
}
```

---

## Environment Requirements

### Node.js & NPM

- **Node.js**: >= 18.0.0 (LTS recommended)
- **NPM**: >= 9.0.0
- **PNPM**: >= 8.0.0 (alternative)
- **Yarn**: >= 3.0.0 (alternative)

### System Requirements

- **OS**: macOS, Linux, Windows (WSL recommended)
- **RAM**: 8GB minimum, 16GB recommended
- **Disk**: 10GB free space
- **CPU**: 4 cores recommended

### Development Tools

- **Git**: >= 2.38.0
- **VS Code**: Latest version recommended
- **Chrome/Edge**: For debugging
- **Docker**: Optional for containerization

---

## Dependency Tree (Simplified)

```
ai-sdlc-framework@3.3.0
├── Testing
│   ├── vitest@3.2.4
│   ├── @testing-library/react@16.3.0
│   └── @testing-library/jest-dom@6.8.0
├── Code Quality
│   ├── eslint@8.57.1
│   ├── prettier@3.6.2
│   └── @typescript-eslint/parser@7.18.0
├── Git Hooks
│   ├── husky@9.1.7
│   ├── lint-staged@16.1.5
│   └── @commitlint/cli@19.8.1
└── Build Tools
    ├── @vitejs/plugin-react@4.0.0
    └── typescript (peer dependency)
```

---

## Version Compatibility Matrix

| Package    | Min Version | Max Version | Notes                        |
| ---------- | ----------- | ----------- | ---------------------------- |
| Node.js    | 18.0.0      | 22.x        | LTS versions preferred       |
| Vitest     | 3.2.4       | 3.x         | Breaking changes in v4       |
| ESLint     | 8.57.0      | 8.x         | v9 requires config migration |
| TypeScript | 5.0.0       | 5.x         | Strict mode recommended      |
| React      | 18.0.0      | 18.x        | Server components support    |
| Next.js    | 14.0.0      | 14.x        | App router preferred         |

---

## Security Considerations

### Dependency Auditing

- Run `npm audit` weekly
- Use `npm audit fix` for safe updates
- Review security advisories
- Keep dependencies updated

### Git Hooks Security

- Validate hook scripts regularly
- Use signed commits when possible
- Restrict hook modifications
- Audit hook configurations

### Code Quality Gates

- Enforce ESLint security rules
- Use strict TypeScript settings
- Validate input sanitization
- Check for exposed secrets

---

_Last Updated: August 27, 2025_  
_Framework Version: AI-SDLC v3.3.0_  
_Maintained by: AI-SDLC Team_
