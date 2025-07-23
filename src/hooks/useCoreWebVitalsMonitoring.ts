/**
 * USE CORE WEB VITALS MONITORING HOOK - ELITE PERFORMANCE INTEGRATION
 *
 * React hook that integrates Core Web Vitals monitoring with React components,
 * providing real-time performance metrics, alerting, and optimization recommendations.
 * Designed for Netflix/Meta performance standards with construction site optimization.
 *
 * FEATURES:
 * - Real-time Core Web Vitals tracking (LCP, FID, CLS, FCP, TTFB)
 * - Performance budget monitoring and violation alerts
 * - Trend analysis and regression detection
 * - Device-specific and network-aware optimization
 * - Construction site performance optimization
 * - Mobile battery and memory optimization
 * - Performance debugging and diagnostics
 *
 * USAGE:
 * ```typescript
 * const {
 *   metrics,
 *   trends,
 *   budgets,
 *   isMonitoring,
 *   subscribe,
 *   exportData
 * } = useCoreWebVitalsMonitoring();
 * ```
 *
 * @author STR Certified Engineering Team
 */

import { useState, useEffect, useCallback, useRef } from "react";
import {
  coreWebVitalsMonitor,
  CoreWebVitalsMetrics,
  PerformanceTrend,
  PerformanceBudget,
  PerformanceAlert,
} from "@/lib/performance/CoreWebVitalsMonitor";
import { logger } from "@/utils/logger";

// Hook interfaces
export interface CoreWebVitalsState {
  metrics: CoreWebVitalsMetrics;
  trends: PerformanceTrend[];
  budgets: PerformanceBudget[];
  alerts: PerformanceAlert[];
  isMonitoring: boolean;
  isInitialized: boolean;
  lastUpdate: number;
  deviceMetrics: DevicePerformanceMetrics;
}

export interface CoreWebVitalsActions {
  startMonitoring: () => Promise<boolean>;
  stopMonitoring: () => void;
  exportData: (format?: "json" | "csv") => string;
  clearAlerts: () => void;
  refreshMetrics: () => void;
  subscribeToAlerts: (
    callback: (alert: PerformanceAlert) => void,
  ) => () => void;
  getOptimizationSuggestions: () => OptimizationSuggestion[];
}

export interface DevicePerformanceMetrics {
  deviceType: "mobile" | "tablet" | "desktop";
  connectionType: string;
  effectiveConnectionType: string;
  batteryLevel?: number;
  deviceMemory?: number;
  hardwareConcurrency: number;
  isLowEndDevice: boolean;
  supportedFeatures: SupportedFeatures;
}

export interface SupportedFeatures {
  performanceObserver: boolean;
  intersectionObserver: boolean;
  webWorkers: boolean;
  serviceWorkers: boolean;
  webAssembly: boolean;
}

export interface OptimizationSuggestion {
  type: "critical" | "important" | "moderate" | "minor";
  metric: string;
  issue: string;
  suggestion: string;
  impact: "high" | "medium" | "low";
  effort: "low" | "medium" | "high";
  priority: number;
}

export interface CoreWebVitalsOptions {
  enableRealTimeUpdates?: boolean;
  updateInterval?: number;
  enableTrendAnalysis?: boolean;
  enableBudgetMonitoring?: boolean;
  enableAlerts?: boolean;
  enableOptimizationSuggestions?: boolean;
  customThresholds?: Partial<
    Record<string, { good: number; needsImprovement: number }>
  >;
}

/**
 * Main Core Web Vitals monitoring hook
 */
