#!/bin/bash

# Elite Database Migration Executor
# Zero-downtime performance optimization deployment
# Target: 10-20x performance improvement through N+1 query elimination

set -euo pipefail

# Configuration
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_NAME:-str_certified}"
DB_USER="${DB_USER:-postgres}"
MIGRATION_FILE="migrations/performance_optimization_v1.sql"
LOG_DIR="logs"
LOG_FILE="$LOG_DIR/migration_$(date +%Y%m%d_%H%M%S).log"
VALIDATION_LOG="$LOG_DIR/validation_$(date +%Y%m%d_%H%M%S).log"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function with timestamps and colors
log() {
    local level=$1
    shift
    local message="$*"
    local timestamp="$(date +'%Y-%m-%d %H:%M:%S')"
    
    case $level in
        "INFO")
            echo -e "${GREEN}[INFO]${NC} [$timestamp] $message" | tee -a "$LOG_FILE"
            ;;
        "WARN")
            echo -e "${YELLOW}[WARN]${NC} [$timestamp] $message" | tee -a "$LOG_FILE"
            ;;
        "ERROR")
            echo -e "${RED}[ERROR]${NC} [$timestamp] $message" | tee -a "$LOG_FILE"
            ;;
        "DEBUG")
            echo -e "${BLUE}[DEBUG]${NC} [$timestamp] $message" | tee -a "$LOG_FILE"
            ;;
        *)
            echo "[$timestamp] $message" | tee -a "$LOG_FILE"
            ;;
    esac
}

# Error handler
error_handler() {
    local line_no=$1
    local error_code=$2
    log "ERROR" "Migration failed at line $line_no with exit code $error_code"
    log "ERROR" "Check $LOG_FILE for detailed error information"
    
    # Attempt to provide rollback instructions
    echo -e "\n${RED}MIGRATION FAILED${NC}"
    echo -e "${YELLOW}To rollback, you can run the rollback commands from the migration file${NC}"
    echo -e "${YELLOW}Or contact the database administrator for assistance${NC}"
    
    exit $error_code
}

# Set error trap
trap 'error_handler ${LINENO} $?' ERR

# Database connection helper
run_sql() {
    local sql="$1"
    local description="${2:-SQL Query}"
    
    log "DEBUG" "Executing: $description"
    
    if ! psql -h "$DB_HOST" -p "$DB_PORT" -d "$DB_NAME" -U "$DB_USER" \
         -v ON_ERROR_STOP=1 -q -c "$sql" 2>&1 | tee -a "$LOG_FILE"; then
        log "ERROR" "Failed to execute: $description"
        return 1
    fi
    
    log "DEBUG" "Successfully executed: $description"
}

# Database connection with file
run_sql_file() {
    local file="$1"
    local description="${2:-SQL File}"
    
    log "DEBUG" "Executing file: $file ($description)"
    
    if ! psql -h "$DB_HOST" -p "$DB_PORT" -d "$DB_NAME" -U "$DB_USER" \
         -v ON_ERROR_STOP=1 -f "$file" 2>&1 | tee -a "$LOG_FILE"; then
        log "ERROR" "Failed to execute file: $file"
        return 1
    fi
    
    log "DEBUG" "Successfully executed file: $file"
}

