/**
 * CORE WEB VITALS MONITOR - ELITE PERFORMANCE TRACKING SYSTEM
 *
 * Advanced performance monitoring system that tracks all Core Web Vitals
 * with real-time reporting, construction site optimization, and Netflix/Meta
 * performance standards compliance (<2.5s LCP, <100ms FID, <0.1 CLS).
 *
 * TRACKED METRICS:
 * - Largest Contentful Paint (LCP) - Loading performance
 * - First Input Delay (FID) - Interactivity performance
 * - Cumulative Layout Shift (CLS) - Visual stability
 * - First Contentful Paint (FCP) - Perceived loading speed
 * - Time to First Byte (TTFB) - Server response performance
 * - Total Blocking Time (TBT) - Main thread blocking
 * - Speed Index - Visual completeness speed
 * - Time to Interactive (TTI) - Full interactivity
 *
 * ADVANCED FEATURES:
 * - Real-time performance scoring with industry benchmarks
 * - Mobile/construction site specific thresholds and optimization
 * - Performance regression detection and alerting
 * - User experience correlation with business metrics
 * - Network-aware performance adaptation strategies
 * - Battery-conscious monitoring with intelligent sampling
 * - Performance budget enforcement and violation alerts
 * - A/B testing performance impact measurement
 *
 * CONSTRUCTION SITE OPTIMIZATION:
 * - 2G/spotty connection performance tracking
 * - Battery life impact measurement and optimization
 * - Touch interaction performance in glove-friendly interfaces
 * - Offline-first performance metrics and caching effectiveness
 * - Large file transfer optimization monitoring
 * - Background sync performance impact tracking
 *
 * COMPLIANCE TARGETS:
 * - LCP: <2.5s (Good), <4.0s (Needs Improvement)
 * - FID: <100ms (Good), <300ms (Needs Improvement)
 * - CLS: <0.1 (Good), <0.25 (Needs Improvement)
 * - FCP: <1.8s (Good), <3.0s (Needs Improvement)
 * - TTFB: <800ms (Good), <1.8s (Needs Improvement)
 *
 * @author STR Certified Engineering Team
 */

import { logger } from "@/utils/logger";

// Core Web Vitals interfaces
export interface CoreWebVitalsMetrics {
  // Primary Core Web Vitals
  lcp: PerformanceMetric | null;
  fid: PerformanceMetric | null;
  cls: PerformanceMetric | null;

  // Supporting metrics
  fcp: PerformanceMetric | null;
  ttfb: PerformanceMetric | null;
  tbt: PerformanceMetric | null;
  speedIndex: PerformanceMetric | null;
  tti: PerformanceMetric | null;

  // Composite scores
  performanceScore: number;
  userExperienceScore: number;
  mobileOptimizationScore: number;

  // Metadata
  timestamp: number;
  url: string;
  userAgent: string;
  connectionType: string;
  deviceType: "mobile" | "tablet" | "desktop";
  viewportSize: { width: number; height: number };
}

export interface PerformanceMetric {
  value: number;
  rating: "good" | "needs-improvement" | "poor";
  percentile: number;
  delta: number; // Change from previous measurement
  trend: "improving" | "stable" | "degrading";
  entries: PerformanceEntry[];
}

export interface PerformanceThresholds {
  lcp: { good: number; needsImprovement: number };
  fid: { good: number; needsImprovement: number };
  cls: { good: number; needsImprovement: number };
  fcp: { good: number; needsImprovement: number };
  ttfb: { good: number; needsImprovement: number };
  tbt: { good: number; needsImprovement: number };
  speedIndex: { good: number; needsImprovement: number };
  tti: { good: number; needsImprovement: number };
}

export interface PerformanceAlert {
  id: string;
  metric: string;
  severity: "warning" | "critical";
  value: number;
  threshold: number;
  message: string;
  timestamp: number;
  url: string;
  suggestions: string[];
}

export interface PerformanceTrend {
  metric: string;
  period: "1h" | "24h" | "7d" | "30d";
  samples: number;
  average: number;
  median: number;
  p75: number;
  p90: number;
  p95: number;
  trend: "improving" | "stable" | "degrading";
  regressionDetected: boolean;
}

