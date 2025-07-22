#!/bin/bash

echo "🔍 PRODUCTION DATABASE VALIDATION EXECUTOR"
echo "=========================================="

# Check if production connection string is available
if [ -z "$DATABASE_URL" ] && [ -z "$PRODUCTION_DB_URL" ]; then
    echo "❌ No production database URL found"
    echo "   Set DATABASE_URL or PRODUCTION_DB_URL environment variable"
    echo "   Example: export DATABASE_URL='postgresql://user:pass@host:port/db'"
    exit 1
fi

# Use provided URL or fallback
DB_URL=${PRODUCTION_DB_URL:-$DATABASE_URL}

echo "📡 Testing database connection..."
if psql "$DB_URL" -c "SELECT 1;" >/dev/null 2>&1; then
    echo "✅ Database connection successful"
else
    echo "❌ Database connection failed"
    echo "   Verify connection string and database accessibility"
    exit 1
fi

# Execute validation script
echo "🔬 Executing production schema validation..."
VALIDATION_OUTPUT="validation-report-$(date +%Y%m%d-%H%M%S).txt"

if psql "$DB_URL" -f scripts/production-schema-validation.sql > "$VALIDATION_OUTPUT" 2>&1; then
    echo "✅ Validation script executed successfully"
    echo "📄 Results saved to: $VALIDATION_OUTPUT"

    # Parse results for critical failures
    if grep -q "CRITICAL FAILURES FOUND" "$VALIDATION_OUTPUT"; then
        CRITICAL_COUNT=$(grep -o "[0-9]\+ CRITICAL FAILURES" "$VALIDATION_OUTPUT" | grep -o "[0-9]\+")
        echo "❌ $CRITICAL_COUNT critical failures found"
        echo "🔍 Critical issues must be resolved before deployment"

        # Show critical failures
        echo ""
        echo "🚨 CRITICAL FAILURES:"
        grep -A 10 "CRITICAL FAILURES:" "$VALIDATION_OUTPUT" | head -20

        exit 1
    else
        echo "✅ No critical failures found"

        # Check for warnings
        if grep -q "WARNINGS:" "$VALIDATION_OUTPUT"; then
            WARN_COUNT=$(grep -c "WARN" "$VALIDATION_OUTPUT" | head -1)
            echo "⚠️  $WARN_COUNT warnings found - review recommended"
        fi

        echo "🎉 Database schema is ready for Enhanced Services deployment"
    fi

else
    echo "❌ Validation script execution failed"
    echo "📄 Error details saved to: $VALIDATION_OUTPUT"
    exit 1
fi

# Generate summary
echo ""
echo "📊 VALIDATION SUMMARY"
echo "===================="
echo "📅 Executed: $(date)"
echo "🗄️  Database: Production"
echo "📄 Full Report: $VALIDATION_OUTPUT"

# Extract key metrics if possible
if command -v grep >/dev/null 2>&1; then
    PASS_COUNT=$(grep -c "✅ PASS" "$VALIDATION_OUTPUT" || echo "0")
    FAIL_COUNT=$(grep -c "❌ FAIL" "$VALIDATION_OUTPUT" || echo "0")
    WARN_COUNT=$(grep -c "⚠️  WARN" "$VALIDATION_OUTPUT" || echo "0")

    echo "✅ Passed checks: $PASS_COUNT"
    echo "❌ Failed checks: $FAIL_COUNT"
    echo "⚠️  Warnings: $WARN_COUNT"

    if [ "$FAIL_COUNT" -eq 0 ]; then
        echo ""
        echo "🚀 READY FOR ENHANCED SERVICES DEPLOYMENT"
    else
        echo ""
        echo "🔧 REQUIRES FIXES BEFORE DEPLOYMENT"
    fi
fi

echo "✅ Production database validation complete"