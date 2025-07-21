/**
 * BLEEDING EDGE: Google PageSpeed 100 Validator
 * 
 * Professional PageSpeed validation and optimization that targets 100% scores
 * - Real-time PageSpeed API integration
 * - Automated performance audits
 * - Advanced optimization recommendations
 * - Performance regression detection
 * - Continuous monitoring and alerting
 */

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

// Type definitions for API responses and audit data
type AuditDetails = Record<string, unknown>;
type AuditRecord = Record<string, {
  id: string;
  title: string;
  description: string;
  score: number;
  scoreDisplayMode?: string;
  numericValue?: number;
  details?: AuditDetails;
}>;
type MetricsData = Record<string, number>;
type PageSpeedAPIResponse = {
  lighthouseResult: {
    categories: {
      performance: { score: number };
    };
    audits: AuditRecord;
  };
};

export interface PageSpeedResult {
  score: number;
  metrics: {
    firstContentfulPaint: number;
    largestContentfulPaint: number;
    firstInputDelay: number;
    cumulativeLayoutShift: number;
    speedIndex: number;
    timeToInteractive: number;
    totalBlockingTime: number;
  };
  opportunities: Array<{
    id: string;
    title: string;
    description: string;
    score: number;
    numericValue: number;
    details: AuditDetails;
  }>;
  diagnostics: Array<{
    id: string;
    title: string;
    description: string;
    score: number;
    details: AuditDetails;
  }>;
  audits: AuditRecord;
}

export interface ValidationConfig {
  apiKey?: string;
  strategy: 'mobile' | 'desktop';
  categories: Array<'performance' | 'accessibility' | 'best-practices' | 'seo' | 'pwa'>;
  url: string;
  enableMonitoring: boolean;
  monitoringInterval: number; // minutes
  alertThreshold: number; // score below which to alert
  locale: string;
}

export interface PerformanceRegression {
  metric: string;
  previousValue: number;
  currentValue: number;
  change: number;
  severity: 'critical' | 'major' | 'minor';
  timestamp: number;
}

export interface OptimizationRecommendation {
  id: string;
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  effort: 'high' | 'medium' | 'low';
  category: 'critical' | 'opportunity' | 'diagnostic';
  implementation: string;
  estimatedGain: number;
}

// ============================================================================
// BLEEDING EDGE PAGESPEED VALIDATOR
// ============================================================================

export class PageSpeedValidator {
  private config: ValidationConfig;
  private lastResult: PageSpeedResult | null = null;
  private monitoring = false;
  private monitoringTimer?: NodeJS.Timeout;
  private regressionHistory: PerformanceRegression[] = [];

  constructor(config: Partial<ValidationConfig>) {
    this.config = {
      strategy: 'mobile',
      categories: ['performance', 'accessibility', 'best-practices', 'seo'],
      url: window.location.origin,
      enableMonitoring: true,
      monitoringInterval: 60, // 1 hour
      alertThreshold: 90,
      locale: 'en',
      ...config
    };
  }

  // ============================================================================
  // CORE VALIDATION METHODS
  // ============================================================================

  /**
   * BLEEDING EDGE: Run comprehensive PageSpeed audit
   */
  public async runAudit(url?: string): Promise<PageSpeedResult> {
    const targetUrl = url || this.config.url;
    
    
    try {
      // Use PageSpeed Insights API
      if (this.config.apiKey) {
        return await this.runPageSpeedAPI(targetUrl);
      } else {
        // Fallback to local performance measurement
        return await this.runLocalAudit(targetUrl);
      }
    } catch (error) {
      throw new PageSpeedError('Failed to run PageSpeed audit', error);
    }
  }

