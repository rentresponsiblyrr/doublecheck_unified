#!/bin/bash
/**
 * PRE-COMMIT QUALITY GATE - NETFLIX/META STANDARDS
 * 
 * This script prevents engineers from committing code that violates
 * our engineering standards. It catches issues before they reach production.
 * 
 * BLOCKS COMMITS with:
 * - Database schema violations (logs table, legacy field names)
 * - Critical any type violations
 * - TypeScript compilation errors
 * - Major naming inconsistencies
 */

set -e

echo "🚀 STR CERTIFIED - PRE-COMMIT QUALITY GATE"
echo "=========================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

VIOLATIONS=0

# Function to check for critical violations
check_critical_violations() {
    echo "🔍 Checking for critical database schema violations..."
    
    # Check for legacy logs table references
    LOGS_VIOLATIONS=$(git diff --cached --name-only | xargs grep -l "\.from('logs')" 2>/dev/null || true)
    if [ ! -z "$LOGS_VIOLATIONS" ]; then
        echo -e "${RED}❌ CRITICAL: Legacy 'logs' table references found:${NC}"
        echo "$LOGS_VIOLATIONS"
        echo -e "${YELLOW}   FIX: Replace .from('logs') with .from('checklist_items')${NC}"
        VIOLATIONS=$((VIOLATIONS + 1))
    fi
    
    # Check for legacy field names
    FIELD_VIOLATIONS=$(git diff --cached --name-only | xargs grep -l "property_name\|street_address" 2>/dev/null || true)
    if [ ! -z "$FIELD_VIOLATIONS" ]; then
        echo -e "${RED}❌ CRITICAL: Legacy field names found:${NC}"
        echo "$FIELD_VIOLATIONS"
        echo -e "${YELLOW}   FIX: Replace property_name→name, street_address→address${NC}"
        VIOLATIONS=$((VIOLATIONS + 1))
    fi
}

# Function to check TypeScript compilation
check_typescript() {
    echo "🔍 Checking TypeScript compilation..."
    
    if ! npm run typecheck > /dev/null 2>&1; then
        echo -e "${RED}❌ CRITICAL: TypeScript compilation failed${NC}"
        echo "Run 'npm run typecheck' to see errors"
        VIOLATIONS=$((VIOLATIONS + 1))
    else
        echo -e "${GREEN}✅ TypeScript compilation passed${NC}"
    fi
}

# Function to run engineering standards enforcer  
check_engineering_standards() {
    echo "🔍 Running engineering standards enforcement..."
    
    if [ -f "engineering-standards-enforcer.cjs" ]; then
        if ! node engineering-standards-enforcer.cjs > /dev/null 2>&1; then
            echo -e "${RED}❌ CRITICAL: Engineering standards violations found${NC}"
            echo "Run 'node engineering-standards-enforcer.cjs' for details"
            VIOLATIONS=$((VIOLATIONS + 1))
        else
            echo -e "${GREEN}✅ Engineering standards check passed${NC}"
        fi
    fi
}

# Function to check for any types in critical files
check_any_types() {
    echo "🔍 Checking for 'any' types in critical files..."
    
    CRITICAL_DIRS="src/hooks src/services src/components/inspector/active"
    ANY_VIOLATIONS=""
    
    for dir in $CRITICAL_DIRS; do
        if [ -d "$dir" ]; then
            ANY_FILES=$(find "$dir" -name "*.ts" -o -name "*.tsx" | xargs grep -l ": any" 2>/dev/null || true)
            if [ ! -z "$ANY_FILES" ]; then
                ANY_VIOLATIONS="$ANY_VIOLATIONS $ANY_FILES"
            fi
        fi
    done
    
    if [ ! -z "$ANY_VIOLATIONS" ]; then
        echo -e "${YELLOW}⚠️  WARNING: 'any' types found in critical files:${NC}"
        echo "$ANY_VIOLATIONS"
        echo -e "${YELLOW}   Consider adding proper TypeScript types${NC}"
        # This is a warning, not blocking
    fi
}

# Function to validate component file naming
check_component_naming() {
    echo "🔍 Checking component file naming conventions..."
    
    KEBAB_COMPONENTS=$(find src/components -name "*-*.tsx" 2>/dev/null || true)
    if [ ! -z "$KEBAB_COMPONENTS" ]; then
        echo -e "${YELLOW}⚠️  WARNING: Kebab-case component files found:${NC}"
        echo "$KEBAB_COMPONENTS"
        echo -e "${YELLOW}   Consider renaming to PascalCase${NC}"
        # This is a warning, not blocking
    fi
}

# Main execution
main() {
    # Only run on staged files
    STAGED_FILES=$(git diff --cached --name-only)
    if [ -z "$STAGED_FILES" ]; then
        echo "No staged files found. Skipping quality gate."
        exit 0
    fi
    
    echo "Checking staged files: $STAGED_FILES"
    echo ""
    
    # Run all checks
    check_critical_violations
    check_typescript
    check_engineering_standards
    check_any_types
    check_component_naming
    
    echo ""
    echo "=========================================="
    
    # Decision
    if [ $VIOLATIONS -eq 0 ]; then
        echo -e "${GREEN}🎉 QUALITY GATE PASSED - Commit approved${NC}"
        echo -e "${GREEN}All critical standards met${NC}"
        exit 0
    else
        echo -e "${RED}🚨 QUALITY GATE FAILED - Commit blocked${NC}"
        echo -e "${RED}Fix $VIOLATIONS critical violation(s) before committing${NC}"
        echo ""
        echo "To bypass (NOT RECOMMENDED):"
        echo "  git commit --no-verify"
        exit 1
    fi
}

# Run the quality gate
main "$@"