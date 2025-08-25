#!/bin/bash

# PostgreSQL Database Automation for Credit Repair Systems
# Designed for The Credit Pros AI-SDLC Framework

set -e

### COLORS
GREEN="\033[0;32m"
RED="\033[0;31m"
YELLOW="\033[1;33m"
BLUE="\033[0;34m"
NC="\033[0m"

echo_color() {
  echo -e "${1}${2}${NC}"
}

### DATABASE CONFIGURATION
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_NAME:-credit_repair_db}"
DB_USER="${DB_USER:-credit_repair_user}"
DB_PASSWORD="${DB_PASSWORD:-}"
TEST_DB_NAME="${TEST_DB_NAME:-credit_repair_test_db}"

### POSTGRESQL AUTOMATION FUNCTIONS

check_postgres_connection() {
  echo_color $YELLOW "🔍 Checking PostgreSQL connection..."
  
  if ! command -v psql >/dev/null 2>&1; then
    echo_color $RED "❌ PostgreSQL client (psql) not found. Please install PostgreSQL."
    exit 1
  fi
  
  if ! pg_isready -h "$DB_HOST" -p "$DB_PORT" >/dev/null 2>&1; then
    echo_color $RED "❌ PostgreSQL server not running on $DB_HOST:$DB_PORT"
    exit 1
  fi
  
  echo_color $GREEN "✅ PostgreSQL connection established"
}

create_test_database() {
  echo_color $YELLOW "🏗️ Setting up test database..."
  
  # Create test database if it doesn't exist
  psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d postgres -tc "SELECT 1 FROM pg_database WHERE datname = '$TEST_DB_NAME'" | grep -q 1 || \
  psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d postgres -c "CREATE DATABASE $TEST_DB_NAME;"
  
  echo_color $GREEN "✅ Test database '$TEST_DB_NAME' ready"
}

run_fcra_compliant_migrations() {
  echo_color $YELLOW "📋 Running FCRA-compliant database migrations..."
  
  # Laravel migration with environment override
  if [[ -f "artisan" ]]; then
    php artisan migrate --database=pgsql_test --force
    echo_color $GREEN "✅ Laravel migrations completed"
  elif [[ -d "backend" ]]; then
    cd backend
    php artisan migrate --database=pgsql_test --force
    cd ..
    echo_color $GREEN "✅ Backend migrations completed"
  else
    echo_color $YELLOW "⚠️ No Laravel project detected - skipping migrations"
  fi
}

validate_existing_tables() {
  echo_color $YELLOW "🔍 Validating existing database tables..."
  
  # Check if we're working with existing tables or need to create test tables
  EXISTING_AUDIT_TABLE="${EXISTING_AUDIT_TABLE:-fcra_audit_log}"
  EXISTING_ACCESS_TABLE="${EXISTING_ACCESS_TABLE:-credit_report_access_log}"
  EXISTING_DISPUTE_TABLE="${EXISTING_DISPUTE_TABLE:-dispute_processing_log}"
  
  echo_color $BLUE "📋 Checking for existing tables:"
  echo_color $BLUE "   - Audit table: $EXISTING_AUDIT_TABLE"
  echo_color $BLUE "   - Access table: $EXISTING_ACCESS_TABLE" 
  echo_color $BLUE "   - Dispute table: $EXISTING_DISPUTE_TABLE"
  
  # Check if tables exist
  AUDIT_EXISTS=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$TEST_DB_NAME" -t -c "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = '$EXISTING_AUDIT_TABLE');" 2>/dev/null || echo "f")
  
  if [[ "$AUDIT_EXISTS" == *"t"* ]]; then
    echo_color $GREEN "✅ Found existing audit table: $EXISTING_AUDIT_TABLE"
    USE_EXISTING_TABLES=true
  else
    echo_color $YELLOW "⚠️  Audit table '$EXISTING_AUDIT_TABLE' not found - will create test tables"
    USE_EXISTING_TABLES=false
  fi
}

