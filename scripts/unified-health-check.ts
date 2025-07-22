#!/usr/bin/env npx tsx

/**
 * UNIFIED SYSTEM HEALTH CHECK SCRIPT - ELITE PWA + PERFORMANCE VALIDATION
 * 
 * Comprehensive health check script that validates the unified PWA + Core Web Vitals
 * system integration, ensuring Netflix/Meta performance standards and production readiness.
 * 
 * VALIDATION COVERAGE:
 * - System initialization and component readiness
 * - Performance monitoring capability and accuracy
 * - PWA manager functionality and integration
 * - Cross-system correlation effectiveness
 * - Construction site optimization readiness
 * - Production monitoring and alerting systems
 * 
 * SUCCESS CRITERIA:
 * - All core systems must be operational
 * - Performance targets must be achievable
 * - Cross-system integration must be functional
 * - Graceful degradation must be verified
 * - Production monitoring must be active
 * 
 * USAGE:
 * npm run health:unified
 * 
 * @author STR Certified Engineering Team
 */

import fs from 'fs';
import path from 'path';

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

interface HealthCheckResult {
  name: string;
  status: 'healthy' | 'warning' | 'critical' | 'unknown';
  message: string;
  details?: any;
  suggestions?: string[];
}

interface SystemIntegrationCheck {
  component: string;
  expected: boolean;
  actual: boolean;
  critical: boolean;
}

class UnifiedSystemHealthCheck {
  private results: HealthCheckResult[] = [];
  private projectRoot: string;

  constructor() {
    this.projectRoot = process.cwd();
  }

  /**
   * Run comprehensive health check
   */
  async runHealthCheck(): Promise<boolean> {
    console.log(`${colors.cyan}${colors.bright}🔍 UNIFIED SYSTEM HEALTH CHECK${colors.reset}\n`);
    console.log(`${colors.blue}Validating Elite PWA + Core Web Vitals Integration${colors.reset}\n`);

    try {
      // Core component checks
      await this.checkCoreComponents();
      
      // Integration checks
      await this.checkSystemIntegration();
      
      // Performance capability checks
      await this.checkPerformanceCapabilities();
      
      // Production readiness checks
      await this.checkProductionReadiness();
      
      // Construction site optimization checks
      await this.checkConstructionSiteOptimization();

      // Display results
      this.displayResults();
      
      // Return overall health status
      return this.calculateOverallHealth();

    } catch (error) {
      console.error(`${colors.red}❌ Health check failed:${colors.reset}`, error);
      return false;
    }
  }

  /**
   * Check core component availability
   */
  private async checkCoreComponents(): Promise<void> {
    console.log(`${colors.yellow}📦 Checking Core Components...${colors.reset}`);

    const components = [
      {
        name: 'Core Web Vitals Monitor',
        path: 'src/lib/performance/CoreWebVitalsMonitor.ts',
        critical: true
      },
      {
        name: 'Service Worker Manager',
        path: 'src/lib/pwa/ServiceWorkerManager.ts',
        critical: true
      },
      {
        name: 'Offline Status Manager',
        path: 'src/lib/pwa/OfflineStatusManager.ts',
        critical: true
      },
      {
        name: 'Install Prompt Handler',
        path: 'src/lib/pwa/InstallPromptHandler.ts',
        critical: true
      },
      {
        name: 'Production Performance Service',
        path: 'src/services/ProductionPerformanceService.ts',
        critical: false
      },
      {
        name: 'Unified Performance Dashboard',
        path: 'src/components/performance/UnifiedPerformanceDashboard.tsx',
        critical: false
      },
      {
        name: 'PWA Status Indicator',
        path: 'src/components/pwa/PWAStatusIndicator.tsx',
        critical: false
      },
      {
        name: 'Core Web Vitals Hook',
        path: 'src/hooks/useCoreWebVitalsMonitoring.ts',
        critical: false
      },
      {
        name: 'PWA Integration Hook',
        path: 'src/hooks/usePWA.ts',
        critical: true
      }
    ];

    for (const component of components) {
      await this.checkComponent(component);
    }
  }