  /**
   * BLEEDING EDGE: Local performance audit without API
   */
  private async runLocalAudit(url: string): Promise<PageSpeedResult> {

    // Collect performance metrics using Navigation Timing API
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    const paint = performance.getEntriesByType('paint');
    const lcpEntries = performance.getEntriesByType('largest-contentful-paint');
    
    // Calculate metrics
    const fcp = paint.find(entry => entry.name === 'first-contentful-paint')?.startTime || 0;
    const lcp = lcpEntries.length > 0 ? lcpEntries[lcpEntries.length - 1].startTime : 0;
    const tti = navigation.loadEventEnd - navigation.loadEventStart;
    const fid = this.estimateFID();
    const cls = this.measureCLS();
    const speedIndex = this.calculateSpeedIndex();
    const tbt = this.calculateTotalBlockingTime();

    // Calculate overall score based on Core Web Vitals
    const score = this.calculateLocalScore({
      firstContentfulPaint: fcp,
      largestContentfulPaint: lcp,
      firstInputDelay: fid,
      cumulativeLayoutShift: cls,
      speedIndex,
      timeToInteractive: tti,
      totalBlockingTime: tbt
    });

    const result: PageSpeedResult = {
      score,
      metrics: {
        firstContentfulPaint: fcp,
        largestContentfulPaint: lcp,
        firstInputDelay: fid,
        cumulativeLayoutShift: cls,
        speedIndex,
        timeToInteractive: tti,
        totalBlockingTime: tbt
      },
      opportunities: await this.generateLocalOpportunities(),
      diagnostics: await this.generateLocalDiagnostics(),
      audits: {}
    };

    this.lastResult = result;
    this.checkForRegressions(result);
    
    return result;
  }

  /**
   * BLEEDING EDGE: PageSpeed Insights API integration
   */
  private async runPageSpeedAPI(url: string): Promise<PageSpeedResult> {
    const apiUrl = 'https://www.googleapis.com/pagespeedonline/v5/runPagespeed';
    const params = new URLSearchParams({
      url: url,
      strategy: this.config.strategy,
      category: this.config.categories.join(','),
      locale: this.config.locale,
      key: this.config.apiKey!
    });

    const response = await fetch(`${apiUrl}?${params}`);
    if (!response.ok) {
      throw new Error(`PageSpeed API error: ${response.status}`);
    }

    const data = await response.json();
    return this.parsePageSpeedResponse(data);
  }

  private parsePageSpeedResponse(data: PageSpeedAPIResponse): PageSpeedResult {
    const lighthouseResult = data.lighthouseResult;
    const categories = lighthouseResult.categories;
    const audits = lighthouseResult.audits;

    // Extract Core Web Vitals
    const metrics = {
      firstContentfulPaint: this.extractMetric(audits, 'first-contentful-paint'),
      largestContentfulPaint: this.extractMetric(audits, 'largest-contentful-paint'),
      firstInputDelay: this.extractMetric(audits, 'max-potential-fid'),
      cumulativeLayoutShift: this.extractMetric(audits, 'cumulative-layout-shift'),
      speedIndex: this.extractMetric(audits, 'speed-index'),
      timeToInteractive: this.extractMetric(audits, 'interactive'),
      totalBlockingTime: this.extractMetric(audits, 'total-blocking-time')
    };

    // Extract opportunities and diagnostics
    const opportunities = Object.values(audits)
      .filter((audit) => audit.scoreDisplayMode === 'numeric' && audit.score < 0.9)
      .map((audit) => ({
        id: audit.id,
        title: audit.title,
        description: audit.description,
        score: audit.score,
        numericValue: audit.numericValue,
        details: audit.details
      }));

    const diagnostics = Object.values(audits)
      .filter((audit) => audit.scoreDisplayMode === 'informative' && audit.score !== null)
      .map((audit) => ({
        id: audit.id,
        title: audit.title,
        description: audit.description,
        score: audit.score,
        details: audit.details
      }));

    const result: PageSpeedResult = {
      score: Math.round(categories.performance.score * 100),
      metrics,
      opportunities,
      diagnostics,
      audits
    };

    this.lastResult = result;
    this.checkForRegressions(result);

    return result;
  }

  // ============================================================================
  // LOCAL PERFORMANCE MEASUREMENT
  // ============================================================================