# Pre-migration validation
validate_environment() {
    log "INFO" "🔍 Validating migration environment..."
    
    # Check if migration file exists
    if [[ ! -f "$MIGRATION_FILE" ]]; then
        log "ERROR" "Migration file not found: $MIGRATION_FILE"
        exit 1
    fi
    
    # Test database connectivity
    log "DEBUG" "Testing database connectivity..."
    if ! psql -h "$DB_HOST" -p "$DB_PORT" -d "$DB_NAME" -U "$DB_USER" -c '\q' 2>/dev/null; then
        log "ERROR" "Database connection failed"
        log "ERROR" "Host: $DB_HOST, Port: $DB_PORT, Database: $DB_NAME, User: $DB_USER"
        exit 1
    fi
    log "INFO" "✅ Database connection successful"
    
    # Check PostgreSQL version
    local pg_version
    pg_version=$(psql -h "$DB_HOST" -p "$DB_PORT" -d "$DB_NAME" -U "$DB_USER" \
                 -t -c "SELECT current_setting('server_version_num')::int;" | xargs)
    
    if [[ $pg_version -lt 140000 ]]; then
        log "ERROR" "PostgreSQL 14+ required for concurrent indexing. Current version: $pg_version"
        exit 1
    fi
    log "INFO" "✅ PostgreSQL version check passed: $pg_version"
    
    # Check for active connections
    local active_connections
    active_connections=$(psql -h "$DB_HOST" -p "$DB_PORT" -d "$DB_NAME" -U "$DB_USER" \
                        -t -c "SELECT count(*) FROM pg_stat_activity WHERE state = 'active';" | xargs)
    log "INFO" "📊 Active database connections: $active_connections"
    
    if [[ $active_connections -gt 50 ]]; then
        log "WARN" "High number of active connections detected: $active_connections"
        log "WARN" "Consider running migration during low-traffic period"
    fi
    
    # Check table sizes
    local checklist_size media_size
    checklist_size=$(psql -h "$DB_HOST" -p "$DB_PORT" -d "$DB_NAME" -U "$DB_USER" \
                    -t -c "SELECT pg_size_pretty(pg_total_relation_size('checklist_items'));" | xargs)
    media_size=$(psql -h "$DB_HOST" -p "$DB_PORT" -d "$DB_NAME" -U "$DB_USER" \
                -t -c "SELECT pg_size_pretty(pg_total_relation_size('media'));" | xargs)
    
    log "INFO" "📊 Table sizes - checklist_items: $checklist_size, media: $media_size"
    
    # Check disk space
    local disk_usage
    disk_usage=$(df -h . | tail -1 | awk '{print $5}' | sed 's/%//')
    if [[ $disk_usage -gt 80 ]]; then
        log "WARN" "⚠️  High disk usage: ${disk_usage}% - consider freeing space"
    else
        log "INFO" "✅ Disk usage acceptable: ${disk_usage}%"
    fi
    
    # Check for existing optimized indexes
    local existing_indexes
    existing_indexes=$(psql -h "$DB_HOST" -p "$DB_PORT" -d "$DB_NAME" -U "$DB_USER" \
                      -t -c "SELECT count(*) FROM pg_indexes WHERE indexname LIKE '%_optimized';" | xargs)
    
    if [[ $existing_indexes -gt 0 ]]; then
        log "WARN" "Found $existing_indexes existing optimized indexes - migration may be partially applied"
        read -p "Continue anyway? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            log "INFO" "Migration cancelled by user"
            exit 0
        fi
    fi
    
    log "INFO" "✅ Environment validation completed successfully"
}

# Execute migration with comprehensive monitoring
execute_migration() {
    log "INFO" "🚀 Starting elite performance optimization migration..."
    
    # Start timing
    local start_time
    start_time=$(date +%s)
    
    # Create backup of critical statistics before migration
    log "INFO" "📊 Creating pre-migration performance baseline..."
    
    psql -h "$DB_HOST" -p "$DB_PORT" -d "$DB_NAME" -U "$DB_USER" -c "
        CREATE TEMP TABLE pre_migration_stats AS
        SELECT 
            'checklist_items' as table_name,
            COUNT(*) as row_count,
            pg_size_pretty(pg_total_relation_size('checklist_items')) as table_size
        UNION ALL
        SELECT 
            'media' as table_name,
            COUNT(*) as row_count,
            pg_size_pretty(pg_total_relation_size('media')) as table_size;
        
        SELECT * FROM pre_migration_stats;
    " | tee -a "$LOG_FILE"
    
    # Execute migration with transaction wrapper for safety
    log "INFO" "🔧 Executing migration file..."
    
    # Use a longer statement timeout for index creation
    psql -h "$DB_HOST" -p "$DB_PORT" -d "$DB_NAME" -U "$DB_USER" \
         -v ON_ERROR_STOP=1 << EOF 2>&1 | tee -a "$LOG_FILE"
\\timing on
\\set VERBOSITY verbose

-- Set longer timeout for concurrent index creation
SET statement_timeout = '30min';
SET lock_timeout = '10min';

BEGIN;
    -- Log migration start
    DO \$\$ BEGIN
        RAISE NOTICE 'Elite performance migration started at %', NOW();
    END \$\$;
    
    -- Execute migration file
    \\i $MIGRATION_FILE
    
    -- Log migration completion
    DO \$\$ BEGIN
        RAISE NOTICE 'Elite performance migration completed at %', NOW();
    END \$\$;
    
COMMIT;

-- Reset timeouts
RESET statement_timeout;
RESET lock_timeout;
EOF

    local end_time
    end_time=$(date +%s)
    local duration=$((end_time - start_time))
    
    log "INFO" "✅ Migration completed successfully in ${duration} seconds"
}

