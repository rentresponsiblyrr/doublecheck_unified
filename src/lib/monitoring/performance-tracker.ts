import { errorReporter } from './error-reporter';
// TEMPORARILY DISABLE TO FIX CRASH  
// import { env } from '../config/environment';

export interface PerformanceMetric {
  name: string;
  value: number;
  unit: 'ms' | 's' | 'bytes' | 'count' | 'percent';
  timestamp: string;
  tags?: Record<string, string>;
  metadata?: Record<string, any>;
}

export interface PerformanceReport {
  metrics: PerformanceMetric[];
  summary: {
    pageLoadTime: number;
    timeToInteractive: number;
    firstContentfulPaint: number;
    largestContentfulPaint: number;
    cumulativeLayoutShift: number;
    firstInputDelay: number;
    totalBlockingTime: number;
  };
  resources: ResourceTiming[];
  userAgent: string;
  url: string;
  timestamp: string;
  sessionId: string;
}

export interface ResourceTiming {
  name: string;
  type: string;
  duration: number;
  size: number;
  cached: boolean;
}

export interface AIProcessingMetrics {
  operationType: string;
  duration: number;
  modelUsed: string;
  inputSize: number;
  outputSize: number;
  success: boolean;
  error?: string;
  metadata?: Record<string, any>;
}

export interface TrackerConfig {
  enableWebVitals?: boolean;
  enableResourceTiming?: boolean;
  enableAIMetrics?: boolean;
  enableUserTiming?: boolean;
  sampleRate?: number;
  slowThreshold?: {
    pageLoad?: number;
    api?: number;
    ai?: number;
    database?: number;
  };
  reportInterval?: number;
  maxMetricsQueue?: number;
}

const DEFAULT_CONFIG: TrackerConfig = {
  enableWebVitals: true,
  enableResourceTiming: true,
  enableAIMetrics: true,
  enableUserTiming: true,
  sampleRate: import.meta.env.PROD ? 0.1 : 1.0,
  slowThreshold: {
    pageLoad: 3000,
    api: 1000,
    ai: 5000,
    database: 500,
  },
  reportInterval: 60000, // 1 minute
  maxMetricsQueue: 100,
};

export class PerformanceTracker {
  private static instance: PerformanceTracker;
  private config: TrackerConfig;
  private metricsQueue: PerformanceMetric[] = [];
  private observer: PerformanceObserver | null = null;
  private reportTimer: NodeJS.Timeout | null = null;
  private sessionId: string;
  private isInitialized = false;

  private constructor() {
    this.config = DEFAULT_CONFIG;
    this.sessionId = this.generateSessionId();
  }

  static getInstance(): PerformanceTracker {
    if (!PerformanceTracker.instance) {
      PerformanceTracker.instance = new PerformanceTracker();
    }
    return PerformanceTracker.instance;
  }

  /**
   * Initialize performance tracking
   */
  initialize(config?: Partial<TrackerConfig>) {
    if (this.isInitialized) return;

    this.config = { ...DEFAULT_CONFIG, ...config };

    // Check if we should track based on sample rate
    if (Math.random() > (this.config.sampleRate || 1)) {
      console.log('[PerformanceTracker] Skipping initialization due to sampling');
      return;
    }

    if (this.config.enableWebVitals) {
      this.setupWebVitals();
    }

    if (this.config.enableResourceTiming) {
      this.setupResourceTiming();
    }

    if (this.config.enableUserTiming) {
      this.setupUserTiming();
    }

    this.startReportTimer();
    this.isInitialized = true;

    // Track initial page load
    this.trackPageLoad();

    if (import.meta.env.DEV) {
      console.log('[PerformanceTracker] Initialized with config:', this.config);
    }
  }