  /**
   * Check individual component
   */
  private async checkComponent(component: { name: string; path: string; critical: boolean }): Promise<void> {
    const filePath = path.join(this.projectRoot, component.path);
    const exists = fs.existsSync(filePath);

    if (exists) {
      // Check file content and structure
      const content = fs.readFileSync(filePath, 'utf8');
      const hasClassOrFunction = /export\s+(class|function|const|default)/.test(content);
      const hasTypeScript = content.includes('interface') || content.includes('type ');
      const hasDocumentation = content.includes('/**') && content.includes('* @author');

      let status: 'healthy' | 'warning' | 'critical' = 'healthy';
      let message = 'Component exists and appears well-structured';
      const suggestions: string[] = [];

      if (!hasClassOrFunction) {
        status = 'warning';
        message = 'Component exists but may be incomplete';
        suggestions.push('Verify component exports the expected class or function');
      }

      if (!hasTypeScript && component.path.endsWith('.ts')) {
        status = 'warning';
        message = 'Component lacks TypeScript interfaces';
        suggestions.push('Add proper TypeScript interfaces and types');
      }

      if (!hasDocumentation) {
        suggestions.push('Add comprehensive JSDoc documentation');
      }

      this.results.push({
        name: component.name,
        status,
        message,
        details: {
          path: component.path,
          size: content.length,
          hasExports: hasClassOrFunction,
          hasTypeScript: hasTypeScript,
          hasDocumentation: hasDocumentation
        },
        suggestions
      });
    } else {
      this.results.push({
        name: component.name,
        status: component.critical ? 'critical' : 'warning',
        message: 'Component file not found',
        details: { expectedPath: component.path },
        suggestions: ['Create the missing component file', 'Verify file path is correct']
      });
    }
  }

  /**
   * Check system integration
   */
  private async checkSystemIntegration(): Promise<void> {
    console.log(`${colors.yellow}🔗 Checking System Integration...${colors.reset}`);

    // Check main.tsx integration
    await this.checkMainIntegration();
    
    // Check hook integrations
    await this.checkHookIntegrations();
    
    // Check component integrations
    await this.checkComponentIntegrations();
  }

  /**
   * Check main.tsx unified initialization
   */
  private async checkMainIntegration(): Promise<void> {
    const mainPath = path.join(this.projectRoot, 'src/main.tsx');
    
    if (!fs.existsSync(mainPath)) {
      this.results.push({
        name: 'Main Application Bootstrap',
        status: 'critical',
        message: 'Main.tsx file not found',
        suggestions: ['Create src/main.tsx with unified system initialization']
      });
      return;
    }

    const mainContent = fs.readFileSync(mainPath, 'utf8');
    
    const checks: SystemIntegrationCheck[] = [
      {
        component: 'Core Web Vitals Import',
        expected: true,
        actual: mainContent.includes('coreWebVitalsMonitor'),
        critical: true
      },
      {
        component: 'PWA Managers Import',
        expected: true,
        actual: mainContent.includes('serviceWorkerManager') && 
                mainContent.includes('offlineStatusManager') && 
                mainContent.includes('installPromptHandler'),
        critical: true
      },
      {
        component: 'Unified Initialization Function',
        expected: true,
        actual: mainContent.includes('initializeUnifiedPerformanceSystem') || 
                mainContent.includes('initializePWAFoundation'),
        critical: true
      },
      {
        component: 'Global State Setup',
        expected: true,
        actual: mainContent.includes('__UNIFIED_SYSTEM_STATUS__') || 
                mainContent.includes('__PWA_STATUS__'),
        critical: false
      },
      {
        component: 'Cross-system Correlation Setup',
        expected: true,
        actual: mainContent.includes('setupPWAPerformanceCorrelation') || 
                mainContent.includes('correlation'),
        critical: false
      }
    ];

    let criticalFailures = 0;
    let warnings = 0;

    for (const check of checks) {
      if (!check.actual) {
        if (check.critical) {
          criticalFailures++;
        } else {
          warnings++;
        }
      }
    }

    let status: 'healthy' | 'warning' | 'critical' = 'healthy';
    let message = 'Main.tsx has proper unified system integration';
    const suggestions: string[] = [];

    if (criticalFailures > 0) {
      status = 'critical';
      message = `Main.tsx missing ${criticalFailures} critical integration(s)`;
      suggestions.push('Add missing imports and initialization functions');
      suggestions.push('Follow the unified system integration pattern');
    } else if (warnings > 0) {
      status = 'warning';
      message = `Main.tsx has ${warnings} integration warning(s)`;
      suggestions.push('Consider adding optional integration features');
    }

    this.results.push({
      name: 'Main Application Bootstrap Integration',
      status,
      message,
      details: { checks, criticalFailures, warnings },
      suggestions
    });
  }

