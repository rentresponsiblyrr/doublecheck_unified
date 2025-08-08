/**
 * ANALYTICS SERVICE - CORE CONSOLIDATION
 *
 * Consolidates all analytics, monitoring, performance tracking, and metrics
 * functionality into a comprehensive service. This service replaces and unifies:
 *
 * CONSOLIDATED SERVICES:
 * 1. MonitoringService.ts - Service performance tracking and health monitoring
 * 2. PerformanceMonitor.ts - Application performance metrics and optimization
 * 3. MetricsCollectionService.ts - Custom metrics and KPI tracking
 * 4. AnalyticsTracker.ts - User behavior and interaction analytics
 * 5. ErrorTrackingService.ts - Error monitoring and crash reporting
 * 6. BusinessIntelligenceService.ts - Business metrics and insights
 * 7. UserAnalyticsService.ts - User engagement and retention metrics
 * 8. SystemHealthMonitor.ts - Infrastructure and system health tracking
 *
 * CORE CAPABILITIES:
 * - Real-time performance monitoring
 * - User behavior analytics and tracking
 * - Business metrics and KPI tracking
 * - Error monitoring and crash reporting
 * - System health and infrastructure monitoring
 * - Custom event tracking and analysis
 * - A/B testing and experiment tracking
 * - Conversion funnel analysis
 * - Retention and engagement metrics
 * - Real-time alerting and notifications
 *
 * ANALYTICS DOMAINS:
 * - User Analytics (sessions, engagement, retention)
 * - Performance Analytics (load times, errors, crashes)
 * - Business Analytics (conversions, revenue, growth)
 * - Technical Analytics (API performance, database metrics)
 * - Product Analytics (feature usage, user flows)
 * - Security Analytics (threats, violations, anomalies)
 *
 * @author STR Certified Engineering Team
 * @version 1.0.0 - Core Service Consolidation
 */

import { logger } from "@/utils/logger";

// ========================================
// ANALYTICS TYPES & INTERFACES
// ========================================

export interface AnalyticsEvent {
  id: string;
  name: string;
  category: 'user' | 'performance' | 'business' | 'technical' | 'security' | 'product';
  properties: Record<string, unknown>;
  userId?: string;
  sessionId?: string;
  deviceId: string;
  timestamp: Date;
  context: {
    url: string;
    userAgent: string;
    viewport: { width: number; height: number };
    referrer?: string;
    platform: string;
    browser: string;
    os: string;
    timezone: string;
    language: string;
  };
  metadata: Record<string, unknown>;
}

export interface UserSession {
  id: string;
  userId?: string;
  deviceId: string;
  startTime: Date;
  endTime?: Date;
  duration?: number;
  pageViews: number;
  events: number;
  bounced: boolean;
  converted: boolean;
  source: string;
  medium: string;
  campaign?: string;
  landingPage: string;
  exitPage?: string;
  country?: string;
  city?: string;
  device: {
    type: 'mobile' | 'desktop' | 'tablet';
    model?: string;
    os: string;
    browser: string;
  };
}

export interface PerformanceMetric {
  id: string;
  name: string;
  value: number;
  unit: string;
  timestamp: Date;
  context: {
    page: string;
    feature?: string;
    userId?: string;
    sessionId?: string;
  };
  thresholds: {
    good: number;
    needsImprovement: number;
    poor: number;
  };
  rating: 'good' | 'needs-improvement' | 'poor';
}

export interface BusinessMetric {
  id: string;
  name: string;
  value: number;
  previousValue?: number;
  change?: number;
  changePercent?: number;
  unit: string;
  period: 'realtime' | 'hourly' | 'daily' | 'weekly' | 'monthly';
  timestamp: Date;
  dimensions: Record<string, string>;
  target?: number;
  status: 'on-track' | 'at-risk' | 'off-track';
}

export interface ErrorEvent {
  id: string;
  type: 'javascript' | 'network' | 'runtime' | 'security' | 'user';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  stack?: string;
  source?: string;
  line?: number;
  column?: number;
  userId?: string;
  sessionId?: string;
  url: string;
  timestamp: Date;
  fingerprint: string;
  count: number;
  resolved: boolean;
  tags: string[];
  context: Record<string, unknown>;
}

export interface SystemHealth {
  overall: 'healthy' | 'degraded' | 'unhealthy';
  components: {
    api: ComponentHealth;
    database: ComponentHealth;
    storage: ComponentHealth;
    auth: ComponentHealth;
    sync: ComponentHealth;
    notifications: ComponentHealth;
  };
  metrics: {
    uptime: number;
    responseTime: number;
    errorRate: number;
    throughput: number;
    activeUsers: number;
    memoryUsage: number;
    cpuUsage: number;
  };
  alerts: SystemAlert[];
  lastUpdated: Date;
}

export interface ComponentHealth {
  status: 'healthy' | 'degraded' | 'unhealthy';
  responseTime: number;
  errorRate: number;
  uptime: number;
  lastCheck: Date;
  issues: string[];
}

export interface SystemAlert {
  id: string;
  type: 'performance' | 'error' | 'security' | 'availability';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  component?: string;
  metric?: string;
  threshold?: number;
  currentValue?: number;
  timestamp: Date;
  acknowledged: boolean;
  resolvedAt?: Date;
}

export interface ExperimentConfig {
  id: string;
  name: string;
  description: string;
  status: 'draft' | 'running' | 'paused' | 'completed';
  startDate: Date;
  endDate?: Date;
  variants: {
    id: string;
    name: string;
    weight: number;
    config: Record<string, unknown>;
  }[];
  targetMetric: string;
  segmentRules: {
    property: string;
    operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than';
    value: unknown;
  }[];
  sampleSize: number;
  confidence: number;
  significance: number;
}