  /**
   * Track page load performance
   */
  private trackPageLoad() {
    if (!window.performance || !window.performance.timing) return;

    // Wait for page to be fully loaded
    if (document.readyState !== 'complete') {
      window.addEventListener('load', () => this.trackPageLoad());
      return;
    }

    const timing = window.performance.timing;
    const navigation = window.performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;

    const metrics = {
      pageLoadTime: timing.loadEventEnd - timing.navigationStart,
      domContentLoaded: timing.domContentLoadedEventEnd - timing.navigationStart,
      timeToFirstByte: timing.responseStart - timing.navigationStart,
      dnsLookup: timing.domainLookupEnd - timing.domainLookupStart,
      tcpConnection: timing.connectEnd - timing.connectStart,
      request: timing.responseStart - timing.requestStart,
      response: timing.responseEnd - timing.responseStart,
      domProcessing: timing.domComplete - timing.domLoading,
    };

    // Track each metric
    Object.entries(metrics).forEach(([name, value]) => {
      this.trackMetric(name, value, 'ms', { category: 'page_load' });
    });

    // Check for slow page load
    if (metrics.pageLoadTime > (this.config.slowThreshold?.pageLoad || 3000)) {
      this.reportSlowOperation('page_load', metrics.pageLoadTime, metrics);
    }
  }