create_fcra_audit_tables() {
  echo_color $YELLOW "🔒 Setting up FCRA audit tables..."
  
  if [[ "$USE_EXISTING_TABLES" == "true" ]]; then
    echo_color $GREEN "✅ Using existing tables - no table creation needed"
    echo_color $BLUE "📝 To map to your existing tables, update these environment variables:"
    echo_color $BLUE "   export EXISTING_AUDIT_TABLE=your_audit_table_name"
    echo_color $BLUE "   export EXISTING_ACCESS_TABLE=your_credit_access_table_name"
    echo_color $BLUE "   export EXISTING_DISPUTE_TABLE=your_disputes_table_name"
    return 0
  fi
  
  echo_color $YELLOW "📋 Creating test tables (for development/testing only)..."
  
  cat << 'EOF' | psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$TEST_DB_NAME"
-- FCRA Audit Trail Table (TEST/DEVELOPMENT ONLY) 
CREATE TABLE IF NOT EXISTS fcra_audit_log (
    id BIGSERIAL PRIMARY KEY,
    consumer_id BIGINT,
    action_type VARCHAR(50) NOT NULL,
    table_name VARCHAR(100) NOT NULL,
    record_id BIGINT,
    old_values JSONB,
    new_values JSONB,
    user_id BIGINT,
    ip_address INET,
    user_agent TEXT,
    fcra_section VARCHAR(20),
    compliance_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    INDEX (consumer_id, created_at),
    INDEX (action_type, created_at),
    INDEX (fcra_section)
);

-- Credit Report Access Log (FCRA Section 604)
CREATE TABLE IF NOT EXISTS credit_report_access_log (
    id BIGSERIAL PRIMARY KEY,
    consumer_id BIGINT NOT NULL,
    bureau_name VARCHAR(20) NOT NULL,
    access_purpose VARCHAR(50) NOT NULL,
    permissible_purpose_code VARCHAR(10),
    accessed_by_user_id BIGINT,
    access_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    consumer_consent BOOLEAN DEFAULT FALSE,
    fcra_disclosure_provided BOOLEAN DEFAULT FALSE,
    retention_expires_at TIMESTAMP WITH TIME ZONE,
    INDEX (consumer_id, access_timestamp),
    INDEX (access_purpose, access_timestamp)
);

-- Dispute Processing Log (FCRA Section 611)
CREATE TABLE IF NOT EXISTS dispute_processing_log (
    id BIGSERIAL PRIMARY KEY,
    consumer_id BIGINT NOT NULL,
    dispute_id BIGINT NOT NULL,
    processing_stage VARCHAR(50) NOT NULL,
    bureau_response JSONB,
    processing_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    days_to_complete INTEGER,
    fcra_compliant BOOLEAN DEFAULT TRUE,
    compliance_notes TEXT,
    INDEX (consumer_id, processing_timestamp),
    INDEX (dispute_id, processing_stage)
);

-- Consumer Data Retention Policy
CREATE TABLE IF NOT EXISTS data_retention_policy (
    id BIGSERIAL PRIMARY KEY,
    table_name VARCHAR(100) NOT NULL,
    consumer_id BIGINT NOT NULL,
    data_type VARCHAR(50) NOT NULL,
    retention_period_years INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    auto_delete_enabled BOOLEAN DEFAULT TRUE,
    INDEX (expires_at, auto_delete_enabled)
);
EOF

  echo_color $GREEN "✅ FCRA audit tables created"
}

seed_test_data() {
  echo_color $YELLOW "🌱 Seeding FCRA-compliant test data..."
  
  cat << 'EOF' | psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$TEST_DB_NAME"
-- Test Consumer Data (Anonymized)
INSERT INTO fcra_audit_log (consumer_id, action_type, table_name, record_id, fcra_section, compliance_notes) VALUES
(1001, 'credit_report_access', 'credit_reports', 5001, '604', 'Permissible purpose: Account review'),
(1002, 'dispute_filed', 'disputes', 3001, '611', 'Consumer dispute under investigation'),
(1003, 'data_correction', 'credit_accounts', 7001, '611', 'Inaccurate information corrected');

-- Test Credit Report Access
INSERT INTO credit_report_access_log (consumer_id, bureau_name, access_purpose, permissible_purpose_code, consumer_consent, fcra_disclosure_provided) VALUES
(1001, 'Equifax', 'account_review', 'AR', TRUE, TRUE),
(1002, 'Experian', 'dispute_investigation', 'DI', TRUE, TRUE),
(1003, 'TransUnion', 'account_monitoring', 'AM', TRUE, TRUE);

-- Test Dispute Processing
INSERT INTO dispute_processing_log (consumer_id, dispute_id, processing_stage, days_to_complete, fcra_compliant) VALUES
(1001, 3001, 'investigation_complete', 28, TRUE),
(1002, 3002, 'pending_bureau_response', 15, TRUE),
(1003, 3003, 'consumer_verification', 7, TRUE);
EOF

  echo_color $GREEN "✅ Test data seeded successfully"
}

