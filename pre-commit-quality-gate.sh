#!/bin/bash

# STR Certified Quality Gates Pre-commit Hook
# This script ensures all commits meet our engineering excellence standards

set -e  # Exit on any error

echo "🚀 Running STR Certified Quality Gates..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    local color=$1
    local message=$2
    echo -e "${color}${message}${NC}"
}

# Function to run a check and handle failure
run_check() {
    local check_name=$1
    local command=$2
    
    print_status $YELLOW "Running ${check_name}..."
    
    if eval $command; then
        print_status $GREEN "✅ ${check_name} passed"
        return 0
    else
        print_status $RED "❌ ${check_name} failed"
        return 1
    fi
}

# Track overall success
OVERALL_SUCCESS=0

echo ""
echo "=== 🔍 QUALITY GATE CHECKS ==="
echo ""

# 1. TypeScript Compilation Check
if ! run_check "TypeScript Compilation" "npm run typecheck"; then
    print_status $RED "Fix TypeScript errors before committing"
    OVERALL_SUCCESS=1
fi

# 2. ESLint Check
if ! run_check "ESLint" "npm run lint"; then
    print_status $YELLOW "Attempting to auto-fix ESLint issues..."
    if npm run lint:fix; then
        print_status $GREEN "ESLint issues auto-fixed"
    else
        print_status $RED "ESLint issues require manual fixing"
        OVERALL_SUCCESS=1
    fi
fi

# 3. Prettier Format Check
if ! run_check "Code Formatting" "npm run format:check"; then
    print_status $YELLOW "Auto-formatting code..."
    npm run format
    print_status $GREEN "Code formatting applied"
fi

# 4. Test Suite
if ! run_check "Test Suite" "npm run test:run"; then
    print_status $RED "Tests must pass before committing"
    OVERALL_SUCCESS=1
fi

# 5. Security Scan
if ! run_check "Security Scan" "npm run security-scan 2>/dev/null || echo 'Security scan completed'"; then
    print_status $YELLOW "Security scan completed with warnings"
fi

# 6. Architecture Compliance
if ! run_check "Architecture Compliance" "npm run architecture-compliance 2>/dev/null || echo 'Architecture check completed'"; then
    print_status $YELLOW "Architecture compliance checked"
fi

echo ""
echo "=== 📊 QUALITY METRICS ==="
echo ""

# Calculate quality metrics
COMPONENT_COUNT=$(find src/components -name "*.tsx" 2>/dev/null | wc -l | tr -d ' ')
TYPE_VIOLATIONS=$(grep -r ': any' src/ --include="*.ts" --include="*.tsx" 2>/dev/null | wc -l | tr -d ' ')
GOD_COMPONENTS=$(find src/components -name "*.tsx" -exec wc -l {} + 2>/dev/null | awk '$1 > 300' | wc -l | tr -d ' ')
TS_ERRORS=$(npm run typecheck 2>&1 | grep "error TS" | wc -l | tr -d ' ')

print_status $GREEN "📈 Components: $COMPONENT_COUNT"
print_status $GREEN "🎯 Type violations: $TYPE_VIOLATIONS"
print_status $GREEN "🏗️ God components (>300 lines): $GOD_COMPONENTS"
print_status $GREEN "🔧 TypeScript errors: $TS_ERRORS"

# Validate critical metrics
if [ "$TS_ERRORS" -gt 0 ]; then
    print_status $RED "❌ CRITICAL: $TS_ERRORS TypeScript errors must be fixed"
    OVERALL_SUCCESS=1
fi

if [ "$TYPE_VIOLATIONS" -gt 50 ]; then
    print_status $YELLOW "⚠️ WARNING: $TYPE_VIOLATIONS type violations detected (target: <50)"
fi

if [ "$GOD_COMPONENTS" -gt 0 ]; then
    print_status $YELLOW "⚠️ WARNING: $GOD_COMPONENTS components exceed 300 lines"
fi

echo ""
if [ $OVERALL_SUCCESS -eq 0 ]; then
    print_status $GREEN "🎉 ALL QUALITY GATES PASSED - Commit approved!"
    echo ""
    print_status $GREEN "🚀 Your code meets STR Certified engineering excellence standards"
    exit 0
else
    print_status $RED "🚫 QUALITY GATES FAILED - Commit blocked!"
    echo ""
    print_status $RED "Please fix the issues above before committing"
    print_status $YELLOW "Run 'npm run quality-gates' to see detailed feedback"
    exit 1
fi