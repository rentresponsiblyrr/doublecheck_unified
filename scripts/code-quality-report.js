#!/usr/bin/env node

/**
 * Code Quality Report Generator
 * Aggregates all quality metrics into a comprehensive dashboard
 * 
 * METRICS TRACKED:
 * - Architecture compliance score
 * - Performance audit results
 * - Security scan results
 * - Test coverage statistics
 * - Bundle size trends
 * - Technical debt assessment
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

class CodeQualityReport {
  constructor() {
    this.report = {
      timestamp: new Date().toISOString(),
      overallScore: 0,
      compliance: null,
      performance: null,
      security: null,
      coverage: null,
      trends: [],
      recommendations: []
    };
  }

  async generateReport() {
    console.log('📊 STR Certified Code Quality Report');
    console.log('=' .repeat(45));
    
    await this.loadComplianceData();
    await this.loadPerformanceData();
    await this.loadSecurityData();
    await this.loadCoverageData();
    await this.calculateOverallScore();
    await this.generateRecommendations();
    
    this.displayReport();
    this.saveReport();
  }

  /**
   * Load architecture compliance data
   */
  async loadComplianceData() {
    const compliancePath = path.join(projectRoot, 'compliance-report.json');
    
    if (fs.existsSync(compliancePath)) {
      const data = JSON.parse(fs.readFileSync(compliancePath, 'utf8'));
      this.report.compliance = {
        passed: data.passed,
        violationsCount: data.violations?.length || 0,
        filesScanned: data.stats?.filesScanned || 0,
        score: this.calculateComplianceScore(data)
      };
    } else {
      this.report.compliance = {
        passed: false,
        violationsCount: -1,
        filesScanned: 0,
        score: 0,
        error: 'Compliance report not found'
      };
    }
  }

  /**
   * Load performance audit data
   */
  async loadPerformanceData() {
    const performancePath = path.join(projectRoot, 'performance-audit.json');
    
    if (fs.existsSync(performancePath)) {
      const data = JSON.parse(fs.readFileSync(performancePath, 'utf8'));
      this.report.performance = {
        passed: data.passed,
        violationsCount: data.results?.violations?.length || 0,
        bundleSize: data.results?.bundleSize?.totalSizeMB || 'Unknown',
        score: this.calculatePerformanceScore(data)
      };
    } else {
      this.report.performance = {
        passed: false,
        violationsCount: -1,
        bundleSize: 'Unknown',
        score: 0,
        error: 'Performance audit not found'
      };
    }
  }

  /**
   * Load security scan data
   */
  async loadSecurityData() {
    const securityPath = path.join(projectRoot, 'security-scan.json');
    
    if (fs.existsSync(securityPath)) {
      const data = JSON.parse(fs.readFileSync(securityPath, 'utf8'));
      this.report.security = {
        passed: data.passed,
        highRisk: data.stats?.highRisk || 0,
        mediumRisk: data.stats?.mediumRisk || 0,
        lowRisk: data.stats?.lowRisk || 0,
        score: this.calculateSecurityScore(data)
      };
    } else {
      this.report.security = {
        passed: false,
        highRisk: -1,
        mediumRisk: -1,
        lowRisk: -1,
        score: 0,
        error: 'Security scan not found'
      };
    }
  }

  /**
   * Load test coverage data
   */
  async loadCoverageData() {
    const coveragePaths = [
      path.join(projectRoot, 'coverage', 'coverage-summary.json'),
      path.join(projectRoot, 'coverage', 'lcov-report', 'index.html')
    ];
    
    for (const coveragePath of coveragePaths) {
      if (fs.existsSync(coveragePath)) {
        if (coveragePath.endsWith('.json')) {
          const data = JSON.parse(fs.readFileSync(coveragePath, 'utf8'));
          this.report.coverage = {
            lines: data.total?.lines?.pct || 0,
            statements: data.total?.statements?.pct || 0,
            functions: data.total?.functions?.pct || 0,
            branches: data.total?.branches?.pct || 0,
            score: this.calculateCoverageScore(data)
          };
          break;
        }
      }
    }
    
    if (!this.report.coverage) {
      this.report.coverage = {
        lines: 0,
        statements: 0,
        functions: 0,
        branches: 0,
        score: 0,
        error: 'Coverage data not found'
      };
    }
  }

  /**
   * Calculate compliance score (0-100)
   */
  calculateComplianceScore(data) {
    if (!data.passed) return 0;
    if (data.violations?.length === 0) return 100;
    
    const violations = data.violations?.length || 0;
    const filesScanned = data.stats?.filesScanned || 1;
    
    // Score based on violations per file ratio
    const violationRatio = violations / filesScanned;
    return Math.max(0, 100 - (violationRatio * 50));
  }

  /**
   * Calculate performance score (0-100)
   */
  calculatePerformanceScore(data) {
    if (!data.passed) return 0;
    
    let score = 100;
    const violations = data.results?.violations || [];
    
    // Deduct points for each violation type
    violations.forEach(v => {
      switch (v.severity) {
        case 'HIGH':
          score -= 15;
          break;
        case 'MEDIUM':
          score -= 8;
          break;
        case 'LOW':
          score -= 3;
          break;
      }
    });
    
    // Bundle size impact
    const bundleSizeMB = parseFloat(data.results?.bundleSize?.totalSizeMB || 0);
    if (bundleSizeMB > 5) {
      score -= 20;
    } else if (bundleSizeMB > 3) {
      score -= 10;
    }
    
    return Math.max(0, score);
  }

  /**
   * Calculate security score (0-100)
   */
  calculateSecurityScore(data) {
    if (!data.passed) return 0;
    
    let score = 100;
    const stats = data.stats || {};
    
    // Major deductions for security issues
    score -= (stats.highRisk || 0) * 25;
    score -= (stats.mediumRisk || 0) * 10;
    score -= (stats.lowRisk || 0) * 3;
    
    return Math.max(0, score);
  }

  /**
   * Calculate coverage score (0-100)
   */
  calculateCoverageScore(data) {
    const total = data.total || {};
    const lines = total.lines?.pct || 0;
    const statements = total.statements?.pct || 0;
    const functions = total.functions?.pct || 0;
    const branches = total.branches?.pct || 0;
    
    // Weighted average of coverage metrics
    return Math.round((lines * 0.3 + statements * 0.3 + functions * 0.2 + branches * 0.2));
  }

  /**
   * Calculate overall quality score
   */
  async calculateOverallScore() {
    const scores = [
      this.report.compliance?.score || 0,
      this.report.performance?.score || 0,
      this.report.security?.score || 0,
      this.report.coverage?.score || 0
    ];
    
    // Weighted average (security and compliance weighted higher)
    const weights = [0.3, 0.25, 0.35, 0.1];
    const weightedSum = scores.reduce((sum, score, index) => sum + score * weights[index], 0);
    
    this.report.overallScore = Math.round(weightedSum);
  }

  /**
   * Generate improvement recommendations
   */
  async generateRecommendations() {
    const recommendations = [];
    
    // Compliance recommendations
    if ((this.report.compliance?.score || 0) < 80) {
      recommendations.push({
        category: 'Architecture',
        priority: 'HIGH',
        message: 'Fix architecture compliance violations immediately',
        action: 'Run npm run architecture-compliance to see detailed violations'
      });
    }
    
    // Security recommendations
    if ((this.report.security?.highRisk || 0) > 0) {
      recommendations.push({
        category: 'Security',
        priority: 'CRITICAL',
        message: 'Fix high-risk security vulnerabilities immediately',
        action: 'Run npm run security-scan to see detailed vulnerabilities'
      });
    }
    
    // Performance recommendations
    if ((this.report.performance?.score || 0) < 70) {
      recommendations.push({
        category: 'Performance',
        priority: 'HIGH',
        message: 'Optimize performance issues',
        action: 'Run npm run performance-audit to see detailed issues'
      });
    }
    
    // Coverage recommendations
    if ((this.report.coverage?.score || 0) < 80) {
      recommendations.push({
        category: 'Testing',
        priority: 'MEDIUM',
        message: 'Increase test coverage to meet STR Certified standards',
        action: 'Add unit tests for untested components and services'
      });
    }
    
    this.report.recommendations = recommendations;
  }

  /**
   * Display comprehensive report
   */
  displayReport() {
    console.log('\n🎯 OVERALL QUALITY SCORE');
    console.log('='.repeat(30));
    
    const scoreColor = this.getScoreColor(this.report.overallScore);
    console.log(`${scoreColor}${this.report.overallScore}/100${'\x1b[0m'}`);
    
    console.log('\n📋 DETAILED BREAKDOWN');
    console.log('-'.repeat(25));
    
    // Compliance
    const complianceScore = this.report.compliance?.score || 0;
    console.log(`Architecture Compliance: ${this.getScoreColor(complianceScore)}${complianceScore}/100${'\x1b[0m'}`);
    if (this.report.compliance?.violationsCount > 0) {
      console.log(`  ⚠️  ${this.report.compliance.violationsCount} violations found`);
    }
    
    // Security
    const securityScore = this.report.security?.score || 0;
    console.log(`Security Score: ${this.getScoreColor(securityScore)}${securityScore}/100${'\x1b[0m'}`);
    if ((this.report.security?.highRisk || 0) > 0) {
      console.log(`  🚨 ${this.report.security.highRisk} high-risk vulnerabilities`);
    }
    
    // Performance
    const performanceScore = this.report.performance?.score || 0;
    console.log(`Performance Score: ${this.getScoreColor(performanceScore)}${performanceScore}/100${'\x1b[0m'}`);
    if (this.report.performance?.bundleSize !== 'Unknown') {
      console.log(`  📦 Bundle size: ${this.report.performance.bundleSize}MB`);
    }
    
    // Coverage
    const coverageScore = this.report.coverage?.score || 0;
    console.log(`Test Coverage: ${this.getScoreColor(coverageScore)}${coverageScore}%${'\x1b[0m'}`);
    
    // Recommendations
    if (this.report.recommendations.length > 0) {
      console.log('\n🔧 PRIORITY RECOMMENDATIONS');
      console.log('-'.repeat(30));
      
      this.report.recommendations
        .sort((a, b) => this.getPriorityWeight(b.priority) - this.getPriorityWeight(a.priority))
        .forEach((rec, index) => {
          const priorityColor = this.getPriorityColor(rec.priority);
          console.log(`${index + 1}. [${priorityColor}${rec.priority}${'\x1b[0m'}] ${rec.message}`);
          console.log(`   Action: ${rec.action}`);
        });
    }
    
    // Grade assignment
    console.log('\n🎓 QUALITY GRADE');
    console.log('-'.repeat(20));
    const grade = this.calculateGrade(this.report.overallScore);
    const gradeColor = this.getGradeColor(grade);
    console.log(`${gradeColor}${grade}${'\x1b[0m'} - ${this.getGradeDescription(grade)}`);
  }

  /**
   * Get color for score display
   */
  getScoreColor(score) {
    if (score >= 90) return '\x1b[32m';  // Green
    if (score >= 70) return '\x1b[33m';  // Yellow
    return '\x1b[31m';  // Red
  }

  /**
   * Get color for priority display
   */
  getPriorityColor(priority) {
    switch (priority) {
      case 'CRITICAL': return '\x1b[35m';  // Magenta
      case 'HIGH': return '\x1b[31m';      // Red
      case 'MEDIUM': return '\x1b[33m';    // Yellow
      case 'LOW': return '\x1b[32m';       // Green
      default: return '\x1b[0m';           // Reset
    }
  }

  /**
   * Get priority weight for sorting
   */
  getPriorityWeight(priority) {
    switch (priority) {
      case 'CRITICAL': return 4;
      case 'HIGH': return 3;
      case 'MEDIUM': return 2;
      case 'LOW': return 1;
      default: return 0;
    }
  }

  /**
   * Calculate letter grade
   */
  calculateGrade(score) {
    if (score >= 95) return 'A+';
    if (score >= 90) return 'A';
    if (score >= 85) return 'A-';
    if (score >= 80) return 'B+';
    if (score >= 75) return 'B';
    if (score >= 70) return 'B-';
    if (score >= 65) return 'C+';
    if (score >= 60) return 'C';
    if (score >= 55) return 'C-';
    if (score >= 50) return 'D';
    return 'F';
  }

  /**
   * Get color for grade display
   */
  getGradeColor(grade) {
    if (grade.startsWith('A')) return '\x1b[32m';  // Green
    if (grade.startsWith('B')) return '\x1b[33m';  // Yellow
    if (grade.startsWith('C')) return '\x1b[36m';  // Cyan
    if (grade.startsWith('D')) return '\x1b[35m';  // Magenta
    return '\x1b[31m';  // Red (F)
  }

  /**
   * Get grade description
   */
  getGradeDescription(grade) {
    switch (grade.charAt(0)) {
      case 'A': return 'Excellent - Production ready with industry-leading quality';
      case 'B': return 'Good - High quality with minor improvements needed';
      case 'C': return 'Satisfactory - Meets basic standards but needs optimization';
      case 'D': return 'Below Standard - Significant improvements required';
      case 'F': return 'Failing - Critical issues must be resolved immediately';
      default: return 'Unknown quality level';
    }
  }

  /**
   * Save comprehensive report to file
   */
  saveReport() {
    const reportPath = path.join(projectRoot, 'code-quality-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(this.report, null, 2));
    
    console.log(`\n💾 Detailed report saved to: code-quality-report.json`);
    console.log(`📈 View trends and metrics in your CI/CD dashboard`);
  }
}

// Generate the code quality report
const reporter = new CodeQualityReport();
reporter.generateReport().catch(error => {
  console.error('Code quality report generation failed:', error);
  process.exit(1);
});