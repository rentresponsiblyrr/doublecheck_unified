#!/bin/bash

# Tech Debt Scanner Script
# Finds and reports on technical debt in the codebase

echo "🔍 STR Certified Tech Debt Scanner"
echo "=================================="
echo ""

# Colors for output
RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
NC='\033[0m' # No Color

# Directories to scan
SRC_DIR="src"
RESULTS_FILE="tech-debt-report-$(date +%Y%m%d-%H%M%S).md"

# Initialize report
echo "# Technical Debt Report" > $RESULTS_FILE
echo "Generated: $(date)" >> $RESULTS_FILE
echo "" >> $RESULTS_FILE

# Function to count occurrences
count_pattern() {
    local pattern=$1
    local file_pattern=$2
    local count=$(grep -r "$pattern" $SRC_DIR --include="$file_pattern" 2>/dev/null | wc -l)
    echo $count
}

# Function to find files
find_files_with_pattern() {
    local pattern=$1
    local file_pattern=$2
    grep -r "$pattern" $SRC_DIR --include="$file_pattern" -l 2>/dev/null
}

echo "## 1. Console Statements Analysis"
echo "## Console Statements" >> $RESULTS_FILE
console_count=$(count_pattern "console\." "*.ts*")
echo -e "${RED}Found: $console_count console statements${NC}"
echo "- Total: $console_count" >> $RESULTS_FILE
echo "" >> $RESULTS_FILE

echo ""
echo "## 2. TypeScript 'any' Types"
echo "## TypeScript 'any' Types" >> $RESULTS_FILE
any_count=$(count_pattern ": any" "*.ts*")
echo -e "${YELLOW}Found: $any_count 'any' type declarations${NC}"
echo "- Total: $any_count" >> $RESULTS_FILE

# List files with most any types
echo "### Files with most 'any' types:" >> $RESULTS_FILE
grep -r ": any" $SRC_DIR --include="*.ts*" 2>/dev/null | cut -d: -f1 | sort | uniq -c | sort -rn | head -10 >> $RESULTS_FILE
echo "" >> $RESULTS_FILE

echo ""
echo "## 3. Nuclear Reloads (window.location.reload)"
echo "## Nuclear Reloads" >> $RESULTS_FILE
reload_count=$(count_pattern "window\.location\.reload" "*.ts*")
echo -e "${RED}Found: $reload_count window.location.reload() calls${NC}"
echo "- Total: $reload_count" >> $RESULTS_FILE
echo "### Files:" >> $RESULTS_FILE
find_files_with_pattern "window\.location\.reload" "*.ts*" >> $RESULTS_FILE
echo "" >> $RESULTS_FILE

echo ""
echo "## 4. God Components (>300 lines)"
echo "## God Components" >> $RESULTS_FILE
echo "### Components over 300 lines:" >> $RESULTS_FILE
god_components=0
for file in $(find $SRC_DIR/components -name "*.tsx" -type f); do
    lines=$(wc -l < "$file")
    if [ $lines -gt 300 ]; then
        echo "- $file: $lines lines" >> $RESULTS_FILE
        ((god_components++))
    fi
done
echo -e "${YELLOW}Found: $god_components components over 300 lines${NC}"
echo "" >> $RESULTS_FILE

echo ""
echo "## 5. Service Files Count"
echo "## Service Files" >> $RESULTS_FILE
service_count=$(find $SRC_DIR/services -name "*.ts" -type f | wc -l)
echo -e "${RED}Found: $service_count service files${NC}"
echo "- Total service files: $service_count" >> $RESULTS_FILE
echo "" >> $RESULTS_FILE

echo ""
echo "## 6. Test Coverage"
echo "## Test Coverage" >> $RESULTS_FILE
test_files=$(find $SRC_DIR -name "*.test.ts*" -o -name "*.spec.ts*" | wc -l)
total_files=$(find $SRC_DIR -name "*.ts*" | wc -l)
non_test_files=$((total_files - test_files))
coverage_ratio=$(echo "scale=2; $test_files * 100 / $non_test_files" | bc)
echo -e "${RED}Test Coverage: ${coverage_ratio}% (${test_files} test files for ${non_test_files} source files)${NC}"
echo "- Test files: $test_files" >> $RESULTS_FILE
echo "- Source files: $non_test_files" >> $RESULTS_FILE
echo "- Coverage ratio: ${coverage_ratio}%" >> $RESULTS_FILE
echo "" >> $RESULTS_FILE