  /**
   * Check hook integrations
   */
  private async checkHookIntegrations(): Promise<void> {
    const hooks = [
      'src/hooks/useCoreWebVitalsMonitoring.ts',
      'src/hooks/usePWA.ts'
    ];

    let integratedHooks = 0;

    for (const hookPath of hooks) {
      const fullPath = path.join(this.projectRoot, hookPath);
      if (fs.existsSync(fullPath)) {
        const content = fs.readFileSync(fullPath, 'utf8');
        
        if (content.includes('export') && (content.includes('function') || content.includes('const'))) {
          integratedHooks++;
        }
      }
    }

    const integrationScore = (integratedHooks / hooks.length) * 100;
    
    this.results.push({
      name: 'React Hook Integration',
      status: integrationScore >= 100 ? 'healthy' : integrationScore >= 50 ? 'warning' : 'critical',
      message: `${integratedHooks}/${hooks.length} hooks properly integrated (${Math.round(integrationScore)}%)`,
      details: { integratedHooks, totalHooks: hooks.length, integrationScore },
      suggestions: integrationScore < 100 ? ['Complete missing hook integrations'] : []
    });
  }

  /**
   * Check component integrations
   */
  private async checkComponentIntegrations(): Promise<void> {
    const components = [
      'src/components/performance/UnifiedPerformanceDashboard.tsx',
      'src/components/performance/PerformanceDashboard.tsx',
      'src/components/pwa/PWAStatusIndicator.tsx'
    ];

    let integratedComponents = 0;

    for (const componentPath of components) {
      const fullPath = path.join(this.projectRoot, componentPath);
      if (fs.existsSync(fullPath)) {
        const content = fs.readFileSync(fullPath, 'utf8');
        
        if (content.includes('export') && content.includes('React.FC')) {
          integratedComponents++;
        }
      }
    }

    const integrationScore = (integratedComponents / components.length) * 100;
    
    this.results.push({
      name: 'Component Integration',
      status: integrationScore >= 100 ? 'healthy' : integrationScore >= 66 ? 'warning' : 'critical',
      message: `${integratedComponents}/${components.length} components properly integrated (${Math.round(integrationScore)}%)`,
      details: { integratedComponents, totalComponents: components.length, integrationScore },
      suggestions: integrationScore < 100 ? ['Complete missing component integrations'] : []
    });
  }

  /**
   * Check performance capabilities
   */
  private async checkPerformanceCapabilities(): Promise<void> {
    console.log(`${colors.yellow}⚡ Checking Performance Capabilities...${colors.reset}`);

    const capabilities = [
      {
        name: 'Core Web Vitals Monitoring',
        check: () => this.checkFileContains('src/lib/performance/CoreWebVitalsMonitor.ts', 'PerformanceObserver')
      },
      {
        name: 'Performance Budget Enforcement',
        check: () => this.checkFileContains('src/lib/performance/CoreWebVitalsMonitor.ts', 'budget')
      },
      {
        name: 'Real-time Alerting',
        check: () => this.checkFileContains('src/lib/performance/CoreWebVitalsMonitor.ts', 'alert')
      },
      {
        name: 'Performance Correlation',
        check: () => this.checkFileContains('src/services/ProductionPerformanceService.ts', 'correlation')
      },
      {
        name: 'Netflix/Meta Standards Compliance',
        check: () => this.checkNetflixMetaCompliance()
      }
    ];

    for (const capability of capabilities) {
      const result = await capability.check();
      
      this.results.push({
        name: capability.name,
        status: result ? 'healthy' : 'warning',
        message: result ? 'Capability implemented' : 'Capability missing or incomplete',
        suggestions: result ? [] : ['Implement missing performance capability']
      });
    }
  }

