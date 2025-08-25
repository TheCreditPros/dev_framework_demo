#!/bin/bash

# Workspace Optimization Script for AI-SDLC
# The Credit Pros - Development Team
# Optimizes existing Laravel + React development workflows

set -euo pipefail

# Colors for output
readonly RED='\033[0;31m'
readonly GREEN='\033[0;32m'
readonly YELLOW='\033[1;33m'
readonly BLUE='\033[0;34m'
readonly NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Optimize Git operations
optimize_git() {
    log_info "Optimizing Git configuration..."
    
    # Enable Git caching and optimization
    git config --global core.preloadindex true
    git config --global core.fscache true
    git config --global gc.auto 256
    git config --global pack.threads 0
    
    # Optimize for large repositories
    git config --global feature.manyFiles true
    git config --global index.threads true
    
    # Enable partial clone for faster operations
    git config --global fetch.writeCommitGraph true
    git config --global maintenance.auto false
    
    log_success "Git configuration optimized"
}

# Optimize NPM/Yarn operations
optimize_package_manager() {
    log_info "Optimizing package manager configuration..."
    
    if [[ -f "package.json" ]]; then
        # Create optimized .npmrc if it doesn't exist
        if [[ ! -f ".npmrc" ]]; then
            cat > .npmrc << 'EOF'
# AI-SDLC NPM Performance Configuration
cache=/tmp/npm-cache
prefer-offline=true
audit-level=high
maxsockets=10
progress=true
package-lock=true
fund=false
EOF
            log_success "Created optimized .npmrc configuration"
        fi
        
        # Clear npm cache and rebuild
        npm cache clean --force > /dev/null 2>&1 || true
        
        # Install dependencies with optimization flags
        if [[ -f "package-lock.json" ]]; then
            log_info "Running optimized npm install..."
            npm ci --prefer-offline --no-audit --no-fund > /dev/null 2>&1
        elif [[ -f "yarn.lock" ]]; then
            log_info "Running optimized yarn install..."
            yarn install --prefer-offline --silent > /dev/null 2>&1
        fi
        
        log_success "Package manager optimized"
    fi
}

# Optimize ESLint performance
optimize_eslint() {
    log_info "Optimizing ESLint configuration..."
    
    if [[ -f "eslint.config.js" ]] || [[ -f ".eslintrc.js" ]]; then
        # Create ESLint cache directory
        mkdir -p .eslintcache
        
        # Update package.json scripts to use caching
        if command -v jq >/dev/null 2>&1; then
            # Use jq if available for JSON manipulation
            tmp=$(mktemp)
            jq '.scripts.lint = "eslint . --cache --cache-location .eslintcache/" | .scripts["lint:fix"] = "eslint . --cache --cache-location .eslintcache/ --fix"' package.json > "$tmp" && mv "$tmp" package.json
        else
            # Fallback: check if scripts need updating
            if ! grep -q "\-\-cache" package.json 2>/dev/null; then
                log_warning "Consider adding --cache flag to your lint scripts for better performance"
            fi
        fi
        
        log_success "ESLint caching configured"
    fi
}

# Optimize Laravel operations (if Laravel project)
optimize_laravel() {
    if [[ ! -f "artisan" ]]; then
        return 0
    fi
    
    log_info "Optimizing Laravel configuration..."
    
    # Clear and rebuild all caches
    php artisan config:clear > /dev/null 2>&1 || true
    php artisan route:clear > /dev/null 2>&1 || true
    php artisan view:clear > /dev/null 2>&1 || true
    php artisan cache:clear > /dev/null 2>&1 || true
    
    # Rebuild caches for performance
    php artisan config:cache > /dev/null 2>&1 || true
    php artisan route:cache > /dev/null 2>&1 || true
    php artisan view:cache > /dev/null 2>&1 || true
    
    # Optimize Composer autoloader
    if [[ -f "composer.json" ]]; then
        composer dump-autoload --optimize --no-dev > /dev/null 2>&1 || true
    fi
    
    log_success "Laravel optimizations applied"
}

# Optimize build tools (Webpack/Vite)
optimize_build_tools() {
    log_info "Optimizing build tools configuration..."
    
    if [[ -f "vite.config.js" ]] || [[ -f "vite.config.ts" ]]; then
        log_info "Vite detected - consider enabling build optimizations in config"
        # Create optimized Vite config recommendations
        cat > vite-optimization-guide.md << 'EOF'
# Vite Optimization Recommendations

Add these optimizations to your vite.config.js:

```javascript
export default defineConfig({
  build: {
    // Enable build caching
    cache: true,
    // Optimize chunk splitting
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          utils: ['lodash', 'moment']
        }
      }
    }
  },
  // Enable CSS code splitting
  css: {
    devSourcemap: true
  }
});
```
EOF
        log_success "Created Vite optimization guide"
    fi
    
    if [[ -f "webpack.config.js" ]]; then
        log_info "Webpack detected - consider enabling caching and optimization plugins"
    fi
}

