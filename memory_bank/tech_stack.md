# Technology Stack - The Credit Pros AI-SDLC Framework

## Frontend Technologies

### Primary Frameworks

- **React 18+** with modern patterns (hooks, suspense, concurrent features)
- **TypeScript 5+** with strict mode enabled for type safety
- **Vite** as primary build tool (10x faster than traditional bundlers)

### State Management

- **Zustand** for lightweight state management
- **TanStack Query** for server state and API caching
- **Redux Toolkit** for complex global state (when needed)

### Styling & UI

- **Tailwind CSS** for utility-first styling
- **Styled Components** for component-level styling
- **CSS Modules** for modular styling approach

### Testing Frameworks

- **Vitest** (primary testing framework, Jest-compatible)
- **React Testing Library** for component testing
- **Playwright** for end-to-end testing
- **MSW (Mock Service Worker)** for API mocking

## Backend Technologies

### Primary Framework

- **Laravel 10+** with PHP 8.2+ features
- **Pest** for elegant PHP testing
- **Laravel Sanctum** for API authentication

### Additional Backend Support

- **Node.js** with Express/Fastify/NestJS
- **Python** with Django/FastAPI/Flask + pytest
- **API Standards**: REST, GraphQL (Apollo), tRPC

### Database & Storage

- **PostgreSQL** (primary database)
- **Redis** for caching and session storage
- **AWS S3** for file storage with encryption

## Development Tools

### Code Quality

- **ESLint** with TypeScript integration
- **Prettier** for code formatting
- **Husky** v8+ for git hooks
- **lint-staged** for pre-commit quality checks

### Build & Bundling

- **esbuild** for ultra-fast TypeScript compilation
- **SWC** for Rust-based JavaScript/TypeScript transformation
- **Webpack 5** (when needed for complex configurations)

### Version Control & CI/CD

- **Git** with conventional commits
- **GitHub Actions** for CI/CD pipelines
- **SonarCloud** for code quality analysis
- **GitHub PR-Agent** for automated code review

## Testing Infrastructure

### Unit Testing

- **Vitest** as primary test runner
- **Coverage thresholds**: 80% lines, 80% functions, 70% branches
- **Mutation testing** for test quality validation

### Integration Testing

- **Database testing** with RefreshDatabase trait
- **API testing** with realistic mock data
- **Authentication testing** with test users

### End-to-End Testing

- **Playwright** with cross-browser support
- **Visual regression testing** with screenshot comparison
- **Auto-healing selectors** for test maintenance

## AI Integration

### AI Services

- **OpenAI GPT-4o-mini** (primary model, cost-optimized)
- **Claude 3.5 Sonnet** for complex analysis
- **DeepSeek-R1** for planning-heavy tasks (97% cost reduction)

### Automation Tools

- **Open-Source PR-Agent** for code review
- **AI test generation** with domain-specific prompts
- **Intelligent bug detection** and autocorrection

## Credit Repair Domain Tools

### Compliance Frameworks

- **FCRA compliance validation** patterns
- **PII encryption** at rest and in transit
- **Audit trail logging** for all credit data access
- **API quality gates** for credit repair domain validation

### Credit Bureau Integration

- **Experian API** integration
- **Equifax API** integration
- **TransUnion API** integration
- **Rate limiting** and error handling

### Financial Calculations

- **FICO Score algorithms** with 300-850 validation
- **Credit utilization calculations**
- **Payment history analysis**
- **Dispute resolution workflows**

## Development Environment

### Required Tools

- **Node.js 18+** for frontend development
- **PHP 8.2+** for backend development
- **PostgreSQL 14+** for database
- **Redis 6+** for caching

### IDE Configuration

- **VS Code** with recommended extensions
- **Cline AI assistant** with custom rules
- **ESLint and Prettier** integration
- **TypeScript strict mode** enabled

### Environment Management

- **Docker** for local development consistency
- **.env** files for configuration management
- **Separate environments**: development, staging, production

## Deployment Infrastructure

### Hosting & Cloud

- **AWS** primary cloud provider
- **Vercel** for frontend deployments (when applicable)
- **Laravel Forge** for backend deployments

### Monitoring & Analytics

- **Application monitoring** with error tracking
- **Performance monitoring** with Core Web Vitals
- **Security scanning** with automated vulnerability detection

This technology stack is optimized for rapid development, high code quality, regulatory compliance, and cost-effective AI integration within The Credit Pros' credit repair domain.