echo ""
echo "## 7. TODO/FIXME Comments"
echo "## TODO/FIXME Comments" >> $RESULTS_FILE
todo_count=$(count_pattern "TODO\|FIXME\|HACK\|XXX" "*.ts*")
echo -e "${YELLOW}Found: $todo_count TODO/FIXME comments${NC}"
echo "- Total: $todo_count" >> $RESULTS_FILE
echo "" >> $RESULTS_FILE

echo ""
echo "## 8. Deprecated Code"
echo "## Deprecated Code" >> $RESULTS_FILE
deprecated_count=$(count_pattern "@deprecated\|DEPRECATED" "*.ts*")
echo -e "${YELLOW}Found: $deprecated_count deprecated markers${NC}"
echo "- Total: $deprecated_count" >> $RESULTS_FILE
echo "" >> $RESULTS_FILE

echo ""
echo "## 9. localStorage/sessionStorage Usage"
echo "## Browser Storage Usage" >> $RESULTS_FILE
local_storage=$(count_pattern "localStorage\|sessionStorage" "*.ts*")
echo -e "${YELLOW}Found: $local_storage localStorage/sessionStorage calls${NC}"
echo "- Total: $local_storage" >> $RESULTS_FILE
echo "" >> $RESULTS_FILE

echo ""
echo "## 10. Error Handling Issues"
echo "## Error Handling" >> $RESULTS_FILE
empty_catch=$(grep -r "catch.*{[\s]*}" $SRC_DIR --include="*.ts*" 2>/dev/null | wc -l)
echo -e "${RED}Found: $empty_catch empty catch blocks${NC}"
echo "- Empty catch blocks: $empty_catch" >> $RESULTS_FILE
echo "" >> $RESULTS_FILE

# Calculate tech debt score
echo "## Tech Debt Score Calculation" >> $RESULTS_FILE
echo "" >> $RESULTS_FILE

score=0
# Scoring logic
if [ $console_count -gt 100 ]; then score=$((score + 2)); else score=$((score + 1)); fi
if [ $any_count -gt 50 ]; then score=$((score + 2)); else score=$((score + 1)); fi
if [ $reload_count -gt 10 ]; then score=$((score + 2)); else score=$((score + 1)); fi
if [ $god_components -gt 5 ]; then score=$((score + 2)); else score=$((score + 1)); fi
if [ $service_count -gt 50 ]; then score=$((score + 2)); else score=$((score + 1)); fi

echo ""
echo "======================================"
echo -e "${RED}Tech Debt Score: $score/10${NC}"
echo "Tech Debt Score: **$score/10**" >> $RESULTS_FILE
echo "" >> $RESULTS_FILE

# Provide recommendations based on score
echo "## Recommendations" >> $RESULTS_FILE
if [ $score -ge 8 ]; then
    echo -e "${RED}⚠️  CRITICAL: Immediate refactoring required${NC}"
    echo "**CRITICAL**: Immediate refactoring required before production" >> $RESULTS_FILE
elif [ $score -ge 6 ]; then
    echo -e "${YELLOW}⚠️  HIGH: Significant technical debt${NC}"
    echo "**HIGH**: Significant technical debt that needs addressing" >> $RESULTS_FILE
elif [ $score -ge 4 ]; then
    echo -e "${YELLOW}MEDIUM: Moderate technical debt${NC}"
    echo "**MEDIUM**: Moderate technical debt, plan for refactoring" >> $RESULTS_FILE
else
    echo -e "${GREEN}LOW: Acceptable technical debt${NC}"
    echo "**LOW**: Technical debt is at acceptable levels" >> $RESULTS_FILE
fi

echo ""
echo "Full report saved to: $RESULTS_FILE"
echo ""
echo "Run cleanup scripts:"
echo "  npm run cleanup:console    - Remove console statements"
echo "  npm run cleanup:any        - Fix TypeScript any types"
echo "  npm run cleanup:services   - Consolidate services"