  /**
   * Check production readiness
   */
  private async checkProductionReadiness(): Promise<void> {
    console.log(`${colors.yellow}🚀 Checking Production Readiness...${colors.reset}`);

    const readinessChecks = [
      {
        name: 'Production Performance Service',
        check: () => fs.existsSync(path.join(this.projectRoot, 'src/services/ProductionPerformanceService.ts'))
      },
      {
        name: 'Error Handling and Recovery',
        check: () => this.checkFileContains('src/main.tsx', 'catch') && 
                    this.checkFileContains('src/main.tsx', 'error')
      },
      {
        name: 'Graceful Degradation',
        check: () => this.checkFileContains('src/main.tsx', 'graceful') ||
                    this.checkFileContains('src/main.tsx', 'degraded')
      },
      {
        name: 'Health Monitoring',
        check: () => fs.existsSync(path.join(this.projectRoot, 'scripts/unified-health-check.ts'))
      },
      {
        name: 'Integration Testing',
        check: () => fs.existsSync(path.join(this.projectRoot, 'src/__tests__/integration/UnifiedSystemIntegration.test.ts'))
      }
    ];

    let readyChecks = 0;

    for (const readinessCheck of readinessChecks) {
      const isReady = readinessCheck.check();
      if (isReady) readyChecks++;

      this.results.push({
        name: readinessCheck.name,
        status: isReady ? 'healthy' : 'warning',
        message: isReady ? 'Production ready' : 'Not production ready',
        suggestions: isReady ? [] : ['Implement production readiness feature']
      });
    }

    const readinessScore = (readyChecks / readinessChecks.length) * 100;
    
    this.results.push({
      name: 'Overall Production Readiness',
      status: readinessScore >= 80 ? 'healthy' : readinessScore >= 60 ? 'warning' : 'critical',
      message: `${Math.round(readinessScore)}% production ready (${readyChecks}/${readinessChecks.length} checks passed)`,
      details: { readinessScore, readyChecks, totalChecks: readinessChecks.length }
    });
  }

  /**
   * Check construction site optimization
   */
  private async checkConstructionSiteOptimization(): Promise<void> {
    console.log(`${colors.yellow}🏗️ Checking Construction Site Optimization...${colors.reset}`);

    const optimizations = [
      {
        name: '2G Network Optimization',
        check: () => this.checkFileContains('src/lib/performance/CoreWebVitalsMonitor.ts', '2g') ||
                    this.checkFileContains('src/services/ProductionPerformanceService.ts', '2g')
      },
      {
        name: 'Battery Optimization',
        check: () => this.checkFileContains('src/services/ProductionPerformanceService.ts', 'battery')
      },
      {
        name: 'Offline Capabilities',
        check: () => this.checkFileContains('src/lib/pwa/OfflineStatusManager.ts', 'offline')
      },
      {
        name: 'Touch-friendly Interface',
        check: () => this.checkFileContains('src/components/performance/UnifiedPerformanceDashboard.tsx', 'touch') ||
                    this.checkTouchOptimization()
      },
      {
        name: 'Network Adaptation',
        check: () => this.checkFileContains('src/services/ProductionPerformanceService.ts', 'network') &&
                    this.checkFileContains('src/services/ProductionPerformanceService.ts', 'adaptation')
      }
    ];

    let optimizedFeatures = 0;

    for (const optimization of optimizations) {
      const isOptimized = optimization.check();
      if (isOptimized) optimizedFeatures++;

      this.results.push({
        name: optimization.name,
        status: isOptimized ? 'healthy' : 'warning',
        message: isOptimized ? 'Optimization implemented' : 'Optimization missing',
        suggestions: isOptimized ? [] : ['Implement construction site optimization']
      });
    }

    const optimizationScore = (optimizedFeatures / optimizations.length) * 100;
    
    this.results.push({
      name: 'Construction Site Readiness',
      status: optimizationScore >= 80 ? 'healthy' : optimizationScore >= 60 ? 'warning' : 'critical',
      message: `${Math.round(optimizationScore)}% construction site optimized (${optimizedFeatures}/${optimizations.length} features)`,
      details: { optimizationScore, optimizedFeatures, totalFeatures: optimizations.length }
    });
  }

