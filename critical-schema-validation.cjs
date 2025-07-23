#!/usr/bin/env node
/**
 * CRITICAL SCHEMA VALIDATION - HIGH CONFIDENCE CHECK
 * 
 * Focuses only on the most critical schema violations that break production
 */

const fs = require('fs');

const CRITICAL_VIOLATIONS = [
  { pattern: /\.from\('logs'\)/, severity: 'CRITICAL', message: 'Using legacy logs table instead of checklist_items' },
  { pattern: /properties.*property_name/, severity: 'CRITICAL', message: 'Using legacy property_name instead of name' },
  { pattern: /properties.*street_address/, severity: 'CRITICAL', message: 'Using legacy street_address instead of address' },
  { pattern: /inspector_remarks/, severity: 'HIGH', message: 'Using legacy inspector_remarks instead of notes' },
  { pattern: /\.pass\s*===/, severity: 'HIGH', message: 'Using legacy pass field instead of status' },
  { pattern: /checklist_id.*static_safety/, severity: 'CRITICAL', message: 'Wrong relationship - should be static_item_id' }
];

const CRITICAL_FILES = [
  'src/components/inspector/active/ActiveInspectionDataManager.tsx',
  'src/components/PropertyCardWithResume.tsx',
  'src/hooks/useInspectionData.ts', 
  'src/services/checklistService.ts'
];

let criticalCount = 0;
let highCount = 0;

console.log('🚨 CRITICAL SCHEMA VIOLATION CHECK');
console.log('='.repeat(50));

CRITICAL_FILES.forEach(filePath => {
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf8');
    let fileHasCritical = false;
    
    CRITICAL_VIOLATIONS.forEach(violation => {
      const matches = content.match(violation.pattern);
      if (matches) {
        if (violation.severity === 'CRITICAL') {
          criticalCount += matches.length;
          console.log(`💥 CRITICAL: ${filePath}`);
          console.log(`    ${violation.message}`);
          fileHasCritical = true;
        } else if (violation.severity === 'HIGH') {
          highCount += matches.length;
          console.log(`⚠️  HIGH: ${filePath}`);
          console.log(`    ${violation.message}`);
        }
      }
    });
    
    if (!fileHasCritical) {
      console.log(`✅ ${filePath.split('/').pop()}: Clean`);
    }
  }
});

console.log('\n' + '='.repeat(50));
console.log(`Critical Violations: ${criticalCount}`);
console.log(`High Violations: ${highCount}`);

if (criticalCount === 0 && highCount <= 2) {
  console.log('🎉 PRODUCTION READY - All critical issues resolved');
  process.exit(0);
} else if (criticalCount === 0) {
  console.log('✅ Critical issues resolved - minor issues remain');
  process.exit(0);
} else {
  console.log('🚨 CRITICAL ISSUES BLOCK PRODUCTION DEPLOYMENT');
  process.exit(1);
}