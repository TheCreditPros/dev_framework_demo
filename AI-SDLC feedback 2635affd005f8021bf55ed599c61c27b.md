# AI-SDLC feedback

# AI-SDLC Integration for Portal 2.x Development

<aside>
This document outlines AI-powered software development lifecycle tools and practices for the Portal 2.x frontend development, covering both Admin Portal and Customer Portal implementation.

</aside>

## Frontend Development Tools & Frameworks

### Admin Portal (Next.js)

| **Technology**   | **Version/Implementation** | **AI Integration Points**                                |     |
| ---------------- | -------------------------- | -------------------------------------------------------- | --- |
| Next.js          | Latest LTS                 | AI-assisted component generation, routing optimization   |     |
| Material UI      | Current implementation     | AI-driven layout suggestions, accessibility improvements |     |
| TypeScript       | Strict mode                | Admin portal not using Typecript                         |     |
| State Management | Context API / Redux        | AI state flow analysis, performance optimization         |     |

# **Key Weaknesses and Risks**

- **ESLint (TypeScript rules don't actually work)**File
  - TypeScript ESLint rules (**`@typescript-eslint/*`**) are used but the TypeScript parser/plugin is not connected in the flat config. In a flat config, you need to explicitly add **`@typescript-eslint/parser`** and **`@typescript-eslint/eslint-plugin`** (or the **`typescript-eslint`** package with **`tseslint.configs.recommended`**). Otherwise, rules may be ignored.
  - **`settings.import.resolver.alias.extensions`** only contains **`".js", ".jsx"`**. There's no **`".ts", ".tsx"`**, which breaks/degrades TypeScript import resolution.
  - Ignoring tests in **`ignores`** (**`"**/_.test.{js,jsx,ts,tsx}"`**, **`"**/**tests**/**/_"`\*\*) deprives the project of important quality checks for the tests themselves.
  - ESLint is disabled in the build in next.config.mjs (**`eslint.ignoreDuringBuilds: true`**), which hides problems in CI.
- **Duplicated/conflicting ESLint configs**There are both eslint.config.mjs and eslint.config.js. This creates ambiguity about which configuration is used by **`next lint`**/editors.
- **Inconsistent Playwright e2e infrastructure**
  - In the root: playwright.config.js with **`testDir: "./tests/e2e"`**, but e2e code is physically located in **`e2e/tests`**. Scripts in package.json (root) use **`-config=e2e/playwright.config.js`** (i.e., a different config). As a result, there are two Playwright configs, different versions, different directories — technical debt and potential discrepancies.
  - Playwright versions differ:
    - Root **`devDependencies`**: **`@playwright/test`** ^1.55.0
    - e2e/package.json: **`@playwright/test`** ^1.52.0. This increases the likelihood of flaky tests/environment discrepancies.
- **Inconsistent package managers/lockfiles**In the root, there are both package-lock.json and **`pnpm-lock.yaml`**. This is a source of dependency drift across different machines/CI.
- **Version pinning**In package.json there are floating versions (e.g., **`"d3-hierarchy": "latest"`**, many dependencies use carets ^). This can break the build/runtime with uncontrolled minor/patch updates. For critical packages, it's better to fix versions and manage updates through Renovate/Dependabot.
- **React 19 compatibility with the ecosystem**
  - The project uses **`react@19`**, **`react-dom@19`**, **`next@15.1.4`**. Not all packages are guaranteed to be fully compatible with React 19 (e.g., **`reactflow@^11.8.1`** — version 11 is targeted for React 18; edge cases may occur in SSR/test environments).
  - MUI v6 and Testing Library v16 are okay, but integration tests on problematic components should be kept in focus.
- **Next.js configuration**
  - **`experimental.esmExternals: "loose"`** in next.config.mjs is a "broad" assumption masking CJS/ESM problems. This can hide errors that will surface later when the bundle chain changes.
  - No explicit configuration for images/domains, **`transpilePackages`**, Mapbox, etc. (the project has heavy ESM packages: **`mapbox-gl@3.x`**, **`react-map-gl`**, **`apexcharts`**). In SSR/Edge environments, this can cause problems; better to control explicitly.
- **TS-config and aliases**
  - tsconfig.json: **`allowJs: true`** + **`strict: true`** — okay, but increases the chance of missing TS checks in .js files. If the goal is strict TS, it's better to gradually migrate .js → .ts and disable **`allowJs`**.
  - Aliases **`@/*`** are set up, but ESLint's **`import/resolver.alias.extensions`** doesn't include **`ts/tsx`** (see the ESLint point).
- **Vitest settings**
  - src/test/setup.ts logs to console on each test run — noise in CI logs. Should be removed or flagged with a **`DEBUG`** variable.
  - 70% coverage threshold in vitest.config.ts is good, but without enforcement on CI/PR (and with ESLint disabled in the build), the risk of code quality reduction remains.
- **Duplication of test infrastructure**There's **`e2e/`** with its own package.json, **`tsconfig`**, eslint.config.mjs, and ecosystem, parallel to the root one. This complicates maintenance, version auditing, and style consistency.
- **Storing `.env` in the repository**There's **`.env`** in the root. If it's committed with secrets, this is a critical risk. Even if it's empty, it's better to store only .env.example, and the actual **`.env`** in local/CI environments.
- **Repo hygiene**
  - In the root, there are **`composer.json`** and **`phpunit.xml`** (PHP), which are unrelated to the NextJS project and may confuse developers/tools.
  - Many auxiliary "AI/PR" scripts in **`scripts/`** and **`scripts-complex/`**. They are useful, but you should:
    - Separate them from the prod build and clearly document them in README.md.
    - Restrict access to external API keys through environment variables.

Some steps and problems to solve

## Setup

<aside>
I ran the command bash ./auto-setup.sh

</aside>

1. Describe dependency issues and their solutions

![Знімок екрана 2025-09-03 о 19.39.44.png](AI-SDLC%20feedback%202635affd005f8021bf55ed599c61c27b/%D0%97%D0%BD%D1%96%D0%BC%D0%BE%D0%BA_%D0%B5%D0%BA%D1%80%D0%B0%D0%BD%D0%B0_2025-09-03_%D0%BE_19.39.44.png)

1. some libraries have compatibility issues:

solution: npm install --save-dev vitest @testing-library/react @testing-library/jest-dom jsdom

![Знімок екрана 2025-09-03 о 20.08.08.png](AI-SDLC%20feedback%202635affd005f8021bf55ed599c61c27b/%D0%97%D0%BD%D1%96%D0%BC%D0%BE%D0%BA_%D0%B5%D0%BA%D1%80%D0%B0%D0%BD%D0%B0_2025-09-03_%D0%BE_20.08.08.png)

1. infinite loop when running the command: [setup.sh](http://setup.sh)

![Знімок екрана 2025-09-03 о 20.19.20.png](AI-SDLC%20feedback%202635affd005f8021bf55ed599c61c27b/%D0%97%D0%BD%D1%96%D0%BC%D0%BE%D0%BA_%D0%B5%D0%BA%D1%80%D0%B0%D0%BD%D0%B0_2025-09-03_%D0%BE_20.19.20.png)

Some tests have been rewritten with errors

![Знімок екрана 2025-09-03 о 20.41.15.png](AI-SDLC%20feedback%202635affd005f8021bf55ed599c61c27b/%D0%97%D0%BD%D1%96%D0%BC%D0%BE%D0%BA_%D0%B5%D0%BA%D1%80%D0%B0%D0%BD%D0%B0_2025-09-03_%D0%BE_20.41.15.png)

for JSX file type, unnecessary line was not removed , now these imports are unnecessary

![Знімок екрана 2025-09-03 о 20.42.31.png](AI-SDLC%20feedback%202635affd005f8021bf55ed599c61c27b/%D0%97%D0%BD%D1%96%D0%BC%D0%BE%D0%BA_%D0%B5%D0%BA%D1%80%D0%B0%D0%BD%D0%B0_2025-09-03_%D0%BE_20.42.31.png)

Result: The project is overloaded with unnecessary files and commands, some of which don't work or are unrelated to the current stack. This creates noise, complicates maintenance, and increases the risk of errors.

Sugestion :

Before the MVP release, it is very important not to risk the product’s stability and not to introduce large-scale changes to the overall architecture. At this stage, the priority is to maintain functionality and complete critical tasks.

Instead of a full architectural overhaul, I recommend focusing on addressing key risk points and missing elements.
The main argument in favor of minimal changes is that the project lacks proper Playwright test integration, which should be implemented and used for automated verification of critical user scenarios.