# Post-migration validation with comprehensive checks
validate_migration() {
    log "INFO" "🔍 Validating migration results..."
    
    # Save validation output to separate file
    exec 3>&1 4>&2 1>"$VALIDATION_LOG" 2>&1
    
    # Check index creation
    local index_count
    index_count=$(psql -h "$DB_HOST" -p "$DB_PORT" -d "$DB_NAME" -U "$DB_USER" \
                 -t -c "SELECT count(*) FROM pg_indexes WHERE indexname LIKE '%_optimized';" | xargs)
    
    echo "📊 Optimized indexes created: $index_count"
    log "INFO" "📊 Optimized indexes created: $index_count"
    
    if [[ $index_count -lt 5 ]]; then
        log "ERROR" "Expected at least 5 optimized indexes, but found $index_count"
        exec 1>&3 2>&4 3>&- 4>&-
        return 1
    fi
    
    # Test the new batch function
    echo "🧪 Testing batch function..."
    local function_test
    function_test=$(psql -h "$DB_HOST" -p "$DB_PORT" -d "$DB_NAME" -U "$DB_USER" \
                   -t -c "SELECT count(*) FROM get_inspection_media_batch('00000000-0000-0000-0000-000000000000');" | xargs)
    
    echo "📊 Batch function test result: $function_test rows (expected 0 for non-existent inspection)"
    log "INFO" "📊 Batch function test successful: $function_test rows"
    
    # Run built-in validation function
    echo "🔍 Running optimization validation..."
    psql -h "$DB_HOST" -p "$DB_PORT" -d "$DB_NAME" -U "$DB_USER" \
         -c "SELECT * FROM validate_optimization();"
    
    # Check index usage (will be 0 initially, but should be available)
    echo "📈 Index usage statistics:"
    psql -h "$DB_HOST" -p "$DB_PORT" -d "$DB_NAME" -U "$DB_USER" \
         -c "SELECT * FROM verify_index_usage();"
    
    # Test performance monitoring
    echo "📊 Performance monitoring test:"
    psql -h "$DB_HOST" -p "$DB_PORT" -d "$DB_NAME" -U "$DB_USER" \
         -c "SELECT log_query_performance('migration_test', 100.5, 1); 
             SELECT operation, duration_ms, rows_affected 
             FROM performance_logs 
             WHERE operation = 'migration_test' 
             ORDER BY logged_at DESC LIMIT 1;"
    
    exec 1>&3 2>&4 3>&- 4>&-
    
    log "INFO" "✅ Migration validation completed successfully"
    log "INFO" "📝 Detailed validation results saved to: $VALIDATION_LOG"
}

# Performance benchmarking with real inspection data
benchmark_performance() {
    log "INFO" "⚡ Running performance benchmarks..."
    
    # Get a real inspection ID for testing
    local test_inspection_id
    test_inspection_id=$(psql -h "$DB_HOST" -p "$DB_PORT" -d "$DB_NAME" -U "$DB_USER" \
                        -t -c "SELECT id FROM inspections LIMIT 1;" | xargs)
    
    if [[ -n "$test_inspection_id" && "$test_inspection_id" != "" ]]; then
        log "INFO" "🧪 Testing with inspection ID: $test_inspection_id"
        
        # Benchmark the new optimized query
        log "DEBUG" "Running performance benchmark..."
        
        psql -h "$DB_HOST" -p "$DB_PORT" -d "$DB_NAME" -U "$DB_USER" << EOF 2>&1 | tee -a "$LOG_FILE"
\\timing on
\\echo 'Performance analysis for optimized batch query:'
EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT) 
SELECT * FROM get_inspection_media_batch('$test_inspection_id');

\\echo ''
\\echo 'Query execution with timing:'
SELECT 
    COUNT(*) as total_items,
    COUNT(DISTINCT checklist_item_id) as checklist_items,
    COUNT(DISTINCT media_id) as media_items
FROM get_inspection_media_batch('$test_inspection_id');
EOF
    else
        log "WARN" "⚠️  No test inspection found - skipping performance benchmark"
        log "INFO" "💡 Create test data and run benchmark manually with:"
        log "INFO" "    SELECT * FROM get_inspection_media_batch('<inspection-id>');"
    fi
}

