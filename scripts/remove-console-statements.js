#!/usr/bin/env node

/**
 * Script to remove console.* statements from production code
 * Replaces them with proper logger calls
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Configuration
const config = {
  rootDir: path.join(__dirname, '../src'),
  extensions: ['ts', 'tsx'],
  excludeDirs: ['__tests__', '__mocks__', 'test'],
  dryRun: process.argv.includes('--dry-run'),
  verbose: process.argv.includes('--verbose'),
  stats: {
    totalFiles: 0,
    filesModified: 0,
    consolesRemoved: 0,
    consolesByType: {}
  }
};

// Console statement patterns
const consolePatterns = [
  /console\.(log|warn|error|info|debug|trace|group|groupEnd|time|timeEnd|table|assert|count|dir|dirxml|profile|profileEnd)\s*\(/g,
  /console\.\w+/g
];

// Logger import statement
const loggerImport = "import { logger } from '@/utils/logger';";

// Console to logger mapping
const consoleToLogger = {
  'console.log': 'logger.info',
  'console.warn': 'logger.warn',
  'console.error': 'logger.error',
  'console.info': 'logger.info',
  'console.debug': 'logger.debug',
  'console.trace': 'logger.debug',
  'console.table': 'logger.info',
  'console.dir': 'logger.debug',
  'console.time': '// Timer:',
  'console.timeEnd': '// Timer end:',
  'console.group': '// Group:',
  'console.groupEnd': '// Group end:',
  'console.assert': '// Assert:',
  'console.count': '// Count:',
  'console.profile': '// Profile:',
  'console.profileEnd': '// Profile end:'
};

/**
 * Process a single file
 */
function processFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  let modified = content;
  let hasChanges = false;
  let needsLoggerImport = false;
  
  // Track console statements in this file
  const fileConsoles = [];
  
  // Find all console statements
  consolePatterns.forEach(pattern => {
    const matches = content.match(pattern);
    if (matches) {
      matches.forEach(match => {
        fileConsoles.push(match);
        const consoleType = match.split('(')[0];
        config.stats.consolesByType[consoleType] = (config.stats.consolesByType[consoleType] || 0) + 1;
      });
    }
  });
  
  if (fileConsoles.length === 0) {
    return false;
  }
  
  if (config.verbose) {
    console.log(`\n📁 ${filePath}`);
    console.log(`   Found ${fileConsoles.length} console statements`);
  }
  
  // Replace console statements
  Object.keys(consoleToLogger).forEach(consoleMethod => {
    const loggerMethod = consoleToLogger[consoleMethod];
    const regex = new RegExp(consoleMethod.replace('.', '\\.') + '\\s*\\(', 'g');
    
    if (modified.match(regex)) {
      hasChanges = true;
      
      if (loggerMethod.startsWith('logger.')) {
        needsLoggerImport = true;
        modified = modified.replace(regex, loggerMethod + '(');
      } else {
        // Comment out timer/profiling statements
        modified = modified.replace(regex, loggerMethod + ' ');
      }
    }
  });
  
  // Remove standalone console statements (e.g., console.log without parentheses)
  modified = modified.replace(/^\s*console\.\w+\s*$/gm, '// Removed console statement');
  
  // Add logger import if needed and not already present
  if (needsLoggerImport && !modified.includes(loggerImport)) {
    // Add after other imports
    const importMatch = modified.match(/^import .* from .*;$/m);
    if (importMatch) {
      const lastImportIndex = modified.lastIndexOf(importMatch[0]);
      modified = modified.slice(0, lastImportIndex + importMatch[0].length) + 
                 '\n' + loggerImport + 
                 modified.slice(lastImportIndex + importMatch[0].length);
    } else {
      // Add at the beginning of the file
      modified = loggerImport + '\n\n' + modified;
    }
  }
  
  // Write changes if not in dry-run mode
  if (hasChanges && !config.dryRun) {
    fs.writeFileSync(filePath, modified, 'utf8');
    config.stats.filesModified++;
    config.stats.consolesRemoved += fileConsoles.length;
    
    if (config.verbose) {
      console.log('   ✅ File updated');
    }
  } else if (hasChanges && config.dryRun) {
    if (config.verbose) {
      console.log('   🔍 Would update (dry-run mode)');
    }
  }
  
  return hasChanges;
}

/**
 * Get all TypeScript files
 */
function getAllFiles() {
  const patterns = config.extensions.map(ext => 
    `${config.rootDir}/**/*.${ext}`
  );
  
  let files = [];
  patterns.forEach(pattern => {
    files = files.concat(glob.sync(pattern, {
      ignore: config.excludeDirs.map(dir => `**/${dir}/**`)
    }));
  });
  
  return files;
}

/**
 * Main execution
 */
function main() {
  console.log('🧹 Console Statement Removal Tool');
  console.log('==================================');
  
  if (config.dryRun) {
    console.log('🔍 Running in DRY-RUN mode (no files will be modified)');
  }
  
  const files = getAllFiles();
  config.stats.totalFiles = files.length;
  
  console.log(`\n📊 Found ${files.length} TypeScript files to process`);
  
  // Process each file
  files.forEach(file => {
    processFile(file);
  });
  
  // Display statistics
  console.log('\n📈 Results:');
  console.log('===========');
  console.log(`Total files scanned: ${config.stats.totalFiles}`);
  console.log(`Files modified: ${config.stats.filesModified}`);
  console.log(`Console statements removed: ${config.stats.consolesRemoved}`);
  
  if (Object.keys(config.stats.consolesByType).length > 0) {
    console.log('\nConsole statements by type:');
    Object.entries(config.stats.consolesByType)
      .sort((a, b) => b[1] - a[1])
      .forEach(([type, count]) => {
        console.log(`  ${type}: ${count}`);
      });
  }
  
  if (config.dryRun) {
    console.log('\n⚠️  This was a dry run. Use without --dry-run flag to apply changes.');
  } else if (config.stats.filesModified > 0) {
    console.log('\n✅ Console statements have been removed successfully!');
    console.log('📝 Please review the changes and test your application.');
  } else {
    console.log('\n✨ No console statements found. Your code is clean!');
  }
}

// Run the script
main();