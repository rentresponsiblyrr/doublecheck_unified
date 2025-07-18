/**
 * @fileoverview Enhanced Error Collection Service
 * Comprehensive error monitoring with console, network, and performance tracking
 * 
 * @author STR Certified Engineering Team
 * @version 2.0.0
 */

import { logger } from '@/utils/logger';
import { userActivityService } from './userActivityService';

export interface ConsoleError {
  id: string;
  timestamp: string;
  level: 'error' | 'warn' | 'info';
  message: string;
  stack?: string;
  filename?: string;
  lineno?: number;
  colno?: number;
  source: 'javascript' | 'promise' | 'resource';
}

export interface NetworkError {
  id: string;
  timestamp: string;
  url: string;
  method: string;
  status: number;
  statusText: string;
  duration: number;
  requestBody?: string;
  responseBody?: string;
  headers: Record<string, string>;
  isSupabaseCall: boolean;
  errorType: 'timeout' | 'network' | 'http' | 'cors' | 'parse';
}

export interface PerformanceMetrics {
  id: string;
  timestamp: string;
  metrics: {
    // Core Web Vitals
    largestContentfulPaint?: number;
    firstInputDelay?: number;
    cumulativeLayoutShift?: number;
    firstContentfulPaint?: number;
    timeToFirstByte?: number;
    
    // Memory and Performance
    usedJSHeapSize?: number;
    totalJSHeapSize?: number;
    jsHeapSizeLimit?: number;
    
    // Navigation Timing
    domContentLoaded?: number;
    loadComplete?: number;
    
    // Custom STR Certified Metrics
    databaseQueryTime?: number;
    imageLoadTime?: number;
    authenticationTime?: number;
  };
}

export interface DatabaseError {
  id: string;
  timestamp: string;
  operation: string;
  table: string;
  error: string;
  query?: string;
  isCompatibilityLayerIssue: boolean;
  suggestedFix?: string;
}

export interface EnhancedErrorContext {
  consoleErrors: ConsoleError[];
  networkErrors: NetworkError[];
  performanceMetrics: PerformanceMetrics[];
  databaseErrors: DatabaseError[];
  userFrustrationLevel: number; // 0-10 based on error frequency and user actions
  errorFrequency: number; // errors per minute
  affectedFeatures: string[];
  potentialRootCause: string[];
}

class EnhancedErrorCollectionService {
  private consoleErrors: ConsoleError[] = [];
  private networkErrors: NetworkError[] = [];
  private performanceMetrics: PerformanceMetrics[] = [];
  private databaseErrors: DatabaseError[] = [];
  private maxErrorsPerType = 20;
  private isCollecting = true;
  private isCollectingConsoleError = false;
  private originalConsole: { [key: string]: any } = {};
  private originalFetch: typeof fetch;

  constructor() {
    this.originalFetch = window.fetch;
    this.initializeErrorCollection();
    this.initializePerformanceMonitoring();
    this.initializeNetworkMonitoring();
    this.initializeDatabaseErrorDetection();
  }

