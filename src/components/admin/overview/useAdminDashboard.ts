import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
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
    // Fetch all inspections within date range
    const { data: inspections } = await supabase
      .from("inspections")
      .select("id, status, start_time, end_time, created_at")
      .gte("created_at", getDateRange(timeRange));

    // Fetch all properties
    const { data: properties } = await supabase.rpc(
      "get_properties_with_inspections",
      { _user_id: null },
    );

    // Fetch active inspectors using RPC to avoid RLS recursion
    const { data: users } = await supabase.rpc("get_users_by_role", {
      _role: "inspector",
    });

    // Fetch checklist items for AI accuracy calculations
    const { data: checklistItems } = await supabase
      .from("checklist_items")
      .select("id, status, ai_status, inspection_id")
      .in("inspection_id", inspections?.map((i) => i.id) || []);

    // Fetch media for photo count calculations
    const { data: media } = await supabase
      .from("media")
      .select("id, checklist_item_id")
      .in("checklist_item_id", checklistItems?.map((c) => c.id) || []);

    // Basic counts
    const totalInspections = inspections?.length || 0;
    const totalProperties = properties?.length || 0;
    const activeInspectors = users?.length || 0;

    // Calculate inspection status counts
    const completedInspections =
      inspections?.filter((i) => i.status === "completed").length || 0;
    const inProgressInspections =
      inspections?.filter((i) => i.status === "in_progress").length || 0;
    const draftInspections =
      inspections?.filter((i) => i.status === "draft").length || 0;

    // Calculate completion rate
    const completionRate =
      totalInspections > 0
        ? (completedInspections / totalInspections) * 100
        : 0;

    // Calculate average inspection time (only for completed inspections with both start and end times)
    const completedWithTimes =
      inspections?.filter(
        (i) => i.status === "completed" && i.start_time && i.end_time,
      ) || [];

    const avgInspectionTime =
      completedWithTimes.length > 0
        ? completedWithTimes.reduce((total, inspection) => {
            const startTime = new Date(inspection.start_time).getTime();
            const endTime = new Date(inspection.end_time).getTime();
            const durationMinutes = (endTime - startTime) / (1000 * 60);
            return total + durationMinutes;
          }, 0) / completedWithTimes.length
        : 0;

    // Calculate AI accuracy (AI predictions vs final status)
    const itemsWithAI =
      checklistItems?.filter((item) => item.ai_status && item.status) || [];
    const aiCorrectPredictions = itemsWithAI.filter(
      (item) =>
        item.ai_status === item.status ||
        (item.ai_status === "pass" && item.status === "completed") ||
        (item.ai_status === "fail" && item.status === "failed"),
    ).length;
    const aiAccuracy =
      itemsWithAI.length > 0
        ? (aiCorrectPredictions / itemsWithAI.length) * 100
        : 0;

    // Calculate pass rate (completed items vs failed items)
    const completedItems =
      checklistItems?.filter((item) => item.status === "completed").length || 0;
    const failedItems =
      checklistItems?.filter((item) => item.status === "failed").length || 0;
    const totalEvaluatedItems = completedItems + failedItems;
    const passRate =
      totalEvaluatedItems > 0
        ? (completedItems / totalEvaluatedItems) * 100
        : 0;

    // Calculate average photos per inspection
    const avgPhotosPerInspection =
      totalInspections > 0 ? (media?.length || 0) / totalInspections : 0;

    // Calculate flagged inspections (inspections with failed items)
    const inspectionsWithFailedItems = new Set(
      checklistItems
        ?.filter((item) => item.status === "failed")
        .map((item) => item.inspection_id) || [],
    );
    const flaggedInspections = inspectionsWithFailedItems.size;

    // Calculate monthly revenue estimate
    const avgRevenuePerInspection = 150; // $150 per inspection
    const monthlyRevenue = completedInspections * avgRevenuePerInspection;

    // Calculate growth rate (compare current period to previous period)
    const previousPeriodStart = new Date();
    const currentPeriodDays = { "7d": 7, "30d": 30, "90d": 90, "1y": 365 }[
      timeRange
    ];
    previousPeriodStart.setTime(
      previousPeriodStart.getTime() -
        currentPeriodDays * 2 * 24 * 60 * 60 * 1000,
    );
    const previousPeriodEnd = new Date();
    previousPeriodEnd.setTime(
      previousPeriodEnd.getTime() - currentPeriodDays * 24 * 60 * 60 * 1000,
    );

    const { data: previousInspections } = await supabase
      .from("inspections")
      .select("id")
      .gte("created_at", previousPeriodStart.toISOString())
      .lt("created_at", previousPeriodEnd.toISOString());

    const previousPeriodCount = previousInspections?.length || 0;
    const growthRate =
      previousPeriodCount > 0
        ? ((totalInspections - previousPeriodCount) / previousPeriodCount) * 100
        : 0;

    return {
      totalProperties,
      totalInspections,
      activeInspectors,
      completionRate: Math.round(completionRate * 10) / 10,
      avgInspectionTime: Math.round(avgInspectionTime),
      customerSatisfaction: passRate / 20, // Convert pass rate to 5-star scale approximation
      monthlyRevenue,
      growthRate: Math.round(growthRate * 10) / 10,
      pendingAudits: inProgressInspections,
      flaggedInspections,
      avgPhotosPerInspection: Math.round(avgPhotosPerInspection),
      aiAccuracy: Math.round(aiAccuracy * 10) / 10,
    };
  }, [timeRange]);

  const loadTrendData = useCallback(async (): Promise<TrendData[]> => {
    try {
      // Calculate months to fetch based on time range
      const monthsToFetch =
        timeRange === "7d"
          ? 2
          : timeRange === "30d"
            ? 6
            : timeRange === "90d"
              ? 12
              : 12;

      const trendData: TrendData[] = [];
      const now = new Date();

      for (let i = monthsToFetch - 1; i >= 0; i--) {
        const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);

        // Fetch inspections for this month
        const { data: monthlyInspections } = await supabase
          .from("inspections")
          .select("id, status")
          .gte("created_at", monthStart.toISOString())
          .lte("created_at", monthEnd.toISOString());

        const inspectionCount = monthlyInspections?.length || 0;
        const completedCount =
          monthlyInspections?.filter((i) => i.status === "completed").length ||
          0;
        const revenue = completedCount * 150; // $150 per completed inspection

        // Calculate satisfaction based on pass rate for the month
        const { data: monthlyChecklistItems } = await supabase
          .from("checklist_items")
          .select("status, inspection_id")
          .in("inspection_id", monthlyInspections?.map((i) => i.id) || []);

        const completedItems =
          monthlyChecklistItems?.filter((item) => item.status === "completed")
            .length || 0;
        const failedItems =
          monthlyChecklistItems?.filter((item) => item.status === "failed")
            .length || 0;
        const totalItems = completedItems + failedItems;
        const passRate =
          totalItems > 0 ? (completedItems / totalItems) * 100 : 0;
        const satisfaction = Math.min(5, Math.max(1, passRate / 20)); // Convert to 1-5 scale

        trendData.push({
          name: monthStart.toLocaleDateString("en-US", { month: "short" }),
          inspections: inspectionCount,
          revenue,
          satisfaction: Math.round(satisfaction * 10) / 10,
        });
      }

      return trendData;
    } catch (error) {
      console.error("Failed to load trend data:", error);
      // Return empty array on error rather than mock data
      return [];
    }
  }, [timeRange]);

  const loadRegionalData = useCallback(async (): Promise<RegionalData[]> => {
    try {
      // Fetch properties with their inspections to analyze by region
      const { data: properties } = await supabase.rpc(
        "get_properties_with_inspections",
        { user_id: null },
      );

      if (!properties || properties.length === 0) {
        return [];
      }

      // Group properties by region (extract from address)
      const regionMap = new Map<
        string,
        { inspections: number; properties: number }
      >();

      properties.forEach((property) => {
        // Extract state/region from address (basic parsing)
        const address = property.property_address || "";
        const addressParts = address.split(",");
        let region = "Unknown";

        if (addressParts.length >= 2) {
          // Try to get state from address
          const statePart = addressParts[addressParts.length - 2]?.trim();
          if (statePart && statePart.length >= 2) {
            region = statePart;
          }
        }

        const current = regionMap.get(region) || {
          inspections: 0,
          properties: 0,
        };
        regionMap.set(region, {
          inspections: current.inspections + (property.inspection_count || 0),
          properties: current.properties + 1,
        });
      });

      // Convert to array and calculate revenue and growth
      const regionData: RegionalData[] = [];

      for (const [region, data] of regionMap.entries()) {
        const revenue = data.inspections * 150; // $150 per inspection

        // Calculate growth (simplified - would need historical data for accurate growth)
        // For now, use inspection density as a proxy for growth
        const inspectionDensity =
          data.properties > 0 ? data.inspections / data.properties : 0;
        const growth = Math.min(
          50,
          Math.max(-20, (inspectionDensity - 1) * 10),
        ); // Normalized growth rate

        regionData.push({
          region,
          inspections: data.inspections,
          revenue,
          growth: Math.round(growth * 10) / 10,
        });
      }

      // Sort by inspection count descending and take top 5
      return regionData
        .sort((a, b) => b.inspections - a.inspections)
        .slice(0, 5);
    } catch (error) {
      console.error("Failed to load regional data:", error);
      // Return empty array on error rather than mock data
      return [];
    }
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
