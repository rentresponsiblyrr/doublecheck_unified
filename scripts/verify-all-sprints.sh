#!/bin/bash

# Master Sprint Verification Script
# Runs all sprint verifications and provides overall status

echo "========================================="
echo "TECH DEBT SPRINT VERIFICATION DASHBOARD"
echo "========================================="
echo "Date: $(date)"
echo ""

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Sprint 1: Critical Blockers & Security
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "SPRINT 1: Critical Blockers & Security"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
CONSOLE_COUNT=$(grep -r "console\." src/ --include="*.ts" --include="*.tsx" 2>/dev/null | wc -l | tr -d ' ')
RELOAD_COUNT=$(grep -r "window\.location\.reload" src/ --include="*.ts*" 2>/dev/null | wc -l | tr -d ' ')
XSS_COUNT=$(grep -r "dangerouslySetInnerHTML" src/ --include="*.tsx" 2>/dev/null | wc -l | tr -d ' ')
EMPTY_CATCH=$(grep -r "catch.*{[[:space:]]*}" src/ --include="*.ts*" 2>/dev/null | wc -l | tr -d ' ')

SPRINT1_COMPLETE=false
if [ "$CONSOLE_COUNT" -eq 0 ] && [ "$RELOAD_COUNT" -eq 0 ] && [ "$XSS_COUNT" -eq 0 ] && [ "$EMPTY_CATCH" -eq 0 ]; then
    SPRINT1_COMPLETE=true
    echo -e "${GREEN}✅ COMPLETE${NC}"
else
    echo -e "${RED}❌ INCOMPLETE${NC}"
fi

echo "• Console statements: $CONSOLE_COUNT/0"
echo "• Nuclear reloads: $RELOAD_COUNT/0"
echo "• XSS vulnerabilities: $XSS_COUNT/0"
echo "• Empty catch blocks: $EMPTY_CATCH/0"
echo ""

# Sprint 2: Service Consolidation
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "SPRINT 2: Service Consolidation"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
SERVICE_COUNT=$(find src/services -name "*.ts" -type f 2>/dev/null | wc -l | tr -d ' ')
CORE_COUNT=$(find src/services/core -name "*.ts" -type f 2>/dev/null | wc -l | tr -d ' ')

SPRINT2_COMPLETE=false
if [ "$SERVICE_COUNT" -le 20 ] && [ "$CORE_COUNT" -ge 8 ]; then
    SPRINT2_COMPLETE=true
    echo -e "${GREEN}✅ COMPLETE${NC}"
else
    echo -e "${RED}❌ INCOMPLETE${NC}"
fi

echo "• Total services: $SERVICE_COUNT/20"
echo "• Core services: $CORE_COUNT/8"
echo ""

# Sprint 3: Component Refactoring
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "SPRINT 3: Component Refactoring"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
GOD_COUNT=$(find src/components -name "*.tsx" -type f -exec wc -l {} + 2>/dev/null | awk '$1 > 300' | wc -l | tr -d ' ')
LARGEST=$(find src/components -name "*.tsx" -type f -exec wc -l {} + 2>/dev/null | sort -rn | head -1 | awk '{print $1}')

SPRINT3_COMPLETE=false
if [ "$GOD_COUNT" -eq 0 ]; then
    SPRINT3_COMPLETE=true
    echo -e "${GREEN}✅ COMPLETE${NC}"
else
    echo -e "${RED}❌ INCOMPLETE${NC}"
fi

echo "• God components (>300 lines): $GOD_COUNT/0"
echo "• Largest component: ${LARGEST:-0} lines"
echo ""

# Sprint 4: Type Safety & Testing
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "SPRINT 4: Type Safety & Testing"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
ANY_COUNT=$(grep -r ": any" src/ --include="*.ts" --include="*.tsx" 2>/dev/null | wc -l | tr -d ' ')

# Try to get test coverage if available
COVERAGE="N/A"
if command -v npm &> /dev/null; then
    COVERAGE_OUTPUT=$(npm run test:coverage 2>&1 | grep "All files" | awk '{print $10}' | sed 's/%//')
    if [ ! -z "$COVERAGE_OUTPUT" ]; then
        COVERAGE="$COVERAGE_OUTPUT"
    fi
fi

SPRINT4_COMPLETE=false
if [ "$ANY_COUNT" -eq 0 ] && [ "$COVERAGE" != "N/A" ]; then
    if (( $(echo "$COVERAGE >= 70" | bc -l 2>/dev/null || echo 0) )); then
        SPRINT4_COMPLETE=true
        echo -e "${GREEN}✅ COMPLETE${NC}"
    else
        echo -e "${RED}❌ INCOMPLETE${NC}"
    fi