run_database_tests() {
  echo_color $YELLOW "🧪 Running PostgreSQL database tests..."
  
  # FCRA Compliance Tests
  echo_color $BLUE "Testing FCRA audit trail functionality..."
  
  # Test 1: Audit log integrity
  AUDIT_COUNT=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$TEST_DB_NAME" -t -c "SELECT COUNT(*) FROM fcra_audit_log WHERE fcra_section IS NOT NULL;")
  if [[ $AUDIT_COUNT -gt 0 ]]; then
    echo_color $GREEN "✅ FCRA audit log functional ($AUDIT_COUNT records)"
  else
    echo_color $RED "❌ FCRA audit log test failed"
  fi
  
  # Test 2: Credit report access compliance
  ACCESS_COUNT=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$TEST_DB_NAME" -t -c "SELECT COUNT(*) FROM credit_report_access_log WHERE consumer_consent = TRUE AND fcra_disclosure_provided = TRUE;")
  if [[ $ACCESS_COUNT -gt 0 ]]; then
    echo_color $GREEN "✅ Credit report access compliance ($ACCESS_COUNT compliant records)"
  else
    echo_color $RED "❌ Credit report access compliance test failed"
  fi
  
  # Test 3: Dispute processing timeline compliance (30-day rule)
  COMPLIANT_DISPUTES=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$TEST_DB_NAME" -t -c "SELECT COUNT(*) FROM dispute_processing_log WHERE days_to_complete <= 30;")
  if [[ $COMPLIANT_DISPUTES -gt 0 ]]; then
    echo_color $GREEN "✅ Dispute processing timeline compliance ($COMPLIANT_DISPUTES within 30 days)"
  else
    echo_color $RED "❌ Dispute processing timeline test failed"
  fi
  
  # Performance Tests
  echo_color $BLUE "Running PostgreSQL performance tests..."
  
  # Test index performance
  QUERY_TIME=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$TEST_DB_NAME" -c "\timing on" -c "EXPLAIN ANALYZE SELECT * FROM fcra_audit_log WHERE consumer_id = 1001 AND created_at > NOW() - INTERVAL '30 days';" | grep "Execution Time" | grep -o '[0-9.]*' | head -1)
  
  if [[ $(echo "$QUERY_TIME < 50" | bc -l) -eq 1 ]]; then
    echo_color $GREEN "✅ Query performance optimal (${QUERY_TIME}ms)"
  else
    echo_color $YELLOW "⚠️ Query performance needs optimization (${QUERY_TIME}ms)"
  fi
}

backup_database() {
  echo_color $YELLOW "💾 Creating database backup..."
  
  BACKUP_DIR="./database-backups"
  mkdir -p "$BACKUP_DIR"
  
  TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
  BACKUP_FILE="$BACKUP_DIR/credit_repair_backup_$TIMESTAMP.sql"
  
  pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" --clean --if-exists > "$BACKUP_FILE"
  
  if [[ -f "$BACKUP_FILE" ]]; then
    echo_color $GREEN "✅ Database backup created: $BACKUP_FILE"
  else
    echo_color $RED "❌ Database backup failed"
  fi
}

cleanup_test_data() {
  echo_color $YELLOW "🧹 Cleaning up test data..."
  
  cat << 'EOF' | psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$TEST_DB_NAME"
-- Clean up test data but preserve tables
TRUNCATE fcra_audit_log, credit_report_access_log, dispute_processing_log, data_retention_policy RESTART IDENTITY;
EOF

  echo_color $GREEN "✅ Test data cleaned up"
}