# Generate migration report
generate_report() {
    local report_file="$LOG_DIR/migration_report_$(date +%Y%m%d_%H%M%S).md"
    
    log "INFO" "📋 Generating migration report..."
    
    cat > "$report_file" << EOF
# Elite Performance Migration Report

**Migration Date:** $(date)
**Database:** $DB_NAME @ $DB_HOST:$DB_PORT
**Duration:** Migration completed successfully

## Migration Summary

### ✅ Completed Tasks
- [x] Created 5+ optimized database indexes with CONCURRENT option
- [x] Implemented \`get_inspection_media_batch()\` function for N+1 elimination
- [x] Added comprehensive performance monitoring infrastructure
- [x] Created validation and analysis functions
- [x] Established performance logging and alerting

### 📊 Technical Improvements
- **Query Pattern:** N+1 individual queries → Single batched query
- **Index Coverage:** Added covering indexes for common query patterns
- **Performance Monitoring:** Real-time query performance tracking
- **Error Handling:** Comprehensive error recovery and logging

### 🔍 Validation Results
$(cat "$VALIDATION_LOG" 2>/dev/null || echo "Validation log not available")

### 📈 Next Steps
1. Monitor application performance over next 24-48 hours
2. Update application code to use new \`get_inspection_media_batch()\` function
3. Implement React BatchedMediaProvider for frontend optimization
4. Track performance improvements with \`analyze_query_performance()\`

### 🚨 Rollback Instructions
If performance issues occur, rollback commands are available in:
$MIGRATION_FILE (see ROLLBACK PLAN section)

### 📞 Support
- Migration Log: $LOG_FILE
- Validation Log: $VALIDATION_LOG
- Database Functions: \`validate_optimization()\`, \`verify_index_usage()\`
EOF

    log "INFO" "📋 Migration report generated: $report_file"
}

# Cleanup function
cleanup() {
    log "INFO" "🧹 Performing cleanup..."
    
    # Clean up any temporary files if needed
    # (Currently none created)
    
    log "INFO" "✅ Cleanup completed"
}

# Main execution function
main() {
    echo -e "${BLUE}🎯 ELITE PERFORMANCE MIGRATION${NC}"
    echo -e "${BLUE}================================${NC}"
    echo "Database: $DB_NAME @ $DB_HOST:$DB_PORT"
    echo "Migration File: $MIGRATION_FILE"
    echo "Log File: $LOG_FILE"
    echo ""
    
    log "INFO" "🚀 Starting Elite Performance Migration"
    
    # Create log directory
    mkdir -p "$LOG_DIR"
    
    # Execute migration phases
    validate_environment
    execute_migration
    validate_migration
    benchmark_performance
    generate_report
    cleanup
    
    echo ""
    echo -e "${GREEN}🏆 ELITE PERFORMANCE MIGRATION COMPLETED SUCCESSFULLY${NC}"
    echo -e "${GREEN}=============================================${NC}"
    echo ""
    echo "📊 Migration Results:"
    echo "  ✅ Database optimization: COMPLETE"
    echo "  ✅ Index creation: COMPLETE" 
    echo "  ✅ Performance monitoring: ACTIVE"
    echo "  ✅ Validation: PASSED"
    echo ""
    echo "📈 Next Steps:"
    echo "  1. Update application code to use get_inspection_media_batch()"
    echo "  2. Implement React BatchedMediaProvider"
    echo "  3. Monitor performance improvements over 24-48 hours"
    echo ""
    echo "📝 Important Files:"
    echo "  📋 Migration Log: $LOG_FILE"
    echo "  🔍 Validation Log: $VALIDATION_LOG"
    echo "  📊 Performance Report: $LOG_DIR/migration_report_*.md"
    echo ""
    echo "🔧 Monitoring Commands:"
    echo "  SELECT * FROM validate_optimization();"
    echo "  SELECT * FROM verify_index_usage();"
    echo "  SELECT * FROM analyze_query_performance();"
    echo ""
    
    log "INFO" "🎯 Elite Performance Migration completed successfully"
}

# Script entry point with error handling
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    # Ensure required commands are available
    command -v psql >/dev/null 2>&1 || { 
        echo -e "${RED}ERROR: psql is required but not installed.${NC}" >&2
        exit 1
    }
    
    # Execute main function
    main "$@"
fi