else
    echo -e "${RED}❌ INCOMPLETE${NC}"
fi

echo "• TypeScript 'any': $ANY_COUNT/0"
echo "• Test coverage: ${COVERAGE}%/70%"
echo ""

# Sprint 5: Performance Optimization
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "SPRINT 5: Performance Optimization"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Check if dist exists from last build
BUNDLE_SIZE="N/A"
if [ -d "dist" ]; then
    BUNDLE_KB=$(find dist/assets -name "*.js" -exec du -k {} + 2>/dev/null | awk '{sum+=$1} END {print sum}')
    if [ ! -z "$BUNDLE_KB" ]; then
        BUNDLE_SIZE=$(echo "scale=2; $BUNDLE_KB / 1024" | bc)
    fi
fi

SPRINT5_COMPLETE=false
if [ "$BUNDLE_SIZE" != "N/A" ]; then
    if (( $(echo "$BUNDLE_SIZE < 0.5" | bc -l 2>/dev/null || echo 0) )); then
        SPRINT5_COMPLETE=true
        echo -e "${GREEN}✅ COMPLETE${NC}"
    else
        echo -e "${RED}❌ INCOMPLETE${NC}"
    fi
else
    echo -e "${YELLOW}⚠ NOT STARTED${NC}"
fi

echo "• Bundle size: ${BUNDLE_SIZE}MB/0.5MB"
echo "• Lighthouse score: [Run manually]"
echo ""

# Overall Progress
echo "========================================="
echo "OVERALL PROGRESS"
echo "========================================="

COMPLETED_SPRINTS=0
[ "$SPRINT1_COMPLETE" = true ] && COMPLETED_SPRINTS=$((COMPLETED_SPRINTS + 1))
[ "$SPRINT2_COMPLETE" = true ] && COMPLETED_SPRINTS=$((COMPLETED_SPRINTS + 1))
[ "$SPRINT3_COMPLETE" = true ] && COMPLETED_SPRINTS=$((COMPLETED_SPRINTS + 1))
[ "$SPRINT4_COMPLETE" = true ] && COMPLETED_SPRINTS=$((COMPLETED_SPRINTS + 1))
[ "$SPRINT5_COMPLETE" = true ] && COMPLETED_SPRINTS=$((COMPLETED_SPRINTS + 1))

echo "Sprints Complete: $COMPLETED_SPRINTS/5"
echo ""

# Progress bar
echo -n "Progress: ["
for i in {1..5}; do
    if [ $i -le $COMPLETED_SPRINTS ]; then
        echo -n "████"
    else
        echo -n "    "
    fi
done
echo "] $(( COMPLETED_SPRINTS * 20 ))%"
echo ""

# Tech Debt Score
TECH_DEBT_SCORE=$(( 10 - (COMPLETED_SPRINTS * 2) ))
echo "Tech Debt Score: $TECH_DEBT_SCORE/10"

if [ $TECH_DEBT_SCORE -ge 8 ]; then
    echo -e "${RED}Status: CRITICAL - Immediate action required${NC}"
elif [ $TECH_DEBT_SCORE -ge 6 ]; then
    echo -e "${YELLOW}Status: HIGH - Significant issues remain${NC}"
elif [ $TECH_DEBT_SCORE -ge 4 ]; then
    echo -e "${YELLOW}Status: MEDIUM - Making progress${NC}"
else
    echo -e "${GREEN}Status: GOOD - Nearly production ready${NC}"
fi

echo ""
echo "========================================="
echo "Next Steps:"
if [ "$SPRINT1_COMPLETE" = false ]; then
    echo "• Complete Sprint 1: Fix security issues"
    echo "  Run: bash scripts/verify-sprint-1.sh"
elif [ "$SPRINT2_COMPLETE" = false ]; then
    echo "• Complete Sprint 2: Consolidate services"
    echo "  Target: Reduce from $SERVICE_COUNT to ≤20 services"
elif [ "$SPRINT3_COMPLETE" = false ]; then
    echo "• Complete Sprint 3: Refactor god components"
    echo "  Target: Eliminate $GOD_COUNT components >300 lines"
elif [ "$SPRINT4_COMPLETE" = false ]; then
    echo "• Complete Sprint 4: Type safety & testing"
    echo "  Target: 0 'any' types, 70% test coverage"
elif [ "$SPRINT5_COMPLETE" = false ]; then
    echo "• Complete Sprint 5: Performance optimization"
    echo "  Target: <500KB bundle, >90 Lighthouse"
else
    echo -e "${GREEN}🎉 ALL SPRINTS COMPLETE!${NC}"
    echo "Tech debt has been successfully remediated."
fi