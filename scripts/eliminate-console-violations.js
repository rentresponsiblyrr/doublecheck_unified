#!/usr/bin/env node

/**
 * CRITICAL SCRIPT: Eliminate ALL Console Violations
 * Systematically removes all console.log/error/warn statements
 * Replaces with enterprise-grade structured logging
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

class ConsoleViolationEliminator {
  constructor() {
    this.violations = [];
    this.replacements = 0;
    this.filesProcessed = 0;
  }

  async eliminateAll() {
    console.log('🚨 CRITICAL: Eliminating ALL Console Violations');
    console.log('=' .repeat(60));
    
    const srcDir = path.join(projectRoot, 'src');
    await this.processDirectory(srcDir);
    
    this.generateReport();
    
    if (this.violations.length > 0) {
      console.log('\n❌ VIOLATIONS STILL EXIST - MANUAL INTERVENTION REQUIRED');
      process.exit(1);
    } else {
      console.log('\n✅ ALL CONSOLE VIOLATIONS ELIMINATED');
      process.exit(0);
    }
  }

  async processDirectory(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      
      if (entry.isDirectory() && !this.shouldSkipDirectory(entry.name)) {
        await this.processDirectory(fullPath);
      } else if (entry.isFile() && this.shouldProcessFile(entry.name)) {
        await this.processFile(fullPath);
      }
    }
  }

  shouldSkipDirectory(name) {
    return ['node_modules', '.git', 'dist', 'build', '__tests__'].includes(name);
  }

  shouldProcessFile(name) {
    return /\.(ts|tsx|js|jsx)$/.test(name) && !name.includes('.test.');
  }

  async processFile(filePath) {
    try {
      const relativePath = path.relative(projectRoot, filePath);
      let content = fs.readFileSync(filePath, 'utf8');
      let originalContent = content;
      this.filesProcessed++;

      // Track violations before replacement
      const violations = this.findConsoleViolations(content);
      this.violations.push(...violations.map(v => ({ ...v, file: relativePath })));

      // Replace console statements with enterprise logging
      content = this.replaceConsoleStatements(content, relativePath);

      // Save if changed
      if (content !== originalContent) {
        // Add logging import if needed and not already present
        if (!content.includes("import { log } from '@/lib/logging/enterprise-logger'")) {
          // Find existing imports and add after them
          const importMatch = content.match(/^(import.*?;\n)+/m);
          if (importMatch) {
            content = content.replace(
              importMatch[0],
              importMatch[0] + "import { log } from '@/lib/logging/enterprise-logger';\n"
            );
          } else {
            // Add at top if no imports found
            content = "import { log } from '@/lib/logging/enterprise-logger';\n\n" + content;
          }
        }

        fs.writeFileSync(filePath, content);
        console.log(`✅ Fixed: ${relativePath}`);
      }

    } catch (error) {
      console.error(`❌ Error processing ${filePath}:`, error.message);
    }
  }

  findConsoleViolations(content) {
    const violations = [];
    const consolePattern = /console\.(log|error|warn|info|debug|trace)\s*\(/g;
    let match;

    while ((match = consolePattern.exec(content)) !== null) {
      const lineNum = this.getLineNumber(content, match.index);
      violations.push({
        line: lineNum,
        type: match[1],
        statement: this.extractStatement(content, match.index)
      });
    }

    return violations;
  }

  replaceConsoleStatements(content, filePath) {
    // Replace console.error with structured error logging
    content = content.replace(
      /console\.error\s*\(\s*(['"`])([^'"`]*)\1\s*,?\s*([^)]*)\)/g,
      (match, quote, message, args) => {
        const component = this.extractComponentName(filePath);
        const cleanArgs = args.trim().replace(/,$/, '');
        
        if (cleanArgs) {
          return `log.error('${message}', { component: '${component}', action: 'error', metadata: { ${cleanArgs} } }, 'ERROR_${component.toUpperCase()}')`;
        } else {
          return `log.error('${message}', { component: '${component}', action: 'error' }, 'ERROR_${component.toUpperCase()}')`;
        }
      }
    );

    // Replace console.warn with structured warning logging
    content = content.replace(
      /console\.warn\s*\(\s*(['"`])([^'"`]*)\1\s*,?\s*([^)]*)\)/g,
      (match, quote, message, args) => {
        const component = this.extractComponentName(filePath);
        const cleanArgs = args.trim().replace(/,$/, '');
        
        if (cleanArgs) {
          return `log.warn('${message}', { component: '${component}', action: 'warning', metadata: { ${cleanArgs} } }, 'WARN_${component.toUpperCase()}')`;
        } else {
          return `log.warn('${message}', { component: '${component}', action: 'warning' }, 'WARN_${component.toUpperCase()}')`;
        }
      }
    );

    // Replace console.log with structured info logging
    content = content.replace(
      /console\.log\s*\(\s*(['"`])([^'"`]*)\1\s*,?\s*([^)]*)\)/g,
      (match, quote, message, args) => {
        const component = this.extractComponentName(filePath);
        const cleanArgs = args.trim().replace(/,$/, '');
        
        if (cleanArgs) {
          return `log.info('${message}', { component: '${component}', action: 'operation', metadata: { ${cleanArgs} } }, 'INFO_${component.toUpperCase()}')`;
        } else {
          return `log.info('${message}', { component: '${component}', action: 'operation' }, 'INFO_${component.toUpperCase()}')`;
        }
      }
    );

    // Replace console.info with structured info logging
    content = content.replace(
      /console\.info\s*\(\s*(['"`])([^'"`]*)\1\s*,?\s*([^)]*)\)/g,
      (match, quote, message, args) => {
        const component = this.extractComponentName(filePath);
        const cleanArgs = args.trim().replace(/,$/, '');
        
        if (cleanArgs) {
          return `log.info('${message}', { component: '${component}', action: 'info', metadata: { ${cleanArgs} } }, 'INFO_${component.toUpperCase()}')`;
        } else {
          return `log.info('${message}', { component: '${component}', action: 'info' }, 'INFO_${component.toUpperCase()}')`;
        }
      }
    );

    // Replace console.debug with structured debug logging
    content = content.replace(
      /console\.debug\s*\(\s*(['"`])([^'"`]*)\1\s*,?\s*([^)]*)\)/g,
      (match, quote, message, args) => {
        const component = this.extractComponentName(filePath);
        const cleanArgs = args.trim().replace(/,$/, '');
        
        if (cleanArgs) {
          return `log.debug('${message}', { component: '${component}', action: 'debug', metadata: { ${cleanArgs} } }, 'DEBUG_${component.toUpperCase()}')`;
        } else {
          return `log.debug('${message}', { component: '${component}', action: 'debug' }, 'DEBUG_${component.toUpperCase()}')`;
        }
      }
    );

    return content;
  }

  extractComponentName(filePath) {
    const fileName = path.basename(filePath, path.extname(filePath));
    return fileName.replace(/[^a-zA-Z0-9]/g, '');
  }

  extractStatement(content, index) {
    const start = content.lastIndexOf('\n', index) + 1;
    const end = content.indexOf('\n', index);
    return content.substring(start, end === -1 ? content.length : end).trim();
  }

  getLineNumber(content, index) {
    return content.substring(0, index).split('\n').length;
  }

  generateReport() {
    console.log('\n📊 CONSOLE VIOLATION ELIMINATION REPORT');
    console.log('-'.repeat(45));
    console.log(`Files Processed: ${this.filesProcessed}`);
    console.log(`Total Violations Found: ${this.violations.length}`);
    console.log(`Replacements Made: ${this.replacements}`);

    if (this.violations.length > 0) {
      console.log('\n🚨 REMAINING VIOLATIONS:');
      console.log('='.repeat(35));
      
      const groupedViolations = {};
      this.violations.forEach(v => {
        if (!groupedViolations[v.file]) {
          groupedViolations[v.file] = [];
        }
        groupedViolations[v.file].push(v);
      });

      Object.entries(groupedViolations).forEach(([file, violations]) => {
        console.log(`\n${file}:`);
        violations.forEach(v => {
          console.log(`  Line ${v.line}: console.${v.type} - ${v.statement}`);
        });
      });

      console.log('\n🔧 MANUAL FIXES REQUIRED:');
      console.log('1. Complex console statements need manual review');
      console.log('2. Template literals and dynamic content require context analysis');
      console.log('3. Error handling patterns need structured logging implementation');
    }
  }
}

// Run the elimination
const eliminator = new ConsoleViolationEliminator();
eliminator.eliminateAll().catch(error => {
  console.error('Console violation elimination failed:', error);
  process.exit(1);
});