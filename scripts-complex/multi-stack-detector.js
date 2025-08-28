#!/usr/bin/env node

/**
 * Multi-Stack Project Detection for AI-SDLC Framework
 * Automatically detects Laravel + React hybrid projects
 */

const fs = require('fs');

class MultiStackDetector {
  constructor() {
    this.projectRoot = process.cwd();
    this.detectionResults = {};
  }

  async detectProjectStack() {
    console.log('🔍 Detecting project stack architecture...');

    const detection = {
      php: this.detectPHPStack(),
      javascript: this.detectJavaScriptStack(),
      database: this.detectDatabaseStack(),
      testing: this.detectTestingStack(),
      deployment: this.detectDeploymentStack(),
    };

    const projectType = this.determineProjectType(detection);
    const recommendations = this.getStackRecommendations(
      projectType,
      detection
    );

    return {
      projectType,
      detection,
      recommendations,
      setupCommands: this.getSetupCommands(projectType),
    };
  }

  detectPHPStack() {
    const indicators = {
      hasComposer: fs.existsSync('composer.json'),
      hasLaravel: fs.existsSync('app/Http/Controllers'),
      hasArtisan: fs.existsSync('artisan'),
      hasPHPUnit: fs.existsSync('phpunit.xml'),
      hasLaravelStructure: fs.existsSync('config/app.php'),
    };

    let framework = 'none';
    if (indicators.hasLaravel) framework = 'laravel';
    else if (indicators.hasComposer) framework = 'php-generic';

    return {
      detected: Object.values(indicators).some(Boolean),
      framework,
      indicators,
      tools: this.detectPHPTools(),
    };
  }

  detectJavaScriptStack() {
    const packageJson = this.readPackageJson();
    const indicators = {
      hasPackageJson: !!packageJson,
      hasReact: this.hasReactDependency(packageJson),
      hasTypeScript: fs.existsSync('tsconfig.json'),
      hasVite: this.hasDependency(packageJson, 'vite'),
      hasNextJS: this.hasDependency(packageJson, 'next'),
    };

    let framework = 'none';
    if (indicators.hasReact && indicators.hasNextJS) framework = 'nextjs';
    else if (indicators.hasReact) framework = 'react';
    else if (indicators.hasPackageJson) framework = 'javascript-generic';

    return {
      detected: indicators.hasPackageJson,
      framework,
      indicators,
      buildTool: this.detectBuildTool(packageJson),
    };
  }

  detectDatabaseStack() {
    const indicators = {
      hasLaravelMigrations: fs.existsSync('database/migrations'),
      hasDockerCompose: fs.existsSync('docker-compose.yml'),
      hasEnvExample: fs.existsSync('.env.example'),
    };

    const envContent = this.readEnvExample();
    const dbType = this.detectDatabaseType(envContent);

    return {
      detected: Object.values(indicators).some(Boolean),
      type: dbType,
      indicators,
    };
  }

  detectTestingStack() {
    const packageJson = this.readPackageJson();
    const indicators = {
      hasVitest: this.hasDependency(packageJson, 'vitest'),
      hasPlaywright: this.hasDependency(packageJson, '@playwright/test'),
      hasPHPUnit: fs.existsSync('phpunit.xml'),
      hasPest: this.hasComposerDependency('pestphp/pest'),
    };

    return {
      detected: Object.values(indicators).some(Boolean),
      frameworks: this.getTestingFrameworks(indicators),
      indicators,
    };
  }

  detectDeploymentStack() {
    const indicators = {
      hasGitHubActions: fs.existsSync('.github/workflows'),
      hasDockerfile: fs.existsSync('Dockerfile'),
      hasLaravelSail: this.hasComposerDependency('laravel/sail'),
      hasVercelConfig: fs.existsSync('vercel.json'),
    };

    return {
      detected: Object.values(indicators).some(Boolean),
      indicators,
    };
  }

  determineProjectType(detection) {
    if (
      detection.php.framework === 'laravel' &&
      detection.javascript.framework === 'react'
    ) {
      return 'LARAVEL_REACT_HYBRID';
    }
    if (detection.php.framework === 'laravel') return 'LARAVEL_API';
    if (detection.javascript.framework === 'react') return 'REACT_SPA';
    if (detection.javascript.framework === 'nextjs') return 'NEXTJS_FULLSTACK';
    return 'UNKNOWN';
  }

  getStackRecommendations(projectType, _detection) {
    const recommendations = {
      LARAVEL_REACT_HYBRID: [
        'Configure Laravel Sail for Docker development',
        'Set up Vite HMR for React hot reloading',
        'Implement API contract testing between Laravel and React',
        'Configure shared test database for integration tests',
        'Set up Laravel Telescope for API monitoring',
        'Add PHPStan Level 8 for strict type checking',
        'Configure Pest for elegant PHP testing',
      ],
      LARAVEL_API: [
        'Add Pest for elegant PHP testing',
        'Configure PHPStan for static analysis',
        'Set up Laravel Sanctum for API authentication',
        'Implement comprehensive API documentation',
        'Add Rector for automated refactoring',
      ],
      REACT_SPA: [
        'Add React Testing Library for component tests',
        'Configure MSW for API mocking',
        'Set up Storybook for component documentation',
        'Implement accessibility testing with axe-core',
        'Add React Query for server state management',
      ],
    };

    return (
      recommendations[projectType] || [
        'Unknown project type - manual configuration required',
      ]
    );
  }

