/**
 * Elite Performance Monitor - Netflix/Google-Level Performance Tracking
 * Real-time performance monitoring with automatic optimization alerts
 * Implements Core Web Vitals tracking and component-level profiling
 */

interface PerformanceMetric {
  name: string;
  value: number;
  type: string;
  timestamp: number;
  component?: string;
  route?: string;
  userId?: string;
  buildVersion?: string;
}

interface CoreWebVitals {
  FCP: number | null; // First Contentful Paint
  LCP: number | null; // Largest Contentful Paint
  FID: number | null; // First Input Delay
  CLS: number | null; // Cumulative Layout Shift
  TTFB: number | null; // Time to First Byte
  INP: number | null; // Interaction to Next Paint
}

interface ComponentPerformanceData {
  name: string;
  renderTime: number;
  renderCount: number;
  averageRenderTime: number;
  maxRenderTime: number;
  minRenderTime: number;
  memoryUsage: number;
  lastRender: number;
}

interface PerformanceBudget {
  FCP: number;
  LCP: number;
  FID: number;
  CLS: number;
  componentRender: number;
  bundleSize: number;
  apiResponse: number;
}

/**
 * Elite performance monitoring system with automatic optimization
 */
export class PerformanceMonitor {
  private observer: PerformanceObserver | null = null;
  private metrics: Map<string, PerformanceMetric[]> = new Map();
  private componentData: Map<string, ComponentPerformanceData> = new Map();
  private coreWebVitals: CoreWebVitals = {
    FCP: null,
    LCP: null,
    FID: null,
    CLS: null,
    TTFB: null,
    INP: null
  };
  
  private performanceBudget: PerformanceBudget = {
    FCP: 1500,      // 1.5s
    LCP: 2500,      // 2.5s
    FID: 100,       // 100ms
    CLS: 0.1,       // 0.1
    componentRender: 50, // 50ms
    bundleSize: 200000,  // 200KB
    apiResponse: 1000    // 1s
  };

  private alertCallbacks: Array<(metric: PerformanceMetric) => void> = [];
  private isEnabled: boolean = true;
  private sampling: number = 1.0; // 100% sampling in development

  constructor(options: { 
    budget?: Partial<PerformanceBudget>;
    sampling?: number;
    enableAlerting?: boolean;
  } = {}) {
    if (options.budget) {
      this.performanceBudget = { ...this.performanceBudget, ...options.budget };
    }
    
    this.sampling = options.sampling ?? 1.0;
    this.isEnabled = options.enableAlerting ?? true;

    this.initializeObserver();
    this.startCoreWebVitalsMonitoring();
    this.startMemoryMonitoring();
  }