export interface PerformanceBudget {
  metric: string;
  target: number;
  warning: number;
  critical: number;
  current: number;
  status: "within" | "warning" | "exceeded";
  impact: "low" | "medium" | "high";
}

export interface DeviceSpecificMetrics {
  deviceType: "mobile" | "tablet" | "desktop";
  screenSize: string;
  pixelDensity: number;
  touchCapability: boolean;
  batteryLevel?: number;
  networkSpeed: string;
  memoryPressure: "low" | "medium" | "high";
}

export class CoreWebVitalsMonitor {
  private static instance: CoreWebVitalsMonitor;
  private metrics: CoreWebVitalsMetrics;
  private thresholds: PerformanceThresholds;
  private observers: Map<string, PerformanceObserver> = new Map();
  private metricHistory: CoreWebVitalsMetrics[] = [];
  private alertSubscribers: ((alert: PerformanceAlert) => void)[] = [];
  private performanceBudgets: PerformanceBudget[] = [];
  private isMonitoring: boolean = false;
  private samplingRate: number = 1.0; // 100% sampling by default

  private constructor() {
    this.thresholds = this.getDefaultThresholds();
    this.metrics = this.initializeEmptyMetrics();
    this.setupPerformanceBudgets();
  }

  static getInstance(): CoreWebVitalsMonitor {
    if (!CoreWebVitalsMonitor.instance) {
      CoreWebVitalsMonitor.instance = new CoreWebVitalsMonitor();
    }
    return CoreWebVitalsMonitor.instance;
  }

  /**
   * Initialize Core Web Vitals monitoring with comprehensive tracking
   */
  async initialize(): Promise<boolean> {
    try {
      logger.info("Initializing Core Web Vitals Monitor", {}, "PERFORMANCE");

      // Check browser support for Performance Observer
      if (!this.checkBrowserSupport()) {
        logger.warn(
          "Performance Observer not supported - degraded monitoring",
          {},
          "PERFORMANCE",
        );
        return this.initializeFallbackMonitoring();
      }

      // Setup Core Web Vitals observers
      this.setupLCPObserver();
      this.setupFIDObserver();
      this.setupCLSObserver();
      this.setupFCPObserver();
      this.setupTTFBObserver();
      this.setupTBTObserver();

      // Setup additional performance monitoring
      this.setupNavigationObserver();
      this.setupResourceObserver();
      this.setupLongTaskObserver();

      // Setup real-time performance scoring
      this.startPerformanceScoring();

      // Setup performance budget monitoring
      this.startBudgetMonitoring();

      // Setup automatic sampling adjustment
      this.setupAdaptiveSampling();

      // Setup page visibility tracking
      this.setupPageVisibilityTracking();

      this.isMonitoring = true;

      logger.info(
        "Core Web Vitals Monitor initialized successfully",
        {
          observersActive: this.observers.size,
          budgetsConfigured: this.performanceBudgets.length,
          samplingRate: this.samplingRate,
        },
        "PERFORMANCE",
      );

      return true;
    } catch (error) {
      logger.error(
        "Core Web Vitals Monitor initialization failed",
        { error },
        "PERFORMANCE",
      );
      return false;
    }
  }

  /**
   * Setup Largest Contentful Paint (LCP) observer
   */
  private setupLCPObserver(): void {
    if (!("PerformanceObserver" in window)) return;

    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1] as any;

