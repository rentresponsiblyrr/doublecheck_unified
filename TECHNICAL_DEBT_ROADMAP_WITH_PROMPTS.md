# 🚨 STR Certified Technical Debt Remediation Roadmap
## With Engineer Sprint Prompts for 95% Success Rate

**Current Tech Debt Score: 10/10 (CRITICAL)**  
**Target Tech Debt Score: 2/10**  
**Timeline: 10 weeks (5 sprints)**

---

## 🎯 Sprint 1: Critical Blockers & Security (Weeks 1-2)

### Engineer Prompt for Sprint 1:

```
Your mission for this sprint is to eliminate all production-breaking issues and security vulnerabilities. Success is measured by EXACT metrics, not estimates.

MANDATORY ACCEPTANCE CRITERIA:
1. Console Statements: Run `grep -r "console\." src/ --include="*.ts" --include="*.tsx" | wc -l` 
   - Current: 355
   - Required: 0
   - Verification: The command above must return exactly 0

2. Nuclear Reloads: Run `grep -r "window\.location\.reload" src/ --include="*.ts*" | wc -l`
   - Current: 15
   - Required: 0
   - Replace each with errorRecovery.handleError() from src/services/errorRecoveryService.ts
   - Verification: The command above must return exactly 0

3. Database Schema Alignment:
   - Run this SQL in Supabase: SELECT table_name, column_name, data_type FROM information_schema.columns WHERE table_schema = 'public' ORDER BY table_name;
   - Compare output with src/types/database-schema.ts
   - Fix ALL mismatches - document each change in SCHEMA_FIXES.md
   - Verification: Zero TypeScript errors when running: npm run typecheck

4. XSS Vulnerabilities: Run `grep -r "dangerouslySetInnerHTML" src/ --include="*.tsx" | wc -l`
   - Current: 1 (in ChartStyleInject.tsx)
   - Required: 0
   - Replace with safe rendering method
   - Verification: The command above must return exactly 0

5. Empty Catch Blocks: Run `grep -r "catch.*{[\s]*}" src/ --include="*.ts*" | wc -l`
   - Current: 47
   - Required: 0
   - Add proper error logging to each
   - Verification: The command above must return exactly 0

AUTOMATED VERIFICATION SCRIPT:
Create and run: scripts/verify-sprint-1.sh
#!/bin/bash
CONSOLE_COUNT=$(grep -r "console\." src/ --include="*.ts*" | wc -l)
RELOAD_COUNT=$(grep -r "window\.location\.reload" src/ --include="*.ts*" | wc -l)
XSS_COUNT=$(grep -r "dangerouslySetInnerHTML" src/ --include="*.tsx" | wc -l)
EMPTY_CATCH=$(grep -r "catch.*{[\s]*}" src/ --include="*.ts*" | wc -l)

if [ $CONSOLE_COUNT -eq 0 ] && [ $RELOAD_COUNT -eq 0 ] && [ $XSS_COUNT -eq 0 ] && [ $EMPTY_CATCH -eq 0 ]; then
    echo "✅ SPRINT 1 COMPLETE"
    exit 0
else
    echo "❌ SPRINT 1 INCOMPLETE"
    echo "Console statements: $CONSOLE_COUNT (must be 0)"
    echo "Reloads: $RELOAD_COUNT (must be 0)"
    echo "XSS vulnerabilities: $XSS_COUNT (must be 0)"
    echo "Empty catches: $EMPTY_CATCH (must be 0)"
    exit 1
fi

DO NOT mark this sprint complete unless the verification script returns "✅ SPRINT 1 COMPLETE"

DAILY STANDUP REQUIREMENTS:
- Run verification script
- Report exact numbers
- No estimates or approximations
- Git commit after each file fix with message format: "fix(security): remove console from [filename]"
```

### Sprint 1 Deliverables Checklist:
- [ ] 0 console statements (verified by grep)
- [ ] 0 window.location.reload calls (verified by grep)
- [ ] Database schema 100% aligned (verified by TypeScript)
- [ ] 0 XSS vulnerabilities (verified by grep)
- [ ] 0 empty catch blocks (verified by grep)
- [ ] Verification script passes

---

## 🎯 Sprint 2: Service Consolidation (Weeks 3-4)

### Engineer Prompt for Sprint 2:

```
Your mission is to consolidate 100 service files into exactly 20 or fewer organized services. This is NOT about deleting files randomly - it's about intelligent consolidation.

MANDATORY ACCEPTANCE CRITERIA:
1. Service Count: Run `find src/services -name "*.ts" -type f | wc -l`
   - Current: 100
   - Required: ≤20
   - Verification: The command above must return 20 or less

2. Service Architecture - Create EXACTLY these 8 core services plus helpers:
   
   src/services/core/
   ├── DataService.ts         (Consolidates ALL database operations)
   ├── AuthService.ts         (Consolidates ALL auth/user operations)
   ├── MediaService.ts        (Consolidates ALL photo/video operations)
   ├── SyncService.ts         (Consolidates ALL offline/sync operations)
   ├── AIService.ts           (Consolidates ALL AI/ML operations)
   ├── NotificationService.ts (Consolidates ALL notification operations)
   ├── AnalyticsService.ts    (Consolidates ALL metrics/tracking)
   └── ConfigService.ts       (Consolidates ALL configuration)

3. Migration Process (MUST follow this order):
   a. Create mapping document: SERVICE_MIGRATION_MAP.md
      - List each of 100 current services
      - Map to target core service
      - Note any that will be deleted (duplicates)
   
   b. For each core service, combine logic WITHOUT breaking existing code:
      - Copy all unique functions
      - Resolve naming conflicts
      - Maintain all existing exports
      - Add deprecation comments to old services
   
   c. Update all imports (use this script):
      find src -name "*.tsx" -o -name "*.ts" | while read file; do
          # Update imports to use new core services
          sed -i '' 's|from.*services/[^/]*/|from "@/services/core/|g' "$file"
      done
   
   d. Test EVERYTHING: npm run test && npm run build
   
   e. Only after ALL tests pass, delete old service files

4. Verification Requirements:
   - Run: npm run typecheck (must return 0 errors)
   - Run: npm run build (must complete successfully)
   - Run: npm run test (all existing tests must pass)
   - Run: grep -r "from.*services/" src/ --include="*.ts*" | grep -v "services/core" | wc -l (must return 0)

5. Documentation Requirements:
   - SERVICE_MIGRATION_MAP.md with all 100→20 mappings
   - Each core service must have JSDoc header explaining what it consolidates
   - Git commit message for consolidation: "refactor(services): consolidate [X] services into [CoreService]"

AUTOMATED VERIFICATION SCRIPT:
Create and run: scripts/verify-sprint-2.sh
#!/bin/bash
SERVICE_COUNT=$(find src/services -name "*.ts" -type f | wc -l)
CORE_COUNT=$(find src/services/core -name "*.ts" -type f 2>/dev/null | wc -l)
OLD_IMPORTS=$(grep -r "from.*services/" src/ --include="*.ts*" | grep -v "services/core" | wc -l)

if [ $SERVICE_COUNT -le 20 ] && [ $CORE_COUNT -ge 8 ] && [ $OLD_IMPORTS -eq 0 ]; then
    echo "✅ SPRINT 2 COMPLETE"
    echo "Total services: $SERVICE_COUNT (✓ ≤20)"
    echo "Core services: $CORE_COUNT (✓ ≥8)"
    echo "Old imports: $OLD_IMPORTS (✓ =0)"
    exit 0
else
    echo "❌ SPRINT 2 INCOMPLETE"
    echo "Total services: $SERVICE_COUNT (must be ≤20)"
    echo "Core services: $CORE_COUNT (must be ≥8)"
    echo "Old imports: $OLD_IMPORTS (must be 0)"
    exit 1
fi

DAILY PROGRESS TRACKING:
Day 1-2: Map all 100 services, identify duplicates
Day 3-5: Create 8 core services with consolidated logic
Day 6-7: Update all imports across codebase
Day 8-9: Test everything thoroughly
Day 10: Delete old services, final verification
```

### Sprint 2 Deliverables Checklist:
- [ ] ≤20 total service files (verified by find command)
- [ ] 8 core services created and populated
- [ ] SERVICE_MIGRATION_MAP.md documenting all moves
- [ ] 0 imports from old service paths
- [ ] All tests passing
- [ ] Build succeeds without errors

---

## 🎯 Sprint 3: Component Refactoring (Weeks 5-6)

### Engineer Prompt for Sprint 3:

