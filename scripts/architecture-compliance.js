#!/usr/bin/env node

/**
 * Architecture Compliance Checker
 * Enforces STR Certified engineering standards automatically
 * 
 * ZERO TOLERANCE VIOLATIONS:
 * 1. Nuclear Error Handling (window.location.reload)
 * 2. God Components (>300 lines)
 * 3. Type Escape Hatches (any, @ts-ignore)
 * 4. Dependency Array Lies
 * 5. Service Layer Pyramids
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

class ArchitectureCompliance {
  constructor() {
    this.violations = [];
    this.stats = {
      filesScanned: 0,
      violationsFound: 0,
      godComponents: 0,
      nuclearErrors: 0,
      typeEscapes: 0
    };
  }

  /**
   * Scan all TypeScript/React files for architecture violations
   */
  async scanProject() {
    console.log('🔍 STR Certified Architecture Compliance Scan');
    console.log('=' .repeat(50));
    
    const srcDir = path.join(projectRoot, 'src');
    await this.scanDirectory(srcDir);
    
    this.generateReport();
    
    if (this.violations.length > 0) {
      console.log('\n❌ ARCHITECTURE COMPLIANCE FAILED');
      console.log(`Found ${this.violations.length} critical violations`);
      process.exit(1);
    } else {
      console.log('\n✅ ARCHITECTURE COMPLIANCE PASSED');
      console.log('All files meet STR Certified engineering standards');
      process.exit(0);
    }
  }

  /**
   * Recursively scan directory for violations
   */
  async scanDirectory(dir) {
    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        
        if (entry.isDirectory() && !this.shouldSkipDirectory(entry.name)) {
          await this.scanDirectory(fullPath);
        } else if (entry.isFile() && this.shouldScanFile(entry.name)) {
          await this.scanFile(fullPath);
        }
      }
    } catch (error) {
      console.warn(`Warning: Could not scan directory ${dir}: ${error.message}`);
    }
  }

  /**
   * Check if directory should be skipped
   */
  shouldSkipDirectory(name) {
    const skipDirs = ['node_modules', '.git', 'dist', 'build', 'coverage', '__tests__', '.next'];
    return skipDirs.includes(name) || name.startsWith('.');
  }

  /**
   * Check if file should be scanned
   */
  shouldScanFile(name) {
    return /\.(ts|tsx|js|jsx)$/.test(name) && !name.endsWith('.test.ts') && !name.endsWith('.test.tsx');
  }

  /**
   * Scan individual file for violations
   */
  async scanFile(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const relativePath = path.relative(projectRoot, filePath);
      this.stats.filesScanned++;

      // Check for violations
      this.checkGodComponent(relativePath, content);
      this.checkNuclearErrorHandling(relativePath, content);
      this.checkTypeEscapeHatches(relativePath, content);
      this.checkDependencyArrayLies(relativePath, content);
      this.checkServiceLayerPyramids(relativePath, content);
      
    } catch (error) {
      console.warn(`Warning: Could not scan file ${filePath}: ${error.message}`);
    }
  }

  /**
   * VIOLATION 1: God Components (>300 lines)
   */
  checkGodComponent(filePath, content) {
    const lines = content.split('\n').length;
    const isComponent = /\.(tsx|jsx)$/.test(filePath) && 
                      (content.includes('export const') || content.includes('export default')) &&
                      content.includes('React');

    if (isComponent && lines > 300) {
      this.addViolation('GOD_COMPONENT', filePath, 1, 
        `Component has ${lines} lines (limit: 300). Break into smaller, focused components.`);
      this.stats.godComponents++;
    }
  }

  /**
   * VIOLATION 2: Nuclear Error Handling
   */
  checkNuclearErrorHandling(filePath, content) {
    const nuclearPatterns = [
      /window\.location\.reload\(\)/g,
      /location\.reload\(\)/g,
      /window\.location\.href\s*=/g,
      /document\.location\.reload\(\)/g
    ];

    for (const pattern of nuclearPatterns) {
      const matches = [...content.matchAll(pattern)];
      for (const match of matches) {
        const lineNum = this.getLineNumber(content, match.index);
        this.addViolation('NUCLEAR_ERROR_HANDLING', filePath, lineNum,
          `Nuclear error handling detected: ${match[0]}. Use graceful error recovery instead.`);
        this.stats.nuclearErrors++;
      }
    }
  }

  /**
   * VIOLATION 3: Type Escape Hatches
   */
  checkTypeEscapeHatches(filePath, content) {
    // Check for 'any' type in business logic (not in test files or type definitions)
    if (!filePath.includes('test') && !filePath.includes('types/')) {
      const anyTypePattern = /:\s*any[\s;,)]/g;
      const matches = [...content.matchAll(anyTypePattern)];
      
      for (const match of matches) {
        const lineNum = this.getLineNumber(content, match.index);
        this.addViolation('TYPE_ESCAPE_HATCH', filePath, lineNum,
          `'any' type detected in business logic. Use proper TypeScript interfaces.`);
        this.stats.typeEscapes++;
      }
    }

    // Check for @ts-ignore comments
    const tsIgnorePattern = /@ts-ignore/g;
    const matches = [...content.matchAll(tsIgnorePattern)];
    
    for (const match of matches) {
      const lineNum = this.getLineNumber(content, match.index);
      this.addViolation('TYPE_ESCAPE_HATCH', filePath, lineNum,
        `@ts-ignore detected. Fix type errors instead of suppressing them.`);
      this.stats.typeEscapes++;
    }
  }

  /**
   * VIOLATION 4: Dependency Array Lies (useEffect)
   */
  checkDependencyArrayLies(filePath, content) {
    // Look for useEffect with eslint-disable comments
    const useEffectPattern = /useEffect\([\s\S]*?\n\s*\/\/\s*eslint-disable.*?deps/g;
    const matches = [...content.matchAll(useEffectPattern)];
    
    for (const match of matches) {
      const lineNum = this.getLineNumber(content, match.index);
      this.addViolation('DEPENDENCY_ARRAY_LIE', filePath, lineNum,
        `useEffect dependency array disabled. Fix the infinite loop properly.`);
    }
  }

  /**
   * VIOLATION 5: Service Layer Pyramids (>5 abstraction layers)
   */
  checkServiceLayerPyramids(filePath, content) {
    if (filePath.includes('service') || filePath.includes('Service')) {
      // Count class inheritance depth and nested service calls
      const serviceCallPattern = /\w+Service\./g;
      const matches = [...content.matchAll(serviceCallPattern)];
      
      if (matches.length > 10) {
        this.addViolation('SERVICE_LAYER_PYRAMID', filePath, 1,
          `Excessive service layer complexity detected (${matches.length} service calls). Simplify architecture.`);
      }
    }
  }

  /**
   * Add violation to the list
   */
  addViolation(type, file, line, message) {
    this.violations.push({
      type,
      file,
      line,
      message,
      severity: 'CRITICAL'
    });
    this.stats.violationsFound++;
  }

  /**
   * Get line number from character index
   */
  getLineNumber(content, index) {
    return content.substring(0, index).split('\n').length;
  }

  /**
   * Generate compliance report
   */
  generateReport() {
    console.log('\n📊 COMPLIANCE REPORT');
    console.log('-'.repeat(30));
    console.log(`Files Scanned: ${this.stats.filesScanned}`);
    console.log(`Total Violations: ${this.stats.violationsFound}`);
    console.log(`God Components: ${this.stats.godComponents}`);
    console.log(`Nuclear Errors: ${this.stats.nuclearErrors}`);
    console.log(`Type Escapes: ${this.stats.typeEscapes}`);

    if (this.violations.length > 0) {
      console.log('\n🚨 CRITICAL VIOLATIONS FOUND:');
      console.log('='.repeat(50));
      
      for (const violation of this.violations) {
        console.log(`\n${violation.type} in ${violation.file}:${violation.line}`);
        console.log(`  ${violation.message}`);
      }
      
      console.log('\n📋 REMEDIATION ACTIONS:');
      console.log('1. Fix nuclear error handling patterns immediately');
      console.log('2. Break down god components into focused modules');
      console.log('3. Replace type escape hatches with proper interfaces');
      console.log('4. Fix useEffect dependency arrays properly');
      console.log('5. Simplify service layer architecture');
    }

    // Write detailed report to file
    const reportPath = path.join(projectRoot, 'compliance-report.json');
    const report = {
      timestamp: new Date().toISOString(),
      stats: this.stats,
      violations: this.violations,
      passed: this.violations.length === 0
    };
    
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`\nDetailed report saved to: ${reportPath}`);
  }
}

// Run the compliance check
const checker = new ArchitectureCompliance();
checker.scanProject().catch(error => {
  console.error('Architecture compliance check failed:', error);
  process.exit(1);
});