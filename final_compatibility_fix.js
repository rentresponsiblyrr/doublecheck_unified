#!/usr/bin/env node

import { readFileSync, writeFileSync } from 'fs';
import { globSync } from 'glob';

console.log('🚨 FINAL COMPATIBILITY LAYER CLEANUP');
console.log('=====================================\n');

// Get all TypeScript files that might have references
const allFiles = globSync('src/**/*.{ts,tsx}', { 
  ignore: ['src/**/*.d.ts', 'src/**/*.test.ts', 'src/**/*.spec.ts'] 
});

let totalFiles = 0;
let totalReplacements = 0;
const filesToFix = [];

console.log(`📁 Scanning ${allFiles.length} files for compatibility references...\n`);

for (const filePath of allFiles) {
  try {
    const content = readFileSync(filePath, 'utf8');
    let modified = content;
    let replacements = 0;

    // Track what we're replacing
    const replacementLog = [];

    // Replace inspection_checklist_items with logs (most critical)
    const inspectionChecklistItems = modified.match(/inspection_checklist_items/g);
    if (inspectionChecklistItems) {
      modified = modified.replace(/inspection_checklist_items/g, 'logs');
      replacements += inspectionChecklistItems.length;
      replacementLog.push(`${inspectionChecklistItems.length} inspection_checklist_items → logs`);
    }

    // Replace properties_fixed with properties
    const propertiesFixed = modified.match(/properties_fixed/g);
    if (propertiesFixed) {
      modified = modified.replace(/properties_fixed/g, 'properties');
      replacements += propertiesFixed.length;
      replacementLog.push(`${propertiesFixed.length} properties_fixed → properties`);
    }

    // Replace inspections_fixed with inspections
    const inspectionsFixed = modified.match(/inspections_fixed/g);
    if (inspectionsFixed) {
      modified = modified.replace(/inspections_fixed/g, 'inspections');
      replacements += inspectionsFixed.length;
      replacementLog.push(`${inspectionsFixed.length} inspections_fixed → inspections`);
    }

    // Replace users! with profiles! (for table relationships)
    const usersTable = modified.match(/users!/g);
    if (usersTable) {
      modified = modified.replace(/users!/g, 'profiles!');
      replacements += usersTable.length;
      replacementLog.push(`${usersTable.length} users! → profiles!`);
    }

    // Replace checklist_items_compat with static_safety_items
    const checklistCompat = modified.match(/checklist_items_compat/g);
    if (checklistCompat) {
      modified = modified.replace(/checklist_items_compat/g, 'static_safety_items');
      replacements += checklistCompat.length;
      replacementLog.push(`${checklistCompat.length} checklist_items_compat → static_safety_items`);
    }

    if (replacements > 0) {
      writeFileSync(filePath, modified, 'utf8');
      console.log(`✅ ${filePath}`);
      replacementLog.forEach(log => console.log(`   📋 ${log}`));
      console.log(`   🔧 Total: ${replacements} replacements\n`);
      
      totalFiles++;
      totalReplacements += replacements;
      filesToFix.push({
        file: filePath,
        replacements: replacements,
        details: replacementLog
      });
    }

  } catch (error) {
    console.error(`❌ ${filePath}: Error - ${error.message}`);
  }
}

console.log(`\n🎯 FINAL CLEANUP COMPLETE:`);
console.log(`   📁 Files modified: ${totalFiles}`);
console.log(`   🔧 Total replacements: ${totalReplacements}`);

if (totalFiles > 0) {
  console.log(`\n⚠️  CRITICAL: ${totalFiles} files still had compatibility references!`);
  console.log(`   These have now been fixed, but this shows our previous cleanup missed some files.`);
} else {
  console.log(`\n✅ PERFECT: No remaining compatibility references found!`);
}

// Clean up the test file
try {
  const fs = await import('fs');
  fs.unlinkSync('final_compatibility_check.js');
  console.log(`\n🧹 Cleaned up temporary files`);
} catch (e) {
  // File already deleted or doesn't exist
}

console.log(`\n🚀 Ready for database cleanup!`);