export function useCoreWebVitalsMonitoring(
  options: CoreWebVitalsOptions = {},
): [CoreWebVitalsState, CoreWebVitalsActions] {
  // Default options
  const config = {
    enableRealTimeUpdates: true,
    updateInterval: 5000,
    enableTrendAnalysis: true,
    enableBudgetMonitoring: true,
    enableAlerts: true,
    enableOptimizationSuggestions: true,
    ...options,
  };

  // State management
  const [state, setState] = useState<CoreWebVitalsState>(() => ({
    metrics: coreWebVitalsMonitor.getCurrentMetrics(),
    trends: [],
    budgets: [],
    alerts: [],
    isMonitoring: false,
    isInitialized: false,
    lastUpdate: Date.now(),
    deviceMetrics: getDeviceMetrics(),
  }));

  // Refs for cleanup and state management
  const updateIntervalRef = useRef<number | null>(null);
  const alertUnsubscribeRef = useRef<(() => void) | null>(null);
  const isInitializingRef = useRef<boolean>(false);

  /**
   * Initialize Core Web Vitals monitoring
   */
  const initializeMonitoring = useCallback(async (): Promise<boolean> => {
    if (isInitializingRef.current || state.isInitialized) {
      return state.isInitialized;
    }

    isInitializingRef.current = true;

    try {
      logger.info(
        "Initializing Core Web Vitals monitoring hook",
        config,
        "CORE_WEB_VITALS_HOOK",
      );

      // Initialize Core Web Vitals monitor
      const initialized = await coreWebVitalsMonitor.initialize();

      if (!initialized) {
        throw new Error("Core Web Vitals monitor initialization failed");
      }

      // Setup alert subscription
      if (config.enableAlerts) {
        alertUnsubscribeRef.current = coreWebVitalsMonitor.subscribeToAlerts(
          (alert) => {
            setState((prev) => ({
              ...prev,
              alerts: [...prev.alerts, alert],
              lastUpdate: Date.now(),
            }));
          },
        );
      }

      // Setup real-time updates
      if (config.enableRealTimeUpdates) {
        startRealTimeUpdates();
      }

      setState((prev) => ({
        ...prev,
        isInitialized: true,
        isMonitoring: true,
        metrics: coreWebVitalsMonitor.getCurrentMetrics(),
        budgets: config.enableBudgetMonitoring
          ? coreWebVitalsMonitor.getPerformanceBudgets()
          : [],
        trends: config.enableTrendAnalysis
          ? coreWebVitalsMonitor.getPerformanceTrends()
          : [],
        lastUpdate: Date.now(),
      }));

      logger.info(
        "Core Web Vitals monitoring hook initialized successfully",
        {
          deviceType: state.deviceMetrics.deviceType,
          connectionType: state.deviceMetrics.connectionType,
          isLowEndDevice: state.deviceMetrics.isLowEndDevice,
        },
        "CORE_WEB_VITALS_HOOK",
      );

      return true;
    } catch (error) {
      logger.error(
        "Core Web Vitals monitoring hook initialization failed",
        { error },
        "CORE_WEB_VITALS_HOOK",
      );

      setState((prev) => ({
        ...prev,
        isInitialized: false,
        isMonitoring: false,
      }));

      return false;
    } finally {
      isInitializingRef.current = false;
    }
  }, [config, state.isInitialized]);

  /**
   * Start real-time updates
   */
  const startRealTimeUpdates = useCallback(() => {
    if (updateIntervalRef.current) {
      clearInterval(updateIntervalRef.current);
    }

    updateIntervalRef.current = window.setInterval(() => {
      try {
        const currentMetrics = coreWebVitalsMonitor.getCurrentMetrics();
        const currentBudgets = config.enableBudgetMonitoring
          ? coreWebVitalsMonitor.getPerformanceBudgets()
          : [];
        const currentTrends = config.enableTrendAnalysis
          ? coreWebVitalsMonitor.getPerformanceTrends()
          : [];

        setState((prev) => ({
          ...prev,
          metrics: currentMetrics,
          budgets: currentBudgets,
          trends: currentTrends,
          lastUpdate: Date.now(),
        }));
      } catch (error) {
        logger.error(
          "Real-time update failed",
          { error },
          "CORE_WEB_VITALS_HOOK",
        );
      }
    }, config.updateInterval);
  }, [
    config.enableBudgetMonitoring,
    config.enableTrendAnalysis,
    config.updateInterval,
  ]);

  /**
   * Stop real-time updates
   */
  const stopRealTimeUpdates = useCallback(() => {
    if (updateIntervalRef.current) {
      clearInterval(updateIntervalRef.current);
      updateIntervalRef.current = null;
    }
  }, []);

  // Actions implementation
  const actions: CoreWebVitalsActions = {
    startMonitoring: useCallback(async (): Promise<boolean> => {
      return await initializeMonitoring();
    }, [initializeMonitoring]),

    stopMonitoring: useCallback((): void => {
      stopRealTimeUpdates();

      if (alertUnsubscribeRef.current) {
        alertUnsubscribeRef.current();
        alertUnsubscribeRef.current = null;
      }

      setState((prev) => ({
        ...prev,
        isMonitoring: false,
      }));

      logger.info(
        "Core Web Vitals monitoring stopped",
        {},
        "CORE_WEB_VITALS_HOOK",
      );
    }, [stopRealTimeUpdates]),

    exportData: useCallback((format: "json" | "csv" = "json"): string => {
      try {
        return coreWebVitalsMonitor.exportPerformanceData(format);
      } catch (error) {
        logger.error(
          "Performance data export failed",
          { error, format },
          "CORE_WEB_VITALS_HOOK",
        );
        return JSON.stringify({
          error: "Export failed",
          timestamp: Date.now(),
        });
      }
    }, []),

    clearAlerts: useCallback((): void => {
      setState((prev) => ({
        ...prev,
        alerts: [],
        lastUpdate: Date.now(),
      }));
    }, []),

    refreshMetrics: useCallback((): void => {
      try {
        const currentMetrics = coreWebVitalsMonitor.getCurrentMetrics();
        const currentBudgets = config.enableBudgetMonitoring
          ? coreWebVitalsMonitor.getPerformanceBudgets()
          : [];
        const currentTrends = config.enableTrendAnalysis
          ? coreWebVitalsMonitor.getPerformanceTrends()
          : [];

        setState((prev) => ({
          ...prev,
          metrics: currentMetrics,
          budgets: currentBudgets,
          trends: currentTrends,
          lastUpdate: Date.now(),
        }));
      } catch (error) {
        logger.error(
          "Metrics refresh failed",
          { error },
          "CORE_WEB_VITALS_HOOK",
        );
      }
    }, [config.enableBudgetMonitoring, config.enableTrendAnalysis]),

    subscribeToAlerts: useCallback(
      (callback: (alert: PerformanceAlert) => void): (() => void) => {
        return coreWebVitalsMonitor.subscribeToAlerts(callback);
      },
      [],
    ),

    getOptimizationSuggestions: useCallback((): OptimizationSuggestion[] => {
      return generateOptimizationSuggestions(
        state.metrics,
        state.budgets,
        state.deviceMetrics,
      );
    }, [state.metrics, state.budgets, state.deviceMetrics]),
  };

  // Initialize on mount
  useEffect(() => {
    initializeMonitoring();
  }, [initializeMonitoring]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopRealTimeUpdates();

      if (alertUnsubscribeRef.current) {
        alertUnsubscribeRef.current();
      }

      logger.info(
        "Core Web Vitals monitoring hook cleanup completed",
        {},
        "CORE_WEB_VITALS_HOOK",
      );
    };
  }, [stopRealTimeUpdates]);

  return [state, actions];
}