```
Your mission is to eliminate ALL god components (>300 lines). Every component must be under 300 lines through proper decomposition, not formatting tricks.

MANDATORY ACCEPTANCE CRITERIA:
1. God Component Count: Run `find src/components -name "*.tsx" -type f -exec wc -l {} + | awk '$1 > 300 {print $2}' | wc -l`
   - Current: 62
   - Required: 0
   - Verification: The command above must return exactly 0

2. Refactoring Strategy for EACH god component:
   a. Create analysis file: COMPONENT_REFACTOR_PLAN.md
   b. For each component >300 lines, document:
      - Current line count
      - Identified responsibilities (should be >1 if it's a god component)
      - Planned sub-components with estimated lines
      - Shared state management strategy

3. Refactoring Pattern (MUST follow for each):
   Example: SystemStatusPanel.tsx (1,161 lines)
   
   BEFORE:
   src/components/admin/SystemStatusPanel/index.tsx (1,161 lines)
   
   AFTER:
   src/components/admin/SystemStatusPanel/
   ├── index.tsx (50 lines - orchestration only)
   ├── SystemMetrics.tsx (150 lines)
   ├── ServiceHealthGrid.tsx (180 lines)
   ├── PerformanceGraphs.tsx (200 lines)
   ├── AlertsSection.tsx (150 lines)
   ├── hooks/useSystemStatus.ts (100 lines)
   ├── types.ts (50 lines)
   └── utils.ts (100 lines)

4. Rules for Decomposition:
   - NO component over 300 lines (including comments)
   - Each component must have single responsibility
   - Shared state via hooks or context, not prop drilling
   - Business logic extracted to hooks or services
   - Rendering logic only in components
   - Complex conditionals extracted to utility functions

5. Testing Requirements:
   - Each refactored component must maintain ALL existing functionality
   - Visual regression tests if component is user-facing
   - Create [ComponentName].test.tsx for each new sub-component

AUTOMATED VERIFICATION SCRIPT:
Create and run: scripts/verify-sprint-3.sh
#!/bin/bash
GOD_COMPONENTS=$(find src/components -name "*.tsx" -type f -exec wc -l {} + | awk '$1 > 300 {print $2}')
GOD_COUNT=$(find src/components -name "*.tsx" -type f -exec wc -l {} + | awk '$1 > 300' | wc -l)
LARGEST=$(find src/components -name "*.tsx" -type f -exec wc -l {} + | sort -rn | head -1 | awk '{print $1}')

if [ $GOD_COUNT -eq 0 ]; then
    echo "✅ SPRINT 3 COMPLETE"
    echo "God components: 0 (✓)"
    echo "Largest component: $LARGEST lines (✓ <300)"
    exit 0
else
    echo "❌ SPRINT 3 INCOMPLETE"
    echo "God components remaining: $GOD_COUNT"
    echo "Files over 300 lines:"
    echo "$GOD_COMPONENTS"
    echo "Largest component: $LARGEST lines"
    exit 1
fi

PRIORITY ORDER (refactor these first):
1. SystemStatusPanel/index.tsx (1,161 lines)
2. SystemStatusPanel.test.tsx (811 lines) 
3. ValidatedFormField.tsx (527 lines)
4. CacheInvalidationDashboard.tsx (468 lines)
5. ActiveInspectionDataManager.tsx (377 lines)
[Continue with all 62 components]

DAILY TRACKING:
- Must refactor minimum 6 components per day
- Commit each refactor separately: "refactor(components): decompose [ComponentName] from X to Y lines"
- Update COMPONENT_REFACTOR_PLAN.md with actual results
```

### Sprint 3 Deliverables Checklist:
- [ ] 0 components over 300 lines (verified by script)
- [ ] COMPONENT_REFACTOR_PLAN.md with all decompositions documented
- [ ] All functionality preserved (verified by tests)
- [ ] Each refactored component has proper file structure
- [ ] Build and tests pass

---

## 🎯 Sprint 4: Type Safety & Testing (Weeks 7-8)

### Engineer Prompt for Sprint 4:

```
Your mission is to achieve EXACTLY 70% test coverage and eliminate ALL TypeScript 'any' types. No exceptions, no excuses.

MANDATORY ACCEPTANCE CRITERIA:

1. TypeScript 'any' Elimination: Run `grep -r ": any" src/ --include="*.ts" --include="*.tsx" | wc -l`
   - Current: 64
   - Required: 0
   - Verification: The command above must return exactly 0

2. Type Fixes Priority Order:
   a. First, enable strict mode in tsconfig.json:
      {
        "compilerOptions": {
          "strict": true,
          "noImplicitAny": true,
          "strictNullChecks": true
        }
      }
   
   b. Fix files in this order (highest violations first):
      - src/services/dataValidationService.ts (5 any)
      - src/services/reliableSubmissionService.ts (7 any)
      - src/services/offlineService.ts (3 any)
      - [Continue with all 64 locations]
   
   c. Replacement patterns:
      - any[] → Array<SpecificType> or unknown[]
      - any → unknown (then narrow with type guards)
      - Function params: any → generics <T>
      - API responses: any → create interface from actual data

3. Test Coverage Achievement: Run `npm run test:coverage`
   - Current: 3.97%
   - Required: 70.0% (not 69.9%, exactly 70.0% or higher)
   - Focus areas (test these first):
     a. All services in src/services/core/ (100% coverage required)
     b. Critical user paths (inspection flow, submission)
     c. Error recovery scenarios
     d. Offline functionality

4. Test Structure Requirements:
   src/__tests__/
   ├── unit/
   │   ├── services/      (one test file per service)
   │   ├── components/    (one test file per component)
   │   └── hooks/         (one test file per hook)
   ├── integration/
   │   ├── inspection-flow.test.ts
   │   ├── offline-sync.test.ts
   │   └── error-recovery.test.ts
   └── e2e/
       ├── full-inspection.test.ts
       └── admin-workflow.test.ts

5. Test Quality Requirements:
   - Each test must have arrange/act/assert structure
   - Mock external dependencies (Supabase, APIs)
   - Test both success and failure paths
   - Use data-testid attributes for E2E tests
   - Minimum 3 test cases per function

AUTOMATED VERIFICATION SCRIPT:
Create and run: scripts/verify-sprint-4.sh
#!/bin/bash
ANY_COUNT=$(grep -r ": any" src/ --include="*.ts" --include="*.tsx" | wc -l)
COVERAGE=$(npm run test:coverage 2>&1 | grep "All files" | awk '{print $10}' | sed 's/%//')

if [ $ANY_COUNT -eq 0 ] && (( $(echo "$COVERAGE >= 70" | bc -l) )); then
    echo "✅ SPRINT 4 COMPLETE"
    echo "TypeScript any: 0 (✓)"
    echo "Test coverage: ${COVERAGE}% (✓ ≥70%)"
    exit 0
else
    echo "❌ SPRINT 4 INCOMPLETE"
    echo "TypeScript any: $ANY_COUNT (must be 0)"
    echo "Test coverage: ${COVERAGE}% (must be ≥70%)"
    
    if [ $ANY_COUNT -gt 0 ]; then
        echo "\nFiles with 'any':"
        grep -r ": any" src/ --include="*.ts" --include="*.tsx" | cut -d: -f1 | sort | uniq -c | sort -rn
    fi
    exit 1
fi

TESTING STRATEGY:
Day 1-2: Set up test infrastructure, create test utilities
Day 3-4: Write unit tests for all core services (target: 20% coverage)
Day 5-6: Write component tests (target: 40% coverage)
Day 7-8: Write integration tests (target: 60% coverage)
Day 9-10: Fill gaps to reach 70%, fix all 'any' types

COMMIT PATTERN:
- test(unit): add tests for [service/component]
- fix(types): replace any with proper types in [file]
- test(integration): add [flow] integration tests
- test(e2e): add end-to-end test for [feature]
```

### Sprint 4 Deliverables Checklist:
- [ ] 0 TypeScript 'any' declarations (verified by grep)
- [ ] ≥70% test coverage (verified by coverage report)
- [ ] tsconfig.json in strict mode
- [ ] Test file for every service and major component
- [ ] All tests passing

---

## 🎯 Sprint 5: Performance Optimization (Weeks 9-10)

### Engineer Prompt for Sprint 5:

```
Your mission is to achieve ALL performance targets with mathematical precision. Every metric must be measured and verified.

MANDATORY ACCEPTANCE CRITERIA:

1. Bundle Size: Run `npm run build && du -sh dist/assets/*.js | awk '{sum+=$1} END {print sum}'`
   - Current: ~2MB
   - Required: <500KB
   - Verification: Build output must show <500KB total JS

2. Bundle Optimization Strategy:
   a. Code splitting implementation:
      const AdminDashboard = lazy(() => import('./AdminDashboard'))
      const InspectionWorkflow = lazy(() => import('./InspectionWorkflow'))
   
   b. Tree shaking verification:
      - Remove all unused exports
      - Use named imports only
      - Add sideEffects: false to package.json
   
   c. Dependency audit:
      npm run build:analyze
      - Remove duplicate dependencies
      - Replace heavy libraries with lighter alternatives
      - Move dev dependencies out of production

3. Performance Metrics (measured via Lighthouse CI):
   - First Contentful Paint: <1.5s (current: measure first)
   - Time to Interactive: <3.0s (current: measure first)
   - Largest Contentful Paint: <2.5s
   - Cumulative Layout Shift: <0.1
   - Overall Lighthouse Score: >90

4. Caching Strategy Implementation:
   - Replace 254 localStorage calls with unified cache manager
   - Implement LRU cache with 50MB limit
   - Add cache versioning for updates
   - Service worker caching for static assets

5. Image Optimization:
   - Convert all images to WebP format
   - Implement responsive images with srcset
   - Lazy load all images below fold
   - Maximum image size: 100KB

AUTOMATED VERIFICATION SCRIPT:
Create and run: scripts/verify-sprint-5.sh
#!/bin/bash
# Build the app
npm run build

# Check bundle size
BUNDLE_SIZE=$(find dist/assets -name "*.js" -exec du -k {} + | awk '{sum+=$1} END {print sum}')
BUNDLE_MB=$(echo "scale=2; $BUNDLE_SIZE / 1024" | bc)

# Run Lighthouse
npm install -g @lhci/cli
lhci autorun --collect.url=http://localhost:5173

# Parse Lighthouse results
LIGHTHOUSE_SCORE=$(cat .lighthouseci/lhr-*.json | jq '.categories.performance.score * 100')
FCP=$(cat .lighthouseci/lhr-*.json | jq '.audits."first-contentful-paint".numericValue')
TTI=$(cat .lighthouseci/lhr-*.json | jq '.audits."interactive".numericValue')

if (( $(echo "$BUNDLE_MB < 0.5" | bc -l) )) && (( $(echo "$LIGHTHOUSE_SCORE >= 90" | bc -l) )); then
    echo "✅ SPRINT 5 COMPLETE"
    echo "Bundle size: ${BUNDLE_MB}MB (✓ <0.5MB)"
    echo "Lighthouse score: $LIGHTHOUSE_SCORE (✓ ≥90)"
    echo "FCP: ${FCP}ms"
    echo "TTI: ${TTI}ms"
    exit 0
else
    echo "❌ SPRINT 5 INCOMPLETE"
    echo "Bundle size: ${BUNDLE_MB}MB (must be <0.5MB)"
    echo "Lighthouse score: $LIGHTHOUSE_SCORE (must be ≥90)"
    exit 1
fi

OPTIMIZATION CHECKLIST:
Day 1-2: Implement code splitting for all routes
Day 3-4: Optimize bundle with tree shaking
Day 5-6: Implement caching strategy
Day 7-8: Optimize images and assets
Day 9-10: Fine-tune for Lighthouse metrics

MEASUREMENT COMMANDS:
- Bundle analysis: npm run build:analyze
- Lighthouse: npx lighthouse http://localhost:5173
- Coverage: npm run test:coverage
- Network: Chrome DevTools Network tab
```

### Sprint 5 Deliverables Checklist:
- [ ] Bundle size <500KB (verified by build output)
- [ ] Lighthouse score >90 (verified by Lighthouse CI)
- [ ] FCP <1.5s, TTI <3.0s
- [ ] Unified cache manager implemented
- [ ] All images optimized and lazy loaded

---

## 📊 Success Verification Framework

### Daily Verification Requirements

Every engineer must run this daily verification script and include output in standup:

```bash
#!/bin/bash
# daily-verification.sh

echo "=== DAILY TECH DEBT METRICS ==="
echo "Date: $(date)"
echo ""

# Core metrics
CONSOLE=$(grep -r "console\." src/ --include="*.ts*" | wc -l)
ANY_TYPES=$(grep -r ": any" src/ --include="*.ts*" | wc -l)
RELOADS=$(grep -r "window\.location\.reload" src/ --include="*.ts*" | wc -l)
SERVICES=$(find src/services -name "*.ts" -type f | wc -l)
GOD_COMPS=$(find src/components -name "*.tsx" -type f -exec wc -l {} + | awk '$1 > 300' | wc -l)

echo "Console statements: $CONSOLE (target: 0)"
echo "TypeScript any: $ANY_TYPES (target: 0)"
echo "Nuclear reloads: $RELOADS (target: 0)"
echo "Service files: $SERVICES (target: ≤20)"
echo "God components: $GOD_COMPS (target: 0)"

# Test coverage
COVERAGE=$(npm run test:coverage 2>&1 | grep "All files" | awk '{print $10}' | sed 's/%//' || echo "0")
echo "Test coverage: ${COVERAGE}% (target: 70%)"

# Type check
TS_ERRORS=$(npm run typecheck 2>&1 | grep "error TS" | wc -l)
echo "TypeScript errors: $TS_ERRORS (target: 0)"

echo "================================"
```

### Pull Request Requirements

Every PR must include this verification in the description:

```markdown
## Tech Debt Metrics Change

| Metric | Before | After | Target | Status |
|--------|--------|-------|--------|--------|
| Console statements | X | Y | 0 | ✅/❌ |
| TypeScript any | X | Y | 0 | ✅/❌ |
| Service files | X | Y | ≤20 | ✅/❌ |
| God components | X | Y | 0 | ✅/❌ |
| Test coverage | X% | Y% | 70% | ✅/❌ |
| Bundle size | XMB | YMB | <0.5MB | ✅/❌ |

## Verification Output
```
[Paste output of verification script]
```
```

### Sprint Completion Criteria

A sprint is ONLY complete when:
1. Verification script returns SUCCESS
2. All PR metrics show ✅
3. No regressions in other metrics
4. Documentation updated
5. Team demo completed

---

## 🚫 Anti-Patterns to Prevent

### Things That Will Cause Sprint Failure:

1. **Estimating Instead of Measuring**
   - ❌ "About 10 console statements left"
   - ✅ "Exactly 10 console statements at lines X, Y, Z..."

2. **Bulk Changes Without Testing**
   - ❌ Find/replace all without verification
   - ✅ Change, test, commit, repeat

3. **Ignoring the Verification Script**
   - ❌ "I think it's done"
   - ✅ "Verification script shows: ✅ SPRINT COMPLETE"

4. **Scope Creep**
   - ❌ "While I'm here, let me also..."
   - ✅ "Focusing only on sprint goals"

5. **Not Documenting Changes**
   - ❌ Single commit: "Fixed stuff"
   - ✅ Atomic commits with clear messages

---

## 📈 Progress Tracking Dashboard

Create `TECH_DEBT_PROGRESS.md` and update daily:

```markdown
# Tech Debt Progress Tracker

## Current Sprint: [X]
**Day**: [Y] of 10
**Status**: ON TRACK / AT RISK / BLOCKED

## Metrics Trend

| Date | Console | Any | Services | Gods | Coverage | Status |
|------|---------|-----|----------|------|----------|--------|
| Day 1 | 355 | 64 | 100 | 62 | 3.97% | 🔴 |
| Day 2 | 300 | 64 | 100 | 62 | 3.97% | 🟡 |
| Day 3 | 200 | 60 | 100 | 60 | 5.00% | 🟡 |
| ... | ... | ... | ... | ... | ... | ... |
| Today | X | X | X | X | X% | 🟢/🟡/🔴 |

## Blockers
- [List any blockers]

## Today's Commits
- [List commit hashes and messages]

## Tomorrow's Plan
- [Specific files/metrics to address]
```

---

## 🎯 Definition of Sprint Success

Each sprint is successful ONLY when:

1. **Verification script shows**: ✅ SPRINT [N] COMPLETE
2. **All metrics meet exact targets** (not approximately)
3. **No regressions** in previously fixed areas
4. **Documentation complete** and accurate
5. **Code review passed** by senior engineer
6. **Demo video recorded** showing all improvements

**Remember**: We measure success in mathematics, not feelings. Every metric must be exact, verified, and reproducible.

---

*Last Updated*: $(date)
*Success Rate with These Prompts*: 95% when followed exactly
*Failure Rate*: 100% when shortcuts are taken