  private estimateFID(): number {
    // Estimate FID based on main thread blocking time
    const longTasks = performance.getEntriesByType('longtask');
    if (longTasks.length === 0) return 0;

    const totalBlockingTime = longTasks.reduce((sum, task) => {
      const blockingTime = Math.max(0, task.duration - 50);
      return sum + blockingTime;
    }, 0);

    // Simple heuristic: FID correlates with TBT
    return Math.min(300, totalBlockingTime * 0.3);
  }

  private measureCLS(): number {
    // Get CLS from Performance Observer if available
    const clsEntries = performance.getEntriesByType('layout-shift');
    let clsScore = 0;

    for (const entry of clsEntries) {
      const layoutShift = entry as PerformanceEntry & {
        hadRecentInput?: boolean;
        value?: number;
      };
      if (!layoutShift.hadRecentInput) {
        clsScore += layoutShift.value || 0;
      }
    }

    return clsScore;
  }

  private calculateSpeedIndex(): number {
    // Simplified Speed Index calculation
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    const paint = performance.getEntriesByType('paint');
    
    const fcp = paint.find(entry => entry.name === 'first-contentful-paint')?.startTime || 0;
    const domContentLoaded = navigation.domContentLoadedEventEnd;
    
    // Simple heuristic based on visual progress
    return (fcp + domContentLoaded) / 2;
  }

  private calculateTotalBlockingTime(): number {
    const longTasks = performance.getEntriesByType('longtask');
    
    return longTasks.reduce((sum, task) => {
      const blockingTime = Math.max(0, task.duration - 50);
      return sum + blockingTime;
    }, 0);
  }

  private calculateLocalScore(metrics: MetricsData): number {
    // Weighted scoring based on Core Web Vitals
    const weights = {
      lcp: 0.25,
      fid: 0.25,
      cls: 0.25,
      fcp: 0.1,
      si: 0.1,
      tti: 0.05
    };

    const scores = {
      lcp: this.scoreMetric(metrics.largestContentfulPaint, [2500, 4000]),
      fid: this.scoreMetric(metrics.firstInputDelay, [100, 300]),
      cls: this.scoreMetric(metrics.cumulativeLayoutShift, [0.1, 0.25]),
      fcp: this.scoreMetric(metrics.firstContentfulPaint, [1800, 3000]),
      si: this.scoreMetric(metrics.speedIndex, [3400, 5800]),
      tti: this.scoreMetric(metrics.timeToInteractive, [3800, 7300])
    };

    const weightedScore = Object.entries(weights).reduce((sum, [metric, weight]) => {
      return sum + (scores[metric as keyof typeof scores] * weight);
    }, 0);

    return Math.round(weightedScore * 100);
  }

  private scoreMetric(value: number, thresholds: [number, number]): number {
    const [good, poor] = thresholds;
    
    if (value <= good) return 1;
    if (value >= poor) return 0;
    
    // Linear interpolation between good and poor
    return 1 - ((value - good) / (poor - good));
  }

  // ============================================================================
  // OPTIMIZATION RECOMMENDATIONS
  // ============================================================================

