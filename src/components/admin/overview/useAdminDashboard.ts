import { useState, useEffect, useCallback } from "react";
import { emergencyAdminDashboardService } from "@/services/emergency/EmergencyAdminDashboardService";
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
    // Use emergency service with automatic fallbacks for 503 errors
    return await emergencyAdminDashboardService.loadDashboardMetrics(timeRange);
  }, [timeRange]);

  const loadTrendData = useCallback(async (): Promise<TrendData[]> => {
    // Use emergency service with fallback data when database fails
    return await emergencyAdminDashboardService.loadTrendData(timeRange);
  }, [timeRange]);

  const loadRegionalData = useCallback(async (): Promise<RegionalData[]> => {
    // Use emergency service with regional fallback data
    return await emergencyAdminDashboardService.loadRegionalData();
  }, []);

  const loadDashboardData = useCallback(async () => {
    try {
      setData((prev) => ({ ...prev, isLoading: true }));

      const [kpis, trends, regions] = await Promise.all([
        loadBusinessMetrics(),
        loadTrendData(),
        loadRegionalData(),
      ]);

      setData({
        kpis,
        trends,
        regions,
        isLoading: false,
      });
    } catch (error) {
      console.error("Failed to load dashboard data:", error);
      setData((prev) => ({ ...prev, isLoading: false }));
    }
  }, [timeRange]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  return {
    ...data,
    reload: loadDashboardData,
  };
};