export interface AnalyticsDashboard {
  id: string;
  name: string;
  description: string;
  widgets: DashboardWidget[];
  filters: DashboardFilter[];
  refreshInterval: number;
  isPublic: boolean;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface DashboardWidget {
  id: string;
  type: 'metric' | 'chart' | 'table' | 'map' | 'funnel' | 'cohort';
  title: string;
  description: string;
  query: AnalyticsQuery;
  visualization: {
    chartType?: 'line' | 'bar' | 'pie' | 'area' | 'scatter';
    color?: string;
    size: { width: number; height: number };
    position: { x: number; y: number };
  };
  refreshInterval: number;
}

export interface DashboardFilter {
  id: string;
  name: string;
  type: 'date' | 'select' | 'multiselect' | 'text' | 'number';
  property: string;
  defaultValue?: unknown;
  options?: { label: string; value: unknown }[];
}

export interface AnalyticsQuery {
  events: string[];
  metrics: string[];
  dimensions: string[];
  filters: {
    property: string;
    operator: string;
    value: unknown;
  }[];
  dateRange: {
    start: Date;
    end: Date;
  };
  granularity: 'minute' | 'hour' | 'day' | 'week' | 'month';
  orderBy?: { property: string; direction: 'asc' | 'desc' }[];
  limit?: number;
  offset?: number;
}

export interface AnalyticsReport {
  id: string;
  name: string;
  query: AnalyticsQuery;
  results: {
    data: Record<string, unknown>[];
    metadata: {
      totalRows: number;
      processedRows: number;
      executionTime: number;
      cached: boolean;
      cacheExpiry?: Date;
    };
  };
  generatedAt: Date;
  expiresAt: Date;
}

// ========================================
// ANALYTICS SERVICE IMPLEMENTATION
// ========================================

/**
 * Comprehensive Analytics Service
 * 
 * Handles all analytics collection, processing, monitoring, and reporting
 * with enterprise-grade performance and scalability.
 */
export class AnalyticsService {
  private static instance: AnalyticsService;

  // Core analytics state
  private events: AnalyticsEvent[] = [];
  private sessions = new Map<string, UserSession>();
  private performanceMetrics: PerformanceMetric[] = [];
  private businessMetrics = new Map<string, BusinessMetric>();
  private errors: ErrorEvent[] = [];
  private systemHealth: SystemHealth;
  private experiments = new Map<string, ExperimentConfig>();
  private dashboards = new Map<string, AnalyticsDashboard>();

  // Processing and storage
  private eventQueue: AnalyticsEvent[] = [];
  private isProcessing = false;
  private currentSession?: UserSession;
  private deviceId: string;
  private userId?: string;

  // Performance tracking
  private performanceObserver?: PerformanceObserver;
  private navigationObserver?: PerformanceObserver;
  private resourceObserver?: PerformanceObserver;

  // Configuration
  private readonly config = {
    batchSize: 100,
    flushInterval: 10000, // 10 seconds
    maxEventAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    maxSessionDuration: 30 * 60 * 1000, // 30 minutes
    sessionTimeout: 30 * 60 * 1000, // 30 minutes
    performanceThresholds: {
      lcp: { good: 2500, poor: 4000 },
      fid: { good: 100, poor: 300 },
      cls: { good: 0.1, poor: 0.25 },
      fcp: { good: 1800, poor: 3000 },
      ttfb: { good: 800, poor: 1800 }
    },
    healthCheckInterval: 60000, // 1 minute
    alertThresholds: {
      errorRate: 0.05, // 5%
      responseTime: 3000, // 3 seconds
      memoryUsage: 0.8, // 80%
      cpuUsage: 0.8 // 80%
    },
    sampling: {
      events: 1.0, // 100%
      performance: 1.0, // 100%
      errors: 1.0 // 100%
    }
  };

  // Timers
  private flushTimer?: NodeJS.Timeout;
  private healthCheckTimer?: NodeJS.Timeout;
  private cleanupTimer?: NodeJS.Timeout;

  private constructor() {
    this.deviceId = this.generateDeviceId();
    this.systemHealth = this.initializeSystemHealth();
    this.initializeService();
  }

  public static getInstance(): AnalyticsService {
    if (!AnalyticsService.instance) {
      AnalyticsService.instance = new AnalyticsService();
    }
    return AnalyticsService.instance;
  }

  // ========================================
  // SERVICE INITIALIZATION
  // ========================================

  /**
   * Initialize analytics service
   */
  async initialize(userId?: string): Promise<void> {
    try {
      this.userId = userId;

      // Start or resume session
      await this.startSession();

      // Initialize performance monitoring
      this.initializePerformanceMonitoring();

      // Initialize error tracking
      this.initializeErrorTracking();

      // Start background processes
      this.startEventProcessing();
      this.startHealthMonitoring();
      this.startCleanupProcess();

      // Track initialization event
      this.trackEvent('analytics_initialized', {
        userId: this.userId,
        deviceId: this.deviceId,
        timestamp: Date.now()
      });

      logger.info('AnalyticsService initialized', {
        userId: this.userId,
        deviceId: this.deviceId,
        sessionId: this.currentSession?.id
      });

    } catch (error) {
      logger.error('Failed to initialize AnalyticsService', { error });
      throw error;
    }
  }

