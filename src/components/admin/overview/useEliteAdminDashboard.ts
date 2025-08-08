/**
 * Elite Admin Dashboard Hook
 * Netflix-grade performance, reliability, and real-time capabilities
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/lib/logger/production-logger";
import { configService } from "@/services/core/ConfigService";
import {
  validateDashboardMetrics,
  validateDashboardHealth,
  transformRawMetrics,
  performDataHealthCheck,
  type DashboardMetrics,
  type DashboardHealth,
} from "@/utils/adminDataValidation";

interface DashboardState {
  metrics: Partial<DashboardMetrics>;
  loadingStates: Record<string, boolean>;
  errors: Record<string, Error | null>;
  lastUpdated: Record<string, Date>;
  isInitialLoad: boolean;
  health: DashboardHealth | null;
}

interface LoadMetricsOptions {
  timeRange?: string;
  skipCache?: boolean;
  priority?: "high" | "normal" | "low";
}

export const useEliteAdminDashboard = (timeRange = "30d") => {
  const [state, setState] = useState<DashboardState>({
    metrics: {},
    loadingStates: {},
    errors: {},
    lastUpdated: {},
    isInitialLoad: true,
    health: null,
  });

  const subscriptionsRef = useRef<any[]>([]);
  const performanceRef = useRef<{
    loadTimes: number[];
    cacheHits: number;
    cacheMisses: number;
  }>({
    loadTimes: [],
    cacheHits: 0,
    cacheMisses: 0,
  });

  /**
   * Load consolidated dashboard metrics with intelligent caching
   */
  const loadConsolidatedMetrics = useCallback(
    async (
      options: LoadMetricsOptions = {},
    ): Promise<DashboardMetrics | null> => {
      const { skipCache = false, priority = "normal" } = options;
      const startTime = performance.now();

      try {
        const cacheKey = CacheKeys.DASHBOARD_METRICS;
        const ttl = priority === "high" ? 60000 : 300000; // 1min for high priority, 5min for normal

        setState((prev) => ({
          ...prev,
          loadingStates: { ...prev.loadingStates, consolidated: true },
          errors: { ...prev.errors, consolidated: null },
        }));

        // Use cache unless explicitly skipped
        const metricsData = skipCache
          ? await fetchMetricsFromDatabase()
          : await dashboardCache.get(cacheKey, fetchMetricsFromDatabase, ttl);

        const loadTime = performance.now() - startTime;
        performanceRef.current.loadTimes.push(loadTime);

        // Validate and transform data
        const transformedMetrics = transformRawMetrics(metricsData);
        const validatedMetrics = validateDashboardMetrics(transformedMetrics);

        // Perform health check
        const healthCheck = performDataHealthCheck(validatedMetrics);
        if (!healthCheck.isHealthy) {
          logger.warn("Dashboard data health issues detected", {
            issues: healthCheck.issues,
            component: "useEliteAdminDashboard",
          });
        }

        setState((prev) => ({
          ...prev,
          metrics: { ...prev.metrics, ...validatedMetrics },
          loadingStates: { ...prev.loadingStates, consolidated: false },
          lastUpdated: { ...prev.lastUpdated, consolidated: new Date() },
          isInitialLoad: false,
        }));

        logger.info("Consolidated metrics loaded successfully", {
          loadTime: `${loadTime.toFixed(2)}ms`,
          cacheHit: !skipCache,
          dataHealth: healthCheck.isHealthy,
          component: "useEliteAdminDashboard",
        });

        return validatedMetrics;
      } catch (error) {
        const loadTime = performance.now() - startTime;
        performanceRef.current.loadTimes.push(loadTime);

        logger.error("Failed to load consolidated metrics", {
          error: error instanceof Error ? error.message : String(error),
          loadTime: `${loadTime.toFixed(2)}ms`,
          skipCache,
          priority,
          component: "useEliteAdminDashboard",
        });

        setState((prev) => ({
          ...prev,
          loadingStates: { ...prev.loadingStates, consolidated: false },
          errors: { ...prev.errors, consolidated: error as Error },
        }));

        return null;
      }
    },
    [],
  );

  /**
   * Fetch metrics directly from database
   */
  const fetchMetricsFromDatabase = async () => {
    const startTime = performance.now();

    const { data, error } = await supabase.rpc("get_admin_dashboard_metrics");

    if (error) {
      throw new Error(`Database query failed: ${error.message}`);
    }

    const queryTime = performance.now() - startTime;
    logger.debug("Database metrics query completed", {
      queryTime: `${queryTime.toFixed(2)}ms`,
      component: "useEliteAdminDashboard",
    });

    return data;
  };

  /**
   * Load individual metric safely with graceful degradation
   */
  const loadMetricSafely = useCallback(
    async <T>(
      metricKey: string,
      loader: () => Promise<T>,
      fallbackData?: T,
    ): Promise<T | null> => {
      const startTime = performance.now();

      try {
        setState((prev) => ({
          ...prev,
          loadingStates: { ...prev.loadingStates, [metricKey]: true },
          errors: { ...prev.errors, [metricKey]: null },
        }));

        const data = await loader();
        const loadTime = performance.now() - startTime;

        setState((prev) => ({
          ...prev,
          metrics: { ...prev.metrics, [metricKey]: data },
          loadingStates: { ...prev.loadingStates, [metricKey]: false },
          lastUpdated: { ...prev.lastUpdated, [metricKey]: new Date() },
        }));

        logger.debug(`Metric ${metricKey} loaded successfully`, {
          loadTime: `${loadTime.toFixed(2)}ms`,
          component: "useEliteAdminDashboard",
        });

        return data;
      } catch (error) {
        const loadTime = performance.now() - startTime;

        logger.error(`Failed to load metric ${metricKey}`, {
          error: error instanceof Error ? error.message : String(error),
          loadTime: `${loadTime.toFixed(2)}ms`,
          component: "useEliteAdminDashboard",
        });

        setState((prev) => ({
          ...prev,
          loadingStates: { ...prev.loadingStates, [metricKey]: false },
          errors: { ...prev.errors, [metricKey]: error as Error },
        }));

        // Return fallback data if available
        if (fallbackData) {
          setState((prev) => ({
            ...prev,
            metrics: { ...prev.metrics, [metricKey]: fallbackData },
          }));
          return fallbackData;
        }

        return null;
      }
    },
    [],
  );

  /**
   * Load dashboard health metrics
   */
  const loadHealthMetrics = useCallback(async (): Promise<void> => {
    try {
      const { data, error } = await supabase.rpc("get_admin_dashboard_health");

      if (error) {
        throw new Error(`Health check failed: ${error.message}`);
      }

      const healthData = validateDashboardHealth(data);

      setState((prev) => ({
        ...prev,
        health: healthData,
      }));

      logger.info("Dashboard health metrics loaded", {
        connectionStatus: healthData.database_health.connection_status,
        queryDuration: healthData.performance_indicators.query_duration_ms,
        component: "useEliteAdminDashboard",
      });
    } catch (error) {
      logger.error("Failed to load health metrics", {
        error: error instanceof Error ? error.message : String(error),
        component: "useEliteAdminDashboard",
      });
    }
  }, []);

  /**
   * Setup real-time subscriptions for live updates
   */
  const setupRealTimeSubscriptions = useCallback(() => {
    // Clean up existing subscriptions
    subscriptionsRef.current.forEach((sub) => {
      supabase.removeChannel(sub);
    });
    subscriptionsRef.current = [];

    // Inspection changes subscription
    const inspectionChannel = supabase
      .channel("elite-dashboard-inspections")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "inspections",
        },
        (payload) => {
          logger.info("Real-time inspection update received", {
            event: payload.eventType,
            inspectionId: payload.new?.id || payload.old?.id,
            component: "useEliteAdminDashboard",
          });

          // Invalidate relevant cache entries
          dashboardCache.invalidate("inspection");
          dashboardCache.invalidate("dashboard_metrics");

          // Trigger selective refresh with high priority
          loadConsolidatedMetrics({ priority: "high", skipCache: true });
        },
      )
      .subscribe();

    // Checklist items subscription for AI metrics
    const checklistChannel = supabase
      .channel("elite-dashboard-checklist")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "checklist_items",
        },
        (payload) => {
          logger.info("Real-time checklist update received", {
            event: payload.eventType,
            itemId: payload.new?.id || payload.old?.id,
            component: "useEliteAdminDashboard",
          });

          // Invalidate AI metrics cache
          dashboardCache.invalidate("ai_metrics");
          dashboardCache.invalidate("dashboard_metrics");

          // Refresh AI-related metrics
          loadConsolidatedMetrics({ priority: "normal" });
        },
      )
      .subscribe();

    // Users subscription for user metrics
    const userChannel = supabase
      .channel("elite-dashboard-users")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "users",
        },
        (payload) => {
          logger.info("Real-time user update received", {
            event: payload.eventType,
            userId: payload.new?.id || payload.old?.id,
            component: "useEliteAdminDashboard",
          });

          // Invalidate user metrics
          dashboardCache.invalidate("user_metrics");

          // Refresh user metrics only (lighter refresh)
          loadMetricSafely("userMetrics", async () => {
            const { data } = await supabase.rpc("get_admin_dashboard_metrics");
            return data?.user_metrics;
          });
        },
      )
      .subscribe();

    subscriptionsRef.current = [
      inspectionChannel,
      checklistChannel,
      userChannel,
    ];

    logger.info("Real-time subscriptions established", {
      channels: subscriptionsRef.current.length,
      component: "useEliteAdminDashboard",
    });
  }, [loadConsolidatedMetrics, loadMetricSafely]);

  /**
   * Refresh specific metrics
   */
  const refreshMetrics = useCallback(
    (metricKeys: string[] = []) => {
      if (metricKeys.length === 0) {
        // Refresh all metrics
        return loadConsolidatedMetrics({ skipCache: true, priority: "high" });
      }

      // Refresh specific metrics
      metricKeys.forEach((key) => {
        dashboardCache.invalidate(key);
      });

      return loadConsolidatedMetrics({ priority: "high" });
    },
    [loadConsolidatedMetrics],
  );

  /**
   * Get performance metrics
   */
  const getPerformanceMetrics = useCallback(() => {
    const loadTimes = performanceRef.current.loadTimes;
    const avgLoadTime =
      loadTimes.length > 0
        ? loadTimes.reduce((sum, time) => sum + time, 0) / loadTimes.length
        : 0;

    const cacheMetrics = dashboardCache.getMetrics();

    return {
      averageLoadTime: Math.round(avgLoadTime * 100) / 100,
      totalQueries: loadTimes.length,
      cacheHitRate: cacheMetrics.hitRate,
      cacheSize: cacheMetrics.cacheSize,
      recentLoadTimes: loadTimes.slice(-10),
      healthStatus:
        state.health?.database_health.connection_status || "unknown",
    };
  }, [state.health]);

  // Initialize dashboard on mount
  useEffect(() => {
    const initializeDashboard = async () => {
      logger.info("Initializing elite admin dashboard", {
        timeRange,
        component: "useEliteAdminDashboard",
      });

      // Start with health check
      await loadHealthMetrics();

      // Load main metrics
      await loadConsolidatedMetrics({ priority: "high" });

      // Setup real-time updates
      setupRealTimeSubscriptions();
    };

    initializeDashboard();

    return () => {
      // Cleanup subscriptions
      subscriptionsRef.current.forEach((sub) => {
        supabase.removeChannel(sub);
      });
    };
  }, [
    timeRange,
    loadConsolidatedMetrics,
    loadHealthMetrics,
    setupRealTimeSubscriptions,
  ]);

  // Periodic health checks
  useEffect(() => {
    const healthCheckInterval = setInterval(() => {
      loadHealthMetrics();
    }, 60000); // Every minute

    return () => clearInterval(healthCheckInterval);
  }, [loadHealthMetrics]);

  return {
    // Data
    metrics: state.metrics,
    health: state.health,

    // Loading states
    isLoading: Object.values(state.loadingStates).some(Boolean),
    isInitialLoad: state.isInitialLoad,
    loadingStates: state.loadingStates,

    // Error states
    errors: state.errors,
    hasErrors: Object.values(state.errors).some(Boolean),

    // Timestamps
    lastUpdated: state.lastUpdated,

    // Actions
    refreshMetrics,
    loadConsolidatedMetrics,
    loadMetricSafely,

    // Performance
    getPerformanceMetrics,

    // Utilities
    clearCache: () => dashboardCache.invalidate(),
    retryFailedMetrics: () => {
      const failedMetrics = Object.keys(state.errors).filter(
        (key) => state.errors[key],
      );
      return refreshMetrics(failedMetrics);
    },
  };
};