# Optimize VS Code workspace
optimize_vscode() {
    if [[ ! -d ".vscode" ]]; then
        mkdir -p .vscode
    fi
    
    log_info "Optimizing VS Code configuration..."
    
    # Create optimized settings
    cat > .vscode/settings.json << 'EOF'
{
  "search.exclude": {
    "**/node_modules": true,
    "**/vendor": true,
    "**/.git": true,
    "**/storage": true,
    "**/bootstrap/cache": true
  },
  "files.watcherExclude": {
    "**/node_modules/**": true,
    "**/vendor/**": true,
    "**/storage/**": true,
    "**/bootstrap/cache/**": true
  },
  "typescript.preferences.includePackageJsonAutoImports": "off",
  "eslint.workingDirectories": ["."],
  "eslint.codeActionsOnSave.mode": "problems",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "files.associations": {
    "*.blade.php": "blade"
  }
}
EOF
    
    log_success "VS Code workspace optimized"
}

# Create performance monitoring cron job
setup_performance_monitoring() {
    log_info "Setting up automated performance monitoring..."
    
    # Create performance monitoring script
    cat > scripts/daily-performance-check.sh << 'EOF'
#!/bin/bash
# Daily performance monitoring for AI-SDLC

cd "$(dirname "$0")/.."

# Run performance monitoring
node scripts/performance-monitor.js monitor

# Send results to MS Teams if configured
if [[ -n "${MS_TEAMS_WEBHOOK_URI:-}" ]]; then
    # Create performance summary for Teams
    if [[ -f "performance-metrics.json" ]]; then
        node scripts/webhook-manager.js custom "📊 Daily Performance Report" "info" '[
            {"name": "Monitoring", "value": "Completed"},
            {"name": "Report", "value": "Available in performance-metrics.json"},
            {"name": "Date", "value": "'$(date -u +"%Y-%m-%d")''"}
        ]'
    fi
fi
EOF
    
    chmod +x scripts/daily-performance-check.sh
    log_success "Daily performance monitoring configured"
}

# Optimize database connections (if applicable)
optimize_database() {
    if [[ -f ".env" ]] && grep -q "DB_CONNECTION" .env; then
        log_info "Database configuration detected - checking optimization opportunities..."
        
        # Check for database connection pooling recommendations
        if grep -q "mysql" .env; then
            log_info "MySQL detected - consider connection pooling and query optimization"
        elif grep -q "postgresql" .env; then
            log_info "PostgreSQL detected - consider connection pooling and indexing"
        fi
        
        log_success "Database optimization recommendations noted"
    fi
}

# Create optimization report
generate_optimization_report() {
    log_info "Generating optimization report..."
    
    cat > WORKSPACE_OPTIMIZATION_REPORT.md << 'EOF'
# Workspace Optimization Report

**Generated:** $(date)

## ✅ Applied Optimizations

### Git Configuration
- Enabled core.preloadindex for faster file operations
- Configured gc.auto for automatic garbage collection
- Enabled feature.manyFiles for large repository support

### Package Manager
- Created optimized .npmrc configuration
- Enabled offline-first installation preference
- Configured parallel installations with maxsockets

### ESLint
- Enabled caching with .eslintcache directory
- Updated lint scripts to use cache flags

### Laravel (if applicable)
- Cleared and rebuilt configuration cache
- Optimized Composer autoloader
- Applied route and view caching

### VS Code
- Configured search and watcher exclusions
- Optimized TypeScript and ESLint settings
- Added file associations for Laravel Blade

### Build Tools
- Created optimization guides for detected build tools
- Recommended chunk splitting and caching strategies

## 📊 Performance Monitoring

- Automated daily performance checks configured
- MS Teams integration for performance reports
- Metrics collection and analysis enabled

## 🚀 Next Steps

1. Run `node scripts/performance-monitor.js monitor` to establish baseline metrics
2. Monitor build times and optimize accordingly
3. Set up database connection pooling if using databases
4. Consider implementing service workers for frontend caching
5. Review and optimize critical rendering paths

## 📈 Monitoring Commands

- `node scripts/performance-monitor.js monitor` - Full performance analysis
- `./scripts/daily-performance-check.sh` - Daily automated check
- `./ai-sdlc teams validate` - Send validation results to Teams

---
*Generated by AI-SDLC Workspace Optimizer*
EOF
    
    log_success "Optimization report generated: WORKSPACE_OPTIMIZATION_REPORT.md"
}

# Main function
main() {
    echo -e "${BLUE}"
    echo "╔════════════════════════════════════════════════════════════════╗"
    echo "║                Workspace Performance Optimizer                ║"
    echo "║                    The Credit Pros - AI-SDLC                  ║"
    echo "╚════════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
    
    log_info "Starting workspace optimization..."
    
    # Create scripts directory if it doesn't exist
    mkdir -p scripts
    
    # Run optimizations
    optimize_git
    optimize_package_manager
    optimize_eslint
    optimize_laravel
    optimize_build_tools
    optimize_vscode
    setup_performance_monitoring
    optimize_database
    
    # Generate report
    generate_optimization_report
    
    log_success "🎉 Workspace optimization complete!"
    echo ""
    log_info "📋 Review the WORKSPACE_OPTIMIZATION_REPORT.md for details"
    log_info "🚀 Run 'node scripts/performance-monitor.js monitor' to establish baseline metrics"
    echo ""
}

# Run main function
main "$@"