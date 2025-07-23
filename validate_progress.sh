#!/bin/bash
# STR Certified Progress Validation Script
echo "=== DAILY PROGRESS VALIDATION ==="
echo "Date: $(date)"
echo "Components: $(find src/components -name '*.tsx' 2>/dev/null | wc -l | tr -d ' ')"
echo "Type violations: $(grep -r ': any' src/ --include='*.ts' --include='*.tsx' 2>/dev/null | wc -l | tr -d ' ')"
echo "God components: $(find src/components -name '*.tsx' -exec wc -l {} + 2>/dev/null | awk '$1 > 300' | wc -l | tr -d ' ')"
echo "TS errors: $(npm run typecheck 2>&1 | grep 'error TS' | wc -l | tr -d ' ')"
echo "=== END VALIDATION ==="
