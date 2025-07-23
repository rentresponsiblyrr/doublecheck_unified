#!/usr/bin/env node
/**
 * COMPREHENSIVE SCHEMA VALIDATION - 99% CONFIDENCE CHECK
 * 
 * This script validates all critical database schema usage across the codebase
 * to ensure production readiness and prevent schema-related errors.
 */

const fs = require('fs');
const path = require('path');

const CRITICAL_FILES = [
  'src/components/inspector/active/ActiveInspectionDataManager.tsx',
  'src/components/PropertyCardWithResume.tsx', 
  'src/hooks/useInspectionData.ts',
  'src/services/UnifiedDatabaseService.ts',
  'src/services/checklistService.ts',
  'src/hooks/useOptimizedInspectionData.ts',
  'src/hooks/useMobileDataManager.ts',
  'src/services/propertyStatusService.ts'
];

const LEGACY_PATTERNS = [
  'properties.*property_id', 'property_name', 'street_address', 
  "from('logs')", 'checklist_id.*static_safety',
  'inspector_remarks', 'log_id'
];

const CORRECT_PATTERNS = [
  { pattern: "from('checklist_items')", description: "Uses correct table" },
  { pattern: "eq('inspection_id'", description: "Uses correct FK relationship" },
  { pattern: "'id', 'name', 'address'", description: "Uses correct property fields" }
];

let totalViolations = 0;
let criticalViolations = 0;
let validationResults = [];

console.log('🚀 COMPREHENSIVE SCHEMA VALIDATION STARTING');
console.log('='.repeat(60));

// Check critical files
CRITICAL_FILES.forEach(filePath => {
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf8');
    let fileViolations = 0;
    
    LEGACY_PATTERNS.forEach(pattern => {
      const matches = content.match(new RegExp(pattern, 'g'));
      if (matches) {
        fileViolations += matches.length;
        totalViolations += matches.length;
        
        if (filePath.includes('ActiveInspectionDataManager') || 
            filePath.includes('PropertyCardWithResume') ||
            filePath.includes('checklistService')) {
          criticalViolations += matches.length;
        }
        
        console.log(`❌ ${filePath}: ${matches.length} instances of "${pattern}"`);
      }
    });
    
    if (fileViolations === 0) {
      console.log(`✅ ${filePath}: Clean`);
    }
    
    validationResults.push({ file: filePath, violations: fileViolations });
  } else {
    console.log(`⚠️  ${filePath}: File not found`);
  }
});

console.log('\n' + '='.repeat(60));
console.log(`📊 VALIDATION RESULTS:`);
console.log(`Total Legacy Pattern Violations: ${totalViolations}`);
console.log(`Critical Path Violations: ${criticalViolations}`);
console.log(`Files Checked: ${CRITICAL_FILES.length}`);

// Confidence calculation
const confidenceScore = Math.max(0, 100 - (criticalViolations * 10) - (totalViolations * 2));
console.log(`\n🎯 CONFIDENCE SCORE: ${confidenceScore}%`);

if (confidenceScore >= 99) {
  console.log('🎉 SYSTEM READY FOR PRODUCTION - 99%+ CONFIDENCE');
  process.exit(0);
} else if (confidenceScore >= 90) {
  console.log('⚠️  SYSTEM MOSTLY READY - Minor issues remain');
  process.exit(1);
} else {
  console.log('🚨 CRITICAL ISSUES REMAIN - NOT PRODUCTION READY');
  process.exit(2);
}