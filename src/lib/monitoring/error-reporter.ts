// TEMPORARILY DISABLE TO FIX CRASH
// import { env } from '../config/environment';
import { supabase } from '../supabase';

export interface ErrorReport {
  id: string;
  timestamp: string;
  message: string;
  stack?: string;
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: string;
  url: string;
  userAgent: string;
  userId?: string;
  sessionId: string;
  context: Record<string, any>;
  breadcrumbs: Breadcrumb[];
  fingerprint: string;
  groupingKey: string;
  environment: string;
  release?: string;
  tags: Record<string, string>;
  extra: Record<string, any>;
}

export interface Breadcrumb {
  timestamp: string;
  type: 'navigation' | 'click' | 'console' | 'xhr' | 'fetch' | 'error' | 'custom';
  category: string;
  message: string;
  level: 'debug' | 'info' | 'warning' | 'error';
  data?: Record<string, any>;
}

export interface UserContext {
  id?: string;
  email?: string;
  username?: string;
  role?: string;
  subscription?: string;
}

export interface ErrorReporterConfig {
  maxBreadcrumbs?: number;
  maxQueueSize?: number;
  flushInterval?: number;
  enableConsoleCapture?: boolean;
  enableNetworkCapture?: boolean;
  enableClickCapture?: boolean;
  enableNavigationCapture?: boolean;
  sensitiveDataPatterns?: RegExp[];
  ignoredErrors?: Array<string | RegExp>;
  beforeSend?: (report: ErrorReport) => ErrorReport | null;
}

const DEFAULT_CONFIG: ErrorReporterConfig = {
  maxBreadcrumbs: 50,
  maxQueueSize: 10,
  flushInterval: 5000,
  enableConsoleCapture: true,
  enableNetworkCapture: true,
  enableClickCapture: true,
  enableNavigationCapture: true,
  sensitiveDataPatterns: [
    /password/i,
    /secret/i,
    /token/i,
    /api[_-]?key/i,
    /authorization/i,
    /credit[_-]?card/i,
    /ssn/i,
  ],
  ignoredErrors: [
    'ResizeObserver loop limit exceeded',
    'ResizeObserver loop completed with undelivered notifications',
    'Non-Error promise rejection captured',
    /^Script error/,
  ],
};

export class ErrorReporter {
  private static instance: ErrorReporter;
  private config: ErrorReporterConfig;
  private breadcrumbs: Breadcrumb[] = [];
  private errorQueue: ErrorReport[] = [];
  private sessionId: string;
  private userContext: UserContext | null = null;
  private flushTimer: NodeJS.Timeout | null = null;
  private isInitialized = false;
  private originalConsole: Record<string, any> = {};
  private originalFetch: typeof fetch;

  private constructor() {
    this.config = DEFAULT_CONFIG;
    this.sessionId = this.generateSessionId();
    this.originalFetch = window.fetch;
  }

  static getInstance(): ErrorReporter {
    if (!ErrorReporter.instance) {
      ErrorReporter.instance = new ErrorReporter();
    }
    return ErrorReporter.instance;
  }

  /**
   * Initialize error reporter with configuration
   */
  initialize(config?: Partial<ErrorReporterConfig>) {
    if (this.isInitialized) return;

    this.config = { ...DEFAULT_CONFIG, ...config };
    // DISABLED: All error monitoring to prevent infinite loops
    // this.setupGlobalHandlers();
    // this.setupBreadcrumbCapture();
    // this.startFlushTimer();
    this.isInitialized = true;

    // Log initialization in development - TEMPORARILY DISABLED
    // if (env.isDevelopment()) {
    //   console.log('[ErrorReporter] Initialized with config:', this.config);
    // }
  }

  /**
   * Report an error with context
   */
  reportError(
    error: Error | string,
    context?: Record<string, any>,
    severity: ErrorReport['severity'] = 'medium'
  ): string {
    // Create error object if string provided
    const errorObj = typeof error === 'string' ? new Error(error) : error;
    
    // Check if error should be ignored
    if (this.shouldIgnoreError(errorObj)) {
      return '';
    }

    const report = this.createErrorReport(errorObj, context, severity);
    
    // Apply beforeSend hook
    if (this.config.beforeSend) {
      const modifiedReport = this.config.beforeSend(report);
      if (!modifiedReport) return '';
    }

    // Add to queue
    this.errorQueue.push(report);

    // Flush immediately for critical errors
    if (severity === 'critical') {
      this.flush();
    } else if (this.errorQueue.length >= (this.config.maxQueueSize || 10)) {
      this.flush();
    }

    return report.id;
  }

