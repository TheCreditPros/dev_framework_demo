#!/bin/bash

# Cline Git Integration Script
# Enhances existing git hooks with Cline-powered test generation

set -e

### COLORS
GREEN="\033[0;32m"
RED="\033[0;31m"
YELLOW="\033[1;33m"
BLUE="\033[0;34m"
NC="\033[0m"

echo_color() { echo -e "${1}${2}${NC}"; }

### FUNCTIONS
info() { echo_color $BLUE "ℹ️  $1"; }
success() { echo_color $GREEN "✅ $1"; }
warn() { echo_color $YELLOW "⚠️  $1"; }
error() { echo_color $RED "❌ $1"; }

### CONFIGURATION
PROJECT_ROOT=$(git rev-parse --show-toplevel)
CHANGED_FILES=$(git diff --cached --name-only)

### MAIN FUNCTIONS

check_for_missing_tests() {
    info "Checking for files that need tests..."
    
    local files_needing_tests=()
    
    for file in $CHANGED_FILES; do
        # Skip if file doesn't exist or is deleted
        [[ ! -f "$file" ]] && continue
        
        # Skip non-source files
        case "$file" in
            *.test.* | *.spec.* | *Test.php | tests/* | __tests__/* | coverage/* | node_modules/* | vendor/*)
                continue
                ;;
            *.js | *.jsx | *.ts | *.tsx | *.php | *.vue)
                # Check if test file exists
                local test_file=""
                case "$file" in
                    *.php)
                        # Laravel convention
                        local class_name=$(basename "$file" .php)
                        test_file="tests/Feature/${class_name}Test.php"
                        if [[ ! -f "$test_file" ]]; then
                            test_file="tests/Unit/${class_name}Test.php"
                        fi
                        ;;
                    *)
                        # JavaScript/TypeScript convention
                        local base_name=$(basename "$file" | sed 's/\.[^.]*$//')
                        local dir_name=$(dirname "$file")
                        test_file="${dir_name}/__tests__/${base_name}.test.${file##*.}"
                        if [[ ! -f "$test_file" ]]; then
                            test_file="${dir_name}/${base_name}.test.${file##*.}"
                        fi
                        if [[ ! -f "$test_file" ]]; then
                            test_file="tests/${dir_name}/${base_name}.test.${file##*.}"
                        fi
                        ;;
                esac
                
                if [[ ! -f "$test_file" ]]; then
                    files_needing_tests+=("$file")
                    warn "Missing tests for: $file"
                fi
                ;;
        esac
    done
    
    if [[ ${#files_needing_tests[@]} -gt 0 ]]; then
        warn "Found ${#files_needing_tests[@]} files without tests"
        return 1
    else
        success "All changed files have corresponding tests"
        return 0
    fi
}

suggest_cline_commands() {
    local files_needing_tests=("$@")
    
    echo_color $YELLOW "🤖 Suggested Cline Commands:"
    echo
    
    for file in "${files_needing_tests[@]}"; do
        case "$file" in
            *.php)
                echo_color $BLUE "For $file (PHP/Laravel):"
                echo "  \"Write comprehensive PHPUnit tests for $file that:"
                echo "  1. Test FCRA compliance on data access"  
                echo "  2. Verify audit trail creation"
                echo "  3. Test rate limiting and validation"
                echo "  4. Mock external APIs appropriately"
                echo "  5. Test error handling and edge cases"
                echo "  Run the tests and fix any failures\""
                ;;
            *.jsx | *.tsx)
                echo_color $BLUE "For $file (React):"
                echo "  \"Generate comprehensive Jest tests for $file that:"
                echo "  1. Test all user interactions and state changes"
                echo "  2. Verify accessibility (WCAG 2.1)"
                echo "  3. Test loading and error states"
                echo "  4. Mock API responses appropriately"
                echo "  5. Test responsive design and edge cases"
                echo "  Execute tests and ensure 100% pass rate\""
                ;;
            *.js | *.ts)
                echo_color $BLUE "For $file (JavaScript/Node.js):"
                echo "  \"Write Jest unit tests for $file that:"
                echo "  1. Test all exported functions thoroughly"
                echo "  2. Include edge cases and error handling"
                echo "  3. Test async operations with proper mocking"
                echo "  4. Verify input validation and sanitization"
                echo "  5. Test credit calculation compliance if applicable"
                echo "  Run tests and fix until all pass\""
                ;;
        esac
        echo
    done
}

check_fcra_compliance() {
    info "Checking FCRA compliance patterns..."
    
    local compliance_issues=()
    
    for file in $CHANGED_FILES; do
        [[ ! -f "$file" ]] && continue
        
        case "$file" in
            *.php | *.js | *.jsx | *.ts | *.tsx)
                # Check for credit data access without audit logging
                if grep -q -i "credit.*report\|credit.*score\|credit.*data" "$file" && \
                   ! grep -q -i "audit.*log\|log.*audit" "$file"; then
                    compliance_issues+=("$file: Credit data access may need audit logging")
                fi
                
                # Check for PII handling without encryption mentions
                if grep -q -i "ssn\|social.*security\|personal.*info" "$file" && \
                   ! grep -q -i "encrypt\|hash\|mask" "$file"; then
                    compliance_issues+=("$file: PII handling may need encryption validation")
                fi
                ;;
        esac
    done
    
    if [[ ${#compliance_issues[@]} -gt 0 ]]; then
        warn "FCRA compliance review needed:"
        for issue in "${compliance_issues[@]}"; do
            warn "  $issue"
        done
        return 1
    else
        success "No obvious FCRA compliance issues detected"
        return 0
    fi
}

run_existing_ai_generation() {
    info "Running existing AI test generation as backup..."
    
    local generated_count=0
    
    for file in $CHANGED_FILES; do
        case "$file" in
            *.js | *.jsx | *.ts | *.tsx)
                if [[ -f "$file" ]] && ! find . -name "*$(basename "$file" | sed 's/\.[^.]*$//')*.test.*" -o -name "*$(basename "$file" | sed 's/\.[^.]*$//')*.spec.*" | grep -q .; then
                    info "Generating tests for $file using existing AI framework..."
                    if npm run ai:generate-tests "$file" 2>/dev/null; then
                        success "Generated AI tests for $file"
                        ((generated_count++))
                    else
                        warn "Failed to generate tests for $file"
                    fi
                fi
                ;;
        esac
    done
    
    if [[ $generated_count -gt 0 ]]; then
        success "Generated tests for $generated_count files using existing AI framework"
        info "You can further enhance these with Cline for interactive refinement"
    fi
}

### MAIN EXECUTION

main() {
    info "Cline Git Integration - Pre-commit Test Generation Check"
    echo
    
    # Skip if no relevant files changed
    if [[ -z "$CHANGED_FILES" ]]; then
        info "No files staged for commit"
        exit 0
    fi
    
    local issues_found=0
    
    # Check for missing tests
    if ! check_for_missing_tests; then
        issues_found=1
        
        # Get list of files needing tests
        local files_needing_tests=()
        for file in $CHANGED_FILES; do
            [[ ! -f "$file" ]] && continue
            case "$file" in
                *.test.* | *.spec.* | *Test.php | tests/* | __tests__/* | coverage/* | node_modules/* | vendor/*)
                    continue
                    ;;
                *.js | *.jsx | *.ts | *.tsx | *.php | *.vue)
                    local test_exists=false
                    case "$file" in
                        *.php)
                            local class_name=$(basename "$file" .php)
                            if [[ -f "tests/Feature/${class_name}Test.php" ]] || [[ -f "tests/Unit/${class_name}Test.php" ]]; then
                                test_exists=true
                            fi
                            ;;
                        *)
                            local base_name=$(basename "$file" | sed 's/\.[^.]*$//')
                            local dir_name=$(dirname "$file")
                            if [[ -f "${dir_name}/__tests__/${base_name}.test.${file##*.}" ]] || \
                               [[ -f "${dir_name}/${base_name}.test.${file##*.}" ]] || \
                               [[ -f "tests/${dir_name}/${base_name}.test.${file##*.}" ]]; then
                                test_exists=true
                            fi
                            ;;
                    esac
                    
                    if [[ "$test_exists" == "false" ]]; then
                        files_needing_tests+=("$file")
                    fi
                    ;;
            esac
        done
        
        echo
        suggest_cline_commands "${files_needing_tests[@]}"
        echo
        
        # Try to generate tests using existing AI framework
        run_existing_ai_generation
    fi
    
    # Check FCRA compliance
    echo
    if ! check_fcra_compliance; then
        issues_found=1
        echo
        warn "Consider using Cline to add compliance patterns:"
        echo "  \"Review the changed files for FCRA compliance and add:"
        echo "  1. Audit trail logging for credit data access"
        echo "  2. PII encryption/masking validation"
        echo "  3. Permissible purpose verification"
        echo "  4. Proper error handling for compliance failures\""
    fi
    
    echo
    if [[ $issues_found -eq 0 ]]; then
        success "🎉 All checks passed! Commit can proceed."
        success "Consider using Cline for ongoing test enhancement and maintenance."
    else
        warn "⚠️  Issues found but commit will proceed."
        warn "Use Cline to address the suggestions above for better code quality."
        warn "Run 'npm run ai:validate' to check overall framework status."
    fi
    
    echo
    info "💡 Pro tip: Use Cline's 'Continue' feature to implement all suggestions at once!"
}

# Execute main function
main "$@"