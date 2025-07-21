/**
 * Performance Monitoring System
 * Tracks application performance, user interactions, and system health
 */

import { supabase } from '@/integrations/supabase/client';

// Type definitions for performance monitoring
type ContextData = Record<string, string | number | boolean | null | undefined>;
type MetadataRecord = Record<string, unknown>;
type ErrorContext = Record<string, unknown>;
type PerformanceMemory = {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
};
type NetworkConnection = {
  effectiveType: string;
  downlink: number;
  rtt: number;
};

export interface PerformanceMetric {
  name: string;
  value: number;
  unit: string;
  timestamp: number;
  context?: ContextData;
  tags?: Record<string, string>;
}

export interface UserInteraction {
  type: 'click' | 'navigation' | 'form_submit' | 'file_upload' | 'ai_request' | 'error';
  element?: string;
  page: string;
  timestamp: number;
  duration?: number;
  metadata?: MetadataRecord;
  userId?: string;
}

export interface SystemHealth {
  metric: string;
  value: number;
  status: 'healthy' | 'warning' | 'critical';
  timestamp: number;
  details?: ContextData;
}

class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: PerformanceMetric[] = [];
  private interactions: UserInteraction[] = [];
  private batchSize = 50;
  private flushInterval = 30000; // 30 seconds
  private observer: PerformanceObserver | null = null;
  private intersectionObserver: IntersectionObserver | null = null;
  private navigationObserver: PerformanceObserver | null = null;

  private constructor() {
    this.initializeObservers();
    this.startBatchFlush();
    this.trackPageLoad();
    this.trackUserInteractions();
  }

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  // Core metric tracking
  trackMetric(name: string, value: number, unit: string = 'ms', context?: ContextData, tags?: Record<string, string>): void {
    const metric: PerformanceMetric = {
      name,
      value,
      unit,
      timestamp: Date.now(),
      context,
      tags: {
        page: window.location.pathname,
        userAgent: navigator.userAgent,
        ...tags,
      },
    };

    this.metrics.push(metric);
    
    // Immediate flush for critical metrics
    if (this.isCriticalMetric(name)) {
      this.flushMetrics();
    }
  }

  // User interaction tracking
  trackInteraction(interaction: Omit<UserInteraction, 'timestamp' | 'page'>): void {
    const fullInteraction: UserInteraction = {
      ...interaction,
      timestamp: Date.now(),
      page: window.location.pathname,
      userId: this.getCurrentUserId(),
    };

    this.interactions.push(fullInteraction);
  }

  // Performance timing measurements
  measureFunction<T>(name: string, fn: () => T, tags?: Record<string, string>): T {
    const start = performance.now();
    
    try {
      const result = fn();
      
      if (result instanceof Promise) {
        return result.then(
          (value) => {
            this.trackMetric(`function.${name}`, performance.now() - start, 'ms', { success: true }, tags);
            return value;
          },
          (error) => {
            this.trackMetric(`function.${name}`, performance.now() - start, 'ms', { success: false, error: error.message }, tags);
            throw error;
          }
        ) as T;
      } else {
        this.trackMetric(`function.${name}`, performance.now() - start, 'ms', { success: true }, tags);
        return result;
      }
    } catch (error: unknown) {
      const errorObj = error as Error;
      this.trackMetric(`function.${name}`, performance.now() - start, 'ms', { success: false, error: errorObj.message }, tags);
      throw error;
    }
  }

  async measureAsync<T>(name: string, fn: () => Promise<T>, tags?: Record<string, string>): Promise<T> {
    const start = performance.now();
    
    try {
      const result = await fn();
      this.trackMetric(`async.${name}`, performance.now() - start, 'ms', { success: true }, tags);
      return result;
    } catch (error: unknown) {
      const errorObj = error as Error;
      this.trackMetric(`async.${name}`, performance.now() - start, 'ms', { success: false, error: errorObj.message }, tags);
      throw error;
    }
  }

  // Core Web Vitals tracking
  private initializeObservers(): void {
    if (typeof window === 'undefined') return;

    // Performance observer for navigation timing
    if ('PerformanceObserver' in window) {
      this.observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.processPerformanceEntry(entry);
        }
      });

      try {
        this.observer.observe({ entryTypes: ['navigation', 'measure', 'mark'] });
      } catch (error) {
      }

      // Navigation observer for page transitions
      this.navigationObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'navigation') {
            this.trackNavigationTiming(entry as PerformanceNavigationTiming);
          }
        }
      });

      try {
        this.navigationObserver.observe({ entryTypes: ['navigation'] });
      } catch (error) {
      }
    }

    // Intersection observer for visibility tracking
    if ('IntersectionObserver' in window) {
      this.intersectionObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const element = entry.target as HTMLElement;
            this.trackMetric('element.visible', entry.intersectionRatio, 'ratio', {
              element: element.tagName,
              id: element.id,
              className: element.className,
            });
          }
        });
      });
    }
  }

  private processPerformanceEntry(entry: PerformanceEntry): void {
    switch (entry.entryType) {
      case 'navigation':
        this.trackNavigationTiming(entry as PerformanceNavigationTiming);
        break;
      case 'measure':
        this.trackMetric(`custom.${entry.name}`, entry.duration, 'ms');
        break;
      case 'mark':
        this.trackMetric(`mark.${entry.name}`, entry.startTime, 'ms');
        break;
    }
  }

  private trackNavigationTiming(timing: PerformanceNavigationTiming): void {
    // Core Web Vitals
    this.trackMetric('navigation.domContentLoaded', timing.domContentLoadedEventEnd - timing.domContentLoadedEventStart, 'ms');
    this.trackMetric('navigation.loadComplete', timing.loadEventEnd - timing.loadEventStart, 'ms');
    this.trackMetric('navigation.domInteractive', timing.domInteractive - timing.fetchStart, 'ms');
    this.trackMetric('navigation.firstPaint', timing.domContentLoadedEventEnd - timing.fetchStart, 'ms');
    
    // Network timing
    this.trackMetric('network.dns', timing.domainLookupEnd - timing.domainLookupStart, 'ms');
    this.trackMetric('network.tcp', timing.connectEnd - timing.connectStart, 'ms');
    this.trackMetric('network.request', timing.responseStart - timing.requestStart, 'ms');
    this.trackMetric('network.response', timing.responseEnd - timing.responseStart, 'ms');
    
    // Page load phases
    this.trackMetric('page.ttfb', timing.responseStart - timing.fetchStart, 'ms'); // Time to First Byte
    this.trackMetric('page.domReady', timing.domComplete - timing.fetchStart, 'ms');
    this.trackMetric('page.loadComplete', timing.loadEventEnd - timing.fetchStart, 'ms');
  }

  private trackPageLoad(): void {
    if (typeof window === 'undefined') return;

    // Track initial page load
    window.addEventListener('load', () => {
      this.trackInteraction({
        type: 'navigation',
        element: 'page_load',
        metadata: {
          referrer: document.referrer,
          loadTime: performance.now(),
        },
      });
    });

    // Track page visibility changes
    document.addEventListener('visibilitychange', () => {
      this.trackInteraction({
        type: 'navigation',
        element: 'visibility_change',
        metadata: {
          hidden: document.hidden,
          visibilityState: document.visibilityState,
        },
      });
    });
  }

  private trackUserInteractions(): void {
    if (typeof window === 'undefined') return;

    // Track clicks
    document.addEventListener('click', (event) => {
      const target = event.target as HTMLElement;
      this.trackInteraction({
        type: 'click',
        element: this.getElementSelector(target),
        metadata: {
          tagName: target.tagName,
          id: target.id,
          className: target.className,
          textContent: target.textContent?.substring(0, 100),
        },
      });
    });

    // Track form submissions
    document.addEventListener('submit', (event) => {
      const form = event.target as HTMLFormElement;
      this.trackInteraction({
        type: 'form_submit',
        element: this.getElementSelector(form),
        metadata: {
          formId: form.id,
          action: form.action,
          method: form.method,
        },
      });
    });

    // Track scroll depth
    let maxScrollDepth = 0;
    window.addEventListener('scroll', () => {
      const scrollDepth = Math.round((window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100);
      if (scrollDepth > maxScrollDepth) {
        maxScrollDepth = scrollDepth;
        this.trackMetric('scroll.depth', scrollDepth, '%');
      }
    });
  }

  // Resource monitoring
  trackResourceUsage(): void {
    if (typeof window === 'undefined') return;

    // Memory usage (if available)
    if ('memory' in performance) {
      const memory = (performance as { memory: PerformanceMemory }).memory;
      this.trackMetric('memory.used', memory.usedJSHeapSize, 'bytes');
      this.trackMetric('memory.total', memory.totalJSHeapSize, 'bytes');
      this.trackMetric('memory.limit', memory.jsHeapSizeLimit, 'bytes');
    }

    // Connection information
    if ('connection' in navigator) {
      const connection = (navigator as { connection: NetworkConnection }).connection;
      this.trackMetric('network.effectiveType', connection.effectiveType === '4g' ? 4 : connection.effectiveType === '3g' ? 3 : 2, 'rating');
      this.trackMetric('network.downlink', connection.downlink, 'mbps');
      this.trackMetric('network.rtt', connection.rtt, 'ms');
    }
  }

  // Error tracking
  trackError(error: Error, context?: ErrorContext): void {
    this.trackInteraction({
      type: 'error',
      element: 'error_boundary',
      metadata: {
        message: error.message,
        stack: error.stack,
        name: error.name,
        context,
      },
    });

    this.trackMetric('error.occurrence', 1, 'count', {
      errorType: error.name,
      message: error.message,
      stack: error.stack?.substring(0, 500),
      context,
    });
  }

  // AI service monitoring
  trackAIRequest(operation: string, duration: number, success: boolean, tokens?: number, cost?: number): void {
    this.trackMetric(`ai.${operation}.duration`, duration, 'ms', { success });
    this.trackMetric(`ai.${operation}.success`, success ? 1 : 0, 'boolean');
    
    if (tokens) {
      this.trackMetric(`ai.${operation}.tokens`, tokens, 'count');
    }
    
    if (cost) {
      this.trackMetric(`ai.${operation}.cost`, cost, 'usd');
    }

    this.trackInteraction({
      type: 'ai_request',
      element: operation,
      duration,
      metadata: { success, tokens, cost },
    });
  }

  // File upload monitoring
  trackFileUpload(fileName: string, fileSize: number, duration: number, success: boolean): void {
    this.trackMetric('upload.duration', duration, 'ms', { success, fileName, fileSize });
    this.trackMetric('upload.size', fileSize, 'bytes', { success, fileName });
    this.trackMetric('upload.speed', fileSize / (duration / 1000), 'bytes_per_second', { success });

    this.trackInteraction({
      type: 'file_upload',
      element: 'file_input',
      duration,
      metadata: { fileName, fileSize, success },
    });
  }

  // Database operation monitoring
  trackDatabaseOperation(operation: string, table: string, duration: number, success: boolean, rowsAffected?: number): void {
    this.trackMetric(`db.${operation}.duration`, duration, 'ms', { success, table });
    
    if (rowsAffected !== undefined) {
      this.trackMetric(`db.${operation}.rows`, rowsAffected, 'count', { table });
    }
  }

  // Batch flushing
  private async flushMetrics(): Promise<void> {
    if (this.metrics.length === 0 && this.interactions.length === 0) return;

    const metricsToFlush = this.metrics.splice(0);
    const interactionsToFlush = this.interactions.splice(0);

    try {
      // Store metrics and interactions in database
      if (metricsToFlush.length > 0) {
        await supabase.from('performance_metrics').insert(
          metricsToFlush.map(metric => ({
            name: metric.name,
            value: metric.value,
            unit: metric.unit,
            timestamp: new Date(metric.timestamp).toISOString(),
            context: metric.context,
            tags: metric.tags,
            session_id: this.getSessionId(),
            user_id: this.getCurrentUserId(),
          }))
        );
      }

      if (interactionsToFlush.length > 0) {
        await supabase.from('user_interactions').insert(
          interactionsToFlush.map(interaction => ({
            type: interaction.type,
            element: interaction.element,
            page: interaction.page,
            timestamp: new Date(interaction.timestamp).toISOString(),
            duration: interaction.duration,
            metadata: interaction.metadata,
            user_id: interaction.userId,
            session_id: this.getSessionId(),
          }))
        );
      }

    } catch (error) {
      // Re-add metrics to queue for retry
      this.metrics.unshift(...metricsToFlush);
      this.interactions.unshift(...interactionsToFlush);
    }
  }

  private startBatchFlush(): void {
    setInterval(() => {
      if (this.metrics.length >= this.batchSize || this.interactions.length >= this.batchSize) {
        this.flushMetrics();
      }
    }, this.flushInterval);

    // Flush on page unload
    window.addEventListener('beforeunload', () => {
      this.flushMetrics();
    });
  }

  // Utility methods
  private isCriticalMetric(name: string): boolean {
    const criticalMetrics = ['error.occurrence', 'ai.cost', 'security.violation'];
    return criticalMetrics.some(critical => name.includes(critical));
  }

  private getElementSelector(element: HTMLElement): string {
    if (element.id) return `#${element.id}`;
    if (element.className) {
      // Handle both regular elements (string) and SVG elements (SVGAnimatedString)
      const classNameString = typeof element.className === 'string' 
        ? element.className 
        : element.className?.baseVal || '';
      if (classNameString) {
        return `.${classNameString.split(' ')[0]}`;
      }
    }
    return element.tagName.toLowerCase();
  }

  private getCurrentUserId(): string | undefined {
    // Get user ID from Supabase auth
    try {
      const { data: { user } } = supabase.auth.getUser();
      return user?.id;
    } catch (error) {
      return undefined;
    }
  }

  private getSessionId(): string {
    // Generate or retrieve session ID
    let sessionId = sessionStorage.getItem('monitoring_session_id');
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem('monitoring_session_id', sessionId);
    }
    return sessionId;
  }

  // Public API for manual tracking
  public mark(name: string): void {
    performance.mark(name);
  }

  public measure(name: string, startMark?: string, endMark?: string): void {
    performance.measure(name, startMark, endMark);
  }

  public startTimer(name: string): () => void {
    const start = performance.now();
    return () => {
      this.trackMetric(`timer.${name}`, performance.now() - start, 'ms');
    };
  }

  public observeElement(element: HTMLElement): void {
    if (this.intersectionObserver) {
      this.intersectionObserver.observe(element);
    }
  }

  public unobserveElement(element: HTMLElement): void {
    if (this.intersectionObserver) {
      this.intersectionObserver.unobserve(element);
    }
  }

  public getMetrics(): PerformanceMetric[] {
    return [...this.metrics];
  }

  public getInteractions(): UserInteraction[] {
    return [...this.interactions];
  }

  public flush(): Promise<void> {
    return this.flushMetrics();
  }

  public destroy(): void {
    if (this.observer) {
      this.observer.disconnect();
    }
    if (this.navigationObserver) {
      this.navigationObserver.disconnect();
    }
    if (this.intersectionObserver) {
      this.intersectionObserver.disconnect();
    }
    this.flushMetrics();
  }
}

// Export singleton instance
export const performanceMonitor = PerformanceMonitor.getInstance();

// Utility functions for easy access
export const trackMetric = (name: string, value: number, unit?: string, context?: ContextData, tags?: Record<string, string>) =>
  performanceMonitor.trackMetric(name, value, unit, context, tags);

export const trackInteraction = (interaction: Omit<UserInteraction, 'timestamp' | 'page'>) =>
  performanceMonitor.trackInteraction(interaction);

export const measureFunction = <T>(name: string, fn: () => T, tags?: Record<string, string>) =>
  performanceMonitor.measureFunction(name, fn, tags);

export const measureAsync = <T>(name: string, fn: () => Promise<T>, tags?: Record<string, string>) =>
  performanceMonitor.measureAsync(name, fn, tags);

export const trackError = (error: Error, context?: ErrorContext) =>
  performanceMonitor.trackError(error, context);

export const startTimer = (name: string) =>
  performanceMonitor.startTimer(name);

export default performanceMonitor;