  /**
   * Set user context for error reports
   */
  setUser(user: UserContext | null) {
    this.userContext = user;
    
    // Add breadcrumb for user change
    if (user) {
      this.addBreadcrumb({
        type: 'custom',
        category: 'auth',
        message: `User logged in: ${user.email || user.id}`,
        level: 'info',
      });
    } else {
      this.addBreadcrumb({
        type: 'custom',
        category: 'auth',
        message: 'User logged out',
        level: 'info',
      });
    }
  }

  /**
   * Add a custom breadcrumb
   */
  addBreadcrumb(breadcrumb: Omit<Breadcrumb, 'timestamp'>) {
    const crumb: Breadcrumb = {
      ...breadcrumb,
      timestamp: new Date().toISOString(),
    };

    this.breadcrumbs.push(crumb);

    // Limit breadcrumbs
    if (this.breadcrumbs.length > (this.config.maxBreadcrumbs || 50)) {
      this.breadcrumbs.shift();
    }
  }

  /**
   * Create error report from error object
   */
  private createErrorReport(
    error: Error,
    context?: Record<string, any>,
    severity: ErrorReport['severity'] = 'medium'
  ): ErrorReport {
    const fingerprint = this.generateFingerprint(error);
    const groupingKey = this.generateGroupingKey(error);

    const report: ErrorReport = {
      id: this.generateId(),
      timestamp: new Date().toISOString(),
      message: error.message,
      stack: error.stack,
      type: error.name || 'Error',
      severity,
      category: context?.category || 'general',
      url: window.location.href,
      userAgent: navigator.userAgent,
      userId: this.userContext?.id,
      sessionId: this.sessionId,
      context: this.sanitizeData({
        ...context,
        page: window.location.pathname,
        referrer: document.referrer,
        viewport: {
          width: window.innerWidth,
          height: window.innerHeight,
        },
        screen: {
          width: window.screen.width,
          height: window.screen.height,
        },
      }),
      breadcrumbs: [...this.breadcrumbs],
      fingerprint,
      groupingKey,
      environment: import.meta.env.MODE,
      release: import.meta.env.VITE_APP_VERSION || '1.0.0',
      tags: {
        browser: this.getBrowserName(),
        os: this.getOSName(),
        device: this.getDeviceType(),
      },
      extra: this.sanitizeData({
        memory: this.getMemoryInfo(),
        connection: this.getConnectionInfo(),
        ...context?.extra,
      }),
    };

    return report;
  }

  /**
   * Setup global error handlers
   */
  private setupGlobalHandlers() {
    // Window error handler
    window.addEventListener('error', (event) => {
      this.reportError(event.error || new Error(event.message), {
        type: 'unhandled_error',
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      }, 'high');
    });

    // Promise rejection handler
    window.addEventListener('unhandledrejection', (event) => {
      const error = event.reason instanceof Error 
        ? event.reason 
        : new Error(String(event.reason));
      
      this.reportError(error, {
        type: 'unhandled_promise_rejection',
        promise: event.promise,
      }, 'high');
    });
  }

  /**
   * Setup breadcrumb capture
   */
  private setupBreadcrumbCapture() {
    // Console capture
    if (this.config.enableConsoleCapture) {
      this.wrapConsole();
    }

    // Network capture
    if (this.config.enableNetworkCapture) {
      this.wrapFetch();
    }

    // Click capture
    if (this.config.enableClickCapture) {
      document.addEventListener('click', this.handleClick.bind(this), true);
    }

    // Navigation capture
    if (this.config.enableNavigationCapture) {
      this.wrapHistory();
    }
  }

  /**
   * Wrap console methods for breadcrumb capture
   */
  private wrapConsole() {
    ['log', 'info', 'warn', 'error'].forEach((level) => {
      this.originalConsole[level] = console[level as keyof Console];
      
      (console as any)[level] = (...args: any[]) => {
        this.addBreadcrumb({
          type: 'console',
          category: 'console',
          message: args.map(arg => String(arg)).join(' '),
          level: level as any,
          data: { arguments: args },
        });

        // Use try-catch to prevent infinite loops
        try {
          this.originalConsole[level].apply(console, args);
        } catch (error) {
          // Silently fail to prevent infinite loops
        }
      };
    });
  }