/**
 * Convenience hook for Core Web Vitals metrics only
 */
export function useCoreWebVitals() {
  const [state, actions] = useCoreWebVitalsMonitoring({
    enableTrendAnalysis: false,
    enableBudgetMonitoring: false,
    enableAlerts: false,
    enableOptimizationSuggestions: false,
  });

  return {
    lcp: state.metrics.lcp,
    fid: state.metrics.fid,
    cls: state.metrics.cls,
    fcp: state.metrics.fcp,
    ttfb: state.metrics.ttfb,
    performanceScore: state.metrics.performanceScore,
    lastUpdate: state.lastUpdate,
    refreshMetrics: actions.refreshMetrics,
  };
}

/**
 * Convenience hook for performance budgets
 */
export function usePerformanceBudgets() {
  const [state, actions] = useCoreWebVitalsMonitoring({
    enableRealTimeUpdates: true,
    enableTrendAnalysis: false,
    enableAlerts: true,
    enableOptimizationSuggestions: false,
  });

  return {
    budgets: state.budgets,
    alerts: state.alerts,
    isMonitoring: state.isMonitoring,
    clearAlerts: actions.clearAlerts,
    subscribeToAlerts: actions.subscribeToAlerts,
  };
}

/**
 * Convenience hook for performance trends
 */
