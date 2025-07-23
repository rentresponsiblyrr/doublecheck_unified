#!/usr/bin/env node
/**
 * ENGINEERING STANDARDS ENFORCER - NETFLIX/META LEVEL
 * 
 * Comprehensive automated tooling to prevent engineering inconsistencies,
 * type safety violations, and maintain codebase excellence standards.
 * 
 * This tool prevents the systemic issues that caused our recent production failures.
 */

const fs = require('fs');
const path = require('path');

// CRITICAL VIOLATIONS THAT BLOCK DEPLOYMENT
const CRITICAL_VIOLATIONS = [
  {
    pattern: /\.from\(['"]logs['"]\)/g,
    severity: 'CRITICAL',
    message: 'Legacy logs table reference - use checklist_items',
    fix: "Replace .from('logs') with .from('checklist_items')"
  },
  {
    pattern: /property_name|street_address/g,
    severity: 'CRITICAL', 
    message: 'Legacy property field names - use name/address',
    fix: 'Replace property_name→name, street_address→address'
  },
  {
    pattern: /useState<any>|useQuery<any>/g,
    severity: 'CRITICAL',
    message: 'Hook any type violation - specify proper types',
    fix: 'Replace with specific TypeScript types'
  }
];

// HIGH PRIORITY VIOLATIONS
const HIGH_VIOLATIONS = [
  {
    pattern: /: any(?![a-zA-Z])/g,
    severity: 'HIGH',
    message: 'Any type usage - should be properly typed',
    fix: 'Replace with specific TypeScript interface or union type'
  },
  {
    pattern: /Record<.*?any>/g,
    severity: 'HIGH', 
    message: 'Record with any type - specify value types',
    fix: 'Replace Record<string, any> with Record<string, specific_type>'
  },
  {
    pattern: /function.*\([^)]*: any/g,
    severity: 'HIGH',
    message: 'Function parameter any type',
    fix: 'Add proper parameter types'
  }
];

// CONSISTENCY VIOLATIONS
const CONSISTENCY_VIOLATIONS = [
  {
    pattern: /on[A-Z][a-zA-Z]*Handler/g,
    severity: 'MEDIUM',
    message: 'Event handler naming inconsistency - use onClick not onClickHandler',
    fix: 'Remove Handler suffix from prop names'
  },
  {
    pattern: /interface I[A-Z]/g,
    severity: 'MEDIUM',
    message: 'Hungarian notation interface naming - avoid I prefix',
    fix: 'Remove I prefix from interface names'
  }
];

// NAMING CONVENTION VIOLATIONS
const NAMING_VIOLATIONS = [
  {
    pattern: /src\/components\/[a-z-]+\.tsx$/,
    severity: 'MEDIUM',
    message: 'UI component kebab-case naming - should be PascalCase',
    fix: 'Rename to PascalCase (e.g., scroll-area.tsx → ScrollArea.tsx)'
  }
];

const CRITICAL_FILES = [
  'src/components/inspector/active/',
  'src/hooks/',
  'src/services/',
  'src/pages/',
  'src/components/reports/'
];

class EngineeringStandardsEnforcer {
  constructor() {
    this.violations = {
      critical: 0,
      high: 0,
      medium: 0,
      total: 0
    };
    this.files = new Set();
  }

  scanFile(filePath, content) {
    let fileViolations = [];
    
    // Check critical violations
    CRITICAL_VIOLATIONS.forEach(violation => {
      const matches = [...content.matchAll(violation.pattern)];
      if (matches.length > 0) {
        this.violations.critical += matches.length;
        this.violations.total += matches.length;
        fileViolations.push({
          severity: violation.severity,
          message: violation.message,
          fix: violation.fix,
          count: matches.length,
          lines: this.getLineNumbers(content, matches)
        });
      }
    });

    // Check high violations
    HIGH_VIOLATIONS.forEach(violation => {
      const matches = [...content.matchAll(violation.pattern)];
      if (matches.length > 0) {
        this.violations.high += matches.length;
        this.violations.total += matches.length;
        fileViolations.push({
          severity: violation.severity,
          message: violation.message,
          fix: violation.fix,
          count: matches.length,
          lines: this.getLineNumbers(content, matches)
        });
      }
    });

    // Check consistency violations
    CONSISTENCY_VIOLATIONS.forEach(violation => {
      const matches = [...content.matchAll(violation.pattern)];
      if (matches.length > 0) {
        this.violations.medium += matches.length;
        this.violations.total += matches.length;
        fileViolations.push({
          severity: violation.severity,
          message: violation.message,
          fix: violation.fix,
          count: matches.length,
          lines: this.getLineNumbers(content, matches)
        });
      }
    });

    return fileViolations;
  }

  getLineNumbers(content, matches) {
    return matches.map(match => {
      const beforeMatch = content.substring(0, match.index);
      return beforeMatch.split('\n').length;
    });
  }

  scanDirectory(dirPath) {
    if (!fs.existsSync(dirPath)) return;
    
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    
    entries.forEach(entry => {
      const fullPath = path.join(dirPath, entry.name);
      
      if (entry.isDirectory()) {
        this.scanDirectory(fullPath);
      } else if (entry.isFile() && /\.(ts|tsx)$/.test(entry.name)) {
        try {
          const content = fs.readFileSync(fullPath, 'utf8');
          const violations = this.scanFile(fullPath, content);
          
          if (violations.length > 0) {
            this.files.add(fullPath);
            console.log(`\n📁 ${fullPath}`);
            violations.forEach(v => {
              const emoji = v.severity === 'CRITICAL' ? '💥' : v.severity === 'HIGH' ? '⚠️' : '📝';
              console.log(`  ${emoji} ${v.severity}: ${v.message} (${v.count} instances)`);
              console.log(`     FIX: ${v.fix}`);
              if (v.lines.length <= 5) {
                console.log(`     LINES: ${v.lines.join(', ')}`);
              } else {
                console.log(`     LINES: ${v.lines.slice(0, 5).join(', ')} (+${v.lines.length - 5} more)`);
              }
            });
          }
        } catch (error) {
          console.log(`❌ Error reading ${fullPath}: ${error.message}`);
        }
      }
    });
  }

  generateReport() {
    console.log('\n' + '='.repeat(80));
    console.log('🚀 ENGINEERING STANDARDS ENFORCEMENT REPORT');
    console.log('='.repeat(80));
    console.log(`💥 Critical Violations: ${this.violations.critical}`);
    console.log(`⚠️  High Priority Violations: ${this.violations.high}`);
    console.log(`📝 Medium Priority Violations: ${this.violations.medium}`);
    console.log(`📊 Total Violations: ${this.violations.total}`);
    console.log(`📁 Files Affected: ${this.files.size}`);

    // Calculate deployment readiness
    const deploymentScore = Math.max(0, 100 - (this.violations.critical * 20) - (this.violations.high * 5) - (this.violations.medium * 1));
    
    console.log(`\n🎯 DEPLOYMENT READINESS SCORE: ${deploymentScore}%`);
    
    if (this.violations.critical > 0) {
      console.log('\n🚨 DEPLOYMENT BLOCKED - Critical violations must be fixed');
      console.log('These violations can cause production failures');
      return false;
    } else if (this.violations.high > 20) {
      console.log('\n⚠️  DEPLOYMENT WARNING - High violation count');
      console.log('Consider fixing high priority issues before deployment');
      return false;
    } else if (deploymentScore >= 95) {
      console.log('\n✅ DEPLOYMENT APPROVED - Excellent code quality');
      return true;
    } else {
      console.log('\n📝 DEPLOYMENT CAUTION - Code quality improvements recommended');
      return true;
    }
  }

  run() {
    console.log('🚀 Starting Engineering Standards Enforcement...');
    console.log('Scanning critical directories for violations...\n');
    
    // Scan critical directories
    CRITICAL_FILES.forEach(dir => {
      if (fs.existsSync(dir)) {
        this.scanDirectory(dir);
      }
    });
    
    // Additional scan of all TypeScript files
    this.scanDirectory('src/');
    
    return this.generateReport();
  }
}

// Run the enforcer
const enforcer = new EngineeringStandardsEnforcer();
const deploymentReady = enforcer.run();

process.exit(deploymentReady ? 0 : 1);