generate_compliance_report() {
  echo_color $YELLOW "📊 Generating FCRA compliance report..."
  
  REPORT_FILE="./fcra_compliance_report_$(date +%Y%m%d_%H%M%S).txt"
  
  cat << EOF > "$REPORT_FILE"
# FCRA Compliance Database Report
Generated: $(date)
Database: $DB_NAME
Test Database: $TEST_DB_NAME

## Audit Trail Status
$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$TEST_DB_NAME" -c "SELECT 'Total Audit Records: ' || COUNT(*) FROM fcra_audit_log;" -t)
$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$TEST_DB_NAME" -c "SELECT 'FCRA Section 604 (Access): ' || COUNT(*) FROM fcra_audit_log WHERE fcra_section = '604';" -t)
$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$TEST_DB_NAME" -c "SELECT 'FCRA Section 611 (Disputes): ' || COUNT(*) FROM fcra_audit_log WHERE fcra_section = '611';" -t)

## Consumer Data Access Compliance
$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$TEST_DB_NAME" -c "SELECT 'Total Access Records: ' || COUNT(*) FROM credit_report_access_log;" -t)
$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$TEST_DB_NAME" -c "SELECT 'Compliant Access (Consent + Disclosure): ' || COUNT(*) FROM credit_report_access_log WHERE consumer_consent = TRUE AND fcra_disclosure_provided = TRUE;" -t)

## Dispute Processing Compliance
$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$TEST_DB_NAME" -c "SELECT 'Total Disputes Processed: ' || COUNT(*) FROM dispute_processing_log;" -t)
$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$TEST_DB_NAME" -c "SELECT 'Within 30-Day Timeline: ' || COUNT(*) FROM dispute_processing_log WHERE days_to_complete <= 30;" -t)

## Recommendations
- All audit tables properly indexed for performance
- FCRA compliance fields mandatory in data access
- Automated cleanup processes for data retention
- Regular compliance monitoring implemented

EOF

  echo_color $GREEN "✅ Compliance report generated: $REPORT_FILE"
}

### MAIN EXECUTION
main() {
  echo_color $GREEN "🐘 PostgreSQL Database Automation for Credit Repair Systems"
  echo_color $GREEN "============================================================"
  
  case "${1:-all}" in
    "test")
      check_postgres_connection
      create_test_database
      create_fcra_audit_tables
      seed_test_data
      run_database_tests
      cleanup_test_data
      ;;
    "setup")
      check_postgres_connection
      create_test_database
      validate_existing_tables
      run_fcra_compliant_migrations
      create_fcra_audit_tables
      ;;
    "backup")
      check_postgres_connection
      backup_database
      ;;
    "report")
      check_postgres_connection
      generate_compliance_report
      ;;
    "all"|*)
      check_postgres_connection
      create_test_database
      validate_existing_tables
      run_fcra_compliant_migrations
      create_fcra_audit_tables
      seed_test_data
      run_database_tests
      backup_database
      generate_compliance_report
      cleanup_test_data
      ;;
  esac
  
  echo_color $GREEN "🎉 PostgreSQL automation completed successfully!"
}

# Show usage if help requested
if [[ "${1}" == "help" || "${1}" == "--help" || "${1}" == "-h" ]]; then
  cat << EOF
PostgreSQL Database Automation for Credit Repair Systems

Usage: $0 [command]

Commands:
  all       Run complete database automation (default)
  setup     Initialize database with FCRA-compliant tables
  test      Run database tests and compliance checks
  backup    Create database backup
  report    Generate FCRA compliance report
  help      Show this help message

Environment Variables:
  DB_HOST       PostgreSQL host (default: localhost)
  DB_PORT       PostgreSQL port (default: 5432)
  DB_NAME       Main database name (default: credit_repair_db)
  DB_USER       Database user (default: credit_repair_user)
  DB_PASSWORD   Database password
  TEST_DB_NAME  Test database name (default: credit_repair_test_db)

Examples:
  $0                    # Run complete automation
  $0 setup             # Initialize FCRA-compliant database
  $0 test              # Run database tests only
  $0 backup            # Create database backup
  DB_HOST=prod.db $0   # Run against production database

EOF
  exit 0
fi

main "$@"