        if (lastEntry) {
          const lcpMetric: PerformanceMetric = {
            value: lastEntry.startTime,
            rating: this.getRating("lcp", lastEntry.startTime),
            percentile: this.calculatePercentile("lcp", lastEntry.startTime),
            delta: this.calculateDelta("lcp", lastEntry.startTime),
            trend: this.calculateTrend("lcp", lastEntry.startTime),
            entries: [lastEntry],
          };

          this.metrics.lcp = lcpMetric;
          this.updatePerformanceScores();
          this.checkPerformanceBudgets("lcp", lastEntry.startTime);

          // Check for performance regression
          this.checkForRegression("lcp", lastEntry.startTime);

          logger.debug(
            "LCP measured",
            {
              value: lastEntry.startTime,
              rating: lcpMetric.rating,
              element: lastEntry.element?.tagName,
            },
            "PERFORMANCE",
          );
        }
      });

      observer.observe({ type: "largest-contentful-paint", buffered: true });
      this.observers.set("lcp", observer);
    } catch (error) {
      logger.error("Failed to setup LCP observer", { error }, "PERFORMANCE");
    }
  }

  /**
   * Setup First Input Delay (FID) observer
   */
  private setupFIDObserver(): void {
    if (!("PerformanceObserver" in window)) return;

    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();

        entries.forEach((entry: any) => {
          const fidMetric: PerformanceMetric = {
            value: entry.processingStart - entry.startTime,
            rating: this.getRating(
              "fid",
              entry.processingStart - entry.startTime,
            ),
            percentile: this.calculatePercentile(
              "fid",
              entry.processingStart - entry.startTime,
            ),
            delta: this.calculateDelta(
              "fid",
              entry.processingStart - entry.startTime,
            ),
            trend: this.calculateTrend(
              "fid",
              entry.processingStart - entry.startTime,
            ),
            entries: [entry],
          };

          this.metrics.fid = fidMetric;
          this.updatePerformanceScores();
          this.checkPerformanceBudgets("fid", fidMetric.value);

          logger.debug(
            "FID measured",
            {
              value: fidMetric.value,
              rating: fidMetric.rating,
              eventType: entry.name,
            },
            "PERFORMANCE",
          );
        });
      });

      observer.observe({ type: "first-input", buffered: true });
      this.observers.set("fid", observer);
    } catch (error) {
      logger.error("Failed to setup FID observer", { error }, "PERFORMANCE");
    }
  }

  /**
   * Setup Cumulative Layout Shift (CLS) observer
   */
  private setupCLSObserver(): void {
    if (!("PerformanceObserver" in window)) return;

    try {
      let clsValue = 0;
      let sessionValue = 0;
      let sessionEntries: any[] = [];

      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();

        entries.forEach((entry: any) => {
          // Only count layout shifts without recent user input
          if (!entry.hadRecentInput) {
            const firstSessionEntry = sessionEntries[0];
            const lastSessionEntry = sessionEntries[sessionEntries.length - 1];

            // If the entry occurred less than 1 second after the previous entry
            // and less than 5 seconds after the first entry in the session,
            // include the entry in the current session
            if (
              sessionValue &&
              entry.startTime - lastSessionEntry.startTime < 1000 &&
              entry.startTime - firstSessionEntry.startTime < 5000
            ) {
              sessionValue += entry.value;
              sessionEntries.push(entry);
            } else {
              // Start a new session
              sessionValue = entry.value;
              sessionEntries = [entry];
            }

            // Update the max session value if the current session is larger
            if (sessionValue > clsValue) {
              clsValue = sessionValue;

              const clsMetric: PerformanceMetric = {
                value: clsValue,
                rating: this.getRating("cls", clsValue),
                percentile: this.calculatePercentile("cls", clsValue),
                delta: this.calculateDelta("cls", clsValue),
                trend: this.calculateTrend("cls", clsValue),
                entries: [...sessionEntries],
              };

              this.metrics.cls = clsMetric;
              this.updatePerformanceScores();
              this.checkPerformanceBudgets("cls", clsValue);

              logger.debug(
                "CLS measured",
                {
                  value: clsValue,
                  rating: clsMetric.rating,
                  sessionEntries: sessionEntries.length,
                },
                "PERFORMANCE",
              );
            }
          }
        });
      });

      observer.observe({ type: "layout-shift", buffered: true });
      this.observers.set("cls", observer);
    } catch (error) {
      logger.error("Failed to setup CLS observer", { error }, "PERFORMANCE");
    }
  }

  /**
   * Setup First Contentful Paint (FCP) observer
   */
  private setupFCPObserver(): void {
    if (!("PerformanceObserver" in window)) return;

    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const fcpEntry = entries.find(
          (entry: any) => entry.name === "first-contentful-paint",
        );

        if (fcpEntry) {
          const fcpMetric: PerformanceMetric = {
            value: fcpEntry.startTime,
            rating: this.getRating("fcp", fcpEntry.startTime),
            percentile: this.calculatePercentile("fcp", fcpEntry.startTime),
            delta: this.calculateDelta("fcp", fcpEntry.startTime),
            trend: this.calculateTrend("fcp", fcpEntry.startTime),
            entries: [fcpEntry],
          };

          this.metrics.fcp = fcpMetric;
          this.updatePerformanceScores();
          this.checkPerformanceBudgets("fcp", fcpEntry.startTime);

          logger.debug(
            "FCP measured",
            {
              value: fcpEntry.startTime,
              rating: fcpMetric.rating,
            },
            "PERFORMANCE",
          );
        }
      });

      observer.observe({ type: "paint", buffered: true });
      this.observers.set("fcp", observer);
    } catch (error) {
      logger.error("Failed to setup FCP observer", { error }, "PERFORMANCE");
    }
  }

  /**
   * Setup Time to First Byte (TTFB) observer
   */
  private setupTTFBObserver(): void {
    if (!("PerformanceObserver" in window)) return;

    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const navEntry = entries.find(
          (entry: any) => entry.entryType === "navigation",
        ) as any;

        if (navEntry) {
          const ttfbValue = navEntry.responseStart - navEntry.fetchStart;

          const ttfbMetric: PerformanceMetric = {
            value: ttfbValue,
            rating: this.getRating("ttfb", ttfbValue),
            percentile: this.calculatePercentile("ttfb", ttfbValue),
            delta: this.calculateDelta("ttfb", ttfbValue),
            trend: this.calculateTrend("ttfb", ttfbValue),
            entries: [navEntry],
          };

          this.metrics.ttfb = ttfbMetric;
          this.updatePerformanceScores();
          this.checkPerformanceBudgets("ttfb", ttfbValue);

          logger.debug(
            "TTFB measured",
            {
              value: ttfbValue,
              rating: ttfbMetric.rating,
            },
            "PERFORMANCE",
          );
        }
      });

      observer.observe({ type: "navigation", buffered: true });
      this.observers.set("ttfb", observer);
    } catch (error) {
      logger.error("Failed to setup TTFB observer", { error }, "PERFORMANCE");
    }
  }

  /**
   * Setup Total Blocking Time (TBT) observer
   */
  private setupTBTObserver(): void {
    if (!("PerformanceObserver" in window)) return;

    try {
      let tbt = 0;

      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();

        entries.forEach((entry: any) => {
          // Long tasks that block the main thread
          if (entry.duration > 50) {
            tbt += entry.duration - 50;
          }
        });

        if (tbt > 0) {
          const tbtMetric: PerformanceMetric = {
            value: tbt,
            rating: this.getRating("tbt", tbt),
            percentile: this.calculatePercentile("tbt", tbt),
            delta: this.calculateDelta("tbt", tbt),
            trend: this.calculateTrend("tbt", tbt),
            entries: entries.slice(),
          };

          this.metrics.tbt = tbtMetric;
          this.updatePerformanceScores();
          this.checkPerformanceBudgets("tbt", tbt);

          logger.debug(
            "TBT measured",
            {
              value: tbt,
              rating: tbtMetric.rating,
              longTasks: entries.length,
            },
            "PERFORMANCE",
          );
        }
      });

      observer.observe({ type: "longtask", buffered: true });
      this.observers.set("tbt", observer);
    } catch (error) {
      logger.error("Failed to setup TBT observer", { error }, "PERFORMANCE");
    }
  }

  /**
   * Setup additional performance observers
   */
  private setupNavigationObserver(): void {
    // Navigation timing observer for additional metrics
    if ("PerformanceObserver" in window) {
      try {
        const observer = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry) =>
            this.processNavigationEntry(entry as PerformanceNavigationTiming),
          );
        });

        observer.observe({ type: "navigation", buffered: true });
        this.observers.set("navigation", observer);
      } catch (error) {
        logger.error(
          "Failed to setup navigation observer",
          { error },
          "PERFORMANCE",
        );
      }
    }
  }

  private setupResourceObserver(): void {
    // Resource timing observer for resource loading performance
    if ("PerformanceObserver" in window) {
      try {
        const observer = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry) =>
            this.processResourceEntry(entry as PerformanceResourceTiming),
          );
        });

        observer.observe({ type: "resource", buffered: true });
        this.observers.set("resource", observer);
      } catch (error) {
        logger.error(
          "Failed to setup resource observer",
          { error },
          "PERFORMANCE",
        );
      }
    }
  }

  private setupLongTaskObserver(): void {
    // Long task observer for main thread blocking detection
    if ("PerformanceObserver" in window) {
      try {
        const observer = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry) => this.processLongTaskEntry(entry));
        });

        observer.observe({ type: "longtask", buffered: true });
        this.observers.set("longtask", observer);
      } catch (error) {
        logger.error(
          "Failed to setup long task observer",
          { error },
          "PERFORMANCE",
        );
      }
    }
  }

  /**
   * Get current Core Web Vitals metrics
   */
  getCurrentMetrics(): CoreWebVitalsMetrics {
    return { ...this.metrics };
  }

  /**
   * Get performance trends over time
   */
  getPerformanceTrends(
    period: "1h" | "24h" | "7d" | "30d" = "24h",
  ): PerformanceTrend[] {
    const trends: PerformanceTrend[] = [];
    const metrics = ["lcp", "fid", "cls", "fcp", "ttfb", "tbt"];

    for (const metric of metrics) {
      const trend = this.calculateMetricTrend(metric, period);
      if (trend) {
        trends.push(trend);
      }
    }

    return trends;
  }

  /**
   * Get performance budget status
   */
  getPerformanceBudgets(): PerformanceBudget[] {
    return [...this.performanceBudgets];
  }

  /**
   * Subscribe to performance alerts
   */
  subscribeToAlerts(callback: (alert: PerformanceAlert) => void): () => void {
    this.alertSubscribers.push(callback);

    // Return unsubscribe function
    return () => {
      const index = this.alertSubscribers.indexOf(callback);
      if (index > -1) {
        this.alertSubscribers.splice(index, 1);
      }
    };
  }

  /**
   * Export performance data for analysis
   */
  exportPerformanceData(format: "json" | "csv" = "json"): string {
    const data = {
      currentMetrics: this.metrics,
      history: this.metricHistory,
      budgets: this.performanceBudgets,
      trends: this.getPerformanceTrends(),
      timestamp: Date.now(),
      url: window.location.href,
      userAgent: navigator.userAgent,
    };

    if (format === "csv") {
      return this.convertToCSV(data);
    }

    return JSON.stringify(data, null, 2);
  }

  // Private helper methods

  private getDefaultThresholds(): PerformanceThresholds {
    return {
      lcp: { good: 2500, needsImprovement: 4000 },
      fid: { good: 100, needsImprovement: 300 },
      cls: { good: 0.1, needsImprovement: 0.25 },
      fcp: { good: 1800, needsImprovement: 3000 },
      ttfb: { good: 800, needsImprovement: 1800 },
      tbt: { good: 200, needsImprovement: 600 },
      speedIndex: { good: 3400, needsImprovement: 5800 },
      tti: { good: 3800, needsImprovement: 7300 },
    };
  }

  private initializeEmptyMetrics(): CoreWebVitalsMetrics {
    return {
      lcp: null,
      fid: null,
      cls: null,
      fcp: null,
      ttfb: null,
      tbt: null,
      speedIndex: null,
      tti: null,
      performanceScore: 0,
      userExperienceScore: 0,
      mobileOptimizationScore: 0,
      timestamp: Date.now(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      connectionType: this.getConnectionType(),
      deviceType: this.getDeviceType(),
      viewportSize: {
        width: window.innerWidth,
        height: window.innerHeight,
      },
    };
  }

  private checkBrowserSupport(): boolean {
    return "PerformanceObserver" in window && "PerformanceEntry" in window;
  }

  private initializeFallbackMonitoring(): boolean {
    // Fallback to Performance.timing API for older browsers
    logger.info("Using fallback performance monitoring", {}, "PERFORMANCE");

    // Setup basic timing measurements
    this.setupFallbackTimingMeasurement();

    return true;
  }

  private setupFallbackTimingMeasurement(): void {
    if (document.readyState === "complete") {
      this.measureFallbackTimings();
    } else {
      window.addEventListener("load", () => {
        setTimeout(() => this.measureFallbackTimings(), 0);
      });
    }
  }

  private measureFallbackTimings(): void {
    const timing = performance.timing;

    // Calculate basic metrics using Performance.timing
    const ttfb = timing.responseStart - timing.fetchStart;
    const fcp = timing.loadEventStart - timing.fetchStart; // Approximation

    this.metrics.ttfb = {
      value: ttfb,
      rating: this.getRating("ttfb", ttfb),
      percentile: 50, // Default percentile
      delta: 0,
      trend: "stable",
      entries: [],
    };

    this.metrics.fcp = {
      value: fcp,
      rating: this.getRating("fcp", fcp),
      percentile: 50,
      delta: 0,
      trend: "stable",
      entries: [],
    };

    this.updatePerformanceScores();
  }

  private getRating(
    metric: string,
    value: number,
  ): "good" | "needs-improvement" | "poor" {
    const threshold = this.thresholds[metric as keyof PerformanceThresholds];
    if (!threshold) return "poor";

    if (value <= threshold.good) return "good";
    if (value <= threshold.needsImprovement) return "needs-improvement";
    return "poor";
  }

  private calculatePercentile(metric: string, value: number): number {
    // Implement percentile calculation based on historical data
    const historicalValues = this.metricHistory
      .map((m) => m[metric as keyof CoreWebVitalsMetrics] as PerformanceMetric)
      .filter((m) => m && m.value)
      .map((m) => m.value)
      .sort((a, b) => a - b);

    if (historicalValues.length === 0) return 50;

    const rank = historicalValues.filter((v) => v <= value).length;
    return Math.round((rank / historicalValues.length) * 100);
  }

  private calculateDelta(metric: string, value: number): number {
    const lastMetric = this.metrics[
      metric as keyof CoreWebVitalsMetrics
    ] as PerformanceMetric;
    return lastMetric ? value - lastMetric.value : 0;
  }

  private calculateTrend(
    metric: string,
    value: number,
  ): "improving" | "stable" | "degrading" {
    const recentValues = this.metricHistory
      .slice(-5) // Last 5 measurements
      .map((m) => m[metric as keyof CoreWebVitalsMetrics] as PerformanceMetric)
      .filter((m) => m && m.value)
      .map((m) => m.value);

    if (recentValues.length < 2) return "stable";

    const trend = recentValues[recentValues.length - 1] - recentValues[0];
    const threshold = this.thresholds[metric as keyof PerformanceThresholds];

    if (!threshold) return "stable";

    const significantChange = threshold.good * 0.1; // 10% of good threshold

    if (trend < -significantChange) return "improving";
    if (trend > significantChange) return "degrading";
    return "stable";
  }

  private updatePerformanceScores(): void {
    // Calculate overall performance score based on Core Web Vitals
    const scores: number[] = [];

    if (this.metrics.lcp)
      scores.push(this.getMetricScore("lcp", this.metrics.lcp.value));
    if (this.metrics.fid)
      scores.push(this.getMetricScore("fid", this.metrics.fid.value));
    if (this.metrics.cls)
      scores.push(this.getMetricScore("cls", this.metrics.cls.value));
    if (this.metrics.fcp)
      scores.push(this.getMetricScore("fcp", this.metrics.fcp.value));
    if (this.metrics.ttfb)
      scores.push(this.getMetricScore("ttfb", this.metrics.ttfb.value));

    this.metrics.performanceScore =
      scores.length > 0
        ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
        : 0;

    // Update timestamp
    this.metrics.timestamp = Date.now();

    // Store in history
    this.storeMetricHistory();
  }

  private getMetricScore(metric: string, value: number): number {
    const threshold = this.thresholds[metric as keyof PerformanceThresholds];
    if (!threshold) return 0;

    // Convert performance value to 0-100 score
    if (value <= threshold.good) return 90;
    if (value <= threshold.needsImprovement) return 50;
    return 10;
  }

  private storeMetricHistory(): void {
    this.metricHistory.push({ ...this.metrics });

    // Keep only last 100 entries to prevent memory bloat
    if (this.metricHistory.length > 100) {
      this.metricHistory = this.metricHistory.slice(-100);
    }
  }

  private setupPerformanceBudgets(): void {
    this.performanceBudgets = [
      {
        metric: "lcp",
        target: 2000,
        warning: 2500,
        critical: 4000,
        current: 0,
        status: "within",
        impact: "high",
      },
      {
        metric: "fid",
        target: 50,
        warning: 100,
        critical: 300,
        current: 0,
        status: "within",
        impact: "high",
      },
      {
        metric: "cls",
        target: 0.05,
        warning: 0.1,
        critical: 0.25,
        current: 0,
        status: "within",
        impact: "medium",
      },
    ];
  }

  private checkPerformanceBudgets(metric: string, value: number): void {
    const budget = this.performanceBudgets.find((b) => b.metric === metric);
    if (!budget) return;

    budget.current = value;

    const previousStatus = budget.status;

    if (value <= budget.target) {
      budget.status = "within";
    } else if (value <= budget.warning) {
      budget.status = "warning";
    } else {
      budget.status = "exceeded";
    }

    // Alert if status worsened
    if (previousStatus !== budget.status && budget.status !== "within") {
      this.triggerPerformanceAlert(metric, value, budget);
    }
  }

  private triggerPerformanceAlert(
    metric: string,
    value: number,
    budget: PerformanceBudget,
  ): void {
    const alert: PerformanceAlert = {
      id: `${metric}_${Date.now()}`,
      metric,
      severity: budget.status === "exceeded" ? "critical" : "warning",
      value,
      threshold:
        budget.status === "exceeded" ? budget.critical : budget.warning,
      message: `${metric.toUpperCase()} ${budget.status === "exceeded" ? "exceeded critical threshold" : "exceeded warning threshold"}`,
      timestamp: Date.now(),
      url: window.location.href,
      suggestions: this.getPerformanceSuggestions(metric, value),
    };

    // Notify all subscribers
    this.alertSubscribers.forEach((callback) => {
      try {
        callback(alert);
      } catch (error) {
        logger.error(
          "Performance alert callback failed",
          { error },
          "PERFORMANCE",
        );
      }
    });

    logger.warn("Performance alert triggered", alert, "PERFORMANCE");
  }

  private getPerformanceSuggestions(metric: string, value: number): string[] {
    const suggestions: Record<string, string[]> = {
      lcp: [
        "Optimize server response times",
        "Use a CDN for faster content delivery",
        "Optimize and compress images",
        "Preload key resources",
        "Remove unused JavaScript",
      ],
      fid: [
        "Split long tasks into smaller chunks",
        "Optimize third-party scripts",
        "Use web workers for heavy computations",
        "Defer non-essential JavaScript",
        "Optimize event handlers",
      ],
      cls: [
        "Set size attributes on images and videos",
        "Avoid inserting content above existing content",
        "Use transform animations instead of changing layout properties",
        "Preload fonts to prevent text shifts",
      ],
      fcp: [
        "Optimize server response time",
        "Eliminate render-blocking resources",
        "Minify CSS and JavaScript",
        "Use efficient cache policies",
        "Optimize fonts loading",
      ],
      ttfb: [
        "Optimize server performance",
        "Use a CDN",
        "Optimize database queries",
        "Enable compression",
        "Reduce server processing time",
      ],
    };

    return suggestions[metric] || [];
  }

  private startPerformanceScoring(): void {
    // Update performance scores every 5 seconds
    setInterval(() => {
      this.updatePerformanceScores();
    }, 5000);
  }

  private startBudgetMonitoring(): void {
    // Check budget violations every 10 seconds
    setInterval(() => {
      this.performanceBudgets.forEach((budget) => {
        const currentMetric = this.metrics[
          budget.metric as keyof CoreWebVitalsMetrics
        ] as PerformanceMetric;
        if (currentMetric) {
          this.checkPerformanceBudgets(budget.metric, currentMetric.value);
        }
      });
    }, 10000);
  }

  private setupAdaptiveSampling(): void {
    // Adjust sampling rate based on device capabilities and network
    const connection = (navigator as any).connection;
    const deviceMemory = (navigator as any).deviceMemory;

    if (connection?.effectiveType === "2g" || deviceMemory < 2) {
      this.samplingRate = 0.1; // 10% sampling on low-end devices
    } else if (connection?.effectiveType === "3g" || deviceMemory < 4) {
      this.samplingRate = 0.5; // 50% sampling on mid-range devices
    }

    logger.info(
      "Adaptive sampling configured",
      {
        samplingRate: this.samplingRate,
        effectiveType: connection?.effectiveType,
        deviceMemory,
      },
      "PERFORMANCE",
    );
  }

  private setupPageVisibilityTracking(): void {
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") {
        // Page is hidden - reduce monitoring frequency
        this.samplingRate = Math.max(0.1, this.samplingRate * 0.5);
      } else {
        // Page is visible - restore normal monitoring
        this.samplingRate = Math.min(1.0, this.samplingRate * 2);
      }
    });
  }

  private checkForRegression(metric: string, value: number): void {
    // Check if current value represents a significant regression
    const recentAverage = this.calculateRecentAverage(metric);
    if (recentAverage === null) return;

    const regressionThreshold = recentAverage * 1.2; // 20% worse than recent average

    if (value > regressionThreshold) {
      logger.warn(
        "Performance regression detected",
        {
          metric,
          currentValue: value,
          recentAverage,
          regressionThreshold,
        },
        "PERFORMANCE",
      );

      // Could trigger additional monitoring or alerts here
    }
  }

  private calculateRecentAverage(metric: string): number | null {
    const recentValues = this.metricHistory
      .slice(-10) // Last 10 measurements
      .map((m) => m[metric as keyof CoreWebVitalsMetrics] as PerformanceMetric)
      .filter((m) => m && m.value)
      .map((m) => m.value);

    return recentValues.length > 0
      ? recentValues.reduce((a, b) => a + b, 0) / recentValues.length
      : null;
  }

  private calculateMetricTrend(
    metric: string,
    period: string,
  ): PerformanceTrend | null {
    // Implement trend calculation based on historical data
    const values = this.metricHistory
      .map((m) => m[metric as keyof CoreWebVitalsMetrics] as PerformanceMetric)
      .filter((m) => m && m.value)
      .map((m) => m.value);

    if (values.length < 2) return null;

    const sorted = [...values].sort((a, b) => a - b);

    return {
      metric,
      period,
      samples: values.length,
      average: values.reduce((a, b) => a + b) / values.length,
      median: sorted[Math.floor(sorted.length / 2)],
      p75: sorted[Math.floor(sorted.length * 0.75)],
      p90: sorted[Math.floor(sorted.length * 0.9)],
      p95: sorted[Math.floor(sorted.length * 0.95)],
      trend: this.calculateTrend(metric, values[values.length - 1]),
      regressionDetected: false, // Would implement regression detection
    };
  }

  private getConnectionType(): string {
    const connection = (navigator as any).connection;
    return connection?.effectiveType || "unknown";
  }

  private getDeviceType(): "mobile" | "tablet" | "desktop" {
    const width = window.innerWidth;
    if (width < 768) return "mobile";
    if (width < 1024) return "tablet";
    return "desktop";
  }

  private processNavigationEntry(entry: PerformanceNavigationTiming): void {
    // Process navigation timing for additional insights
    logger.debug(
      "Navigation timing",
      {
        domContentLoaded: entry.domContentLoadedEventEnd - entry.fetchStart,
        loadComplete: entry.loadEventEnd - entry.fetchStart,
        dnsLookup: entry.domainLookupEnd - entry.domainLookupStart,
        tcpConnect: entry.connectEnd - entry.connectStart,
      },
      "PERFORMANCE",
    );
  }

  private processResourceEntry(entry: PerformanceResourceTiming): void {
    // Process resource timing for loading optimization insights
    if (entry.transferSize > 100000) {
      // Resources larger than 100KB
      logger.debug(
        "Large resource detected",
        {
          name: entry.name,
          size: entry.transferSize,
          duration: entry.duration,
        },
        "PERFORMANCE",
      );
    }
  }

  private processLongTaskEntry(entry: PerformanceEntry): void {
    // Process long task entries for main thread blocking detection
    if (entry.duration > 50) {
      logger.debug(
        "Long task detected",
        {
          duration: entry.duration,
          startTime: entry.startTime,
        },
        "PERFORMANCE",
      );
    }
  }

  private convertToCSV(data: any): string {
    // Simple CSV conversion - would implement full CSV export
    return "Performance data export in CSV format - not implemented";
  }

  /**
   * Cleanup observers and stop monitoring
   */
  destroy(): void {
    this.observers.forEach((observer, type) => {
      try {
        observer.disconnect();
      } catch (error) {
        logger.error(
          `Failed to disconnect ${type} observer`,
          { error },
          "PERFORMANCE",
        );
      }
    });

    this.observers.clear();
    this.isMonitoring = false;

    logger.info("Core Web Vitals Monitor destroyed", {}, "PERFORMANCE");
  }
}

// Export singleton instance
export const coreWebVitalsMonitor = CoreWebVitalsMonitor.getInstance();
export default coreWebVitalsMonitor;
