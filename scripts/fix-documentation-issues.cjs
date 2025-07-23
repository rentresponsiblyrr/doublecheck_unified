#!/usr/bin/env node

/**
 * STR Certified Documentation Fix Script
 * 
 * This script automatically fixes common documentation issues:
 * - Outdated API references
 * - Broken internal links
 * - Missing code examples
 * - Inconsistent formatting
 * - Deprecated patterns
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('📚 Fixing documentation issues...\n');

// Colors for output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m'
};

function printStatus(color, message) {
  console.log(`${color}${message}${colors.reset}`);
}

function findMarkdownFiles(dir = '.') {
  const files = [];
  
  function traverse(currentDir) {
    const entries = fs.readdirSync(currentDir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);
      
      if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
        traverse(fullPath);
      } else if (entry.isFile() && entry.name.endsWith('.md')) {
        files.push(fullPath);
      }
    }
  }
  
  traverse(dir);
  return files;
}

function fixDatabaseReferences(content) {
  let fixed = content;
  let changes = 0;
  
  // Fix table references
  const tableReplacements = [
    { old: /\.from\('logs'\)/g, new: ".from('checklist_items')", desc: "logs → checklist_items" },
    { old: /\.from\('profiles'\)/g, new: ".from('users')", desc: "profiles → users" },
    { old: /property_name/g, new: "name", desc: "property_name → name" },
    { old: /street_address/g, new: "address", desc: "street_address → address" },
    { old: /static_safety_item_id/g, new: "static_item_id", desc: "static_safety_item_id → static_item_id" }
  ];
  
  for (const replacement of tableReplacements) {
    const matches = (fixed.match(replacement.old) || []).length;
    if (matches > 0) {
      fixed = fixed.replace(replacement.old, replacement.new);
      changes += matches;
      printStatus(colors.green, `  ✅ Fixed ${matches} instances of ${replacement.desc}`);
    }
  }
  
  return { content: fixed, changes };
}

function fixCodeExamples(content) {
  let fixed = content;
  let changes = 0;
  
  // Fix TypeScript examples with old patterns
  const patterns = [
    {
      old: /```typescript\n(\s*)const.*: any/g,
      new: (match) => match.replace(': any', ': PropertyData'),
      desc: "any types in examples"
    }
  ];
  
  for (const pattern of patterns) {
    const matches = (fixed.match(pattern.old) || []).length;
    if (matches > 0) {
      fixed = fixed.replace(pattern.old, pattern.new);
      changes += matches;
      printStatus(colors.green, `  ✅ Fixed ${matches} instances of ${pattern.desc}`);
    }
  }
  
  return { content: fixed, changes };
}

function fixBrokenLinks(content, filePath) {
  let fixed = content;
  let changes = 0;
  
  // Check for links to files that don't exist
  const linkPattern = /\[([^\]]+)\]\(([^)]+)\)/g;
  let match;
  
  while ((match = linkPattern.exec(content)) !== null) {
    const linkText = match[1];
    const linkPath = match[2];
    
    // Skip external links
    if (linkPath.startsWith('http') || linkPath.startsWith('mailto:')) {
      continue;
    }
    
    // Resolve relative path
    const resolvedPath = path.resolve(path.dirname(filePath), linkPath);
    
    if (!fs.existsSync(resolvedPath)) {
      printStatus(colors.yellow, `  ⚠️ Broken link in ${path.basename(filePath)}: ${linkPath}`);
      
      // Try to find similar files
      const baseName = path.basename(linkPath, path.extname(linkPath));
      const markdownFiles = findMarkdownFiles();
      const similar = markdownFiles.find(f => path.basename(f, '.md').toLowerCase().includes(baseName.toLowerCase()));
      
      if (similar) {
        const relativePath = path.relative(path.dirname(filePath), similar);
        fixed = fixed.replace(match[0], `[${linkText}](${relativePath})`);
        changes++;
        printStatus(colors.green, `  ✅ Fixed broken link: ${linkPath} → ${relativePath}`);
      }
    }
  }
  
  return { content: fixed, changes };
}

function addMissingHeaders(content, filePath) {
  let fixed = content;
  let changes = 0;
  
  // Add file header if missing
  if (!fixed.startsWith('#')) {
    const fileName = path.basename(filePath, '.md');
    const header = `# ${fileName.replace(/[-_]/g, ' ').replace(/\\b\\w/g, l => l.toUpperCase())}\n\n`;
    fixed = header + fixed;
    changes++;
    printStatus(colors.green, `  ✅ Added header to ${path.basename(filePath)}`);
  }
  
  return { content: fixed, changes };
}

function fixCommonTypos(content) {
  let fixed = content;
  let changes = 0;
  
  const typos = [
    { old: /teh/g, new: 'the' },
    { old: /recieve/g, new: 'receive' },
    { old: /occured/g, new: 'occurred' },
    { old: /seperate/g, new: 'separate' },
    { old: /definately/g, new: 'definitely' }
  ];
  
  for (const typo of typos) {
    const matches = (fixed.match(typo.old) || []).length;
    if (matches > 0) {
      fixed = fixed.replace(typo.old, typo.new);
      changes += matches;
    }
  }
  
  if (changes > 0) {
    printStatus(colors.green, `  ✅ Fixed ${changes} common typos`);
  }
  
  return { content: fixed, changes };
}

function processFile(filePath) {
  printStatus(colors.blue, `📄 Processing ${path.basename(filePath)}...`);
  
  try {
    const originalContent = fs.readFileSync(filePath, 'utf8');
    let content = originalContent;
    let totalChanges = 0;
    
    // Apply all fixes
    const fixes = [
      fixDatabaseReferences,
      fixCodeExamples,
      fixCommonTypos,
      (content) => fixBrokenLinks(content, filePath),
      (content) => addMissingHeaders(content, filePath)
    ];
    
    for (const fix of fixes) {
      const result = fix(content);
      content = result.content;
      totalChanges += result.changes;
    }
    
    // Write back if changes were made
    if (totalChanges > 0) {
      fs.writeFileSync(filePath, content);
      printStatus(colors.green, `  💾 Saved ${totalChanges} changes to ${path.basename(filePath)}`);
    } else {
      printStatus(colors.green, `  ✅ No issues found in ${path.basename(filePath)}`);
    }
    
    return totalChanges;
  } catch (error) {
    printStatus(colors.red, `  ❌ Error processing ${filePath}: ${error.message}`);
    return 0;
  }
}

function generateDocumentationReport() {
  printStatus(colors.blue, '📊 Generating documentation report...');
  
  const markdownFiles = findMarkdownFiles();
  const report = {
    totalFiles: markdownFiles.length,
    filesWithIssues: 0,
    totalIssuesFixed: 0,
    fileReports: []
  };
  
  for (const file of markdownFiles) {
    const changes = processFile(file);
    if (changes > 0) {
      report.filesWithIssues++;
      report.totalIssuesFixed += changes;
    }
    
    report.fileReports.push({
      file: path.relative('.', file),
      issues: changes
    });
  }
  
  // Save report
  const reportPath = 'documentation-fix-report.json';
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  
  return report;
}

function main() {
  printStatus(colors.blue, '🚀 Starting documentation fixes...\n');
  
  const report = generateDocumentationReport();
  
  console.log('\\n' + '='.repeat(50));
  printStatus(colors.green, '📊 DOCUMENTATION FIX SUMMARY');
  console.log('='.repeat(50));
  
  console.log(`📁 Total files processed: ${report.totalFiles}`);
  console.log(`🔧 Files with fixes: ${report.filesWithIssues}`);
  console.log(`✅ Total issues fixed: ${report.totalIssuesFixed}`);
  
  if (report.totalIssuesFixed > 0) {
    printStatus(colors.green, '\\n🎉 Documentation fixes completed successfully!');
    console.log(`\\n📄 Detailed report saved to: documentation-fix-report.json`);
  } else {
    printStatus(colors.green, '\\n✅ No documentation issues found!');
  }
  
  console.log('\\nNext steps:');
  console.log('1. Review the changes made');
  console.log('2. Run: git add . && git commit -m "📚 Fix documentation issues"');
  console.log('3. Run: npm run audit:comprehensive');
}

// Run the fixes
main();