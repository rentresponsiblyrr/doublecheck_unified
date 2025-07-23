#!/usr/bin/env node
/**
 * MARKDOWN DOCUMENTATION CONSISTENCY AUDITOR
 * 
 * Audits all 2,626+ markdown files for outdated information,
 * schema references, and consistency with current implementation.
 */

const fs = require('fs');
const path = require('path');

const OUTDATED_PATTERNS = [
  {
    pattern: /logs.*table|\.from\(['"]logs['"]\)/gi,
    severity: 'CRITICAL',
    message: 'References legacy logs table - should be checklist_items',
    replacement: 'checklist_items table / .from(\'checklist_items\')'
  },
  {
    pattern: /property_name|street_address/gi,
    severity: 'CRITICAL', 
    message: 'References legacy property field names',
    replacement: 'name (for property_name), address (for street_address)'
  },
  {
    pattern: /property_id.*integer|property_id.*number/gi,
    severity: 'HIGH',
    message: 'Documents property_id as integer - now UUID string',
    replacement: 'property_id: UUID string'
  },
  {
    pattern: /Phase\s*1.*completion|Phase\s*1.*complete/gi,
    severity: 'MEDIUM',
    message: 'References outdated Phase 1 completion claims',
    replacement: 'Updated implementation status'
  },
  {
    pattern: /99%.*confidence.*achieved/gi,
    severity: 'LOW',
    message: 'May reference outdated confidence claims',
    replacement: 'Current system status'
  }
];

class MarkdownAuditor {
  constructor() {
    this.violations = { critical: 0, high: 0, medium: 0, low: 0, total: 0 };
    this.filesScanned = 0;
    this.filesWithViolations = 0;
    this.violationsByFile = new Map();
  }

  auditFile(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const violations = [];
      
      OUTDATED_PATTERNS.forEach(pattern => {
        const matches = [...content.matchAll(pattern.pattern)];
        if (matches.length > 0) {
          violations.push({
            pattern: pattern.pattern.source,
            severity: pattern.severity,
            message: pattern.message,
            replacement: pattern.replacement,
            count: matches.length,
            matches: matches.slice(0, 3).map(m => ({
              text: m[0],
              line: this.getLineNumber(content, m.index)
            }))
          });
          
          this.violations[pattern.severity.toLowerCase()] += matches.length;
          this.violations.total += matches.length;
        }
      });
      
      if (violations.length > 0) {
        this.violationsByFile.set(filePath, violations);
        this.filesWithViolations++;
      }
      
      this.filesScanned++;
      return violations;
    } catch (error) {
      console.error(`Error reading ${filePath}:`, error.message);
      return [];
    }
  }

  getLineNumber(content, index) {
    return content.substring(0, index).split('\n').length;
  }

  auditDirectory(dirPath = '.') {
    const findMarkdownFiles = (dir) => {
      let files = [];
      try {
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        
        entries.forEach(entry => {
          const fullPath = path.join(dir, entry.name);
          
          if (entry.isDirectory() && !entry.name.startsWith('.') && 
              !['node_modules', 'dist', 'build'].includes(entry.name)) {
            files.push(...findMarkdownFiles(fullPath));
          } else if (entry.isFile() && entry.name.endsWith('.md')) {
            files.push(fullPath);
          }
        });
      } catch (error) {
        // Skip directories we can't read
      }
      
      return files;
    };

    const markdownFiles = findMarkdownFiles(dirPath);
    console.log(`📚 Found ${markdownFiles.length} markdown files`);
    
    markdownFiles.forEach(file => {
      this.auditFile(file);
    });
  }

  generateReport() {
    console.log('\n' + '='.repeat(80));
    console.log('📚 MARKDOWN DOCUMENTATION CONSISTENCY AUDIT REPORT');
    console.log('='.repeat(80));
    
    console.log(`📊 FILES SCANNED: ${this.filesScanned}`);
    console.log(`📝 FILES WITH VIOLATIONS: ${this.filesWithViolations}`);
    console.log(`\n🚨 VIOLATIONS BY SEVERITY:`);
    console.log(`  💥 Critical: ${this.violations.critical}`);
    console.log(`  ⚠️  High: ${this.violations.high}`);
    console.log(`  📝 Medium: ${this.violations.medium}`);
    console.log(`  💡 Low: ${this.violations.low}`);
    console.log(`  📊 Total: ${this.violations.total}`);

    if (this.filesWithViolations > 0) {
      console.log('\n📁 FILES WITH CRITICAL VIOLATIONS:');
      
      [...this.violationsByFile.entries()].forEach(([file, violations]) => {
        const criticalViolations = violations.filter(v => v.severity === 'CRITICAL');
        if (criticalViolations.length > 0) {
          console.log(`\n📄 ${file}`);
          criticalViolations.forEach(v => {
            console.log(`  💥 ${v.message} (${v.count} instances)`);
            console.log(`     REPLACE WITH: ${v.replacement}`);
            v.matches.forEach(m => {
              console.log(`     Line ${m.line}: "${m.text}"`);
            });
          });
        }
      });
    }

    const urgentUpdatesNeeded = this.violations.critical + this.violations.high;
    console.log(`\n🎯 DOCUMENTATION UPDATE PRIORITY:`);
    
    if (urgentUpdatesNeeded === 0) {
      console.log('✅ Documentation is up-to-date with current implementation');
    } else if (urgentUpdatesNeeded < 10) {
      console.log(`📝 Minor updates needed (${urgentUpdatesNeeded} high-priority items)`);
    } else if (urgentUpdatesNeeded < 50) {
      console.log(`⚠️  Moderate updates needed (${urgentUpdatesNeeded} high-priority items)`);
    } else {
      console.log(`🚨 Major documentation overhaul needed (${urgentUpdatesNeeded} critical/high items)`);
    }

    return urgentUpdatesNeeded;
  }

  generateUpdateScript() {
    console.log('\n📝 GENERATING AUTOMATED UPDATE SCRIPT...');
    
    const updateScript = `#!/bin/bash
# AUTOMATED MARKDOWN UPDATE SCRIPT
# Generated by markdown-consistency-auditor.cjs

echo "🚀 Updating markdown documentation for schema consistency..."

# Update logs table references
find . -name "*.md" -exec sed -i '' 's/logs table/checklist_items table/g' {} +
find . -name "*.md" -exec sed -i '' "s/\\.from('logs')/\\.from('checklist_items')/g" {} +
find . -name "*.md" -exec sed -i '' "s/\\.from(\"logs\")/\\.from('checklist_items')/g" {} +

# Update field name references  
find . -name "*.md" -exec sed -i '' 's/property_name/name/g' {} +
find . -name "*.md" -exec sed -i '' 's/street_address/address/g' {} +

# Update property_id type documentation
find . -name "*.md" -exec sed -i '' 's/property_id: number/property_id: string (UUID)/g' {} +
find . -name "*.md" -exec sed -i '' 's/property_id.*integer/property_id: UUID string/g' {} +

echo "✅ Markdown documentation updated"
echo "🔍 Run 'node markdown-consistency-auditor.cjs' to verify updates"
`;

    fs.writeFileSync('update-markdown-docs.sh', updateScript);
    fs.chmodSync('update-markdown-docs.sh', '755');
    
    console.log('📁 Created: update-markdown-docs.sh');
    console.log('   Run this script to automatically fix common documentation issues');
  }

  run() {
    console.log('📚 Starting Markdown Documentation Consistency Audit...');
    this.auditDirectory();
    const urgentItems = this.generateReport();
    
    if (urgentItems > 0) {
      this.generateUpdateScript();
    }
    
    return urgentItems === 0;
  }
}

// Run the auditor
const auditor = new MarkdownAuditor();
const isUpToDate = auditor.run();
process.exit(isUpToDate ? 0 : 1);