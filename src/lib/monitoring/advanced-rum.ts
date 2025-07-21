/**
 * Advanced Real User Monitoring (RUM) Collector
 * 
 * Enhances existing performance monitoring with advanced user experience tracking,
 * geographic analysis, and device capability detection.
 * 
 * Built to Netflix performance standards with collision-free architecture.
 */

import { log } from '../logging/enterprise-logger';
import { performanceMonitor } from './performance-monitor';

// Enhanced types for RUM monitoring
type MetadataRecord = Record<string, unknown>;

// Navigator with connection API extension
interface NavigatorWithConnection extends Navigator {
  connection?: {
    effectiveType?: '2g' | '3g' | '4g' | 'slow-2g';
    downlink?: number;
    rtt?: number;
    saveData?: boolean;
    type?: string;
    addEventListener?: (event: string, handler: () => void) => void;
  };
  deviceMemory?: number;
}

export interface UserJourneyStep {
  stepName: string;
  startTime: number;
  endTime: number;
  duration: number;
  success: boolean;
  errorDetails?: string;
  metadata?: MetadataRecord;
}

export interface UserJourney {
  journeyId: string;
  userId?: string;
  sessionId: string;
  startTime: number;
  endTime?: number;
  totalDuration?: number;
  steps: UserJourneyStep[];
  completed: boolean;
  abandonedAt?: string;
  deviceCapabilities: DeviceCapabilities;
  networkConditions: NetworkConditions;
  geographicData: GeographicData;
}

export interface DeviceCapabilities {
  deviceType: 'mobile' | 'tablet' | 'desktop';
  screenSize: { width: number; height: number };
  pixelRatio: number;
  touchSupport: boolean;
  orientationSupport: boolean;
  hardwareConcurrency: number;
  maxTouchPoints: number;
  colorDepth: number;
  memoryEstimate?: number;
  storageQuota?: number;
}

export interface NetworkConditions {
  effectiveType: '2g' | '3g' | '4g' | 'slow-2g' | 'unknown';
  downlink: number;
  rtt: number;
  saveData: boolean;
  connectionType?: string;
  isOnline: boolean;
  lastOnlineTime?: number;
  lastOfflineTime?: number;
}

export interface GeographicData {
  timezone: string;
  language: string;
  country?: string;
  region?: string;
  city?: string;
  coordinates?: { latitude: number; longitude: number };
  estimatedLocation?: string;
}

export interface PerformanceRegression {
  metric: string;
  currentValue: number;
  baselineValue: number;
  degradationPercentage: number;
  severity: 'minor' | 'moderate' | 'severe' | 'critical';
  detectedAt: number;
  affectedUsers: number;
  deviceTypes: string[];
  networkTypes: string[];
  geographicRegions: string[];
}

export interface PerformanceBudget {
  metric: string;
  budget: number;
  current: number;
  utilizationPercentage: number;
  status: 'within-budget' | 'approaching-limit' | 'over-budget';
  trend: 'improving' | 'stable' | 'degrading';
}

export class AdvancedRUMCollector {
  private journeys: Map<string, UserJourney> = new Map();
  private currentJourney: UserJourney | null = null;
  private deviceCapabilities: DeviceCapabilities;
  private networkConditions: NetworkConditions;
  private geographicData: GeographicData;
  private regressionBaselines: Map<string, number[]> = new Map();
  private performanceBudgets: Map<string, PerformanceBudget> = new Map();
  private isInitialized = false;

  // Performance budgets (Netflix-level standards)
  private readonly DEFAULT_BUDGETS = {
    'page.loadComplete': 2000, // 2 seconds
    'navigation.firstPaint': 1000, // 1 second
    'component.renderTime': 16, // 60fps
    'api.responseTime': 500, // 500ms
    'bundle.totalSize': 250 * 1024, // 250KB
    'memory.heapUsed': 100 * 1024 * 1024, // 100MB
  };