  private async generateLocalOpportunities(): Promise<Array<{
    id: string;
    title: string;
    description: string;
    score: number;
    numericValue: number;
    details: AuditDetails;
  }>> {
    const opportunities = [];

    // Resource optimization opportunities
    const resources = performance.getEntriesByType('resource');
    const largeResources = resources.filter(r => r.transferSize > 100 * 1024);
    
    if (largeResources.length > 0) {
      opportunities.push({
        id: 'optimize-images',
        title: 'Optimize Images',
        description: 'Properly sized images can save bandwidth and improve load times',
        score: 0.7,
        numericValue: largeResources.reduce((sum, r) => sum + r.transferSize, 0),
        details: largeResources.map(r => ({ url: r.name, size: r.transferSize }))
      });
    }

    // JavaScript optimization
    const scriptResources = resources.filter(r => r.name.includes('.js'));
    if (scriptResources.length > 10) {
      opportunities.push({
        id: 'reduce-javascript',
        title: 'Reduce JavaScript',
        description: 'Consider code splitting and removing unused JavaScript',
        score: 0.6,
        numericValue: scriptResources.reduce((sum, r) => sum + r.transferSize, 0),
        details: scriptResources.map(r => ({ url: r.name, size: r.transferSize }))
      });
    }

    // CSS optimization
    const cssResources = resources.filter(r => r.name.includes('.css'));
    if (cssResources.some(r => r.transferSize > 50 * 1024)) {
      opportunities.push({
        id: 'minify-css',
        title: 'Minify CSS',
        description: 'Minifying CSS can reduce file sizes and improve load times',
        score: 0.8,
        numericValue: cssResources.reduce((sum, r) => sum + r.transferSize, 0),
        details: cssResources.map(r => ({ url: r.name, size: r.transferSize }))
      });
    }

    return opportunities;
  }

  private async generateLocalDiagnostics(): Promise<Array<{
    id: string;
    title: string;
    description: string;
    score: number;
    details: AuditDetails;
  }>> {
    const diagnostics = [];

    // Check for render-blocking resources
    const cssResources = performance.getEntriesByType('resource')
      .filter(r => r.name.includes('.css'));
    
    if (cssResources.length > 3) {
      diagnostics.push({
        id: 'render-blocking-resources',
        title: 'Eliminate render-blocking resources',
        description: 'Resources are blocking the first paint of your page',
        score: 0.5,
        details: cssResources.map(r => ({ url: r.name }))
      });
    }

    // Check for unused CSS
    if (document.styleSheets.length > 5) {
      diagnostics.push({
        id: 'unused-css-rules',
        title: 'Reduce unused CSS',
        description: 'Reduce unused rules from stylesheets',
        score: 0.7,
        details: { stylesheets: document.styleSheets.length }
      });
    }

    return diagnostics;
  }

  public generateOptimizationPlan(result: PageSpeedResult): OptimizationRecommendation[] {
    const recommendations: OptimizationRecommendation[] = [];

    // Core Web Vitals specific recommendations
    if (result.metrics.largestContentfulPaint > 2500) {
      recommendations.push({
        id: 'optimize-lcp',
        title: 'Optimize Largest Contentful Paint',
        description: 'Improve LCP by optimizing images, server response times, and render-blocking resources',
        impact: 'high',
        effort: 'medium',
        category: 'critical',
        implementation: 'Preload LCP element, optimize images, use CDN',
        estimatedGain: Math.round((result.metrics.largestContentfulPaint - 2500) / 25)
      });
    }

    if (result.metrics.firstInputDelay > 100) {
      recommendations.push({
        id: 'reduce-fid',
        title: 'Reduce First Input Delay',
        description: 'Minimize main thread work and reduce JavaScript execution time',
        impact: 'high',
        effort: 'high',
        category: 'critical',
        implementation: 'Code splitting, defer non-critical JS, use web workers',
        estimatedGain: Math.round((result.metrics.firstInputDelay - 100) / 10)
      });
    }

    if (result.metrics.cumulativeLayoutShift > 0.1) {
      recommendations.push({
        id: 'improve-cls',
        title: 'Improve Cumulative Layout Shift',
        description: 'Set explicit dimensions for images and reserve space for dynamic content',
        impact: 'high',
        effort: 'low',
        category: 'critical',
        implementation: 'Add width/height attributes, use aspect-ratio CSS, font-display: swap',
        estimatedGain: Math.round((result.metrics.cumulativeLayoutShift - 0.1) * 100)
      });
    }

    // Process opportunities
    result.opportunities.forEach(opportunity => {
      if (opportunity.score < 0.9) {
        recommendations.push({
          id: opportunity.id,
          title: opportunity.title,
          description: opportunity.description,
          impact: opportunity.score < 0.5 ? 'high' : 'medium',
          effort: 'medium',
          category: 'opportunity',
          implementation: this.getImplementationGuidance(opportunity.id),
          estimatedGain: Math.round((1 - opportunity.score) * 20)
        });
      }
    });

    // Sort by impact and estimated gain
    return recommendations.sort((a, b) => {
      const impactWeight = { high: 3, medium: 2, low: 1 };
      const aWeight = impactWeight[a.impact] * a.estimatedGain;
      const bWeight = impactWeight[b.impact] * b.estimatedGain;
      return bWeight - aWeight;
    });
  }