  /**
   * Setup Web Vitals tracking
   */
  private setupWebVitals() {
    if (!window.PerformanceObserver) return;

    try {
      // Track Largest Contentful Paint (LCP)
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1] as any;
        this.trackMetric('lcp', lastEntry.startTime, 'ms', { 
          category: 'web_vitals',
          element: lastEntry.element?.tagName,
        });
      });
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });

      // Track First Input Delay (FID)
      const fidObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          this.trackMetric('fid', entry.processingStart - entry.startTime, 'ms', {
            category: 'web_vitals',
            eventType: entry.name,
          });
        });
      });
      fidObserver.observe({ entryTypes: ['first-input'] });

      // Track Cumulative Layout Shift (CLS)
      let clsValue = 0;
      const clsObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
          }
        });
        this.trackMetric('cls', clsValue, 'count', { category: 'web_vitals' });
      });
      clsObserver.observe({ entryTypes: ['layout-shift'] });

    } catch (error) {
      console.error('[PerformanceTracker] Error setting up Web Vitals:', error);
    }
  }

  /**
   * Setup resource timing tracking
   */
  private setupResourceTiming() {
    if (!window.PerformanceObserver) return;

    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          if (entry.entryType === 'resource') {
            const resource: ResourceTiming = {
              name: entry.name,
              type: entry.initiatorType,
              duration: entry.duration,
              size: entry.transferSize || 0,
              cached: entry.transferSize === 0 && entry.decodedBodySize > 0,
            };

            // Track slow resources
            if (resource.duration > 1000) {
              this.trackMetric('slow_resource', resource.duration, 'ms', {
                category: 'resource',
                url: resource.name,
                type: resource.type,
                cached: resource.cached,
              });
            }
          }
        });
      });

      observer.observe({ entryTypes: ['resource'] });
      this.observer = observer;
    } catch (error) {
      console.error('[PerformanceTracker] Error setting up resource timing:', error);
    }
  }

  /**
   * Setup user timing tracking
   */
  private setupUserTiming() {
    if (!window.PerformanceObserver) return;

    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          if (entry.entryType === 'measure') {
            this.trackMetric(entry.name, entry.duration, 'ms', {
              category: 'user_timing',
              startMark: (entry as PerformanceMeasure).detail?.start,
              endMark: (entry as PerformanceMeasure).detail?.end,
            });
          }
        });
      });

      observer.observe({ entryTypes: ['measure'] });
    } catch (error) {
      console.error('[PerformanceTracker] Error setting up user timing:', error);
    }
  }

  /**
   * Track a custom metric
   */
  trackMetric(
    name: string,
    value: number,
    unit: PerformanceMetric['unit'] = 'ms',
    metadata?: Record<string, any>
  ) {
    const metric: PerformanceMetric = {
      name,
      value,
      unit,
      timestamp: new Date().toISOString(),
      tags: {
        environment: import.meta.env.MODE,
        ...metadata?.tags,
      },
      metadata,
    };

    this.metricsQueue.push(metric);

    // Flush if queue is full
    if (this.metricsQueue.length >= (this.config.maxMetricsQueue || 100)) {
      this.flush();
    }

    // Log in development
    if (import.meta.env.DEV) {
      console.log('[PerformanceTracker] Metric:', metric);
    }
  }

  /**
   * Track API call performance
   */
  trackApiCall(url: string, method: string, duration: number, status: number) {
    this.trackMetric('api_call', duration, 'ms', {
      category: 'api',
      url,
      method,
      status,
      success: status >= 200 && status < 300,
    });

    // Check for slow API calls
    if (duration > (this.config.slowThreshold?.api || 1000)) {
      this.reportSlowOperation('api', duration, { url, method, status });
    }
  }

  /**
   * Track AI processing performance
   */
  trackAIProcessing(metrics: AIProcessingMetrics) {
    this.trackMetric('ai_processing', metrics.duration, 'ms', {
      category: 'ai',
      operation: metrics.operationType,
      model: metrics.modelUsed,
      inputSize: metrics.inputSize,
      outputSize: metrics.outputSize,
      success: metrics.success,
      ...metrics.metadata,
    });

    // Check for slow AI operations
    if (metrics.duration > (this.config.slowThreshold?.ai || 5000)) {
      this.reportSlowOperation('ai', metrics.duration, metrics);
    }

    // Report errors
    if (!metrics.success && metrics.error) {
      errorReporter.reportError(new Error(`AI Processing Failed: ${metrics.error}`), {
        category: 'ai',
        operation: metrics.operationType,
        model: metrics.modelUsed,
      });
    }
  }

  /**
   * Track database query performance
   */
  trackDatabaseQuery(query: string, duration: number, success: boolean, rowCount?: number) {
    this.trackMetric('database_query', duration, 'ms', {
      category: 'database',
      query: this.sanitizeQuery(query),
      success,
      rowCount,
    });

    // Check for slow queries
    if (duration > (this.config.slowThreshold?.database || 500)) {
      this.reportSlowOperation('database', duration, { query, rowCount });
    }
  }

  /**
   * Create a performance mark
   */
  mark(name: string) {
    if (window.performance && window.performance.mark) {
      window.performance.mark(name);
    }
  }

  /**
   * Measure between two marks
   */
  measure(name: string, startMark: string, endMark?: string) {
    if (window.performance && window.performance.measure) {
      try {
        window.performance.measure(name, startMark, endMark);
      } catch (error) {
        console.error('[PerformanceTracker] Error creating measure:', error);
      }
    }
  }

  /**
   * Start a timer for measuring operations
   */
  startTimer(name: string): () => number {
    const startTime = performance.now();
    const markName = `${name}_start`;
    this.mark(markName);

    return () => {
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      this.measure(name, markName);
      this.trackMetric(name, duration, 'ms', { category: 'timer' });
      
      return duration;
    };
  }

  /**
   * Report slow operations
   */
  private reportSlowOperation(type: string, duration: number, details: any) {
    errorReporter.addBreadcrumb({
      type: 'custom',
      category: 'performance',
      message: `Slow ${type} operation: ${duration}ms`,
      level: 'warning',
      data: details,
    });

    // Log to console in development
    if (import.meta.env.DEV) {
      console.warn(`[PerformanceTracker] Slow ${type} operation:`, {
        duration,
        details,
      });
    }
  }

  /**
   * Get current performance summary
   */
  getPerformanceSummary(): PerformanceReport['summary'] {
    const navigation = window.performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    const paint = window.performance.getEntriesByType('paint');

    const fcp = paint.find(entry => entry.name === 'first-contentful-paint');
    const lcp = this.metricsQueue.find(m => m.name === 'lcp')?.value || 0;
    const fid = this.metricsQueue.find(m => m.name === 'fid')?.value || 0;
    const cls = this.metricsQueue.find(m => m.name === 'cls')?.value || 0;

    return {
      pageLoadTime: navigation?.loadEventEnd - navigation?.fetchStart || 0,
      timeToInteractive: navigation?.domInteractive - navigation?.fetchStart || 0,
      firstContentfulPaint: fcp?.startTime || 0,
      largestContentfulPaint: lcp,
      cumulativeLayoutShift: cls,
      firstInputDelay: fid,
      totalBlockingTime: this.calculateTotalBlockingTime(),
    };
  }

  /**
   * Calculate total blocking time
   */
  private calculateTotalBlockingTime(): number {
    // Temporarily disabled to avoid deprecated API warnings
    return 0;
    
    // TODO: Replace with modern performance API
    // const longTasks = window.performance.getEntriesByType('longtask') as any[];
    // return longTasks.reduce((total, task) => {
    //   const blockingTime = task.duration - 50; // Tasks over 50ms are considered blocking
    //   return total + (blockingTime > 0 ? blockingTime : 0);
    // }, 0);
  }

  /**
   * Flush metrics to monitoring service
   */
  private async flush() {
    if (this.metricsQueue.length === 0) return;

    const report: PerformanceReport = {
      metrics: [...this.metricsQueue],
      summary: this.getPerformanceSummary(),
      resources: this.getResourceTimings(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      timestamp: new Date().toISOString(),
      sessionId: this.sessionId,
    };

    this.metricsQueue = [];

    try {
      // In production, send to monitoring service
      if (import.meta.env.PROD) {
        await this.sendToMonitoringService(report);
      }

      // Log summary in development
      if (import.meta.env.DEV) {
        console.log('[PerformanceTracker] Performance Report:', report);
      }
    } catch (error) {
      console.error('[PerformanceTracker] Failed to flush metrics:', error);
    }
  }

  /**
   * Get resource timings
   */
  private getResourceTimings(): ResourceTiming[] {
    const entries = window.performance.getEntriesByType('resource') as PerformanceResourceTiming[];
    
    return entries
      .slice(-50) // Last 50 resources
      .map(entry => ({
        name: entry.name,
        type: entry.initiatorType,
        duration: entry.duration,
        size: entry.transferSize || 0,
        cached: entry.transferSize === 0 && entry.decodedBodySize > 0,
      }));
  }

  /**
   * Send report to monitoring service
   */
  private async sendToMonitoringService(report: PerformanceReport) {
    // Implementation would depend on the monitoring service used
    // This is a placeholder for the actual implementation
  }

  /**
   * Sanitize database queries
   */
  private sanitizeQuery(query: string): string {
    // Remove potentially sensitive data from queries
    return query
      .replace(/\b\d{4,}\b/g, 'XXX') // Replace long numbers
      .replace(/(['"])([^'"]{20,})\1/g, '$1...$1') // Truncate long strings
      .substring(0, 200); // Limit length
  }

  /**
   * Start report timer
   */
  private startReportTimer() {
    if (this.reportTimer) return;

    this.reportTimer = setInterval(() => {
      this.flush();
    }, this.config.reportInterval || 60000);
  }

  /**
   * Utility methods
   */
  private generateSessionId(): string {
    return `perf_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Cleanup and destroy
   */
  destroy() {
    if (this.observer) {
      this.observer.disconnect();
    }

    if (this.reportTimer) {
      clearInterval(this.reportTimer);
    }

    this.flush();
  }
}

// Export singleton instance
export const performanceTracker = PerformanceTracker.getInstance();

// Export convenience functions
export const trackMetric = (name: string, value: number, unit?: PerformanceMetric['unit'], metadata?: any) =>
  performanceTracker.trackMetric(name, value, unit, metadata);

export const trackApiCall = (url: string, method: string, duration: number, status: number) =>
  performanceTracker.trackApiCall(url, method, duration, status);

export const trackAIProcessing = (metrics: AIProcessingMetrics) =>
  performanceTracker.trackAIProcessing(metrics);

export const startTimer = (name: string) =>
  performanceTracker.startTimer(name);

// Initialize on import if in browser
if (typeof window !== 'undefined') {
  performanceTracker.initialize();
}