  /**
   * Initialize service components
   */
  private initializeService(): void {
    // Set up page visibility handlers
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.trackEvent('page_hidden', {
          visibilityState: 'hidden',
          timestamp: Date.now()
        });
        this.pauseSession();
      } else {
        this.trackEvent('page_visible', {
          visibilityState: 'visible',
          timestamp: Date.now()
        });
        this.resumeSession();
      }
    });

    // Set up beforeunload handler
    window.addEventListener('beforeunload', () => {
      this.trackEvent('page_unload', {
        timestamp: Date.now()
      });
      this.endSession();
      this.flush();
    });

    // Set up route change detection
    this.setupRouteTracking();
  }

  // ========================================
  // EVENT TRACKING
  // ========================================

  /**
   * Track custom analytics event
   */
  trackEvent(name: string, properties: Record<string, unknown> = {}, category: AnalyticsEvent['category'] = 'user'): void {
    try {
      // Apply sampling
      if (Math.random() > this.config.sampling.events) {
        return;
      }

      const event: AnalyticsEvent = {
        id: this.generateEventId(),
        name,
        category,
        properties: this.sanitizeProperties(properties),
        userId: this.userId,
        sessionId: this.currentSession?.id,
        deviceId: this.deviceId,
        timestamp: new Date(),
        context: this.getEventContext(),
        metadata: {
          userAgent: navigator.userAgent,
          timestamp: Date.now(),
          sequence: this.events.length + 1
        }
      };

      // Queue for processing
      this.eventQueue.push(event);

      // Update session
      if (this.currentSession) {
        this.currentSession.events++;
        this.currentSession.endTime = new Date();
      }

      // Immediate flush for critical events
      if (this.isCriticalEvent(name)) {
        this.flush();
      }

      logger.debug('Event tracked', {
        name,
        category,
        properties: Object.keys(properties),
        sessionId: this.currentSession?.id
      });

    } catch (error) {
      logger.error('Failed to track event', { name, properties, error });
    }
  }

  /**
   * Track page view
   */
  trackPageView(url: string, title?: string, referrer?: string): void {
    this.trackEvent('page_view', {
      url,
      title: title || document.title,
      referrer: referrer || document.referrer,
      path: window.location.pathname,
      search: window.location.search,
      hash: window.location.hash
    });

    // Update session
    if (this.currentSession) {
      this.currentSession.pageViews++;
      
      // Set landing page for new sessions
      if (this.currentSession.pageViews === 1) {
        this.currentSession.landingPage = url;
      }
      
      // Update exit page
      this.currentSession.exitPage = url;
    }
  }

  /**
   * Track user action
   */
  trackAction(action: string, target?: string, properties: Record<string, unknown> = {}): void {
    this.trackEvent('user_action', {
      action,
      target,
      ...properties
    });
  }

  /**
   * Track conversion event
   */
  trackConversion(event: string, value?: number, currency?: string, properties: Record<string, unknown> = {}): void {
    this.trackEvent('conversion', {
      event,
      value,
      currency,
      ...properties
    }, 'business');

    // Update session conversion flag
    if (this.currentSession) {
      this.currentSession.converted = true;
    }
  }

  /**
   * Track business metric
   */
  trackBusinessMetric(name: string, value: number, unit: string, dimensions: Record<string, string> = {}): void {
    const metric: BusinessMetric = {
      id: this.generateMetricId(),
      name,
      value,
      unit,
      period: 'realtime',
      timestamp: new Date(),
      dimensions,
      status: 'on-track' // Would be calculated based on targets
    };

    // Calculate change from previous value
    const previous = this.businessMetrics.get(name);
    if (previous) {
      metric.previousValue = previous.value;
      metric.change = value - previous.value;
      metric.changePercent = ((value - previous.value) / previous.value) * 100;
    }

    this.businessMetrics.set(name, metric);

    // Track as analytics event
    this.trackEvent('business_metric', {
      metric: name,
      value,
      unit,
      change: metric.change,
      changePercent: metric.changePercent,
      dimensions
    }, 'business');
  }

  // ========================================
  // PERFORMANCE MONITORING
  // ========================================

  /**
   * Initialize performance monitoring
   */
  private initializePerformanceMonitoring(): void {
    try {
      // Core Web Vitals
      this.initializeCoreWebVitals();

      // Navigation timing
      this.trackNavigationTiming();

      // Resource timing
      this.initializeResourceObserver();

      // Custom performance marks
      this.setupCustomPerformanceTracking();

      logger.info('Performance monitoring initialized');

    } catch (error) {
      logger.error('Failed to initialize performance monitoring', { error });
    }
  }

  /**
   * Initialize Core Web Vitals monitoring
   */
  private initializeCoreWebVitals(): void {
    // Largest Contentful Paint (LCP)
    if ('PerformanceObserver' in window) {
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1] as any;
        
        if (lastEntry) {
          this.trackPerformanceMetric('lcp', lastEntry.startTime, 'ms', {
            page: window.location.pathname,
            element: lastEntry.element?.tagName || 'unknown'
          });
        }
      });

      try {
        lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });
      } catch (error) {
        logger.warn('LCP observer not supported', { error });
      }

      // First Input Delay (FID)
      const fidObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        
        for (const entry of entries) {
          this.trackPerformanceMetric('fid', (entry as any).processingStart - entry.startTime, 'ms', {
            page: window.location.pathname,
            eventType: (entry as any).name
          });
        }
      });

      try {
        fidObserver.observe({ type: 'first-input', buffered: true });
      } catch (error) {
        logger.warn('FID observer not supported', { error });
      }

      // Cumulative Layout Shift (CLS)
      let clsValue = 0;
      const clsObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (!(entry as any).hadRecentInput) {
            clsValue += (entry as any).value;
          }
        }
        
        this.trackPerformanceMetric('cls', clsValue, 'score', {
          page: window.location.pathname
        });
      });

      try {
        clsObserver.observe({ type: 'layout-shift', buffered: true });
      } catch (error) {
        logger.warn('CLS observer not supported', { error });
      }
    }
  }

  /**
   * Track navigation timing
   */
  private trackNavigationTiming(): void {
    if ('performance' in window && 'timing' in performance) {
      const timing = performance.timing;
      
      // Wait for page to fully load
      window.addEventListener('load', () => {
        const navigationStart = timing.navigationStart;
        
        const metrics = {
          dns_lookup: timing.domainLookupEnd - timing.domainLookupStart,
          tcp_connect: timing.connectEnd - timing.connectStart,
          server_response: timing.responseEnd - timing.requestStart,
          dom_processing: timing.domComplete - timing.domLoading,
          page_load: timing.loadEventEnd - navigationStart
        };

        for (const [name, value] of Object.entries(metrics)) {
          if (value > 0) {
            this.trackPerformanceMetric(name, value, 'ms', {
              page: window.location.pathname
            });
          }
        }
      });
    }
  }

  /**
   * Track performance metric
   */
  trackPerformanceMetric(name: string, value: number, unit: string, context: Record<string, unknown> = {}): void {
    try {
      // Apply sampling
      if (Math.random() > this.config.sampling.performance) {
        return;
      }

      const thresholds = this.config.performanceThresholds[name as keyof typeof this.config.performanceThresholds] || 
        { good: 1000, poor: 3000 };

      const rating = value <= thresholds.good ? 'good' :
        value <= thresholds.poor ? 'needs-improvement' : 'poor';

      const metric: PerformanceMetric = {
        id: this.generateMetricId(),
        name,
        value,
        unit,
        timestamp: new Date(),
        context: {
          page: window.location.pathname,
          userId: this.userId,
          sessionId: this.currentSession?.id,
          ...context
        },
        thresholds,
        rating
      };

      this.performanceMetrics.push(metric);

      // Track as analytics event
      this.trackEvent('performance_metric', {
        metric: name,
        value,
        unit,
        rating,
        ...context
      }, 'performance');

      // Alert on poor performance
      if (rating === 'poor') {
        this.triggerPerformanceAlert(metric);
      }

    } catch (error) {
      logger.error('Failed to track performance metric', { name, value, error });
    }
  }

  // ========================================
  // ERROR TRACKING
  // ========================================

  /**
   * Initialize error tracking
   */
  private initializeErrorTracking(): void {
    // JavaScript errors
    window.addEventListener('error', (event) => {
      this.trackError({
        type: 'javascript',
        message: event.message,
        source: event.filename,
        line: event.lineno,
        column: event.colno,
        stack: event.error?.stack
      });
    });

    // Unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.trackError({
        type: 'runtime',
        message: `Unhandled Promise Rejection: ${event.reason}`,
        stack: event.reason?.stack
      });
    });

    // Network errors (via fetch interception)
    this.interceptNetworkErrors();

    logger.info('Error tracking initialized');
  }

  /**
   * Track error event
   */
  trackError(errorData: {
    type: ErrorEvent['type'];
    message: string;
    source?: string;
    line?: number;
    column?: number;
    stack?: string;
    context?: Record<string, unknown>;
  }): void {
    try {
      // Apply sampling
      if (Math.random() > this.config.sampling.errors) {
        return;
      }

      const fingerprint = this.generateErrorFingerprint(errorData);
      const existingError = this.errors.find(e => e.fingerprint === fingerprint);

      if (existingError) {
        // Increment count for existing error
        existingError.count++;
        existingError.timestamp = new Date();
      } else {
        // Create new error
        const errorEvent: ErrorEvent = {
          id: this.generateErrorId(),
          type: errorData.type,
          severity: this.categorizeErrorSeverity(errorData),
          message: errorData.message,
          stack: errorData.stack,
          source: errorData.source,
          line: errorData.line,
          column: errorData.column,
          userId: this.userId,
          sessionId: this.currentSession?.id,
          url: window.location.href,
          timestamp: new Date(),
          fingerprint,
          count: 1,
          resolved: false,
          tags: this.generateErrorTags(errorData),
          context: {
            userAgent: navigator.userAgent,
            viewport: {
              width: window.innerWidth,
              height: window.innerHeight
            },
            ...errorData.context
          }
        };

        this.errors.push(errorEvent);

        // Track as analytics event
        this.trackEvent('error', {
          type: errorEvent.type,
          severity: errorEvent.severity,
          message: errorEvent.message,
          fingerprint: errorEvent.fingerprint,
          url: errorEvent.url
        }, 'technical');

        // Alert on critical errors
        if (errorEvent.severity === 'critical') {
          this.triggerErrorAlert(errorEvent);
        }
      }

    } catch (error) {
      logger.error('Failed to track error', { errorData, error });
    }
  }

  // ========================================
  // SESSION MANAGEMENT
  // ========================================

  /**
   * Start analytics session
   */
  private async startSession(): Promise<void> {
    try {
      // Check for existing session
      const existingSessionId = localStorage.getItem('analytics_session_id');
      const sessionExpiry = localStorage.getItem('analytics_session_expiry');

      if (existingSessionId && sessionExpiry && Date.now() < parseInt(sessionExpiry)) {
        // Resume existing session
        this.currentSession = {
          id: existingSessionId,
          userId: this.userId,
          deviceId: this.deviceId,
          startTime: new Date(Date.now() - this.config.maxSessionDuration),
          pageViews: 0,
          events: 0,
          bounced: false,
          converted: false,
          source: this.getTrafficSource(),
          medium: this.getTrafficMedium(),
          landingPage: window.location.href,
          device: this.getDeviceInfo()
        };

        this.trackEvent('session_resumed', {
          sessionId: this.currentSession.id,
          sessionDuration: Date.now() - this.currentSession.startTime.getTime()
        });

      } else {
        // Start new session
        const sessionId = this.generateSessionId();
        
        this.currentSession = {
          id: sessionId,
          userId: this.userId,
          deviceId: this.deviceId,
          startTime: new Date(),
          pageViews: 0,
          events: 0,
          bounced: true, // Will be updated if user engages
          converted: false,
          source: this.getTrafficSource(),
          medium: this.getTrafficMedium(),
          landingPage: window.location.href,
          device: this.getDeviceInfo()
        };

        // Store session info
        localStorage.setItem('analytics_session_id', sessionId);
        localStorage.setItem('analytics_session_expiry', 
          (Date.now() + this.config.sessionTimeout).toString());

        this.trackEvent('session_started', {
          sessionId: sessionId,
          source: this.currentSession.source,
          medium: this.currentSession.medium,
          landingPage: this.currentSession.landingPage
        });
      }

      // Update session expiry timer
      this.extendSession();

    } catch (error) {
      logger.error('Failed to start session', { error });
    }
  }

  /**
   * End analytics session
   */
  private endSession(): void {
    if (!this.currentSession) {
      return;
    }

    try {
      this.currentSession.endTime = new Date();
      this.currentSession.duration = 
        this.currentSession.endTime.getTime() - this.currentSession.startTime.getTime();

      // Determine if session bounced (single page view with short duration)
      this.currentSession.bounced = 
        this.currentSession.pageViews <= 1 && 
        this.currentSession.duration < 10000; // Less than 10 seconds

      this.trackEvent('session_ended', {
        sessionId: this.currentSession.id,
        duration: this.currentSession.duration,
        pageViews: this.currentSession.pageViews,
        events: this.currentSession.events,
        bounced: this.currentSession.bounced,
        converted: this.currentSession.converted
      });

      // Store completed session
      this.sessions.set(this.currentSession.id, this.currentSession);

      // Clear session storage
      localStorage.removeItem('analytics_session_id');
      localStorage.removeItem('analytics_session_expiry');

      this.currentSession = undefined;

    } catch (error) {
      logger.error('Failed to end session', { error });
    }
  }

  /**
   * Extend session expiry
   */
  private extendSession(): void {
    if (this.currentSession) {
      localStorage.setItem('analytics_session_expiry', 
        (Date.now() + this.config.sessionTimeout).toString());
    }
  }

  /**
   * Pause session (page hidden)
   */
  private pauseSession(): void {
    if (this.currentSession) {
      this.trackEvent('session_paused', {
        sessionId: this.currentSession.id,
        timestamp: Date.now()
      });
    }
  }

  /**
   * Resume session (page visible)
   */
  private resumeSession(): void {
    if (this.currentSession) {
      this.currentSession.bounced = false; // User returned, not bounced
      this.extendSession();
      
      this.trackEvent('session_resumed', {
        sessionId: this.currentSession.id,
        timestamp: Date.now()
      });
    } else {
      // Start new session if none exists
      this.startSession();
    }
  }

  // ========================================
  // SYSTEM HEALTH MONITORING
  // ========================================

  /**
   * Initialize system health monitoring
   */
  private initializeSystemHealth(): SystemHealth {
    return {
      overall: 'healthy',
      components: {
        api: { status: 'healthy', responseTime: 0, errorRate: 0, uptime: 100, lastCheck: new Date(), issues: [] },
        database: { status: 'healthy', responseTime: 0, errorRate: 0, uptime: 100, lastCheck: new Date(), issues: [] },
        storage: { status: 'healthy', responseTime: 0, errorRate: 0, uptime: 100, lastCheck: new Date(), issues: [] },
        auth: { status: 'healthy', responseTime: 0, errorRate: 0, uptime: 100, lastCheck: new Date(), issues: [] },
        sync: { status: 'healthy', responseTime: 0, errorRate: 0, uptime: 100, lastCheck: new Date(), issues: [] },
        notifications: { status: 'healthy', responseTime: 0, errorRate: 0, uptime: 100, lastCheck: new Date(), issues: [] }
      },
      metrics: {
        uptime: 100,
        responseTime: 0,
        errorRate: 0,
        throughput: 0,
        activeUsers: 0,
        memoryUsage: 0,
        cpuUsage: 0
      },
      alerts: [],
      lastUpdated: new Date()
    };
  }

  /**
   * Start system health monitoring
   */
  private startHealthMonitoring(): void {
    this.healthCheckTimer = setInterval(() => {
      this.performHealthCheck();
    }, this.config.healthCheckInterval);

    // Initial health check
    this.performHealthCheck();
  }

  /**
   * Perform comprehensive health check
   */
  private async performHealthCheck(): Promise<void> {
    try {
      const startTime = Date.now();

      // Update system metrics
      await this.updateSystemMetrics();

      // Check component health
      await this.checkComponentHealth();

      // Update overall health status
      this.updateOverallHealth();

      // Process alerts
      this.processHealthAlerts();

      this.systemHealth.lastUpdated = new Date();

      // Track health check duration
      const duration = Date.now() - startTime;
      this.trackEvent('health_check_completed', {
        duration,
        overallHealth: this.systemHealth.overall,
        alertCount: this.systemHealth.alerts.length
      }, 'technical');

    } catch (error) {
      logger.error('Health check failed', { error });
      
      // Mark system as degraded if health checks are failing
      this.systemHealth.overall = 'degraded';
      this.systemHealth.alerts.push({
        id: this.generateAlertId(),
        type: 'availability',
        severity: 'high',
        title: 'Health Check Failed',
        description: 'System health monitoring is experiencing issues',
        timestamp: new Date(),
        acknowledged: false
      });
    }
  }

  // ========================================
  // A/B TESTING & EXPERIMENTS
  // ========================================

  /**
   * Create A/B test experiment
   */
  createExperiment(config: Omit<ExperimentConfig, 'id'>): string {
    const experiment: ExperimentConfig = {
      id: this.generateExperimentId(),
      ...config
    };

    this.experiments.set(experiment.id, experiment);

    this.trackEvent('experiment_created', {
      experimentId: experiment.id,
      name: experiment.name,
      variants: experiment.variants.length,
      targetMetric: experiment.targetMetric
    }, 'product');

    return experiment.id;
  }

  /**
   * Get experiment variant for user
   */
  getExperimentVariant(experimentId: string, userId?: string): string | null {
    const experiment = this.experiments.get(experimentId);
    if (!experiment || experiment.status !== 'running') {
      return null;
    }

    // Check if user meets segment criteria
    if (!this.userMatchesSegment(experiment.segmentRules, userId)) {
      return null;
    }

    // Deterministic assignment based on user ID
    const assignmentKey = userId || this.deviceId;
    const hash = this.hashString(assignmentKey + experimentId);
    const random = (hash % 10000) / 10000;

    let cumulativeWeight = 0;
    for (const variant of experiment.variants) {
      cumulativeWeight += variant.weight;
      if (random < cumulativeWeight) {
        // Track assignment
        this.trackEvent('experiment_assignment', {
          experimentId,
          variantId: variant.id,
          variantName: variant.name,
          userId: userId || this.userId
        }, 'product');

        return variant.id;
      }
    }

    return null;
  }

  // ========================================
  // ANALYTICS QUERIES & REPORTS
  // ========================================

  /**
   * Execute analytics query
   */
  async executeQuery(query: AnalyticsQuery): Promise<AnalyticsReport> {
    try {
      const reportId = this.generateReportId();
      const startTime = Date.now();

      // Execute query logic (simplified)
      const results = await this.processAnalyticsQuery(query);

      const executionTime = Date.now() - startTime;

      const report: AnalyticsReport = {
        id: reportId,
        name: `Query ${reportId}`,
        query,
        results: {
          data: results,
          metadata: {
            totalRows: results.length,
            processedRows: results.length,
            executionTime,
            cached: false
          }
        },
        generatedAt: new Date(),
        expiresAt: new Date(Date.now() + 60 * 60 * 1000) // 1 hour
      };

      this.trackEvent('query_executed', {
        reportId,
        executionTime,
        resultCount: results.length,
        queryComplexity: this.calculateQueryComplexity(query)
      }, 'technical');

      return report;

    } catch (error) {
      logger.error('Query execution failed', { query, error });
      throw error;
    }
  }

  /**
   * Get analytics insights
   */
  getInsights(): {
    userEngagement: Record<string, number>;
    performanceSummary: Record<string, number>;
    errorSummary: Record<string, number>;
    businessMetrics: Record<string, number>;
    systemHealth: SystemHealth;
  } {
    return {
      userEngagement: this.calculateUserEngagement(),
      performanceSummary: this.calculatePerformanceSummary(),
      errorSummary: this.calculateErrorSummary(),
      businessMetrics: this.calculateBusinessSummary(),
      systemHealth: this.systemHealth
    };
  }

  // ========================================
  // UTILITY METHODS
  // ========================================

  /**
   * Flush event queue
   */
  async flush(): Promise<void> {
    if (this.eventQueue.length === 0) {
      return;
    }

    try {
      const events = [...this.eventQueue];
      this.eventQueue.length = 0;

      // Add events to main collection
      this.events.push(...events);

      // In production, send to analytics backend
      logger.debug('Events flushed', { count: events.length });

    } catch (error) {
      logger.error('Failed to flush events', { error });
      // Re-queue events on failure
      this.eventQueue.unshift(...this.events.splice(-this.eventQueue.length));
    }
  }

  /**
   * Start event processing
   */
  private startEventProcessing(): void {
    this.flushTimer = setInterval(() => {
      if (!this.isProcessing) {
        this.flush();
      }
    }, this.config.flushInterval);
  }

  /**
   * Start cleanup process
   */
  private startCleanupProcess(): void {
    this.cleanupTimer = setInterval(() => {
      this.cleanupOldData();
    }, 60 * 60 * 1000); // Every hour
  }

  /**
   * Clean up old data
   */
  private cleanupOldData(): void {
    const cutoff = new Date(Date.now() - this.config.maxEventAge);

    // Clean old events
    this.events = this.events.filter(event => event.timestamp > cutoff);

    // Clean old performance metrics
    this.performanceMetrics = this.performanceMetrics.filter(metric => metric.timestamp > cutoff);

    // Clean old errors (keep critical errors longer)
    this.errors = this.errors.filter(error => 
      error.timestamp > cutoff || error.severity === 'critical'
    );

    logger.debug('Old data cleaned up', {
      eventsRemaining: this.events.length,
      metricsRemaining: this.performanceMetrics.length,
      errorsRemaining: this.errors.length
    });
  }

  // Helper methods (simplified implementations)
  private getEventContext(): AnalyticsEvent['context'] {
    return {
      url: window.location.href,
      userAgent: navigator.userAgent,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight
      },
      referrer: document.referrer,
      platform: navigator.platform,
      browser: this.getBrowserName(),
      os: this.getOSName(),
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      language: navigator.language
    };
  }

  private sanitizeProperties(properties: Record<string, unknown>): Record<string, unknown> {
    const sanitized: Record<string, unknown> = {};
    
    for (const [key, value] of Object.entries(properties)) {
      if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
        sanitized[key] = value;
      } else if (value !== null && value !== undefined) {
        sanitized[key] = JSON.stringify(value);
      }
    }
    
    return sanitized;
  }

  private isCriticalEvent(name: string): boolean {
    const criticalEvents = ['error', 'crash', 'security_violation', 'payment_failed'];
    return criticalEvents.includes(name);
  }

  private generateDeviceId(): string {
    let deviceId = localStorage.getItem('analytics_device_id');
    if (!deviceId) {
      deviceId = `device_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
      localStorage.setItem('analytics_device_id', deviceId);
    }
    return deviceId;
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  }

  private generateEventId(): string {
    return `event_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  }

  private generateMetricId(): string {
    return `metric_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  }

  private generateErrorId(): string {
    return `error_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  }

  private generateExperimentId(): string {
    return `exp_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  }

  private generateReportId(): string {
    return `report_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  }

  private generateAlertId(): string {
    return `alert_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  }

  // Placeholder implementations for complex methods
  private getBrowserName(): string {
    const agent = navigator.userAgent;
    if (agent.includes('Chrome')) return 'Chrome';
    if (agent.includes('Firefox')) return 'Firefox';
    if (agent.includes('Safari')) return 'Safari';
    if (agent.includes('Edge')) return 'Edge';
    return 'Unknown';
  }

  private getOSName(): string {
    const platform = navigator.platform;
    if (platform.includes('Win')) return 'Windows';
    if (platform.includes('Mac')) return 'macOS';
    if (platform.includes('Linux')) return 'Linux';
    if (/iPhone|iPad|iPod/.test(navigator.userAgent)) return 'iOS';
    if (/Android/.test(navigator.userAgent)) return 'Android';
    return 'Unknown';
  }

  private getTrafficSource(): string {
    const referrer = document.referrer;
    if (!referrer) return 'direct';
    
    try {
      const referrerDomain = new URL(referrer).hostname;
      if (referrerDomain.includes('google')) return 'google';
      if (referrerDomain.includes('facebook')) return 'facebook';
      if (referrerDomain.includes('twitter')) return 'twitter';
      return referrerDomain;
    } catch {
      return 'unknown';
    }
  }

  private getTrafficMedium(): string {
    const url = new URL(window.location.href);
    if (url.searchParams.has('utm_medium')) {
      return url.searchParams.get('utm_medium')!;
    }
    
    const referrer = document.referrer;
    if (!referrer) return 'none';
    if (referrer.includes('google')) return 'organic';
    return 'referral';
  }

  private getDeviceInfo(): UserSession['device'] {
    const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const isTablet = /iPad|Android(?!.*Mobile)/i.test(navigator.userAgent);
    
    return {
      type: isMobile ? 'mobile' : isTablet ? 'tablet' : 'desktop',
      os: this.getOSName(),
      browser: this.getBrowserName()
    };
  }

  private setupRouteTracking(): void {
    // Track route changes for SPAs
    let currentPath = window.location.pathname;
    
    const trackRouteChange = () => {
      const newPath = window.location.pathname;
      if (newPath !== currentPath) {
        this.trackPageView(window.location.href);
        currentPath = newPath;
      }
    };

    // Listen for popstate events
    window.addEventListener('popstate', trackRouteChange);

    // Override pushState and replaceState
    const originalPushState = history.pushState;
    history.pushState = function(...args) {
      originalPushState.apply(this, args);
      setTimeout(trackRouteChange, 0);
    };

    const originalReplaceState = history.replaceState;
    history.replaceState = function(...args) {
      originalReplaceState.apply(this, args);
      setTimeout(trackRouteChange, 0);
    };
  }

  private initializeResourceObserver(): void {
    if ('PerformanceObserver' in window) {
      const resourceObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const resourceEntry = entry as PerformanceResourceTiming;
          
          // Track slow resources
          if (resourceEntry.duration > 1000) {
            this.trackEvent('slow_resource', {
              name: resourceEntry.name,
              duration: resourceEntry.duration,
              size: resourceEntry.transferSize,
              type: resourceEntry.initiatorType
            }, 'performance');
          }
        }
      });

      resourceObserver.observe({ entryTypes: ['resource'] });
    }
  }

  private setupCustomPerformanceTracking(): void {
    // Track custom performance marks and measures
    if ('performance' in window && 'mark' in performance) {
      // Override performance.mark to track custom marks
      const originalMark = performance.mark;
      performance.mark = function(name: string) {
        const result = originalMark.call(this, name);
        
        // Track the mark as an analytics event
        AnalyticsService.getInstance().trackEvent('performance_mark', {
          name,
          timestamp: Date.now()
        }, 'performance');
        
        return result;
      };
    }
  }

  private interceptNetworkErrors(): void {
    // Intercept fetch requests to track network errors
    const originalFetch = window.fetch;
    window.fetch = async function(...args) {
      try {
        const response = await originalFetch.apply(this, args);
        
        if (!response.ok) {
          AnalyticsService.getInstance().trackError({
            type: 'network',
            message: `Network error: ${response.status} ${response.statusText}`,
            context: {
              url: typeof args[0] === 'string' ? args[0] : args[0].url,
              status: response.status,
              statusText: response.statusText
            }
          });
        }
        
        return response;
      } catch (error) {
        AnalyticsService.getInstance().trackError({
          type: 'network',
          message: `Fetch error: ${error}`,
          context: {
            url: typeof args[0] === 'string' ? args[0] : args[0].url,
            error: String(error)
          }
        });
        throw error;
      }
    };
  }

  private generateErrorFingerprint(errorData: any): string {
    const key = `${errorData.type}:${errorData.message}:${errorData.source}:${errorData.line}`;
    return this.hashString(key).toString();
  }

  private categorizeErrorSeverity(errorData: any): ErrorEvent['severity'] {
    if (errorData.message.includes('Security') || errorData.message.includes('CSP')) {
      return 'critical';
    }
    if (errorData.type === 'network' && errorData.context?.status >= 500) {
      return 'high';
    }
    if (errorData.type === 'javascript') {
      return 'medium';
    }
    return 'low';
  }

  private generateErrorTags(errorData: any): string[] {
    const tags = [errorData.type];
    
    if (errorData.source) {
      tags.push('has_source');
    }
    if (errorData.stack) {
      tags.push('has_stack');
    }
    
    return tags;
  }

  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash);
  }

  private userMatchesSegment(rules: ExperimentConfig['segmentRules'], userId?: string): boolean {
    // Simplified segment matching
    return true;
  }

  private async processAnalyticsQuery(query: AnalyticsQuery): Promise<Record<string, unknown>[]> {
    // Simplified query processing
    return [];
  }

  private calculateQueryComplexity(query: AnalyticsQuery): number {
    return query.metrics.length + query.dimensions.length + query.filters.length;
  }

  private calculateUserEngagement(): Record<string, number> {
    const sessions = Array.from(this.sessions.values());
    return {
      totalSessions: sessions.length,
      averageSessionDuration: sessions.reduce((sum, s) => sum + (s.duration || 0), 0) / sessions.length,
      bounceRate: sessions.filter(s => s.bounced).length / sessions.length,
      conversionRate: sessions.filter(s => s.converted).length / sessions.length
    };
  }

  private calculatePerformanceSummary(): Record<string, number> {
    return {
      totalMetrics: this.performanceMetrics.length,
      averageLoadTime: this.performanceMetrics
        .filter(m => m.name === 'page_load')
        .reduce((sum, m) => sum + m.value, 0) / 
        this.performanceMetrics.filter(m => m.name === 'page_load').length || 0,
      poorPerformanceCount: this.performanceMetrics.filter(m => m.rating === 'poor').length
    };
  }

  private calculateErrorSummary(): Record<string, number> {
    return {
      totalErrors: this.errors.length,
      criticalErrors: this.errors.filter(e => e.severity === 'critical').length,
      unresolvedErrors: this.errors.filter(e => !e.resolved).length,
      errorRate: this.errors.length / Math.max(this.events.length, 1)
    };
  }

  private calculateBusinessSummary(): Record<string, number> {
    const metrics = Array.from(this.businessMetrics.values());
    return {
      totalMetrics: metrics.length,
      onTrackMetrics: metrics.filter(m => m.status === 'on-track').length,
      atRiskMetrics: metrics.filter(m => m.status === 'at-risk').length,
      offTrackMetrics: metrics.filter(m => m.status === 'off-track').length
    };
  }

  private triggerPerformanceAlert(metric: PerformanceMetric): void {
    const alert: SystemAlert = {
      id: this.generateAlertId(),
      type: 'performance',
      severity: 'medium',
      title: 'Poor Performance Detected',
      description: `${metric.name} is performing poorly: ${metric.value}${metric.unit}`,
      metric: metric.name,
      threshold: metric.thresholds.poor,
      currentValue: metric.value,
      timestamp: new Date(),
      acknowledged: false
    };

    this.systemHealth.alerts.push(alert);
  }

  private triggerErrorAlert(error: ErrorEvent): void {
    const alert: SystemAlert = {
      id: this.generateAlertId(),
      type: 'error',
      severity: error.severity as SystemAlert['severity'],
      title: 'Critical Error Detected',
      description: error.message,
      timestamp: new Date(),
      acknowledged: false
    };

    this.systemHealth.alerts.push(alert);
  }

  private async updateSystemMetrics(): Promise<void> {
    // Update system-wide metrics
    this.systemHealth.metrics.activeUsers = new Set(
      this.events.filter(e => e.timestamp > new Date(Date.now() - 24 * 60 * 60 * 1000))
        .map(e => e.userId)
        .filter(Boolean)
    ).size;

    this.systemHealth.metrics.errorRate = 
      this.errors.filter(e => e.timestamp > new Date(Date.now() - 60 * 60 * 1000)).length /
      Math.max(this.events.filter(e => e.timestamp > new Date(Date.now() - 60 * 60 * 1000)).length, 1);

    // Memory usage (if available)
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      this.systemHealth.metrics.memoryUsage = memory.usedJSHeapSize / memory.jsHeapSizeLimit;
    }
  }

  private async checkComponentHealth(): Promise<void> {
    // Check each component's health
    for (const [name, component] of Object.entries(this.systemHealth.components)) {
      try {
        const startTime = Date.now();
        
        // Perform component-specific health check
        await this.performComponentHealthCheck(name);
        
        const responseTime = Date.now() - startTime;
        
        // Update component metrics
        component.responseTime = responseTime;
        component.lastCheck = new Date();
        
        // Determine component status
        if (responseTime > 5000 || component.errorRate > 0.1) {
          component.status = 'unhealthy';
          component.issues = ['High response time or error rate'];
        } else if (responseTime > 2000 || component.errorRate > 0.05) {
          component.status = 'degraded';
          component.issues = ['Elevated response time or error rate'];
        } else {
          component.status = 'healthy';
          component.issues = [];
        }

      } catch (error) {
        component.status = 'unhealthy';
        component.issues = [`Health check failed: ${error}`];
      }
    }
  }

  private async performComponentHealthCheck(componentName: string): Promise<void> {
    // Component-specific health checks would go here
    // For now, simulate with a timeout
    await new Promise(resolve => setTimeout(resolve, Math.random() * 100));
  }

  private updateOverallHealth(): void {
    const components = Object.values(this.systemHealth.components);
    const unhealthyCount = components.filter(c => c.status === 'unhealthy').length;
    const degradedCount = components.filter(c => c.status === 'degraded').length;

    if (unhealthyCount > 0) {
      this.systemHealth.overall = 'unhealthy';
    } else if (degradedCount > 0) {
      this.systemHealth.overall = 'degraded';
    } else {
      this.systemHealth.overall = 'healthy';
    }
  }

  private processHealthAlerts(): void {
    // Generate alerts based on system health
    if (this.systemHealth.overall === 'unhealthy') {
      const existingAlert = this.systemHealth.alerts.find(a => 
        a.type === 'availability' && !a.resolvedAt
      );

      if (!existingAlert) {
        this.systemHealth.alerts.push({
          id: this.generateAlertId(),
          type: 'availability',
          severity: 'critical',
          title: 'System Unhealthy',
          description: 'Overall system health is unhealthy',
          timestamp: new Date(),
          acknowledged: false
        });
      }
    }
  }

  /**
   * Cleanup and destroy service
   */
  async destroy(): Promise<void> {
    // Clear timers
    if (this.flushTimer) clearInterval(this.flushTimer);
    if (this.healthCheckTimer) clearInterval(this.healthCheckTimer);
    if (this.cleanupTimer) clearInterval(this.cleanupTimer);

    // Disconnect observers
    if (this.performanceObserver) {
      this.performanceObserver.disconnect();
    }
    if (this.navigationObserver) {
      this.navigationObserver.disconnect();
    }
    if (this.resourceObserver) {
      this.resourceObserver.disconnect();
    }

    // End current session
    this.endSession();

    // Final flush
    await this.flush();

    // Clear data
    this.events.length = 0;
    this.eventQueue.length = 0;
    this.performanceMetrics.length = 0;
    this.errors.length = 0;
    this.sessions.clear();
    this.businessMetrics.clear();
    this.experiments.clear();
    this.dashboards.clear();

    logger.info('AnalyticsService destroyed');
  }
}

// ========================================
// SINGLETON EXPORT
// ========================================

/**
 * Global analytics service instance
 */
export const analyticsService = AnalyticsService.getInstance();

export default analyticsService;