  /**
   * Initialize comprehensive error collection
   */
  private initializeErrorCollection() {
    if (typeof window === 'undefined') return;

    // Capture JavaScript errors
    window.addEventListener('error', (event) => {
      this.collectConsoleError({
        level: 'error',
        message: event.message,
        stack: event.error?.stack,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        source: 'javascript'
      });
    });

    // Capture unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.collectConsoleError({
        level: 'error',
        message: `Unhandled Promise Rejection: ${event.reason}`,
        stack: event.reason?.stack,
        source: 'promise'
      });
    });

    // Intercept console methods to capture console errors
    this.interceptConsole();

    // Capture resource loading errors
    this.monitorResourceErrors();
  }

  /**
   * Intercept console methods to capture all console output
   */
  private interceptConsole() {
    ['error', 'warn', 'info'].forEach(level => {
      this.originalConsole[level] = console[level as keyof Console];
      
      (console as any)[level] = (...args: any[]) => {
        // Call original console method
        this.originalConsole[level].apply(console, args);
        
        // Prevent infinite recursion during error collection
        if (this.isCollectingConsoleError) return;
        
        // Capture for our monitoring
        try {
          this.collectConsoleError({
            level: level as 'error' | 'warn' | 'info',
            message: args.map(arg => {
              if (typeof arg === 'object') {
                try {
                  return JSON.stringify(arg);
                } catch (stringifyError) {
                  return '[Object - JSON.stringify failed]';
                }
              }
              return String(arg);
            }).join(' '),
            source: 'javascript'
          });
        } catch (error) {
          // Silently fail to prevent further loops
        }
      };
    });
  }

  /**
   * Monitor resource loading errors (images, scripts, etc.)
   */
  private monitorResourceErrors() {
    window.addEventListener('error', (event) => {
      if (event.target !== window && event.target) {
        const target = event.target as HTMLElement;
        this.collectConsoleError({
          level: 'error',
          message: `Resource failed to load: ${(target as any).src || (target as any).href}`,
          source: 'resource'
        });
      }
    }, true);
  }

  /**
   * Initialize network request monitoring
   */
  private initializeNetworkMonitoring() {
    if (typeof window === 'undefined') return;

    // Intercept fetch requests
    window.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
      const startTime = performance.now();
      const url = typeof input === 'string' ? input : input.toString();
      const method = init?.method || 'GET';
      
      try {
        const response = await this.originalFetch(input, init);
        const duration = performance.now() - startTime;

        // Collect network error data for failed requests
        if (!response.ok) {
          this.collectNetworkError({
            url,
            method,
            status: response.status,
            statusText: response.statusText,
            duration,
            headers: this.extractHeaders(response.headers),
            isSupabaseCall: url.includes('supabase.co'),
            errorType: this.determineNetworkErrorType(response.status),
            requestBody: init?.body?.toString(),
            responseBody: await this.safelyExtractResponseBody(response.clone())
          });
        }

        return response;
      } catch (error) {
        const duration = performance.now() - startTime;
        
        this.collectNetworkError({
          url,
          method,
          status: 0,
          statusText: 'Network Error',
          duration,
          headers: {},
          isSupabaseCall: url.includes('supabase.co'),
          errorType: 'network',
          requestBody: init?.body?.toString(),
          responseBody: error instanceof Error ? error.message : 'Unknown error'
        });

        throw error;
      }
    };
  }

  /**
   * Initialize performance monitoring
   */
  private initializePerformanceMonitoring() {
    if (typeof window === 'undefined') return;

    // Collect Core Web Vitals when available
    if ('PerformanceObserver' in window) {
      // Largest Contentful Paint
      new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        const lastEntry = entries[entries.length - 1];
        this.updatePerformanceMetrics({ largestContentfulPaint: lastEntry.startTime });
      }).observe({ entryTypes: ['largest-contentful-paint'] });

      // First Input Delay
      new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        entries.forEach(entry => {
          this.updatePerformanceMetrics({ 
            firstInputDelay: (entry as any).processingStart - entry.startTime 
          });
        });
      }).observe({ entryTypes: ['first-input'] });

      // Cumulative Layout Shift
      new PerformanceObserver((entryList) => {
        let clsValue = 0;
        entryList.getEntries().forEach(entry => {
          clsValue += (entry as any).value;
        });
        this.updatePerformanceMetrics({ cumulativeLayoutShift: clsValue });
      }).observe({ entryTypes: ['layout-shift'] });
    }

    // Memory usage monitoring
    this.monitorMemoryUsage();

    // Page load performance
    window.addEventListener('load', () => {
      setTimeout(() => this.collectPageLoadMetrics(), 0);
    });
  }

  /**
   * Monitor memory usage periodically
   */
  private monitorMemoryUsage() {
    const collectMemory = () => {
      if ('memory' in performance) {
        const memory = (performance as any).memory;
        this.updatePerformanceMetrics({
          usedJSHeapSize: memory.usedJSHeapSize,
          totalJSHeapSize: memory.totalJSHeapSize,
          jsHeapSizeLimit: memory.jsHeapSizeLimit
        });
      }
    };

    // Collect memory usage every 30 seconds
    setInterval(collectMemory, 30000);
    collectMemory(); // Initial collection
  }

  /**
   * Collect page load performance metrics
   */
  private collectPageLoadMetrics() {
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    
    if (navigation) {
      this.updatePerformanceMetrics({
        firstContentfulPaint: navigation.responseStart - navigation.fetchStart,
        timeToFirstByte: navigation.responseStart - navigation.requestStart,
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.fetchStart,
        loadComplete: navigation.loadEventEnd - navigation.fetchStart
      });
    }
  }

  /**
   * Initialize database error detection for compatibility layer issues
   */
  private initializeDatabaseErrorDetection() {
    // Monitor for specific Supabase/database errors
    const originalConsoleError = console.error;
    console.error = (...args: any[]) => {
      originalConsoleError.apply(console, args);
      
      const message = args.join(' ');
      if (this.isDatabaseError(message)) {
        this.collectDatabaseError(message);
      }
    };
  }

  /**
   * Collect console error with metadata
   */
  private collectConsoleError(errorData: Omit<ConsoleError, 'id' | 'timestamp'>) {
    if (!this.isCollecting || this.isCollectingConsoleError) return;

    this.isCollectingConsoleError = true;
    
    try {
      const error: ConsoleError = {
        id: this.generateId(),
        timestamp: new Date().toISOString(),
        ...errorData
      };

      this.consoleErrors.push(error);
      this.maintainErrorLimit('console');

      // Track user frustration level
      this.updateUserFrustrationLevel();

      // DISABLED: Enhanced error collection logging to prevent infinite loops
      // if (this.originalConsole.error) {
      //   this.originalConsole.error('Enhanced error collected', { type: 'console', error });
      // }
    } finally {
      this.isCollectingConsoleError = false;
    }
  }

  /**
   * Collect network error with metadata
   */
  private collectNetworkError(errorData: Omit<NetworkError, 'id' | 'timestamp'>) {
    if (!this.isCollecting) return;

    const error: NetworkError = {
      id: this.generateId(),
      timestamp: new Date().toISOString(),
      ...errorData
    };

    this.networkErrors.push(error);
    this.maintainErrorLimit('network');

    // Special handling for Supabase errors
    if (error.isSupabaseCall) {
      this.handleSupabaseError(error);
    }

    // DISABLED: Network error logging to prevent infinite loops
    // logger.error('Network error collected', { error }, 'ERROR_COLLECTION');
  }

  /**
   * Update performance metrics
   */
  private updatePerformanceMetrics(newMetrics: Partial<PerformanceMetrics['metrics']>) {
    const existing = this.performanceMetrics[this.performanceMetrics.length - 1];
    
    if (existing && this.isRecentMetric(existing.timestamp)) {
      // Update existing recent metric
      existing.metrics = { ...existing.metrics, ...newMetrics };
    } else {
      // Create new metric entry
      const metric: PerformanceMetrics = {
        id: this.generateId(),
        timestamp: new Date().toISOString(),
        metrics: newMetrics
      };

      this.performanceMetrics.push(metric);
      this.maintainErrorLimit('performance');
    }
  }

  /**
   * Collect database error
   */
  private collectDatabaseError(errorMessage: string) {
    const error: DatabaseError = {
      id: this.generateId(),
      timestamp: new Date().toISOString(),
      operation: this.extractDatabaseOperation(errorMessage),
      table: this.extractTableName(errorMessage),
      error: errorMessage,
      isCompatibilityLayerIssue: this.isCompatibilityLayerError(errorMessage),
      suggestedFix: this.generateDatabaseErrorFix(errorMessage)
    };

    this.databaseErrors.push(error);
    this.maintainErrorLimit('database');

    // DISABLED: Database error logging to prevent infinite loops
    // logger.error('Database error collected', { error }, 'ERROR_COLLECTION');
  }

  /**
   * Handle specific Supabase error analysis
   */
  private handleSupabaseError(error: NetworkError) {
    // Check for compatibility layer issues
    if (error.url.includes('users') || error.url.includes('static_safety_items')) {
      this.collectDatabaseError(
        `Potential compatibility layer issue: ${error.status} ${error.statusText} on ${error.url}`
      );
    }
  }

  /**
   * Get comprehensive error context for bug reports
   */
  getErrorContext(): EnhancedErrorContext {
    const now = Date.now();
    const recentThreshold = 5 * 60 * 1000; // 5 minutes

    // Filter recent errors
    const recentConsoleErrors = this.consoleErrors.filter(e => 
      now - new Date(e.timestamp).getTime() < recentThreshold
    );
    const recentNetworkErrors = this.networkErrors.filter(e => 
      now - new Date(e.timestamp).getTime() < recentThreshold
    );
    const recentDatabaseErrors = this.databaseErrors.filter(e => 
      now - new Date(e.timestamp).getTime() < recentThreshold
    );

    return {
      consoleErrors: recentConsoleErrors,
      networkErrors: recentNetworkErrors,
      performanceMetrics: this.performanceMetrics.slice(-3), // Last 3 metric snapshots
      databaseErrors: recentDatabaseErrors,
      userFrustrationLevel: this.calculateUserFrustrationLevel(),
      errorFrequency: this.calculateErrorFrequency(),
      affectedFeatures: this.identifyAffectedFeatures(),
      potentialRootCause: this.identifyPotentialRootCauses()
    };
  }

  /**
   * Calculate user frustration level based on error patterns
   */
  private calculateUserFrustrationLevel(): number {
    const recentErrors = [...this.consoleErrors, ...this.networkErrors, ...this.databaseErrors]
      .filter(e => Date.now() - new Date(e.timestamp).getTime() < 5 * 60 * 1000);

    const errorCount = recentErrors.length;
    const criticalErrors = recentErrors.filter(e => 
      ('level' in e && e.level === 'error') || 
      ('status' in e && e.status >= 500)
    ).length;

    // Base frustration on error frequency and severity
    let frustration = Math.min(errorCount * 0.5 + criticalErrors * 1.5, 10);

    // Increase frustration for rapid consecutive errors
    const errorTimes = recentErrors.map(e => new Date(e.timestamp).getTime()).sort();
    let consecutiveErrors = 0;
    for (let i = 1; i < errorTimes.length; i++) {
      if (errorTimes[i] - errorTimes[i-1] < 10000) { // Within 10 seconds
        consecutiveErrors++;
      }
    }

    frustration += consecutiveErrors * 0.3;
    return Math.min(Math.round(frustration), 10);
  }

  /**
   * Calculate error frequency (errors per minute)
   */
  private calculateErrorFrequency(): number {
    const oneMinuteAgo = Date.now() - 60 * 1000;
    const recentErrors = [...this.consoleErrors, ...this.networkErrors, ...this.databaseErrors]
      .filter(e => new Date(e.timestamp).getTime() > oneMinuteAgo);

    return recentErrors.length;
  }

  /**
   * Identify affected features based on error patterns
   */
  private identifyAffectedFeatures(): string[] {
    const features = new Set<string>();

    // Analyze network errors for feature identification
    this.networkErrors.forEach(error => {
      if (error.url.includes('properties')) features.add('Property Management');
      if (error.url.includes('inspection')) features.add('Inspection System');
      if (error.url.includes('auth')) features.add('Authentication');
      if (error.url.includes('media')) features.add('Media Upload');
      if (error.url.includes('checklist')) features.add('Checklist Management');
    });

    // Analyze console errors for feature identification
    this.consoleErrors.forEach(error => {
      if (error.message.includes('Property')) features.add('Property Management');
      if (error.message.includes('Inspection')) features.add('Inspection System');
      if (error.message.includes('Auth')) features.add('Authentication');
      if (error.message.includes('Upload')) features.add('Media Upload');
    });

    return Array.from(features);
  }

  /**
   * Identify potential root causes based on error patterns
   */
  private identifyPotentialRootCauses(): string[] {
    const causes = new Set<string>();

    // Database compatibility layer issues
    const hasCompatibilityErrors = this.databaseErrors.some(e => e.isCompatibilityLayerIssue);
    if (hasCompatibilityErrors) {
      causes.add('Database Compatibility Layer Issues');
    }

    // Network connectivity issues
    const hasNetworkErrors = this.networkErrors.some(e => e.errorType === 'network');
    if (hasNetworkErrors) {
      causes.add('Network Connectivity Problems');
    }

    // Authentication issues
    const hasAuthErrors = this.networkErrors.some(e => e.status === 401 || e.status === 403);
    if (hasAuthErrors) {
      causes.add('Authentication/Authorization Issues');
    }

    // Memory issues
    const hasMemoryIssues = this.performanceMetrics.some(m => 
      m.metrics.usedJSHeapSize && m.metrics.jsHeapSizeLimit &&
      m.metrics.usedJSHeapSize > m.metrics.jsHeapSizeLimit * 0.9
    );
    if (hasMemoryIssues) {
      causes.add('Memory Usage Issues');
    }

    // Performance issues
    const hasPerformanceIssues = this.performanceMetrics.some(m =>
      (m.metrics.largestContentfulPaint && m.metrics.largestContentfulPaint > 4000) ||
      (m.metrics.firstInputDelay && m.metrics.firstInputDelay > 300)
    );
    if (hasPerformanceIssues) {
      causes.add('Performance Degradation');
    }

    return Array.from(causes);
  }

  // Utility methods
  private generateId(): string {
    return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private maintainErrorLimit(type: 'console' | 'network' | 'performance' | 'database') {
    const arrays = {
      console: this.consoleErrors,
      network: this.networkErrors,
      performance: this.performanceMetrics,
      database: this.databaseErrors
    };

    const array = arrays[type];
    if (array.length > this.maxErrorsPerType) {
      array.splice(0, array.length - this.maxErrorsPerType);
    }
  }

  private extractHeaders(headers: Headers): Record<string, string> {
    const result: Record<string, string> = {};
    headers.forEach((value, key) => {
      result[key] = value;
    });
    return result;
  }

  private async safelyExtractResponseBody(response: Response): Promise<string> {
    try {
      const text = await response.text();
      return text.length > 1000 ? text.substring(0, 1000) + '...' : text;
    } catch {
      return 'Could not extract response body';
    }
  }

  private determineNetworkErrorType(status: number): NetworkError['errorType'] {
    if (status === 0) return 'network';
    if (status === 408 || status === 504) return 'timeout';
    if (status >= 400 && status < 500) return 'http';
    if (status >= 500) return 'http';
    return 'network';
  }

  private isDatabaseError(message: string): boolean {
    const dbKeywords = [
      'relation does not exist',
      'column does not exist',
      'permission denied',
      'invalid input syntax',
      'connection refused',
      'timeout',
      'supabase',
      'postgresql'
    ];
    return dbKeywords.some(keyword => message.toLowerCase().includes(keyword));
  }

  private isCompatibilityLayerError(message: string): boolean {
    const compatibilityKeywords = [
      'users',
      'static_safety_items',
      'logs',
      'properties',
      'uuid_to_int',
      'int_to_uuid'
    ];
    return compatibilityKeywords.some(keyword => message.includes(keyword));
  }

  private extractDatabaseOperation(message: string): string {
    const operations = ['SELECT', 'INSERT', 'UPDATE', 'DELETE', 'CREATE', 'DROP'];
    const found = operations.find(op => message.toUpperCase().includes(op));
    return found || 'UNKNOWN';
  }

  private extractTableName(message: string): string {
    const tableMatch = message.match(/table "([^"]+)"/i) || 
                      message.match(/relation "([^"]+)"/i) ||
                      message.match(/from (\w+)/i);
    return tableMatch ? tableMatch[1] : 'unknown';
  }

  private generateDatabaseErrorFix(message: string): string {
    if (message.includes('does not exist')) {
      return 'Check if compatibility views are properly installed. Run database migration script.';
    }
    if (message.includes('permission denied')) {
      return 'Verify Row Level Security policies and user permissions.';
    }
    if (message.includes('uuid_to_int') || message.includes('int_to_uuid')) {
      return 'Ensure UUID conversion functions are installed in database.';
    }
    return 'Review database schema and compatibility layer configuration.';
  }

  private isRecentMetric(timestamp: string): boolean {
    return Date.now() - new Date(timestamp).getTime() < 30000; // 30 seconds
  }

  private updateUserFrustrationLevel() {
    // Track user actions to correlate with errors
    userActivityService.trackCustomAction('error_occurred', {
      timestamp: new Date().toISOString(),
      errorCount: this.consoleErrors.length + this.networkErrors.length + this.databaseErrors.length
    });
  }

  /**
   * Clear all collected errors (useful for testing)
   */
  clearAll() {
    this.consoleErrors = [];
    this.networkErrors = [];
    this.performanceMetrics = [];
    this.databaseErrors = [];
  }

  /**
   * Stop error collection
   */
  stopCollection() {
    this.isCollecting = false;
  }

  /**
   * Resume error collection
   */
  resumeCollection() {
    this.isCollecting = true;
  }
}

// Export singleton instance
export const enhancedErrorCollectionService = new EnhancedErrorCollectionService();

export default enhancedErrorCollectionService;