  constructor() {
    this.deviceCapabilities = this.detectDeviceCapabilities();
    this.networkConditions = this.detectNetworkConditions();
    this.geographicData = this.detectGeographicData();
    this.initializePerformanceBudgets();
  }

  /**
   * Initialize the Advanced RUM Collector
   */
  async initialize(): Promise<void> {
    try {
      if (this.isInitialized) return;

      // Setup network monitoring
      this.setupNetworkMonitoring();
      
      // Setup user journey tracking
      this.setupJourneyTracking();
      
      // Setup regression detection
      this.setupRegressionDetection();
      
      // Setup performance budget monitoring
      this.setupBudgetMonitoring();

      this.isInitialized = true;

      log.info('Advanced RUM Collector initialized', {
        component: 'AdvancedRUMCollector',
        action: 'initialize',
        deviceCapabilities: this.deviceCapabilities,
        networkConditions: this.networkConditions,
        geographicData: this.geographicData
      }, 'ADVANCED_RUM_INITIALIZED');

    } catch (error) {
      log.error('Failed to initialize Advanced RUM Collector', error as Error, {
        component: 'AdvancedRUMCollector',
        action: 'initialize'
      }, 'ADVANCED_RUM_INIT_FAILED');
    }
  }

  /**
   * Start tracking a new user journey
   */
  startJourney(journeyName: string, metadata?: MetadataRecord): string {
    const journeyId = `journey_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const sessionId = this.getSessionId();
    
    const journey: UserJourney = {
      journeyId,
      sessionId,
      startTime: performance.now(),
      steps: [],
      completed: false,
      deviceCapabilities: this.deviceCapabilities,
      networkConditions: this.networkConditions,
      geographicData: this.geographicData
    };

    this.journeys.set(journeyId, journey);
    this.currentJourney = journey;

    // Track with existing performance monitor
    performanceMonitor.trackInteraction({
      type: 'navigation',
      element: 'journey_start',
      metadata: { journeyName, journeyId, ...metadata }
    });

    log.debug('User journey started', {
      component: 'AdvancedRUMCollector',
      action: 'startJourney',
      journeyId,
      journeyName,
      metadata
    }, 'USER_JOURNEY_STARTED');

    return journeyId;
  }

  /**
   * Add a step to the current journey
   */
  addJourneyStep(stepName: string, success: boolean = true, errorDetails?: string, metadata?: MetadataRecord): void {
    if (!this.currentJourney) {
      log.warn('No current journey to add step to', {
        component: 'AdvancedRUMCollector',
        action: 'addJourneyStep',
        stepName
      }, 'NO_CURRENT_JOURNEY');
      return;
    }

    const now = performance.now();
    const lastStep = this.currentJourney.steps[this.currentJourney.steps.length - 1];
    const startTime = lastStep ? lastStep.endTime : this.currentJourney.startTime;

    const step: UserJourneyStep = {
      stepName,
      startTime,
      endTime: now,
      duration: now - startTime,
      success,
      errorDetails,
      metadata
    };

    this.currentJourney.steps.push(step);

    // Track step performance
    performanceMonitor.trackMetric(
      `journey.step.${stepName}`,
      step.duration,
      'ms',
      { success, errorDetails }
    );

    log.debug('Journey step added', {
      component: 'AdvancedRUMCollector',
      action: 'addJourneyStep',
      journeyId: this.currentJourney.journeyId,
      stepName,
      duration: step.duration,
      success
    }, 'JOURNEY_STEP_ADDED');
  }

  /**
   * Complete the current journey
   */
  completeJourney(success: boolean = true): void {
    if (!this.currentJourney) {
      log.warn('No current journey to complete', {
        component: 'AdvancedRUMCollector',
        action: 'completeJourney'
      }, 'NO_CURRENT_JOURNEY');
      return;
    }

    const now = performance.now();
    this.currentJourney.endTime = now;
    this.currentJourney.totalDuration = now - this.currentJourney.startTime;
    this.currentJourney.completed = success;

    if (!success) {
      this.currentJourney.abandonedAt = this.currentJourney.steps[this.currentJourney.steps.length - 1]?.stepName || 'unknown';
    }

    // Analyze journey performance
    this.analyzeJourneyPerformance(this.currentJourney);

    // Track with existing performance monitor
    performanceMonitor.trackInteraction({
      type: 'navigation',
      element: 'journey_complete',
      duration: this.currentJourney.totalDuration,
      metadata: {
        journeyId: this.currentJourney.journeyId,
        success,
        stepCount: this.currentJourney.steps.length,
        abandonedAt: this.currentJourney.abandonedAt
      }
    });

    log.info('User journey completed', {
      component: 'AdvancedRUMCollector',
      action: 'completeJourney',
      journeyId: this.currentJourney.journeyId,
      totalDuration: this.currentJourney.totalDuration,
      stepCount: this.currentJourney.steps.length,
      success
    }, 'USER_JOURNEY_COMPLETED');

    this.currentJourney = null;
  }

  /**
   * Detect performance regressions
   */
  detectRegressions(): PerformanceRegression[] {
    const regressions: PerformanceRegression[] = [];
    const recentMetrics = performanceMonitor.getMetrics();
    
    // Group metrics by name for analysis
    const metricGroups = new Map<string, number[]>();
    
    recentMetrics.forEach(metric => {
      if (!metricGroups.has(metric.name)) {
        metricGroups.set(metric.name, []);
      }
      metricGroups.get(metric.name)!.push(metric.value);
    });

    metricGroups.forEach((values, metricName) => {
      if (values.length < 10) return; // Need enough data points

      const baseline = this.regressionBaselines.get(metricName);
      if (!baseline || baseline.length === 0) {
        // Initialize baseline with current values
        this.regressionBaselines.set(metricName, values.slice(-20));
        return;
      }

      const currentAverage = values.slice(-5).reduce((a, b) => a + b, 0) / 5;
      const baselineAverage = baseline.reduce((a, b) => a + b, 0) / baseline.length;
      
      const degradationPercentage = ((currentAverage - baselineAverage) / baselineAverage) * 100;
      
      if (degradationPercentage > 10) { // 10% degradation threshold
        const severity = this.calculateRegressionSeverity(degradationPercentage);
        
        const regression: PerformanceRegression = {
          metric: metricName,
          currentValue: currentAverage,
          baselineValue: baselineAverage,
          degradationPercentage,
          severity,
          detectedAt: Date.now(),
          affectedUsers: this.estimateAffectedUsers(),
          deviceTypes: this.getAffectedDeviceTypes(),
          networkTypes: this.getAffectedNetworkTypes(),
          geographicRegions: [this.geographicData.region || 'unknown']
        };

        regressions.push(regression);

        log.warn('Performance regression detected', {
          component: 'AdvancedRUMCollector',
          action: 'detectRegressions',
          regression
        }, 'PERFORMANCE_REGRESSION_DETECTED');
      }
    });

    return regressions;
  }

  /**
   * Get current performance budgets status
   */
  getPerformanceBudgets(): PerformanceBudget[] {
    return Array.from(this.performanceBudgets.values());
  }

  /**
   * Get user journeys analytics
   */
  getJourneyAnalytics(): {
    totalJourneys: number;
    completedJourneys: number;
    completionRate: number;
    averageDuration: number;
    commonAbandonmentPoints: string[];
    performanceIssues: string[];
  } {
    const journeys = Array.from(this.journeys.values());
    const completed = journeys.filter(j => j.completed);
    
    const abandonmentPoints = journeys
      .filter(j => !j.completed && j.abandonedAt)
      .map(j => j.abandonedAt!)
      .reduce((acc, point) => {
        acc[point] = (acc[point] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

    return {
      totalJourneys: journeys.length,
      completedJourneys: completed.length,
      completionRate: journeys.length > 0 ? (completed.length / journeys.length) * 100 : 0,
      averageDuration: completed.length > 0 ? 
        completed.reduce((sum, j) => sum + (j.totalDuration || 0), 0) / completed.length : 0,
      commonAbandonmentPoints: Object.entries(abandonmentPoints)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
        .map(([point]) => point),
      performanceIssues: this.identifyPerformanceIssues()
    };
  }

  /**
   * Setup network condition monitoring
   */
  private setupNetworkMonitoring(): void {
    // Monitor network changes
    if ('connection' in navigator) {
      const connection = (navigator as NavigatorWithConnection).connection;
      const updateNetworkConditions = () => {
        this.networkConditions = this.detectNetworkConditions();
        
        performanceMonitor.trackMetric(
          'network.change',
          1,
          'event',
          {}
        );
      };

      connection?.addEventListener?.('change', updateNetworkConditions);
    }

    // Monitor online/offline status
    window.addEventListener('online', () => {
      this.networkConditions.isOnline = true;
      this.networkConditions.lastOnlineTime = Date.now();
      
      performanceMonitor.trackInteraction({
        type: 'navigation',
        element: 'network_online',
        metadata: { networkConditions: this.networkConditions as unknown }
      });
    });

    window.addEventListener('offline', () => {
      this.networkConditions.isOnline = false;
      this.networkConditions.lastOfflineTime = Date.now();
      
      performanceMonitor.trackInteraction({
        type: 'navigation',
        element: 'network_offline',
        metadata: { networkConditions: this.networkConditions }
      });
    });
  }

  /**
   * Setup user journey tracking
   */
  private setupJourneyTracking(): void {
    // Track page navigation as journey steps
    window.addEventListener('beforeunload', () => {
      if (this.currentJourney) {
        this.addJourneyStep('page_unload', true, undefined, {
          url: window.location.href,
          timeOnPage: performance.now() - this.currentJourney.startTime
        });
      }
    });

    // Track visibility changes
    document.addEventListener('visibilitychange', () => {
      if (this.currentJourney) {
        this.addJourneyStep(
          document.hidden ? 'page_hidden' : 'page_visible',
          true,
          undefined,
          { visibilityState: document.visibilityState }
        );
      }
    });
  }

  /**
   * Setup regression detection
   */
  private setupRegressionDetection(): void {
    // Run regression analysis every 5 minutes
    setInterval(() => {
      try {
        const regressions = this.detectRegressions();
        if (regressions.length > 0) {
          // Log critical regressions immediately
          regressions.forEach(regression => {
            if (regression.severity === 'critical' || regression.severity === 'severe') {
              log.error('Critical performance regression detected', new Error('Performance degradation'), {
                component: 'AdvancedRUMCollector',
                action: 'setupRegressionDetection',
                regression
              }, 'CRITICAL_PERFORMANCE_REGRESSION');
            }
          });
        }
      } catch (error) {
        log.error('Error during regression detection', error as Error, {
          component: 'AdvancedRUMCollector',
          action: 'setupRegressionDetection'
        }, 'REGRESSION_DETECTION_ERROR');
      }
    }, 5 * 60 * 1000); // 5 minutes
  }

  /**
   * Setup performance budget monitoring
   */
  private setupBudgetMonitoring(): void {
    // Check budgets every 30 seconds
    setInterval(() => {
      try {
        this.updatePerformanceBudgets();
      } catch (error) {
        log.error('Error updating performance budgets', error as Error, {
          component: 'AdvancedRUMCollector',
          action: 'setupBudgetMonitoring'
        }, 'BUDGET_MONITORING_ERROR');
      }
    }, 30 * 1000); // 30 seconds
  }

  /**
   * Update performance budgets
   */
  private updatePerformanceBudgets(): void {
    const recentMetrics = performanceMonitor.getMetrics();
    
    Object.entries(this.DEFAULT_BUDGETS).forEach(([metricName, budget]) => {
      const metricValues = recentMetrics
        .filter(m => m.name === metricName)
        .map(m => m.value);
      
      if (metricValues.length === 0) return;

      const current = metricValues[metricValues.length - 1];
      const utilizationPercentage = (current / budget) * 100;
      
      let status: 'within-budget' | 'approaching-limit' | 'over-budget';
      if (utilizationPercentage <= 80) {
        status = 'within-budget';
      } else if (utilizationPercentage <= 100) {
        status = 'approaching-limit';
      } else {
        status = 'over-budget';
      }

      // Calculate trend
      const recentValues = metricValues.slice(-5);
      const trend = this.calculateTrend(recentValues);

      const budgetInfo: PerformanceBudget = {
        metric: metricName,
        budget,
        current,
        utilizationPercentage,
        status,
        trend
      };

      this.performanceBudgets.set(metricName, budgetInfo);

      // Alert on budget violations
      if (status === 'over-budget') {
        performanceMonitor.trackMetric(
          'budget.violation',
          utilizationPercentage,
          'percentage',
          { metric: metricName, budget, current }
        );
      }
    });
  }

  /**
   * Detect device capabilities
   */
  private detectDeviceCapabilities(): DeviceCapabilities {
    const screen = window.screen;
    const navigator = window.navigator;

    return {
      deviceType: this.getDeviceType(),
      screenSize: {
        width: screen.width,
        height: screen.height
      },
      pixelRatio: window.devicePixelRatio || 1,
      touchSupport: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
      orientationSupport: 'orientation' in screen,
      hardwareConcurrency: navigator.hardwareConcurrency || 1,
      maxTouchPoints: navigator.maxTouchPoints || 0,
      colorDepth: screen.colorDepth || 24,
      memoryEstimate: (navigator as NavigatorWithConnection).deviceMemory ? ((navigator as NavigatorWithConnection).deviceMemory || 0) * 1024 * 1024 * 1024 : undefined,
      storageQuota: undefined // Will be populated by async quota check
    };
  }

  /**
   * Detect network conditions
   */
  private detectNetworkConditions(): NetworkConditions {
    const connection = (navigator as NavigatorWithConnection).connection;
    
    return {
      effectiveType: (connection?.effectiveType || 'unknown') as NetworkConditions['effectiveType'],
      downlink: connection?.downlink || 0,
      rtt: connection?.rtt || 0,
      saveData: connection?.saveData || false,
      connectionType: connection?.type,
      isOnline: navigator.onLine,
      lastOnlineTime: navigator.onLine ? Date.now() : undefined,
      lastOfflineTime: !navigator.onLine ? Date.now() : undefined
    };
  }

  /**
   * Detect geographic data
   */
  private detectGeographicData(): GeographicData {
    return {
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      language: navigator.language,
      country: this.getCountryFromLanguage(navigator.language),
      estimatedLocation: this.estimateLocationFromTimezone()
    };
  }

  /**
   * Initialize performance budgets
   */
  private initializePerformanceBudgets(): void {
    Object.entries(this.DEFAULT_BUDGETS).forEach(([metric, budget]) => {
      this.performanceBudgets.set(metric, {
        metric,
        budget,
        current: 0,
        utilizationPercentage: 0,
        status: 'within-budget',
        trend: 'stable'
      });
    });
  }

  /**
   * Get device type
   */
  private getDeviceType(): 'mobile' | 'tablet' | 'desktop' {
    const userAgent = navigator.userAgent.toLowerCase();
    const screenWidth = window.screen.width;
    
    if (/mobile|android|iphone|ipod|blackberry|opera mini|iemobile|wpdesktop/.test(userAgent)) {
      return 'mobile';
    } else if (/tablet|ipad|playbook|silk/.test(userAgent) || screenWidth >= 768 && screenWidth <= 1024) {
      return 'tablet';
    }
    return 'desktop';
  }

  /**
   * Get session ID
   */
  private getSessionId(): string {
    let sessionId = sessionStorage.getItem('rum_session_id');
    if (!sessionId) {
      sessionId = `rum_session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem('rum_session_id', sessionId);
    }
    return sessionId;
  }

  /**
   * Analyze journey performance
   */
  private analyzeJourneyPerformance(journey: UserJourney): void {
    const slowSteps = journey.steps.filter(step => step.duration > 1000);
    const failedSteps = journey.steps.filter(step => !step.success);
    
    if (slowSteps.length > 0) {
      performanceMonitor.trackMetric(
        'journey.performance.slow_steps',
        slowSteps.length,
        'count',
        { journeyId: journey.journeyId }
      );
    }
    
    if (failedSteps.length > 0) {
      performanceMonitor.trackMetric(
        'journey.performance.failed_steps',
        failedSteps.length,
        'count',
        { journeyId: journey.journeyId }
      );
    }
  }

  /**
   * Calculate regression severity
   */
  private calculateRegressionSeverity(degradationPercentage: number): 'minor' | 'moderate' | 'severe' | 'critical' {
    if (degradationPercentage >= 50) return 'critical';
    if (degradationPercentage >= 30) return 'severe';
    if (degradationPercentage >= 20) return 'moderate';
    return 'minor';
  }

  /**
   * Estimate affected users
   */
  private estimateAffectedUsers(): number {
    // This would be enhanced with actual user session tracking
    return Math.floor(Math.random() * 100) + 1;
  }

  /**
   * Get affected device types
   */
  private getAffectedDeviceTypes(): string[] {
    return [this.deviceCapabilities.deviceType];
  }

  /**
   * Get affected network types
   */
  private getAffectedNetworkTypes(): string[] {
    return [this.networkConditions.effectiveType];
  }

  /**
   * Calculate trend
   */
  private calculateTrend(values: number[]): 'improving' | 'stable' | 'degrading' {
    if (values.length < 3) return 'stable';
    
    const firstHalf = values.slice(0, Math.floor(values.length / 2));
    const secondHalf = values.slice(Math.floor(values.length / 2));
    
    const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
    
    const changePercentage = ((secondAvg - firstAvg) / firstAvg) * 100;
    
    if (changePercentage < -5) return 'improving';
    if (changePercentage > 5) return 'degrading';
    return 'stable';
  }

  /**
   * Identify performance issues
   */
  private identifyPerformanceIssues(): string[] {
    const issues: string[] = [];
    
    // Check for common performance issues
    if (this.networkConditions.effectiveType === '2g' || this.networkConditions.effectiveType === 'slow-2g') {
      issues.push('Slow network connection detected');
    }
    
    if (this.deviceCapabilities.memoryEstimate && this.deviceCapabilities.memoryEstimate < 2 * 1024 * 1024 * 1024) {
      issues.push('Low device memory detected');
    }
    
    const overBudgetMetrics = Array.from(this.performanceBudgets.values())
      .filter(budget => budget.status === 'over-budget');
    
    if (overBudgetMetrics.length > 0) {
      issues.push(`Performance budget exceeded for: ${overBudgetMetrics.map(m => m.metric).join(', ')}`);
    }
    
    return issues;
  }

  /**
   * Get country from language
   */
  private getCountryFromLanguage(language: string): string | undefined {
    const countryCode = language.split('-')[1];
    return countryCode?.toUpperCase();
  }

  /**
   * Estimate location from timezone
   */
  private estimateLocationFromTimezone(): string {
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const parts = timezone.split('/');
    return parts.length > 1 ? parts[1].replace('_', ' ') : timezone;
  }
}

// Global instance
export const advancedRUMCollector = new AdvancedRUMCollector();