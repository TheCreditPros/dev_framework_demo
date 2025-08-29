# System Patterns

This file documents recurring patterns and standards used in the project.
It is optional, but recommended to be updated as the project evolves.

2025-08-14 14:29:49 - Initial system patterns established for AI-SDLC framework

## Coding Patterns

- **Memory Bank Pattern** - Modular context preservation system with timestamped updates and cross-mode accessibility
- **AI-Enhanced Development** - Integration of AI assistance at each SDLC phase (planning, coding, testing, deployment)
- **Framework Agnostic Approach** - Core AI-SDLC patterns designed to work with multiple technology stacks
- **Progressive Implementation** - Incremental adoption strategy allowing developers to implement AI assistance gradually

## Architectural Patterns

- **Separation of Concerns** - Clear boundaries between AI framework components and application-specific implementations
- **Context-Driven Architecture** - Memory Bank system providing persistent context across development sessions
- **Modular Framework Design** - Independent components for different SDLC phases (requirements, design, implementation, testing, deployment)
- **Technology Stack Demonstration** - Laravel/React combination as primary example with extensible patterns for other stacks

## Testing Patterns

- **AI-Enhanced TDD** - Test-driven development augmented with AI-generated test cases and edge case analysis
- **Cross-Stack Testing** - Integrated testing patterns covering both Laravel backend and React frontend components
- **Documentation-Driven Testing** - Tests that serve as both validation and documentation for AI-SDLC patterns
- **Continuous Validation** - Automated testing of AI-generated code and suggestions throughout development lifecycle
- **Vitest Framework Standard** - All test files use Vitest v3.2.4 with vi.\* mock functions
- **JSX Test File Naming** - Test files containing JSX must use .test.jsx or .spec.jsx extensions
- **Component Mock Pattern** - React components mocked with vi.mock() returning functional components
- **Global Test Environment** - Test globals (describe, it, expect, vi) configured in ESLint
- **Deterministic Validation Runs** - Use single-worker runs during validation to eliminate flakiness

## Migration Patterns

- **Automated Migration Scripts** - Node.js scripts for bulk code transformations (jest-to-vitest.js pattern)
- **AST-Based Replacements** - Regex patterns for safe API migration (jest.fn() → vi.fn())
- **File Extension Validation** - Automated detection and fixing of incorrect file extensions
- **Dependency Cleanup** - Systematic removal of deprecated packages while preserving compatibility
- **PR-Based Deployment** - Changes validated through PR gates before merge (PR #482 pattern)

## Quality Gate Patterns

- **Pre-commit Validation** - ESLint + Prettier via lint-staged before every commit
- **Commit Message Standards** - Conventional commits enforced via commitlint
- **Post-commit Hooks** - Additional validation after successful commits
- **Hook Path Standardization** - `core.hookspath` set to `.husky`; validation script checks configured path
- **Configuration Isolation** - Separate config files (.lintstagedrc.js) to avoid conflicts
- **Flat ESLint Config** - Modern ESLint v9 configuration with explicit global definitions
- **TypeScript Integration** - @typescript-eslint parser for .ts/.tsx files

## Configuration Patterns

- **Monorepo Structure** - Multiple sub-projects (portal2-admin-refactor) within main repository
- **Shared Dependencies** - Root package.json managing common development dependencies
- **Environment-Specific Configs** - Separate ESLint configs per repository with shared patterns
- **Git Hook Automation** - Husky v9 managing all git lifecycle hooks
- **Build Directory Exclusion** - .next, dist, build directories excluded from linting

## Error Handling Patterns

- **Non-blocking Warnings** - Configuration to warn rather than error for recoverable issues
- **Graceful Degradation** - Tests continue running even with some failures
- **Validation Reporting** - Comprehensive status reports (FINAL-VALIDATION-REPORT.md)
- **Known Issues Tracking** - Documentation of non-critical issues for future resolution
- **Incremental Fixes** - Progressive improvement approach vs. blocking on perfection

---

2025-08-14 14:29:49 - Core patterns established for Memory Bank and AI-SDLC framework demonstration
2025-08-27 - Comprehensive patterns updated after 805+ file migration and quality gate implementation
2025-08-29 - Deterministic validation runs and hook path standardization recorded
