import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/utils/logger";
import {
  BusinessKPIs,
  TrendData,
  RegionalData,
  TimeRange,
  DashboardData,
} from "./types";

export const useAdminDashboard = (timeRange: TimeRange = "30d") => {
  const [data, setData] = useState<DashboardData>({
    kpis: {
      totalProperties: 0,
      totalInspections: 0,
      activeInspectors: 0,
      completionRate: 0,
      avgInspectionTime: 0,
      customerSatisfaction: 0,
      monthlyRevenue: 0,
      growthRate: 0,
      pendingAudits: 0,
      flaggedInspections: 0,
      avgPhotosPerInspection: 0,
      aiAccuracy: 0,
    },
    trends: [],
    regions: [],
    isLoading: true,
  });

  const getDateRange = (range: TimeRange): string => {
    const now = new Date();
    const days = {
      "7d": 7,
      "30d": 30,
      "90d": 90,
      "1y": 365,
    }[range];

    const date = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    return date.toISOString();
  };

  const loadBusinessMetrics = useCallback(async (): Promise<BusinessKPIs> => {
    logger.info("🔍 DIRECT RPC: Loading dashboard metrics directly", {
      timeRange,
    });

    try {
      // Call RPC function directly - no fallbacks
      const { data, error } = await supabase.rpc("get_admin_dashboard_metrics");

      if (error) {
        logger.error("🔍 DIRECT RPC: get_admin_dashboard_metrics failed", {
          error: error.message,
          code: error.code,
          status: error.status,
          details: error.details,
        });
        throw new Error(`RPC Error: ${error.message} (Code: ${error.code})`);
      }

      if (!data) {
        logger.error("🔍 DIRECT RPC: No data returned from RPC");
        throw new Error("No data returned from get_admin_dashboard_metrics");
      }

      logger.info("🔍 DIRECT RPC: Success! Data keys:", Object.keys(data));

      // Transform the data
      const result: BusinessKPIs = {
        totalProperties: data.property_metrics?.total_properties || 0,
        totalInspections: data.inspection_counts?.total || 0,
        activeInspectors: data.user_metrics?.active_inspectors || 0,
        completionRate: data.inspection_counts?.completed
          ? (data.inspection_counts.completed / data.inspection_counts.total) *
            100
          : 0,
        avgInspectionTime: data.time_analytics?.avg_duration_minutes || 0,
        customerSatisfaction: data.ai_metrics?.accuracy_rate
          ? (data.ai_metrics.accuracy_rate / 100) * 5
          : 4.5,
        monthlyRevenue: data.revenue_metrics?.monthly_revenue || 0,
        growthRate: data.revenue_metrics?.growth_rate || 0,
        pendingAudits: data.inspection_counts?.auditing || 0,
        flaggedInspections: data.inspection_counts?.flagged || 0,
        avgPhotosPerInspection:
          data.media_metrics?.avg_photos_per_inspection || 0,
        aiAccuracy: data.ai_metrics?.accuracy_rate || 0,
      };

      logger.info("🔍 DIRECT RPC: Transformed result:", result);
      return result;
    } catch (error) {
      logger.error("🔍 DIRECT RPC: Exception in loadBusinessMetrics", {
        error,
      });
      throw error; // Re-throw to let component handle the error
    }
  }, [timeRange]);

  const loadTrendData = useCallback(async (): Promise<TrendData[]> => {
    logger.info("🔍 DIRECT RPC: Loading trend data directly", { timeRange });

    try {
      // Call RPC function to get trend data - no mock data
      const { data, error } = await supabase.rpc("get_admin_dashboard_trends", {
        _time_range: timeRange,
      });

      if (error) {
        logger.warn("Trend data RPC failed, returning empty data", {
          error: error.message,
          timeRange,
        });
        return [];
      }

      if (!data || !Array.isArray(data)) {
        logger.info("No trend data available, returning empty array");
        return [];
      }

      return data;
    } catch (error) {
      logger.error("Exception loading trend data", { error });
      return [];
    }
  }, [timeRange]);

  const loadRegionalData = useCallback(async (): Promise<RegionalData[]> => {
    logger.info("🔍 DIRECT RPC: Loading regional data directly");

    try {
      // Call RPC function to get regional data - no mock data
      const { data, error } = await supabase.rpc(
        "get_admin_dashboard_regional",
      );

      if (error) {
        logger.warn("Regional data RPC failed, returning empty data", {
          error: error.message,
        });
        return [];
      }

      if (!data || !Array.isArray(data)) {
        logger.info("No regional data available, returning empty array");
        return [];
      }

      return data;
    } catch (error) {
      logger.error("Exception loading regional data", { error });
      return [];
    }
  }, []);

  const loadDashboardData = useCallback(async () => {
    try {
      setData((prev) => ({ ...prev, isLoading: true }));

      logger.info("🔍 DIRECT RPC: Starting dashboard data load", { timeRange });

      const [kpis, trends, regions] = await Promise.all([
        loadBusinessMetrics(),
        loadTrendData(),
        loadRegionalData(),
      ]);

      logger.info("🔍 DIRECT RPC: Dashboard data loaded successfully", {
        hasKpis: !!kpis,
        trendsCount: trends.length,
        regionsCount: regions.length,
      });

      setData({
        kpis,
        trends,
        regions,
        isLoading: false,
      });
    } catch (error) {
      logger.error("🔍 DIRECT RPC: Failed to load dashboard data", { error });
      // Keep current data but stop loading
      setData((prev) => ({ ...prev, isLoading: false }));
    }
  }, [loadBusinessMetrics, loadTrendData, loadRegionalData]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  return {
    ...data,
    reload: loadDashboardData,
  };
};
