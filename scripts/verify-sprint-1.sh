#!/bin/bash

# Sprint 1 Verification Script
# Verifies all critical security and production issues are fixed

echo "========================================="
echo "SPRINT 1 VERIFICATION"
echo "Critical Blockers & Security"
echo "========================================="
echo ""

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Initialize pass/fail
SPRINT_PASS=true

# 1. Console Statements Check
echo "1. Console Statements Check"
CONSOLE_COUNT=$(grep -r "console\." src/ --include="*.ts" --include="*.tsx" 2>/dev/null | wc -l | tr -d ' ')
if [ "$CONSOLE_COUNT" -eq 0 ]; then
    echo -e "   ${GREEN}✓ Console statements: 0${NC}"
else
    echo -e "   ${RED}✗ Console statements: $CONSOLE_COUNT (must be 0)${NC}"
    SPRINT_PASS=false
    echo "   Files with console statements:"
    grep -r "console\." src/ --include="*.ts" --include="*.tsx" -l 2>/dev/null | head -5 | sed 's/^/      /'
fi
echo ""

# 2. Nuclear Reloads Check
echo "2. Nuclear Reloads Check"
RELOAD_COUNT=$(grep -r "window\.location\.reload" src/ --include="*.ts*" 2>/dev/null | wc -l | tr -d ' ')
if [ "$RELOAD_COUNT" -eq 0 ]; then
    echo -e "   ${GREEN}✓ window.location.reload: 0${NC}"
else
    echo -e "   ${RED}✗ window.location.reload: $RELOAD_COUNT (must be 0)${NC}"
    SPRINT_PASS=false
    echo "   Files with reloads:"
    grep -r "window\.location\.reload" src/ --include="*.ts*" -l 2>/dev/null | head -5 | sed 's/^/      /'
fi
echo ""

# 3. XSS Vulnerabilities Check
echo "3. XSS Vulnerabilities Check"
XSS_COUNT=$(grep -r "dangerouslySetInnerHTML" src/ --include="*.tsx" 2>/dev/null | wc -l | tr -d ' ')
if [ "$XSS_COUNT" -eq 0 ]; then
    echo -e "   ${GREEN}✓ dangerouslySetInnerHTML: 0${NC}"
else
    echo -e "   ${RED}✗ dangerouslySetInnerHTML: $XSS_COUNT (must be 0)${NC}"
    SPRINT_PASS=false
    echo "   Files with XSS risk:"
    grep -r "dangerouslySetInnerHTML" src/ --include="*.tsx" -l 2>/dev/null | sed 's/^/      /'
fi
echo ""

# 4. Empty Catch Blocks Check
echo "4. Empty Catch Blocks Check"
EMPTY_CATCH=$(grep -r "catch.*{[[:space:]]*}" src/ --include="*.ts*" 2>/dev/null | wc -l | tr -d ' ')
if [ "$EMPTY_CATCH" -eq 0 ]; then
    echo -e "   ${GREEN}✓ Empty catch blocks: 0${NC}"
else
    echo -e "   ${RED}✗ Empty catch blocks: $EMPTY_CATCH (must be 0)${NC}"
    SPRINT_PASS=false
    echo "   Files with empty catches:"
    grep -r "catch.*{[[:space:]]*}" src/ --include="*.ts*" -l 2>/dev/null | head -5 | sed 's/^/      /'
fi
echo ""

# 5. TypeScript Compilation Check
echo "5. TypeScript Compilation Check"
TS_ERRORS=$(npm run typecheck 2>&1 | grep "error TS" | wc -l | tr -d ' ')
if [ "$TS_ERRORS" -eq 0 ]; then
    echo -e "   ${GREEN}✓ TypeScript errors: 0${NC}"
else
    echo -e "   ${YELLOW}⚠ TypeScript errors: $TS_ERRORS (should be 0)${NC}"
    echo "   Run 'npm run typecheck' for details"
fi
echo ""

# 6. Build Check
echo "6. Build Check"
echo "   Running build test..."
if npm run build:check > /dev/null 2>&1; then
    echo -e "   ${GREEN}✓ Build succeeds${NC}"
else
    echo -e "   ${YELLOW}⚠ Build has issues${NC}"
    echo "   Run 'npm run build' for details"
fi
echo ""

# Final Result
echo "========================================="
if [ "$SPRINT_PASS" = true ]; then
    echo -e "${GREEN}✅ SPRINT 1 COMPLETE${NC}"
    echo ""
    echo "All critical security issues have been resolved!"
    echo "Ready to proceed to Sprint 2: Service Consolidation"
    exit 0
else
    echo -e "${RED}❌ SPRINT 1 INCOMPLETE${NC}"
    echo ""
    echo "Critical issues remain. Fix the above before marking complete."
    echo ""
    echo "Quick fixes available:"
    echo "  npm run cleanup:console     - Remove console statements"
    echo "  npm run cleanup:security    - Fix security issues"
    exit 1
fi