  /**
   * Wrap fetch for network breadcrumbs
   */
  private wrapFetch() {
    window.fetch = async (...args) => {
      const [input, init] = args;
      const url = typeof input === 'string' ? input : input.url;
      const method = init?.method || 'GET';

      const startTime = Date.now();

      try {
        const response = await this.originalFetch.apply(window, args);
        
        this.addBreadcrumb({
          type: 'fetch',
          category: 'fetch',
          message: `${method} ${url}`,
          level: response.ok ? 'info' : 'error',
          data: {
            method,
            url,
            status: response.status,
            duration: Date.now() - startTime,
          },
        });

        return response;
      } catch (error) {
        this.addBreadcrumb({
          type: 'fetch',
          category: 'fetch',
          message: `${method} ${url} failed`,
          level: 'error',
          data: {
            method,
            url,
            error: error instanceof Error ? error.message : String(error),
            duration: Date.now() - startTime,
          },
        });

        throw error;
      }
    };
  }

  /**
   * Handle click events for breadcrumbs
   */
  private handleClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    const selector = this.getElementSelector(target);

    this.addBreadcrumb({
      type: 'click',
      category: 'ui',
      message: `Click on ${selector}`,
      level: 'info',
      data: {
        selector,
        text: target.textContent?.substring(0, 100),
        tagName: target.tagName,
      },
    });
  }

  /**
   * Wrap history API for navigation breadcrumbs
   */
  private wrapHistory() {
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;

    history.pushState = (...args) => {
      this.addBreadcrumb({
        type: 'navigation',
        category: 'navigation',
        message: `Navigation to ${args[2]}`,
        level: 'info',
        data: { to: args[2] },
      });
      return originalPushState.apply(history, args);
    };

    history.replaceState = (...args) => {
      this.addBreadcrumb({
        type: 'navigation',
        category: 'navigation',
        message: `Navigation to ${args[2]}`,
        level: 'info',
        data: { to: args[2] },
      });
      return originalReplaceState.apply(history, args);
    };

    window.addEventListener('popstate', () => {
      this.addBreadcrumb({
        type: 'navigation',
        category: 'navigation',
        message: `Navigation to ${window.location.pathname}`,
        level: 'info',
        data: { to: window.location.pathname },
      });
    });
  }

  /**
   * Sanitize data to remove sensitive information
   */
  private sanitizeData(data: any): any {
    if (!data) return data;

    const sanitized = JSON.parse(JSON.stringify(data));

    const sanitizeObject = (obj: any) => {
      Object.keys(obj).forEach(key => {
        // Check if key matches sensitive pattern
        const isSensitive = this.config.sensitiveDataPatterns?.some(
          pattern => pattern.test(key)
        );

        if (isSensitive) {
          obj[key] = '[REDACTED]';
        } else if (typeof obj[key] === 'object' && obj[key] !== null) {
          sanitizeObject(obj[key]);
        }
      });
    };

    sanitizeObject(sanitized);
    return sanitized;
  }

  /**
   * Check if error should be ignored
   */
  private shouldIgnoreError(error: Error): boolean {
    if (!this.config.ignoredErrors) return false;

    return this.config.ignoredErrors.some(pattern => {
      if (typeof pattern === 'string') {
        return error.message.includes(pattern);
      }
      return pattern.test(error.message);
    });
  }

  /**
   * Flush error queue to monitoring service
   */
  private async flush() {
    if (this.errorQueue.length === 0) return;

    const errors = [...this.errorQueue];
    this.errorQueue = [];

    try {
      // In production, send to monitoring service - TEMPORARILY DISABLED
      // if (env.isProduction() && env.monitoring.sentryDsn) {
      //   // Send to Sentry or similar service
      //   await this.sendToMonitoringService(errors);
      // }

      // Also log to Supabase for internal tracking
      await this.logToSupabase(errors);
    } catch (error) {
      console.error('[ErrorReporter] Failed to flush errors:', error);
      // Re-add errors to queue if flush failed
      this.errorQueue.unshift(...errors);
    }
  }

  /**
   * Send errors to external monitoring service
   */
  private async sendToMonitoringService(errors: ErrorReport[]) {
    // Implementation would depend on the monitoring service used
    // Example for Sentry:
    /*
    if (window.Sentry) {
      errors.forEach(error => {
        window.Sentry.captureException(new Error(error.message), {
          contexts: {
            report: error,
          },
          tags: error.tags,
          extra: error.extra,
          fingerprint: [error.fingerprint],
        });
      });
    }
    */
  }

  /**
   * Log errors to Supabase
   */
  private async logToSupabase(errors: ErrorReport[]) {
    // Supabase error logging disabled - error_logs table not created yet
    // if (!env.validateSupabaseConfig()) return; // TEMPORARILY DISABLED

    // Temporarily disabled to avoid 404 errors
    console.log('[ErrorReporter] Supabase logging disabled, errors logged to console:', errors.length);
    return;

    const { error } = await supabase
      .from('error_logs')
      .insert(errors.map(err => ({
        ...err,
        user_id: err.userId,
        session_id: err.sessionId,
      })));

    if (error) {
      console.error('[ErrorReporter] Failed to log to Supabase:', error);
    }
  }

  /**
   * Start flush timer
   */
  private startFlushTimer() {
    if (this.flushTimer) return;

    this.flushTimer = setInterval(() => {
      this.flush();
    }, this.config.flushInterval || 5000);
  }

  /**
   * Utility methods
   */
  private generateId(): string {
    return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateFingerprint(error: Error): string {
    const parts = [
      error.name,
      error.message.substring(0, 100),
      error.stack?.split('\n')[1]?.trim() || '',
    ];
    return parts.join('|');
  }

  private generateGroupingKey(error: Error): string {
    // Group similar errors together
    const stackLines = error.stack?.split('\n') || [];
    const relevantLine = stackLines.find(line => line.includes('at ')) || '';
    return `${error.name}-${relevantLine}`;
  }

  private getElementSelector(element: HTMLElement): string {
    const parts: string[] = [];
    let current: HTMLElement | null = element;

    while (current && parts.length < 5) {
      let selector = current.tagName.toLowerCase();
      
      if (current.id) {
        selector += `#${current.id}`;
      } else if (current.className) {
        // Handle both regular elements (string) and SVG elements (SVGAnimatedString)
        const classNames = typeof current.className === 'string' 
          ? current.className 
          : current.className?.baseVal || '';
        if (classNames) {
          selector += `.${classNames.split(' ').filter(Boolean).join('.')}`;
        }
      }

      parts.unshift(selector);
      current = current.parentElement;
    }

    return parts.join(' > ');
  }

  private getBrowserName(): string {
    const ua = navigator.userAgent;
    if (ua.includes('Chrome')) return 'Chrome';
    if (ua.includes('Firefox')) return 'Firefox';
    if (ua.includes('Safari')) return 'Safari';
    if (ua.includes('Edge')) return 'Edge';
    return 'Unknown';
  }

  private getOSName(): string {
    const ua = navigator.userAgent;
    if (ua.includes('Windows')) return 'Windows';
    if (ua.includes('Mac')) return 'macOS';
    if (ua.includes('Linux')) return 'Linux';
    if (ua.includes('Android')) return 'Android';
    if (ua.includes('iOS')) return 'iOS';
    return 'Unknown';
  }

  private getDeviceType(): string {
    const ua = navigator.userAgent;
    if (ua.includes('Mobile')) return 'Mobile';
    if (ua.includes('Tablet')) return 'Tablet';
    return 'Desktop';
  }

  private getMemoryInfo(): Record<string, any> {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      return {
        usedJSHeapSize: memory.usedJSHeapSize,
        totalJSHeapSize: memory.totalJSHeapSize,
        jsHeapSizeLimit: memory.jsHeapSizeLimit,
      };
    }
    return {};
  }

  private getConnectionInfo(): Record<string, any> {
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      return {
        effectiveType: connection.effectiveType,
        downlink: connection.downlink,
        rtt: connection.rtt,
      };
    }
    return {};
  }

  /**
   * Cleanup and destroy
   */
  destroy() {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }

    // Restore original methods
    Object.keys(this.originalConsole).forEach(level => {
      (console as any)[level] = this.originalConsole[level];
    });

    window.fetch = this.originalFetch;

    // Flush remaining errors
    this.flush();
  }
}

// Export singleton instance
export const errorReporter = ErrorReporter.getInstance();

// Initialize on import if in browser
if (typeof window !== 'undefined') {
  errorReporter.initialize();
}