  getSetupCommands(projectType) {
    const commands = {
      LARAVEL_REACT_HYBRID: [
        'composer install',
        'npm install',
        'cp .env.example .env',
        'php artisan key:generate',
        'php artisan migrate',
        './vendor/bin/sail up -d',
        'npm run dev',
      ],
      LARAVEL_API: [
        'composer install',
        'cp .env.example .env',
        'php artisan key:generate',
        'php artisan migrate',
        'php artisan serve',
      ],
      REACT_SPA: ['npm install', 'npm run dev'],
    };

    return commands[projectType] || ['echo "Unknown project type"'];
  }

  // Helper methods
  readPackageJson() {
    try {
      return JSON.parse(fs.readFileSync('package.json', 'utf8'));
    } catch {
      return null;
    }
  }

  hasDependency(packageJson, dep) {
    if (!packageJson) return false;
    return !!(
      packageJson.dependencies?.[dep] || packageJson.devDependencies?.[dep]
    );
  }

  hasReactDependency(packageJson) {
    return this.hasDependency(packageJson, 'react');
  }

  hasComposerDependency(dep) {
    try {
      const composer = JSON.parse(fs.readFileSync('composer.json', 'utf8'));
      return !!(composer.require?.[dep] || composer['require-dev']?.[dep]);
    } catch {
      return false;
    }
  }

  readEnvExample() {
    try {
      return fs.readFileSync('.env.example', 'utf8');
    } catch {
      return '';
    }
  }

  detectDatabaseType(envContent) {
    if (envContent.includes('DB_CONNECTION=pgsql')) return 'postgresql';
    if (envContent.includes('DB_CONNECTION=mysql')) return 'mysql';
    if (envContent.includes('DB_CONNECTION=sqlite')) return 'sqlite';
    return 'unknown';
  }

  detectBuildTool(packageJson) {
    if (this.hasDependency(packageJson, 'vite')) return 'vite';
    if (this.hasDependency(packageJson, 'webpack')) return 'webpack';
    if (this.hasDependency(packageJson, 'esbuild')) return 'esbuild';
    return 'unknown';
  }

  detectPHPTools() {
    const tools = {};
    try {
      tools.phpstan = this.hasComposerDependency('phpstan/phpstan');
      tools.phpcs = this.hasComposerDependency('squizlabs/php_codesniffer');
      tools.pest = this.hasComposerDependency('pestphp/pest');
      tools.rector = this.hasComposerDependency('rector/rector');
      tools.pint = this.hasComposerDependency('laravel/pint');
    } catch {
      // Composer.json not found or invalid, continue without PHP tools
    }
    return tools;
  }

  getTestingFrameworks(indicators) {
    const frameworks = [];
    if (indicators.hasVitest) frameworks.push('vitest');
    if (indicators.hasPlaywright) frameworks.push('playwright');
    if (indicators.hasPHPUnit) frameworks.push('phpunit');
    if (indicators.hasPest) frameworks.push('pest');
    return frameworks;
  }

  generateConfigurationReport() {
    const result = this.detectProjectStack();
    const report = {
      timestamp: new Date().toISOString(),
      projectType: result.projectType,
      recommendations: result.recommendations,
      setupCommands: result.setupCommands,
      missingTools: this.identifyMissingTools(result.detection),
    };

    fs.writeFileSync(
      'project-stack-report.json',
      JSON.stringify(report, null, 2)
    );
    console.log('📊 Project stack report generated: project-stack-report.json');

    return report;
  }

  identifyMissingTools(detection) {
    const missing = [];

    if (detection.php.detected && !detection.php.tools.phpstan) {
      missing.push('PHPStan for static analysis');
    }
    if (detection.php.detected && !detection.php.tools.pest) {
      missing.push('Pest for elegant PHP testing');
    }
    if (
      detection.javascript.detected &&
      !detection.testing.indicators.hasPlaywright
    ) {
      missing.push('Playwright for E2E testing');
    }
    if (
      detection.javascript.detected &&
      !detection.testing.indicators.hasVitest
    ) {
      missing.push('Vitest for unit testing');
    }

    return missing;
  }
}

if (require.main === module) {
  const detector = new MultiStackDetector();
  detector
    .detectProjectStack()
    .then((result) => {
      console.log('📊 Project Stack Detection Results:');
      console.log(`Project Type: ${result.projectType}`);
      console.log('\n🔧 Recommendations:');
      result.recommendations.forEach((rec) => console.log(`  - ${rec}`));
      console.log('\n⚡ Setup Commands:');
      result.setupCommands.forEach((cmd) => console.log(`  $ ${cmd}`));
    })
    .catch(console.error);
}

module.exports = MultiStackDetector;
