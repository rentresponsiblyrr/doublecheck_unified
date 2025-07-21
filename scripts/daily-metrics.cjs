#!/usr/bin/env node
/**
 * Daily Metrics Collection Script
 * Tracks progress against roadmap targets
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class DailyMetrics {
  constructor() {
    this.metrics = {
      timestamp: new Date().toISOString(),
      date: new Date().toDateString()
    };
  }

  // Collect codebase metrics
  collectCodebaseMetrics() {
    try {
      // Component count
      const componentCount = execSync('find src -name "*.tsx" -o -name "*.ts" | grep -v test | wc -l', { encoding: 'utf8' });
      this.metrics.componentCount = parseInt(componentCount.trim());
      
      // Line counts
      const totalLines = execSync('find src -name "*.tsx" -o -name "*.ts" | xargs wc -l | tail -1 | awk "{print $1}"', { encoding: 'utf8' });
      this.metrics.totalLines = parseInt(totalLines.trim());
      
      // Average component size
      this.metrics.avgComponentSize = Math.round(this.metrics.totalLines / this.metrics.componentCount);
      
      // Type safety violations
      const anyTypes = execSync('grep -r "any\\|@ts-ignore" src --include="*.ts" --include="*.tsx" | grep -v test | wc -l', { encoding: 'utf8' });
      this.metrics.typeSafetyViolations = parseInt(anyTypes.trim());
      
      // Nuclear patterns
      const nuclearPatterns = execSync('grep -r "window\\.location\\." src --include="*.ts" --include="*.tsx" | wc -l', { encoding: 'utf8' });
      this.metrics.nuclearPatterns = parseInt(nuclearPatterns.trim());
      
      // God components (>300 lines)
      const godComponentsOutput = execSync('find src -name "*.tsx" -exec wc -l {} + | awk "$1 > 300 {count++} END {print count+0}"', { encoding: 'utf8' });
      this.metrics.godComponents = parseInt(godComponentsOutput.trim());
      
    } catch (error) {
      console.error('Error collecting codebase metrics:', error.message);
    }
  }

  // Check build status
  checkBuildStatus() {
    try {
      execSync('npm run typecheck', { stdio: 'pipe' });
      this.metrics.buildStatus = 'PASSING';
      this.metrics.typeScriptErrors = 0;
    } catch (error) {
      this.metrics.buildStatus = 'FAILING';
      this.metrics.typeScriptErrors = 1;
    }
  }

  // Calculate progress scores
  calculateProgress() {
    const targets = {
      componentCount: 150,
      typeSafetyViolations: 0,
      nuclearPatterns: 0,
      godComponents: 0
    };
    
    this.metrics.progress = {
      componentReduction: Math.max(0, Math.min(100, ((459 - this.metrics.componentCount) / (459 - targets.componentCount)) * 100)),
      typeSafetyProgress: Math.max(0, Math.min(100, ((444 - this.metrics.typeSafetyViolations) / 444) * 100)),
      nuclearElimination: this.metrics.nuclearPatterns === 0 ? 100 : 0,
      architectureCleanup: this.metrics.godComponents === 0 ? 100 : Math.max(0, 100 - (this.metrics.godComponents * 10))
    };
    
    // Overall progress score
    const progressValues = Object.values(this.metrics.progress);
    this.metrics.overallProgress = progressValues.reduce((sum, val) => sum + val, 0) / progressValues.length;
  }

  // Generate trending data
  generateTrends() {
    const historyPath = path.join(process.cwd(), 'metrics-history.json');
    let history = [];
    
    if (fs.existsSync(historyPath)) {
      try {
        history = JSON.parse(fs.readFileSync(historyPath, 'utf8'));
      } catch (error) {
        console.warn('Could not read metrics history:', error.message);
      }
    }
    
    // Add current metrics to history
    history.push(this.metrics);
    
    // Keep only last 30 days
    if (history.length > 30) {
      history = history.slice(-30);
    }
    
    // Calculate trends
    if (history.length >= 2) {
      const previous = history[history.length - 2];
      const current = this.metrics;
      
      this.metrics.trends = {
        componentCount: current.componentCount - previous.componentCount,
        typeSafetyViolations: current.typeSafetyViolations - previous.typeSafetyViolations,
        nuclearPatterns: current.nuclearPatterns - previous.nuclearPatterns,
        godComponents: current.godComponents - previous.godComponents,
        overallProgress: current.overallProgress - previous.overallProgress
      };
    }
    
    // Save updated history
    fs.writeFileSync(historyPath, JSON.stringify(history, null, 2));
  }

  // Generate report
  generateReport() {
    console.log('📈 DAILY METRICS REPORT');
    console.log('==========================');
    console.log(`Date: ${this.metrics.date}`);
    console.log(`📁 Components: ${this.metrics.componentCount} (target: 150)`);
    console.log(`🔧 Type Safety: ${this.metrics.typeSafetyViolations} violations (target: 0)`);
    console.log(`💥 Nuclear Patterns: ${this.metrics.nuclearPatterns} (target: 0)`);
    console.log(`👹 God Components: ${this.metrics.godComponents} (target: 0)`);
    console.log(`✅ Build Status: ${this.metrics.buildStatus}`);
    console.log(`🎯 Overall Progress: ${Math.round(this.metrics.overallProgress)}%`);
    
    if (this.metrics.trends) {
      console.log('\n📈 DAILY CHANGES:');
      console.log(`Components: ${this.metrics.trends.componentCount >= 0 ? '+' : ''}${this.metrics.trends.componentCount}`);
      console.log(`Type Safety: ${this.metrics.trends.typeSafetyViolations >= 0 ? '+' : ''}${this.metrics.trends.typeSafetyViolations}`);
      console.log(`Nuclear Patterns: ${this.metrics.trends.nuclearPatterns >= 0 ? '+' : ''}${this.metrics.trends.nuclearPatterns}`);
      console.log(`God Components: ${this.metrics.trends.godComponents >= 0 ? '+' : ''}${this.metrics.trends.godComponents}`);
      console.log(`Progress: ${this.metrics.trends.overallProgress >= 0 ? '+' : ''}${Math.round(this.metrics.trends.overallProgress)}%`);
    }
    
    // Progress breakdown
    console.log('\n🎯 PROGRESS BREAKDOWN:');
    console.log(`Component Reduction: ${Math.round(this.metrics.progress.componentReduction)}%`);
    console.log(`Type Safety: ${Math.round(this.metrics.progress.typeSafetyProgress)}%`);
    console.log(`Nuclear Elimination: ${Math.round(this.metrics.progress.nuclearElimination)}%`);
    console.log(`Architecture Cleanup: ${Math.round(this.metrics.progress.architectureCleanup)}%`);
  }

  // Save detailed metrics
  saveMetrics() {
    const metricsPath = path.join(process.cwd(), 'daily-metrics.json');
    fs.writeFileSync(metricsPath, JSON.stringify(this.metrics, null, 2));
    console.log(`\n💾 Metrics saved to ${metricsPath}`);
  }

  // Run complete metrics collection
  async run() {
    console.log('🔍 Collecting daily metrics...');
    
    this.collectCodebaseMetrics();
    this.checkBuildStatus();
    this.calculateProgress();
    this.generateTrends();
    this.generateReport();
    this.saveMetrics();
    
    console.log('\n✅ Metrics collection complete!');
    return this.metrics;
  }
}

// Run if called directly
if (require.main === module) {
  const metrics = new DailyMetrics();
  metrics.run().catch(error => {
    console.error('❌ Metrics collection failed:', error);
    process.exit(1);
  });
}

module.exports = DailyMetrics;
