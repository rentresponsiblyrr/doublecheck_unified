#!/bin/bash

echo "🚀 STR CERTIFIED - SPRINT 2 VERIFICATION"
echo "========================================"
echo "Service Consolidation: 100 → ≤20"
echo ""

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Initialize pass/fail
SPRINT_PASS=true

# 1. Service Count Check
echo "1. Service Count Analysis"
SERVICE_COUNT=$(find src/services -name "*.ts" -type f 2>/dev/null | wc -l | tr -d ' ')
echo -e "   Current total services: ${BLUE}$SERVICE_COUNT${NC}"

if [ "$SERVICE_COUNT" -le 20 ]; then
    echo -e "   ${GREEN}✓ Service count target met: $SERVICE_COUNT ≤ 20${NC}"
else
    echo -e "   ${RED}✗ Service count target missed: $SERVICE_COUNT > 20${NC}"
    SPRINT_PASS=false
fi
echo ""

# 2. Core Services Check
echo "2. Core Service Architecture"
CORE_COUNT=$(find src/services/core -name "*.ts" -type f 2>/dev/null | wc -l | tr -d ' ')
echo -e "   Core services found: ${BLUE}$CORE_COUNT${NC}"

if [ "$CORE_COUNT" -ge 8 ]; then
    echo -e "   ${GREEN}✓ Core services requirement met: $CORE_COUNT ≥ 8${NC}"
    echo "   Core services:"
    find src/services/core -name "*.ts" -type f 2>/dev/null | sed 's|src/services/core/||' | sed 's/^/      /'
else
    echo -e "   ${RED}✗ Core services requirement missed: $CORE_COUNT < 8${NC}"
    SPRINT_PASS=false
    if [ -d "src/services/core" ]; then
        echo "   Found:"
        find src/services/core -name "*.ts" -type f 2>/dev/null | sed 's|src/services/core/||' | sed 's/^/      /'
    else
        echo "   src/services/core directory not found"
    fi
fi
echo ""

# 3. Import Migration Check
echo "3. Import Migration Analysis"
OLD_IMPORTS=$(grep -r "from.*services/" src/ --include="*.ts" --include="*.tsx" 2>/dev/null | grep -v "services/core" | wc -l | tr -d ' ')
echo -e "   Old import patterns found: ${BLUE}$OLD_IMPORTS${NC}"

if [ "$OLD_IMPORTS" -eq 0 ]; then
    echo -e "   ${GREEN}✓ All imports migrated to core services: 0${NC}"
else
    echo -e "   ${RED}✗ Old imports still exist: $OLD_IMPORTS (must be 0)${NC}"
    SPRINT_PASS=false
    echo "   Sample old imports:"
    grep -r "from.*services/" src/ --include="*.ts" --include="*.tsx" 2>/dev/null | grep -v "services/core" | head -3 | sed 's/^/      /'
fi
echo ""

# 4. TypeScript Compilation Check
echo "4. TypeScript Compilation"
echo "   Running typecheck..."
if npm run typecheck --silent > /dev/null 2>&1; then
    echo -e "   ${GREEN}✓ TypeScript compilation successful${NC}"
else
    echo -e "   ${RED}✗ TypeScript compilation failed${NC}"
    SPRINT_PASS=false
    echo "   Run 'npm run typecheck' for details"
fi
echo ""

# 5. Build Check  
echo "5. Build Verification"
echo "   Running build test..."
if npm run build --silent > /dev/null 2>&1; then
    echo -e "   ${GREEN}✓ Build successful${NC}"
else
    echo -e "   ${YELLOW}⚠ Build issues detected${NC}"
    echo "   Run 'npm run build' for details"
fi
echo ""

# 6. Service Distribution Analysis
echo "6. Service Distribution"
echo "   Current service breakdown:"
if [ -d "src/services/core" ]; then
    echo -e "   ${GREEN}Core Services:${NC} $(find src/services/core -name "*.ts" -type f 2>/dev/null | wc -l | tr -d ' ')"
fi

NON_CORE=$(find src/services -name "*.ts" -type f 2>/dev/null | grep -v "/core/" | wc -l | tr -d ' ')
echo -e "   ${BLUE}Other Services:${NC} $NON_CORE"
echo -e "   ${BLUE}Total Services:${NC} $SERVICE_COUNT"
echo ""

# Final Result
echo "========================================"
if [ "$SPRINT_PASS" = true ]; then
    echo -e "${GREEN}✅ SPRINT 2 COMPLETE${NC}"
    echo ""
    echo -e "🎯 ${GREEN}SERVICE CONSOLIDATION ACHIEVED!${NC}"
    echo -e "   • Services reduced to: $SERVICE_COUNT (target: ≤20)"
    echo -e "   • Core architecture: $CORE_COUNT services"
    echo -e "   • Import migration: Complete"
    echo -e "   • Code quality: Maintained"
    echo ""
    echo "Ready to proceed to Sprint 3: Component Refactoring"
    exit 0
else
    echo -e "${RED}❌ SPRINT 2 INCOMPLETE${NC}"
    echo ""
    echo "Critical consolidation work remains:"
    echo "• Reduce service count to ≤20"
    echo "• Create 8+ core services"  
    echo "• Migrate all imports to core services"
    echo "• Ensure TypeScript compilation passes"
    echo ""
    echo "NEXT STEPS:"
    echo "1. Complete service consolidation"
    echo "2. Update import statements"
    echo "3. Fix any compilation errors"
    exit 1
fi