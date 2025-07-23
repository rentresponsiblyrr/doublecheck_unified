/**
 * INSPECTION MONITORING HOOK - PHASE 1 CRITICAL FIX
 *
 * React hook for seamless integration with inspection monitoring system
 * Provides real-time monitoring capabilities with minimal performance impact
 *
 * Features:
 * - Automatic error tracking for components
 * - Performance monitoring with SLA alerts
 * - Real-time metrics subscription
 * - Optimistic updates and error recovery
 * - Memory efficient with cleanup
 *
 * ELIMINATES: Manual error tracking and performance monitoring
 * PROVIDES: Plug-and-play monitoring for React components
 * ENSURES: Comprehensive visibility without development overhead
 *
 * @example
 * ```typescript
 * const { trackError, trackSuccess, metrics, alerts } = useInspectionMonitoring({
 *   componentName: 'PropertyInspectionForm',
 *   autoTrack: true
 * });
 *
 * // Automatic error tracking
 * const handleInspectionCreation = async () => {
 *   try {
 *     const result = await createInspection(data);
 *     trackSuccess(result);
 *   } catch (error) {
 *     trackError(error); // Automatically handled
 *   }
 * };
 * ```
 */

import { useState, useEffect, useCallback, useRef } from "react";
import {
  inspectionErrorMonitor,
  trackInspectionError,
  trackInspectionSuccess,
  ErrorMetrics,
  MonitoringAlert,
  InspectionErrorEvent,
} from "@/lib/monitoring/inspection-error-monitor";
import { InspectionErrorCode } from "@/lib/database/inspection-creation-service";

// ================================================================
// HOOK CONFIGURATION INTERFACES
// ================================================================

export interface InspectionMonitoringConfig {
  /** Component or feature name for context */
  componentName?: string;

  /** Automatically track errors thrown in component */
  autoTrack?: boolean;

  /** Auto-refresh metrics interval in milliseconds */
  refreshInterval?: number;

  /** Enable real-time metrics updates */
  realTimeUpdates?: boolean;

  /** Performance threshold for alerts (milliseconds) */
  performanceThreshold?: number;

  /** User context to include in all tracking calls */
  userContext?: {
    userId?: string;
    userRole?: string;
    sessionId?: string;
  };
}

export interface MonitoringHookResult {
  /** Current error metrics */
  metrics: ErrorMetrics | null;

  /** Active monitoring alerts */
  alerts: MonitoringAlert[];

  /** Is monitoring data loading */
  isLoading: boolean;

  /** Last error that occurred */
  lastError: Error | null;

  /** Track an inspection error */
  trackError: (
    error: Error | InspectionErrorEvent,
    context?: Record<string, unknown>,
  ) => void;

  /** Track a successful inspection */
  trackSuccess: (data: {
    processingTime: number;
    context?: Record<string, unknown>;
  }) => void;

  /** Manually refresh monitoring data */
  refreshMetrics: () => void;

  /** Clear last error */
  clearError: () => void;

  /** Export monitoring data */
  exportData: () => void;

  /** Get component-specific metrics */
  getComponentMetrics: () => ErrorMetrics | null;
}

// ================================================================
// MAIN MONITORING HOOK
// ================================================================

