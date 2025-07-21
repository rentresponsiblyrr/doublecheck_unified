#!/usr/bin/env node
/**
 * Progress Validation Script
 * Prevents fraudulent completion claims by measuring actual progress
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// VALIDATION THRESHOLDS
const TARGETS = {
  MAX_COMPONENTS: 150,
  MAX_ANY_TYPES: 0,
  MAX_COMPONENT_LINES: 300,
  MAX_WINDOW_LOCATION: 0,
  MIN_TEST_COVERAGE: 90
};

class ProgressValidator {
  constructor() {
    this.violations = [];
    this.metrics = {};
  }

  // Count TypeScript files (components)
  countComponents() {
    try {
      const output = execSync('find src -name "*.tsx" -o -name "*.ts" | grep -v test | wc -l', { encoding: 'utf8' });
      this.metrics.componentCount = parseInt(output.trim());
      
      if (this.metrics.componentCount > TARGETS.MAX_COMPONENTS) {
        this.violations.push({
          type: 'COMPONENT_COUNT_VIOLATION',
          current: this.metrics.componentCount,
          target: TARGETS.MAX_COMPONENTS,
          severity: 'HIGH'
        });
      }
    } catch (error) {
      this.violations.push({
        type: 'COMPONENT_COUNT_ERROR',
        error: error.message,
        severity: 'CRITICAL'
      });
    }
  }

  // Count type safety violations
  countTypeSafetyViolations() {
    try {
      const anyTypes = execSync('grep -r "any\\|@ts-ignore" src --include="*.ts" --include="*.tsx" | grep -v test | wc -l', { encoding: 'utf8' });
      this.metrics.typeSafetyViolations = parseInt(anyTypes.trim());
      
      if (this.metrics.typeSafetyViolations > TARGETS.MAX_ANY_TYPES) {
        this.violations.push({
          type: 'TYPE_SAFETY_VIOLATION',
          current: this.metrics.typeSafetyViolations,
          target: TARGETS.MAX_ANY_TYPES,
          severity: 'HIGH'
        });
      }
    } catch (error) {
      this.violations.push({
        type: 'TYPE_SAFETY_ERROR',
        error: error.message,
        severity: 'CRITICAL'
      });
    }
  }

  // Count nuclear error patterns
  countNuclearPatterns() {
    try {
      const windowLocation = execSync('grep -r "window\\.location\\." src --include="*.ts" --include="*.tsx" | wc -l', { encoding: 'utf8' });
      this.metrics.nuclearPatterns = parseInt(windowLocation.trim());
      
      if (this.metrics.nuclearPatterns > TARGETS.MAX_WINDOW_LOCATION) {
        this.violations.push({
          type: 'NUCLEAR_PATTERN_VIOLATION',
          current: this.metrics.nuclearPatterns,
          target: TARGETS.MAX_WINDOW_LOCATION,
          severity: 'CRITICAL'
        });
      }
    } catch (error) {
      this.violations.push({
        type: 'NUCLEAR_PATTERN_ERROR',
        error: error.message,
        severity: 'CRITICAL'
      });
    }
  }

  // Check for god components
  checkGodComponents() {
    try {
      const godComponents = execSync('find src -name "*.tsx" -exec wc -l {} + | awk "$1 > 300 {print $2}" | wc -l', { encoding: 'utf8' });
      this.metrics.godComponents = parseInt(godComponents.trim());
      
      if (this.metrics.godComponents > 0) {
        this.violations.push({
          type: 'GOD_COMPONENT_VIOLATION',
          current: this.metrics.godComponents,
          target: 0,
          severity: 'HIGH'
        });
      }
    } catch (error) {
      this.violations.push({
        type: 'GOD_COMPONENT_ERROR',
        error: error.message,
        severity: 'CRITICAL'
      });
    }
  }

  // Run TypeScript check
  checkTypeScript() {
    try {
      execSync('npm run typecheck', { stdio: 'pipe' });
      this.metrics.typeScriptErrors = 0;
    } catch (error) {
      this.metrics.typeScriptErrors = 1;
      this.violations.push({
        type: 'TYPESCRIPT_ERROR',
        error: 'TypeScript compilation failed',
        severity: 'CRITICAL'
      });
    }
  }

  // Generate detailed report
  generateReport() {
    const timestamp = new Date().toISOString();
    const isCompliant = this.violations.length === 0;
    
    const report = {
      timestamp,
      isCompliant,
      metrics: this.metrics,
      violations: this.violations,
      targets: TARGETS,
      summary: {
        totalViolations: this.violations.length,
        criticalViolations: this.violations.filter(v => v.severity === 'CRITICAL').length,
        highViolations: this.violations.filter(v => v.severity === 'HIGH').length,
        complianceScore: Math.max(0, 100 - (this.violations.length * 10))
      }
    };

    return report;
  }

  // Run all validations
  async validate() {
    console.log('🔍 Running progress validation...');
    
    this.countComponents();
    this.countTypeSafetyViolations();
    this.countNuclearPatterns();
    this.checkGodComponents();
    this.checkTypeScript();
    
    const report = this.generateReport();
    
    // Save report
    const reportPath = path.join(process.cwd(), 'validation-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    // Display results
    this.displayResults(report);
    
    return report;
  }

  displayResults(report) {
    console.log('\n📊 VALIDATION RESULTS');
    console.log('=====================================');
    console.log(`🎯 Compliance Score: ${report.summary.complianceScore}%`);
    console.log(`📈 Components: ${report.metrics.componentCount}/${TARGETS.MAX_COMPONENTS}`);
    console.log(`🔧 Type Safety: ${report.metrics.typeSafetyViolations}/${TARGETS.MAX_ANY_TYPES} violations`);
    console.log(`💥 Nuclear Patterns: ${report.metrics.nuclearPatterns}/${TARGETS.MAX_WINDOW_LOCATION}`);
    console.log(`👹 God Components: ${report.metrics.godComponents}/0`);
    console.log(`✅ TypeScript: ${report.metrics.typeScriptErrors === 0 ? 'PASS' : 'FAIL'}`);
    
    if (report.violations.length > 0) {
      console.log('\n🚨 VIOLATIONS DETECTED:');
      report.violations.forEach((violation, index) => {
        console.log(`${index + 1}. [${violation.severity}] ${violation.type}`);
        if (violation.current !== undefined) {
          console.log(`   Current: ${violation.current}, Target: ${violation.target}`);
        }
        if (violation.error) {
          console.log(`   Error: ${violation.error}`);
        }
      });
      
      console.log('\n❌ VALIDATION FAILED - Claims rejected');
      process.exit(1);
    } else {
      console.log('\n✅ ALL VALIDATIONS PASSED - Standards met');
      process.exit(0);
    }
  }
}

// Run validation if called directly
if (require.main === module) {
  const validator = new ProgressValidator();
  validator.validate().catch(error => {
    console.error('❌ Validation failed:', error);
    process.exit(1);
  });
}

module.exports = ProgressValidator;