export function usePerformanceTrends(
  period: "1h" | "24h" | "7d" | "30d" = "24h",
) {
  const [state, actions] = useCoreWebVitalsMonitoring({
    enableRealTimeUpdates: false,
    enableTrendAnalysis: true,
    enableBudgetMonitoring: false,
    enableAlerts: false,
  });

  const filteredTrends = state.trends.filter(
    (trend) => trend.period === period,
  );

  return {
    trends: filteredTrends,
    refreshTrends: actions.refreshMetrics,
    exportData: actions.exportData,
  };
}

// Helper functions

/**
 * Get device performance characteristics
 */
function getDeviceMetrics(): DevicePerformanceMetrics {
  const connection = (navigator as any).connection;
  const deviceMemory = (navigator as any).deviceMemory;
  const hardwareConcurrency = navigator.hardwareConcurrency || 4;

  const deviceType = getDeviceType();
  const isLowEndDevice =
    deviceMemory < 2 ||
    hardwareConcurrency < 2 ||
    connection?.effectiveType === "2g" ||
    connection?.effectiveType === "slow-2g";

  return {
    deviceType,
    connectionType: connection?.type || "unknown",
    effectiveConnectionType: connection?.effectiveType || "unknown",
    batteryLevel: undefined, // Would be populated by battery API if available
    deviceMemory,
    hardwareConcurrency,
    isLowEndDevice,
    supportedFeatures: {
      performanceObserver: "PerformanceObserver" in window,
      intersectionObserver: "IntersectionObserver" in window,
      webWorkers: "Worker" in window,
      serviceWorkers: "serviceWorker" in navigator,
      webAssembly: "WebAssembly" in window,
    },
  };
}

/**
 * Determine device type based on viewport
 */
function getDeviceType(): "mobile" | "tablet" | "desktop" {
  const width = window.innerWidth;
  if (width < 768) return "mobile";
  if (width < 1024) return "tablet";
  return "desktop";
}

/**
 * Generate optimization suggestions based on current performance
 */
function generateOptimizationSuggestions(
  metrics: CoreWebVitalsMetrics,
  budgets: PerformanceBudget[],
  deviceMetrics: DevicePerformanceMetrics,
): OptimizationSuggestion[] {
  const suggestions: OptimizationSuggestion[] = [];

  // LCP optimizations
  if (metrics.lcp && metrics.lcp.rating !== "good") {
    suggestions.push({
      type: "critical",
      metric: "lcp",
      issue: `LCP is ${metrics.lcp.value.toFixed(0)}ms (target: <2500ms)`,
      suggestion: "Optimize server response times and preload key resources",
      impact: "high",
      effort: "medium",
      priority: 10,
    });
  }

  // FID optimizations
  if (metrics.fid && metrics.fid.rating !== "good") {
    suggestions.push({
      type: "important",
      metric: "fid",
      issue: `FID is ${metrics.fid.value.toFixed(0)}ms (target: <100ms)`,
      suggestion: "Split long tasks and defer non-essential JavaScript",
      impact: "high",
      effort: "high",
      priority: 9,
    });
  }

  // CLS optimizations
  if (metrics.cls && metrics.cls.rating !== "good") {
    suggestions.push({
      type: "important",
      metric: "cls",
      issue: `CLS is ${metrics.cls.value.toFixed(3)} (target: <0.1)`,
      suggestion: "Set dimensions on images and avoid layout shifts",
      impact: "medium",
      effort: "low",
      priority: 8,
    });
  }

  // Device-specific optimizations
  if (deviceMetrics.isLowEndDevice) {
    suggestions.push({
      type: "moderate",
      metric: "general",
      issue: "Low-end device detected",
      suggestion:
        "Implement device-specific optimizations and reduce bundle size",
      impact: "medium",
      effort: "medium",
      priority: 7,
    });
  }

  // Mobile-specific optimizations
  if (deviceMetrics.deviceType === "mobile") {
    suggestions.push({
      type: "moderate",
      metric: "general",
      issue: "Mobile device performance",
      suggestion: "Optimize for touch interactions and battery usage",
      impact: "medium",
      effort: "medium",
      priority: 6,
    });
  }

  // Sort by priority
  return suggestions.sort((a, b) => b.priority - a.priority);
}

export default useCoreWebVitalsMonitoring;