export const useInspectionMonitoring = (
  config: InspectionMonitoringConfig = {},
): MonitoringHookResult => {
  const {
    componentName = "UnknownComponent",
    autoTrack = false,
    refreshInterval = 30000,
    realTimeUpdates = true,
    performanceThreshold = 1000,
    userContext = {},
  } = config;

  // State
  const [metrics, setMetrics] = useState<ErrorMetrics | null>(null);
  const [alerts, setAlerts] = useState<MonitoringAlert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastError, setLastError] = useState<Error | null>(null);

  // Refs for cleanup and performance
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const componentErrorsRef = useRef<InspectionErrorEvent[]>([]);

  // ================================================================
  // ERROR TRACKING FUNCTIONS
  // ================================================================

  const trackError = useCallback(
    (
      error: Error | InspectionErrorEvent,
      context: Record<string, unknown> = {},
    ) => {
      try {
        let errorEvent: InspectionErrorEvent;

        if (error instanceof Error) {
          // Convert regular Error to InspectionErrorEvent
          errorEvent = {
            errorCode: InspectionErrorCode.SYSTEM_CONFIGURATION_ERROR,
            message: error.message,
            timestamp: new Date().toISOString(),
            userContext: {
              ...userContext,
              ...context,
            },
            technicalContext: {
              component: componentName,
              stackTrace: error.stack,
              url:
                typeof window !== "undefined"
                  ? window.location.href
                  : undefined,
            },
            businessImpact: {
              severity: "medium",
              affectedUsers: 1,
            },
          };
        } else {
          // Enhance existing InspectionErrorEvent
          errorEvent = {
            ...error,
            userContext: {
              ...userContext,
              ...error.userContext,
              ...context,
            },
            technicalContext: {
              component: componentName,
              ...error.technicalContext,
            },
          };
        }

        // Track in component-specific history
        componentErrorsRef.current.push(errorEvent);
        if (componentErrorsRef.current.length > 100) {
          componentErrorsRef.current = componentErrorsRef.current.slice(-100);
        }

        // Track in global monitoring system
        trackInspectionError(errorEvent);

        // Update local state
        setLastError(error instanceof Error ? error : new Error(error.message));
      } catch (trackingError) {
        console.error("Failed to track inspection error:", trackingError);
        setLastError(
          trackingError instanceof Error
            ? trackingError
            : new Error("Tracking failed"),
        );
      }
    },
    [componentName, userContext],
  );

  const trackSuccess = useCallback(
    (data: { processingTime: number; context?: Record<string, unknown> }) => {
      try {
        trackInspectionSuccess({
          processingTime: data.processingTime,
          userContext: {
            ...userContext,
            ...data.context,
          },
          performanceData: {
            processingTime: data.processingTime,
          },
        });

        // Performance alerting
        if (data.processingTime > performanceThreshold) {
          trackError(
            new Error(`Slow performance detected: ${data.processingTime}ms`),
            {
              performanceAlert: true,
              threshold: performanceThreshold,
            },
          );
        }

        // Clear last error on successful operation
        setLastError(null);
      } catch (trackingError) {
        console.error("Failed to track inspection success:", trackingError);
      }
    },
    [userContext, performanceThreshold, trackError],
  );

  // ================================================================
  // METRICS AND ALERTS MANAGEMENT
  // ================================================================

  const refreshMetrics = useCallback(() => {
    try {
      setIsLoading(true);
      const currentMetrics = inspectionErrorMonitor.getErrorMetrics();
      const currentAlerts = inspectionErrorMonitor.getActiveAlerts();

      setMetrics(currentMetrics);
      setAlerts(currentAlerts);
    } catch (error) {
      console.error("Failed to refresh monitoring metrics:", error);
      trackError(
        error instanceof Error ? error : new Error("Metrics refresh failed"),
      );
    } finally {
      setIsLoading(false);
    }
  }, [trackError]);

  const getComponentMetrics = useCallback((): ErrorMetrics | null => {
    if (!metrics || componentErrorsRef.current.length === 0) {
      return null;
    }

    const componentErrors = componentErrorsRef.current;
    const now = Date.now();
    const oneDayAgo = now - 24 * 60 * 60 * 1000;

    const recentComponentErrors = componentErrors.filter(
      (error) => new Date(error.timestamp).getTime() > oneDayAgo,
    );

    const errorsByCode = recentComponentErrors.reduce(
      (acc, error) => {
        acc[error.errorCode] = (acc[error.errorCode] || 0) + 1;
        return acc;
      },
      {} as Record<InspectionErrorCode, number>,
    );

    return {
      totalErrors: recentComponentErrors.length,
      errorsByCode,
      errorRate: recentComponentErrors.length / 24, // errors per hour
      averageProcessingTime: 0, // Component-specific processing time would need additional tracking
      successRate: 1, // Would need to track component successes separately
      criticalErrors: recentComponentErrors.filter(
        (e) => e.businessImpact?.severity === "critical",
      ).length,
      recentErrors: recentComponentErrors.slice(-10),
      performanceTrends: {
        averageResponseTime: 0,
        p95ResponseTime: 0,
        errorRateChange: 0,
      },
    };
  }, [metrics]);

  // ================================================================
  // UTILITY FUNCTIONS
  // ================================================================

  const clearError = useCallback(() => {
    setLastError(null);
  }, []);

  const exportData = useCallback(() => {
    try {
      const monitoringData = inspectionErrorMonitor.exportMonitoringData();
      const componentData = {
        ...monitoringData,
        componentName,
        componentErrors: componentErrorsRef.current,
        componentMetrics: getComponentMetrics(),
      };

      const dataStr = JSON.stringify(componentData, null, 2);
      const dataBlob = new Blob([dataStr], { type: "application/json" });

      const link = document.createElement("a");
      link.href = URL.createObjectURL(dataBlob);
      link.download = `inspection-monitoring-${componentName}-${new Date().toISOString().slice(0, 10)}.json`;
      link.click();

      URL.revokeObjectURL(link.href);
    } catch (error) {
      console.error("Failed to export monitoring data:", error);
      trackError(error instanceof Error ? error : new Error("Export failed"));
    }
  }, [componentName, getComponentMetrics, trackError]);

  // ================================================================
  // EFFECT HOOKS
  // ================================================================

  // Initial metrics load and auto-refresh setup
  useEffect(() => {
    refreshMetrics();

    if (realTimeUpdates) {
      refreshIntervalRef.current = setInterval(refreshMetrics, refreshInterval);
    }

    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, [refreshMetrics, realTimeUpdates, refreshInterval]);

  // Auto-track unhandled errors in component
  useEffect(() => {
    if (!autoTrack) return;

    const handleUnhandledError = (event: ErrorEvent) => {
      trackError(new Error(event.message), {
        autoTracked: true,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      });
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const error =
        event.reason instanceof Error
          ? event.reason
          : new Error(String(event.reason));

      trackError(error, {
        autoTracked: true,
        rejectionType: "unhandled_promise",
      });
    };

    window.addEventListener("error", handleUnhandledError);
    window.addEventListener("unhandledrejection", handleUnhandledRejection);

    return () => {
      window.removeEventListener("error", handleUnhandledError);
      window.removeEventListener(
        "unhandledrejection",
        handleUnhandledRejection,
      );
    };
  }, [autoTrack, trackError]);

  // ================================================================
  // RETURN HOOK RESULT
  // ================================================================

  return {
    metrics,
    alerts,
    isLoading,
    lastError,
    trackError,
    trackSuccess,
    refreshMetrics,
    clearError,
    exportData,
    getComponentMetrics,
  };
};