  private getImplementationGuidance(opportunityId: string): string {
    const guidance: Record<string, string> = {
      'optimize-images': 'Use modern image formats (WebP, AVIF), implement lazy loading, serve responsive images',
      'reduce-javascript': 'Implement code splitting, tree shaking, and remove unused dependencies',
      'minify-css': 'Use CSS minification tools, remove unused CSS, implement critical CSS',
      'render-blocking-resources': 'Inline critical CSS, defer non-critical CSS, use media queries',
      'server-response-time': 'Optimize database queries, use caching, implement CDN',
      'preload-key-requests': 'Use <link rel="preload"> for critical resources'
    };

    return guidance[opportunityId] || 'Refer to PageSpeed Insights documentation for specific guidance';
  }

  // ============================================================================
  // MONITORING & REGRESSION DETECTION
  // ============================================================================

  public startMonitoring(): void {
    if (this.monitoring) return;
    
    this.monitoring = true;
    
    this.monitoringTimer = setInterval(async () => {
      try {
        const result = await this.runAudit();
        
        if (result.score < this.config.alertThreshold) {
          this.triggerAlert(result);
        }
      } catch (error) {
      }
    }, this.config.monitoringInterval * 60 * 1000);
  }

  public stopMonitoring(): void {
    if (this.monitoringTimer) {
      clearInterval(this.monitoringTimer);
      this.monitoringTimer = undefined;
    }
    this.monitoring = false;
  }

  private checkForRegressions(currentResult: PageSpeedResult): void {
    if (!this.lastResult) return;

    const regressions: PerformanceRegression[] = [];

    // Check each metric for regression
    Object.entries(currentResult.metrics).forEach(([metric, currentValue]) => {
      const previousValue = (this.lastResult!.metrics as MetricsData)[metric];
      
      if (previousValue && currentValue > previousValue) {
        const change = currentValue - previousValue;
        const changePercent = (change / previousValue) * 100;
        
        let severity: PerformanceRegression['severity'] = 'minor';
        if (changePercent > 50) severity = 'critical';
        else if (changePercent > 20) severity = 'major';
        
        regressions.push({
          metric,
          previousValue,
          currentValue,
          change: changePercent,
          severity,
          timestamp: Date.now()
        });
      }
    });

    if (regressions.length > 0) {
      this.regressionHistory.push(...regressions);
      this.handleRegressions(regressions);
    }
  }

  private handleRegressions(regressions: PerformanceRegression[]): void {
    regressions.forEach(regression => {
      const emoji = regression.severity === 'critical' ? '🚨' : 
                   regression.severity === 'major' ? '⚠️' : '⚪';
      
      log.warn(
        `${emoji} Performance regression detected: ${regression.metric} ` +
        `${regression.previousValue.toFixed(1)} → ${regression.currentValue.toFixed(1)} ` +
        `(+${regression.change.toFixed(1)}%)`
      );
    });
  }

  private triggerAlert(result: PageSpeedResult): void {
    
    // In production, this would send alerts via email, Slack, etc.
    if (typeof window !== 'undefined' && 'Notification' in window) {
      new Notification('PageSpeed Alert', {
        body: `Performance score dropped to ${result.score}/100`,
        icon: '/favicon.ico'
      });
    }
  }

  private extractMetric(audits: AuditRecord, metricId: string): number {
    const audit = audits[metricId];
    return audit ? (audit.numericValue || 0) : 0;
  }

  // ============================================================================
  // PUBLIC API
  // ============================================================================

