module.exports = {
  // AI-SDLC Framework Configuration for Next.js + React + TypeScript
  version: '3.3.0',
  projectType: 'NEXT_JS_REACT_TS',

  // Environment-specific overrides
  environment: process.env.NODE_ENV || 'development',

  // Project-specific customization
  project: {
    name: process.env.PROJECT_NAME || 'portal2-admin-refactor',
    domain: process.env.PROJECT_DOMAIN || 'general', // Remove hardcoded "credit repair"
    compliance: process.env.COMPLIANCE_REQUIREMENTS || 'basic', // Make compliance configurable
    team: process.env.TEAM_NAME || 'development', // Remove hardcoded "The Credit Pros"
  },

  // AI Model Configuration (97% Cost Optimization)
  ai: {
    primary: process.env.AI_PRIMARY_MODEL || 'gpt-4o-mini', // 80% of tasks - $0.00015/token
    complex: process.env.AI_COMPLEX_MODEL || 'claude-3-5-sonnet', // Complex analysis - $0.003/token
    planning: process.env.AI_PLANNING_MODEL || 'deepseek-r1', // Planning tasks - $0.000055/token
    costOptimization: process.env.AI_COST_OPTIMIZATION !== 'false',
    maxTokens: parseInt(process.env.AI_MAX_TOKENS) || 2000,
    temperature: parseFloat(process.env.AI_TEMPERATURE) || 0.3,
  },

  // Quality Gates Configuration
  qualityGates: {
    eslint: {
      enabled: process.env.ESLINT_ENABLED !== 'false',
      config: process.env.ESLINT_CONFIG || './eslint.config.mjs',
      autoFix: process.env.ESLINT_AUTO_FIX !== 'false',
    },
    prettier: {
      enabled: process.env.PRETTIER_ENABLED !== 'false',
      config: process.env.PRETTIER_CONFIG || './prettier.config.mjs',
      autoFormat: process.env.PRETTIER_AUTO_FORMAT !== 'false',
    },
    typescript: {
      enabled: process.env.TYPESCRIPT_ENABLED !== 'false',
      strict: process.env.TYPESCRIPT_STRICT !== 'false',
      noEmit: process.env.TYPESCRIPT_NO_EMIT !== 'false',
    },
    testing: {
      vitest: {
        enabled: process.env.VITEST_ENABLED !== 'false',
        coverage: parseInt(process.env.VITEST_COVERAGE_THRESHOLD) || 80,
        config: process.env.VITEST_CONFIG || './vitest.config.ts',
      },
      playwright: {
        enabled: process.env.PLAYWRIGHT_ENABLED !== 'false',
        config: process.env.PLAYWRIGHT_CONFIG || './e2e/playwright.config.js',
        autoHealing: process.env.PLAYWRIGHT_AUTO_HEALING !== 'false',
      },
    },
  },

  // Pre-commit Hooks Configuration
  hooks: {
    preCommit: process.env.PRE_COMMIT_HOOKS?.split(',') || [
      'lint:fix',
      'typecheck',
      'format:fix',
      'quality-gate-check',
    ],
    commitMsg: process.env.COMMIT_MSG_HOOKS?.split(',') || [
      'conventional-commit-validation',
    ],
    postCommit: process.env.POST_COMMIT_HOOKS?.split(',') || [
      'ai-quality-analysis',
      'multi-stack-detection',
      'ai-test-improvement',
    ],
    // Make hooks configurable per environment
    environment: {
      development: {
        preCommit: ['lint:fix', 'typecheck', 'format:fix'], // Faster for dev
        postCommit: ['ai-quality-analysis'], // Minimal for dev
      },
      production: {
        preCommit: [
          'lint:fix',
          'typecheck',
          'test:ci',
          'format:fix',
          'quality-gate-check',
        ], // Full checks for prod
        postCommit: [
          'ai-quality-analysis',
          'multi-stack-detection',
          'ai-test-improvement',
        ], // Full analysis for prod
      },
    },
  },

  // Multi-Stack Detection
  stackDetection: {
    nextjs: process.env.DETECT_NEXTJS !== 'false',
    react: process.env.DETECT_REACT !== 'false',
    typescript: process.env.DETECT_TYPESCRIPT !== 'false',
    materialUi: process.env.DETECT_MATERIAL_UI !== 'false',
    testing: process.env.DETECT_TESTING !== 'false',
    e2e: process.env.DETECT_E2E !== 'false',
    // Add custom stack detection
    custom: process.env.CUSTOM_STACK_DETECTION?.split(',') || [],
  },

  // Auto-Healing Configuration
  autoHealing: {
    playwright: {
      enabled: process.env.PLAYWRIGHT_AUTO_HEALING !== 'false',
      selectorStrategy: process.env.SELECTOR_STRATEGY || 'data-testid',
      timeoutExtension: process.env.TIMEOUT_EXTENSION !== 'false',
      brokenSelectorDetection:
        process.env.BROKEN_SELECTOR_DETECTION !== 'false',
    },
    tests: {
      autoGeneration: process.env.AUTO_TEST_GENERATION !== 'false',
      improvement: process.env.AUTO_TEST_IMPROVEMENT !== 'false',
      coverage: process.env.AUTO_COVERAGE_IMPROVEMENT !== 'false',
    },
  },

  // Cost Optimization
  costOptimization: {
    modelRouting: process.env.AI_MODEL_ROUTING !== 'false',
    tokenOptimization: process.env.AI_TOKEN_OPTIMIZATION !== 'false',
    batchProcessing: process.env.AI_BATCH_PROCESSING !== 'false',
    cacheEnabled: process.env.AI_CACHE_ENABLED !== 'false',
  },

  // Notification Configuration
  notifications: {
    enabled: process.env.NOTIFICATIONS_ENABLED !== 'false',
    providers: process.env.NOTIFICATION_PROVIDERS?.split(',') || ['console'], // console, teams, slack, email
    teams: {
      enabled: process.env.TEAMS_NOTIFICATIONS !== 'false',
      webhookUrl: process.env.MS_TEAMS_WEBHOOK_URI,
      devWebhookUrl: process.env.MS_TEAMS_DEV_WEBHOOK,
      securityWebhookUrl: process.env.MS_TEAMS_SECURITY_WEBHOOK,
    },
    slack: {
      enabled: process.env.SLACK_NOTIFICATIONS !== 'false',
      webhookUrl: process.env.SLACK_WEBHOOK_URI,
    },
    email: {
      enabled: process.env.EMAIL_NOTIFICATIONS !== 'false',
      smtp: process.env.SMTP_CONFIG,
    },
  },

  // File Path Configuration (Make paths configurable)
  paths: {
    source: process.env.SOURCE_PATH || 'src',
    tests: process.env.TESTS_PATH || 'tests',
    integration: process.env.INTEGRATION_TESTS_PATH || 'tests/integration',
    e2e: process.env.E2E_TESTS_PATH || 'tests/e2e',
    coverage: process.env.COVERAGE_PATH || 'coverage',
    reports: process.env.REPORTS_PATH || 'reports',
  },

  // Compliance Configuration (Make compliance configurable)
  compliance: {
    enabled: process.env.COMPLIANCE_ENABLED !== 'false',
    framework: process.env.COMPLIANCE_FRAMEWORK || 'basic', // basic, fcra, gdpr, sox, custom
    rules: process.env.COMPLIANCE_RULES?.split(',') || [],
    validation: {
      enabled: process.env.COMPLIANCE_VALIDATION !== 'false',
      strict: process.env.COMPLIANCE_STRICT === 'true',
    },
  },

  // Performance Configuration
  performance: {
    enabled: process.env.PERFORMANCE_ENABLED !== 'false',
    budgets: {
      firstContentfulPaint: process.env.PERF_FCP_THRESHOLD || '2.5s',
      largestContentfulPaint: process.env.PERF_LCP_THRESHOLD || '4.0s',
      cumulativeLayoutShift: process.env.PERF_CLS_THRESHOLD || '0.1',
    },
    lighthouse: {
      enabled: process.env.LIGHTHOUSE_ENABLED !== 'false',
      config: process.env.LIGHTHOUSE_CONFIG || './lighthouse.config.js',
    },
  },

  // Security Configuration
  security: {
    enabled: process.env.SECURITY_ENABLED !== 'false',
    scanning: {
      enabled: process.env.SECURITY_SCANNING !== 'false',
      level: process.env.SECURITY_SCAN_LEVEL || 'medium', // low, medium, high, critical
    },
    compliance: {
      enabled: process.env.SECURITY_COMPLIANCE !== 'false',
      frameworks: process.env.SECURITY_FRAMEWORKS?.split(',') || [],
    },
  },

  // Rollback and Recovery
  rollback: {
    enabled: process.env.ROLLBACK_ENABLED !== 'false',
    checkpoints: process.env.ROLLBACK_CHECKPOINTS?.split(',') || [
      'dependencies',
      'configs',
      'scripts',
      'hooks',
    ],
    backupFiles: process.env.ROLLBACK_BACKUP_FILES?.split(',') || [
      '.eslintrc.js',
      '.prettierrc',
      'package.json',
    ],
  },

  // Debug and Development
  debug: {
    enabled: process.env.DEBUG_ENABLED === 'true',
    verbose: process.env.VERBOSE_LOGGING === 'true',
    logLevel: process.env.LOG_LEVEL || 'info', // error, warn, info, debug
  },
};