// ================================================================
// CONVENIENCE HOOKS
// ================================================================

/**
 * Simplified hook for basic error tracking
 */
export const useErrorTracking = (componentName: string) => {
  const { trackError, trackSuccess, lastError, clearError } =
    useInspectionMonitoring({
      componentName,
      autoTrack: false,
      realTimeUpdates: false,
    });

  return { trackError, trackSuccess, lastError, clearError };
};

/**
 * Hook for performance monitoring only
 */
export const usePerformanceMonitoring = (
  componentName: string,
  performanceThreshold = 1000,
) => {
  const { trackSuccess, metrics, refreshMetrics } = useInspectionMonitoring({
    componentName,
    performanceThreshold,
    realTimeUpdates: true,
  });

  const trackOperation = useCallback(
    async <T>(
      operation: () => Promise<T>,
      context?: Record<string, unknown>,
    ): Promise<T> => {
      const startTime = performance.now();

      try {
        const result = await operation();
        const processingTime = performance.now() - startTime;

        trackSuccess({ processingTime, context });
        return result;
      } catch (error) {
        const processingTime = performance.now() - startTime;
        trackSuccess({ processingTime, context: { ...context, failed: true } });
        throw error;
      }
    },
    [trackSuccess],
  );

  return {
    trackOperation,
    metrics,
    refreshMetrics,
    averageResponseTime: metrics?.averageProcessingTime || 0,
  };
};

export default useInspectionMonitoring;