  /**
   * Initialize PerformanceObserver for automatic metric collection
   */
  private initializeObserver(): void {
    if (!window.PerformanceObserver) {
      console.warn('PerformanceObserver not supported');
      return;
    }

    try {
      this.observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.processPerformanceEntry(entry);
        }
      });

      // Observe all performance metrics
      this.observer.observe({
        entryTypes: [
          'measure',
          'navigation', 
          'paint',
          'largest-contentful-paint',
          'layout-shift',
          'first-input',
          'element'
        ]
      });

      console.log('Performance Monitor initialized successfully');
    } catch (error) {
      console.warn('Failed to initialize PerformanceObserver:', error);
    }
  }

  /**
   * Process performance entries and update metrics
   */
  private processPerformanceEntry(entry: PerformanceEntry): void {
    if (Math.random() > this.sampling) return;

    const metric: PerformanceMetric = {
      name: entry.name,
      value: entry.duration || (entry as PerformanceEntry & { value?: number }).value || 0,
      type: entry.entryType,
      timestamp: Date.now(),
      route: window.location.pathname,
      buildVersion: process.env.VITE_APP_VERSION || 'unknown'
    };

    // Update Core Web Vitals
    this.updateCoreWebVitals(entry, metric);

    // Store metric
    const metricKey = `${entry.entryType}-${entry.name}`;
    if (!this.metrics.has(metricKey)) {
      this.metrics.set(metricKey, []);
    }
    this.metrics.get(metricKey)!.push(metric);

    // Check performance budget violations
    this.checkPerformanceBudget(metric);

    // Log significant performance issues
    this.logPerformanceIssues(metric);
  }

  /**
   * Update Core Web Vitals metrics
   */
  private updateCoreWebVitals(entry: PerformanceEntry, metric: PerformanceMetric): void {
    switch (entry.entryType) {
      case 'paint':
        if (entry.name === 'first-contentful-paint') {
          this.coreWebVitals.FCP = metric.value;
        }
        break;
      
      case 'largest-contentful-paint':
        this.coreWebVitals.LCP = metric.value;
        break;
      
      case 'first-input':
        this.coreWebVitals.FID = metric.value;
        break;
      
      case 'layout-shift':
        const layoutShift = entry as PerformanceEntry & {
          hadRecentInput?: boolean;
          value: number;
        };
        if (!layoutShift.hadRecentInput) {
          this.coreWebVitals.CLS = (this.coreWebVitals.CLS || 0) + layoutShift.value;
        }
        break;

      case 'navigation':
        const navEntry = entry as PerformanceNavigationTiming;
        this.coreWebVitals.TTFB = navEntry.responseStart - navEntry.requestStart;
        break;
    }
  }

  /**
   * Measure component render performance
   */
  measureComponentRender<T>(
    componentName: string, 
    renderFn: () => T,
    props?: Record<string, unknown>
  ): T {
    if (!this.isEnabled) return renderFn();

    const startTime = performance.now();
    const startMemory = (performance as Performance & {
      memory?: {
        usedJSHeapSize: number;
        totalJSHeapSize: number;
        jsHeapSizeLimit: number;
      };
    }).memory?.usedJSHeapSize || 0;
    
    performance.mark(`${componentName}-render-start`);
    
    try {
      const result = renderFn();
      
      const endTime = performance.now();
      const endMemory = (performance as Performance & {
        memory?: {
          usedJSHeapSize: number;
          totalJSHeapSize: number;
          jsHeapSizeLimit: number;
        };
      }).memory?.usedJSHeapSize || 0;
      const renderTime = endTime - startTime;
      const memoryDelta = endMemory - startMemory;
      
      performance.mark(`${componentName}-render-end`);
      performance.measure(
        `${componentName}-render`,
        `${componentName}-render-start`,
        `${componentName}-render-end`
      );

      // Update component performance data
      this.updateComponentData(componentName, renderTime, memoryDelta);

      // Alert on slow renders
      if (renderTime > this.performanceBudget.componentRender) {
        this.alertSlowRender(componentName, renderTime, props);
      }

      return result;
    } catch (error) {
      performance.clearMarks(`${componentName}-render-start`);
      throw error;
    }
  }

  /**
   * Update component performance statistics
   */
  private updateComponentData(componentName: string, renderTime: number, memoryDelta: number): void {
    const existing = this.componentData.get(componentName);
    
    if (existing) {
      existing.renderCount++;
      existing.renderTime += renderTime;
      existing.averageRenderTime = existing.renderTime / existing.renderCount;
      existing.maxRenderTime = Math.max(existing.maxRenderTime, renderTime);
      existing.minRenderTime = Math.min(existing.minRenderTime, renderTime);
      existing.memoryUsage += memoryDelta;
      existing.lastRender = Date.now();
    } else {
      this.componentData.set(componentName, {
        name: componentName,
        renderTime,
        renderCount: 1,
        averageRenderTime: renderTime,
        maxRenderTime: renderTime,
        minRenderTime: renderTime,
        memoryUsage: memoryDelta,
        lastRender: Date.now()
      });
    }
  }

  /**
   * Measure API call performance
   */
  async measureAPICall<T>(
    endpoint: string,
    apiCall: () => Promise<T>,
    options: { timeout?: number; retries?: number } = {}
  ): Promise<T> {
    const startTime = performance.now();
    const measureName = `api-${endpoint}`;
    
    performance.mark(`${measureName}-start`);
    
    try {
      const result = await apiCall();
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      performance.mark(`${measureName}-end`);
      performance.measure(measureName, `${measureName}-start`, `${measureName}-end`);
      
      // Log slow API calls
      if (duration > this.performanceBudget.apiResponse) {
        console.warn(`Slow API call detected: ${endpoint} took ${duration.toFixed(2)}ms`);
        this.reportMetric({
          name: endpoint,
          value: duration,
          type: 'api-slow',
          timestamp: Date.now()
        });
      }
      
      return result;
    } catch (error) {
      performance.clearMarks(`${measureName}-start`);
      this.reportMetric({
        name: endpoint,
        value: performance.now() - startTime,
        type: 'api-error',
        timestamp: Date.now()
      });
      throw error;
    }
  }

  /**
   * Start Core Web Vitals monitoring using web-vitals library approach
   */
  private startCoreWebVitalsMonitoring(): void {
    // Monitor INP (Interaction to Next Paint)
    if ('PerformanceEventTiming' in window) {
      const interactionId = 0;
      const interactionMap = new Map();

      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'event') {
            const eventEntry = entry as PerformanceEntry & {
              interactionId?: number;
              processingStart?: number;
            };
            if (eventEntry.interactionId) {
              interactionMap.set(eventEntry.interactionId, eventEntry.processingStart);
            }
          }
        }
      }).observe({ entryTypes: ['event'] });
    }

    // Monitor Long Tasks
    if ('PerformanceLongTaskTiming' in window) {
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          console.warn(`Long task detected: ${entry.duration.toFixed(2)}ms`);
          this.reportMetric({
            name: 'long-task',
            value: entry.duration,
            type: 'performance-issue',
            timestamp: Date.now()
          });
        }
      }).observe({ entryTypes: ['longtask'] });
    }
  }

  /**
   * Monitor memory usage
   */
  private startMemoryMonitoring(): void {
    if (!(performance as Performance & {
      memory?: {
        usedJSHeapSize: number;
        totalJSHeapSize: number;
        jsHeapSizeLimit: number;
      };
    }).memory) return;

    setInterval(() => {
      const memory = (performance as Performance & {
        memory: {
          usedJSHeapSize: number;
          totalJSHeapSize: number;
          jsHeapSizeLimit: number;
        };
      }).memory;
      const used = memory.usedJSHeapSize;
      const total = memory.totalJSHeapSize;
      const limit = memory.jsHeapSizeLimit;

      // Alert on high memory usage
      if (used / limit > 0.8) {
        console.warn(`High memory usage: ${(used / 1024 / 1024).toFixed(2)}MB`);
        this.reportMetric({
          name: 'memory-usage-high',
          value: used,
          type: 'memory-warning',
          timestamp: Date.now()
        });
      }
    }, 10000); // Check every 10 seconds
  }

  /**
   * Check performance budget violations
   */
  private checkPerformanceBudget(metric: PerformanceMetric): void {
    const violations: string[] = [];

    // Check Core Web Vitals against budget
    if (this.coreWebVitals.FCP && this.coreWebVitals.FCP > this.performanceBudget.FCP) {
      violations.push(`FCP: ${this.coreWebVitals.FCP}ms > ${this.performanceBudget.FCP}ms`);
    }

    if (this.coreWebVitals.LCP && this.coreWebVitals.LCP > this.performanceBudget.LCP) {
      violations.push(`LCP: ${this.coreWebVitals.LCP}ms > ${this.performanceBudget.LCP}ms`);
    }

    if (this.coreWebVitals.FID && this.coreWebVitals.FID > this.performanceBudget.FID) {
      violations.push(`FID: ${this.coreWebVitals.FID}ms > ${this.performanceBudget.FID}ms`);
    }

    if (this.coreWebVitals.CLS && this.coreWebVitals.CLS > this.performanceBudget.CLS) {
      violations.push(`CLS: ${this.coreWebVitals.CLS} > ${this.performanceBudget.CLS}`);
    }

    if (violations.length > 0) {
      console.warn('Performance budget violations:', violations);
      this.triggerAlerts({
        ...metric,
        name: 'performance-budget-violation',
        type: 'budget-violation'
      });
    }
  }

  /**
   * Log performance issues for monitoring
   */
  private logPerformanceIssues(metric: PerformanceMetric): void {
    // Log to external monitoring service in production
    if (process.env.NODE_ENV === 'production') {
      // Would integrate with services like DataDog, NewRelic, etc.
      this.sendToMonitoringService(metric);
    }

    // Local development logging
    if (process.env.NODE_ENV === 'development') {
      if (metric.value > 1000) { // >1s operations
        console.warn(`Performance issue detected:`, metric);
      }
    }
  }

  /**
   * Alert on slow component renders
   */
  private alertSlowRender(componentName: string, renderTime: number, props?: Record<string, unknown>): void {
    console.warn(`Slow render detected: ${componentName} took ${renderTime.toFixed(2)}ms`, {
      component: componentName,
      renderTime,
      props,
      budget: this.performanceBudget.componentRender
    });

    this.triggerAlerts({
      name: componentName,
      value: renderTime,
      type: 'slow-render',
      timestamp: Date.now(),
      component: componentName
    });
  }

  /**
   * Trigger performance alerts
   */
  private triggerAlerts(metric: PerformanceMetric): void {
    this.alertCallbacks.forEach(callback => {
      try {
        callback(metric);
      } catch (error) {
        console.error('Alert callback error:', error);
      }
    });
  }

  /**
   * Send metrics to external monitoring service
   */
  private sendToMonitoringService(metric: PerformanceMetric): void {
    // Implementation would depend on monitoring service
    // Example for DataDog, NewRelic, or custom analytics
    if (window.fetch) {
      fetch('/api/metrics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(metric)
      }).catch(error => {
        console.warn('Failed to send metric to monitoring service:', error);
      });
    }
  }

  /**
   * Public API methods
   */
  
  public reportMetric(metric: Omit<PerformanceMetric, 'timestamp'>): void {
    this.processPerformanceEntry({
      name: metric.name,
      entryType: metric.type,
      duration: metric.value,
      startTime: 0
    } as PerformanceEntry);
  }

  public addAlertCallback(callback: (metric: PerformanceMetric) => void): () => void {
    this.alertCallbacks.push(callback);
    return () => {
      const index = this.alertCallbacks.indexOf(callback);
      if (index > -1) {
        this.alertCallbacks.splice(index, 1);
      }
    };
  }

  public getCoreWebVitals(): CoreWebVitals {
    return { ...this.coreWebVitals };
  }

  public getComponentPerformance(): ComponentPerformanceData[] {
    return Array.from(this.componentData.values());
  }

  public getMetrics(type?: string): PerformanceMetric[] {
    if (type) {
      return Array.from(this.metrics.values())
        .flat()
        .filter(metric => metric.type === type);
    }
    return Array.from(this.metrics.values()).flat();
  }

  public getBudgetStatus(): { 
    violations: string[];
    grade: 'A' | 'B' | 'C' | 'D' | 'F';
    score: number;
  } {
    const violations: string[] = [];
    let score = 100;

    // Check each budget item
    Object.entries(this.performanceBudget).forEach(([key, budget]) => {
      const current = this.getCurrentValueForBudget(key);
      if (current > budget) {
        violations.push(`${key}: ${current} > ${budget}`);
        score -= 20;
      }
    });

    const grade = score >= 90 ? 'A' : score >= 80 ? 'B' : score >= 70 ? 'C' : score >= 60 ? 'D' : 'F';
    
    return { violations, grade, score: Math.max(0, score) };
  }

  private getCurrentValueForBudget(key: string): number {
    switch (key) {
      case 'FCP': return this.coreWebVitals.FCP || 0;
      case 'LCP': return this.coreWebVitals.LCP || 0;
      case 'FID': return this.coreWebVitals.FID || 0;
      case 'CLS': return this.coreWebVitals.CLS || 0;
      case 'componentRender': 
        const components = this.getComponentPerformance();
        return Math.max(...components.map(c => c.maxRenderTime), 0);
      default: return 0;
    }
  }

  public updateBudget(newBudget: Partial<PerformanceBudget>): void {
    this.performanceBudget = { ...this.performanceBudget, ...newBudget };
  }

  public destroy(): void {
    if (this.observer) {
      this.observer.disconnect();
    }
    this.metrics.clear();
    this.componentData.clear();
    this.alertCallbacks = [];
  }
}

/**
 * Global performance monitor instance
 */
export const globalPerformanceMonitor = new PerformanceMonitor({
  budget: {
    FCP: 1500,
    LCP: 2500,
    FID: 100,
    CLS: 0.1,
    componentRender: 50,
    bundleSize: 200000,
    apiResponse: 1000
  },
  sampling: process.env.NODE_ENV === 'production' ? 0.1 : 1.0 // 10% sampling in production
});