  public getLastResult(): PageSpeedResult | null {
    return this.lastResult;
  }

  public getRegressionHistory(): PerformanceRegression[] {
    return [...this.regressionHistory];
  }

  public generateReport(): string {
    if (!this.lastResult) return 'No audit results available';

    const result = this.lastResult;
    const recommendations = this.generateOptimizationPlan(result);

    let report = `
🎯 BLEEDING EDGE: PageSpeed 100 Validation Report
===============================================
Overall Score: ${result.score}/100 ${result.score >= 90 ? '🟢' : result.score >= 50 ? '🟡' : '🔴'}

Core Web Vitals:
🎨 LCP: ${result.metrics.largestContentfulPaint.toFixed(1)}ms ${result.metrics.largestContentfulPaint <= 2500 ? '✅' : '❌'}
⚡ FID: ${result.metrics.firstInputDelay.toFixed(1)}ms ${result.metrics.firstInputDelay <= 100 ? '✅' : '❌'}
📐 CLS: ${result.metrics.cumulativeLayoutShift.toFixed(3)} ${result.metrics.cumulativeLayoutShift <= 0.1 ? '✅' : '❌'}

Additional Metrics:
🎨 FCP: ${result.metrics.firstContentfulPaint.toFixed(1)}ms
📊 SI: ${result.metrics.speedIndex.toFixed(1)}ms
🎯 TTI: ${result.metrics.timeToInteractive.toFixed(1)}ms
⏱️ TBT: ${result.metrics.totalBlockingTime.toFixed(1)}ms

Top Optimization Opportunities:
`;

    recommendations.slice(0, 5).forEach((rec, index) => {
      const impact = rec.impact === 'high' ? '🔴' : rec.impact === 'medium' ? '🟡' : '🟢';
      report += `${index + 1}. ${impact} ${rec.title} (+${rec.estimatedGain} points)\n`;
      report += `   ${rec.description}\n`;
    });

    return report;
  }

  public async validatePageSpeed100(): Promise<boolean> {
    
    const result = await this.runAudit();
    const is100Score = result.score >= 100;
    
    if (is100Score) {
    } else {
    }
    
    return is100Score;
  }
}

// ============================================================================
// ERROR CLASS
// ============================================================================

export class PageSpeedError extends Error {
  constructor(message: string, public cause?: Error) {
    super(message);
    this.name = 'PageSpeedError';
  }
}

// ============================================================================
// FACTORY FUNCTION
// ============================================================================

export function createPageSpeedValidator(config?: Partial<ValidationConfig>): PageSpeedValidator {
  return new PageSpeedValidator(config);
}

// ============================================================================
// INTEGRATION HOOK
// ============================================================================

import React from 'react';

export function usePageSpeedValidator(config?: Partial<ValidationConfig>) {
  const [validator, setValidator] = React.useState<PageSpeedValidator | null>(null);
  const [result, setResult] = React.useState<PageSpeedResult | null>(null);
  const [isValidating, setIsValidating] = React.useState(false);

  React.useEffect(() => {
    const instance = createPageSpeedValidator(config);
    setValidator(instance);

    // Start monitoring if enabled
    if (config?.enableMonitoring) {
      instance.startMonitoring();
    }

    return () => {
      instance.stopMonitoring();
    };
  }, []);

  const runAudit = React.useCallback(async (url?: string) => {
    if (!validator || isValidating) return;

    setIsValidating(true);
    try {
      const auditResult = await validator.runAudit(url);
      setResult(auditResult);
      return auditResult;
    } catch (error) {
      throw error;
    } finally {
      setIsValidating(false);
    }
  }, [validator, isValidating]);

  return {
    validator,
    result,
    isValidating,
    runAudit,
    validatePageSpeed100: validator?.validatePageSpeed100.bind(validator),
    generateReport: validator?.generateReport.bind(validator),
    getOptimizationPlan: result ? validator?.generateOptimizationPlan.bind(validator, result) : undefined
  };
}