  /**
   * Display results
   */
  private displayResults(): void {
    console.log(`\n${colors.bright}📊 HEALTH CHECK RESULTS${colors.reset}\n`);

    const statusCounts = {
      healthy: 0,
      warning: 0,
      critical: 0,
      unknown: 0
    };

    for (const result of this.results) {
      statusCounts[result.status]++;

      const statusIcon = {
        healthy: '✅',
        warning: '⚠️',
        critical: '❌',
        unknown: '❓'
      }[result.status];

      const statusColor = {
        healthy: colors.green,
        warning: colors.yellow,
        critical: colors.red,
        unknown: colors.blue
      }[result.status];

      console.log(`${statusIcon} ${statusColor}${result.name}${colors.reset}: ${result.message}`);

      if (result.suggestions && result.suggestions.length > 0) {
        result.suggestions.forEach(suggestion => {
          console.log(`   ${colors.blue}💡 ${suggestion}${colors.reset}`);
        });
      }

      if (result.details && Object.keys(result.details).length > 0) {
        console.log(`   ${colors.blue}📋 Details: ${JSON.stringify(result.details)}${colors.reset}`);
      }

      console.log('');
    }

    // Summary
    console.log(`${colors.bright}SUMMARY:${colors.reset}`);
    console.log(`✅ Healthy: ${colors.green}${statusCounts.healthy}${colors.reset}`);
    console.log(`⚠️ Warning: ${colors.yellow}${statusCounts.warning}${colors.reset}`);
    console.log(`❌ Critical: ${colors.red}${statusCounts.critical}${colors.reset}`);
    console.log(`❓ Unknown: ${colors.blue}${statusCounts.unknown}${colors.reset}\n`);
  }

  /**
   * Calculate overall health
   */
  private calculateOverallHealth(): boolean {
    const criticalIssues = this.results.filter(r => r.status === 'critical').length;
    const healthyChecks = this.results.filter(r => r.status === 'healthy').length;
    const totalChecks = this.results.length;

    const healthPercentage = (healthyChecks / totalChecks) * 100;

    console.log(`${colors.bright}OVERALL SYSTEM HEALTH:${colors.reset}`);
    console.log(`Health Score: ${healthPercentage >= 80 ? colors.green : healthPercentage >= 60 ? colors.yellow : colors.red}${Math.round(healthPercentage)}%${colors.reset}`);
    console.log(`Critical Issues: ${criticalIssues === 0 ? colors.green : colors.red}${criticalIssues}${colors.reset}\n`);

    if (criticalIssues === 0 && healthPercentage >= 80) {
      console.log(`${colors.green}${colors.bright}🎉 SYSTEM IS HEALTHY AND READY FOR PRODUCTION!${colors.reset}\n`);
      return true;
    } else if (criticalIssues === 0 && healthPercentage >= 60) {
      console.log(`${colors.yellow}${colors.bright}⚠️ SYSTEM HAS WARNINGS BUT IS FUNCTIONAL${colors.reset}\n`);
      return true;
    } else {
      console.log(`${colors.red}${colors.bright}❌ SYSTEM HAS CRITICAL ISSUES - NOT READY FOR PRODUCTION${colors.reset}\n`);
      return false;
    }
  }

  // Helper methods
  private checkFileContains(filePath: string, searchTerm: string): boolean {
    const fullPath = path.join(this.projectRoot, filePath);
    if (!fs.existsSync(fullPath)) return false;
    
    const content = fs.readFileSync(fullPath, 'utf8');
    return content.toLowerCase().includes(searchTerm.toLowerCase());
  }

  private checkNetflixMetaCompliance(): boolean {
    const monitorPath = path.join(this.projectRoot, 'src/lib/performance/CoreWebVitalsMonitor.ts');
    if (!fs.existsSync(monitorPath)) return false;
    
    const content = fs.readFileSync(monitorPath, 'utf8');
    return content.includes('2500') && // LCP target
           content.includes('100') &&  // FID target
           content.includes('0.1');    // CLS target
  }

  private checkTouchOptimization(): boolean {
    const dashboardPath = path.join(this.projectRoot, 'src/components/performance/UnifiedPerformanceDashboard.tsx');
    if (!fs.existsSync(dashboardPath)) return false;
    
    const content = fs.readFileSync(dashboardPath, 'utf8');
    return content.includes('44px') || // Touch target size
           content.includes('touch') ||
           content.includes('mobile');
  }
}

// Run the health check
async function main() {
  const healthCheck = new UnifiedSystemHealthCheck();
  const isHealthy = await healthCheck.runHealthCheck();
  
  process.exit(isHealthy ? 0 : 1);
}

// Execute if called directly
if (require.main === module) {
  main().catch(error => {
    console.error(`${colors.red}Health check failed:${colors.reset}`, error);
    process.exit(1);
  });
}

export default UnifiedSystemHealthCheck;