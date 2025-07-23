import React from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { statusCountService } from "@/services/statusCountService";
import { normalizeStatus } from "@/types/inspection-status";

export interface InspectorInspection {
  id: string;
  property_id: string;
  status:
    | "draft"
    | "in_progress"
    | "in-progress"
    | "completed"
    | "pending_review"
    | "pending-review"
    | "approved"
    | "rejected";
  start_time: string | null;
  end_time: string | null;
  completed: boolean;
  property: {
    id: string;
    name: string;
    address: string;
  } | null;
  checklist_items_count: number;
  completed_items_count: number;
  progress_percentage: number;
}

// Helper function to fetch properties with inspection counts
async function fetchPropertiesWithInspections(userId: string | null) {
  try {
    // Try RPC function first
    const result = await supabase.rpc("get_properties_with_inspections", {
      _user_id: userId,
    });

    if (!result.error) {
      // CRITICAL FIX: Filter out properties with completed inspections
      const filteredData = (result.data || [])
        .filter((property) => {
          // Hide properties with completed inspections
          return !property.latest_inspection_completed;
        })
        .map((property) => {
          // CRITICAL FIX: Show only 1 inspection per property for inspector view
          return {
            ...property,
            inspection_count: property.inspection_count > 0 ? 1 : 0,
          };
        });

      // REMOVED: Property filtering logging to prevent infinite loops
      //   original: result.data?.length || 0,
      //   filtered: filteredData.length,
      //   removed: (result.data?.length || 0) - filteredData.length
      // });

      return { ...result, data: filteredData };
    }

    // Fallback to direct query using properties
    const { data: properties, error } = await supabase
      .from("properties")
      .select(
        `
        id,
        name,
        address,
        vrbo_url,
        airbnb_url,
        created_at
      `,
      )
      .eq("added_by", userId);
    // Removed status filter - properties table doesn't have status column

    if (error) throw error;

    // Add inspection count data manually
    const enrichedProperties = await Promise.all(
      (properties || []).map(async (property) => {
        const { data: inspections } = await supabase
          .from("inspections")
          .select("id, status, completed")
          .eq("property_id", property.id);

        const inspection_count = inspections?.length || 0;
        const completed_inspection_count =
          inspections?.filter((i) => i.status === "completed").length || 0;
        const active_inspection_count =
          inspections?.filter((i) => i.status === "in_progress").length || 0;
        const draft_inspection_count =
          inspections?.filter((i) => i.status === "draft").length || 0;

        return {
          ...property,
          inspection_count,
          completed_inspection_count,
          active_inspection_count,
          draft_inspection_count,
          latest_inspection_id: inspections?.[0]?.id || null,
          latest_inspection_completed: inspections?.[0]?.completed || false,
        };
      }),
    );

    return { data: enrichedProperties, error: null };
  } catch (error) {
    return { data: [], error };
  }
}

export const useInspectorDashboard = () => {
  const { user, userRole } = useAuth();

  const {
    data: dashboardData = { inspections: [], properties: [] },
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["inspector-dashboard", user?.id, userRole],
    queryFn: async () => {
      if (!user?.id) {
        return { inspections: [], properties: [] };
      }

      // REMOVED: Dashboard fetching logging to prevent infinite loops

      // Determine if user should see all inspections or just their own
      const isInspectorRole = userRole === "inspector";

      // Use secure data fetching to avoid 503 Service Unavailable errors
      let inspectionsResult, propertiesResult;

      if (isInspectorRole) {
        // For inspectors: use limited scope query to avoid RLS conflicts
        [inspectionsResult, propertiesResult] = await Promise.all([
          supabase
            .from("inspections")
            .select(
              `
              id,
              property_id,
              status,
              start_time,
              end_time,
              completed,
              properties:property_id (
                id,
                name,
                address
              )
            `,
            )
            .eq("inspector_id", user.id)
            .in("status", ["draft", "in_progress"])
            .order("updated_at", { ascending: false })
            .limit(10), // Limit to reduce load and avoid timeouts

          // Properties with inspection counts for inspector
          fetchPropertiesWithInspections(user.id),
        ]);
      } else {
        // For admin/auditor: use verified RPC functions
        try {
          [inspectionsResult, propertiesResult] = await Promise.all([
            supabase.rpc("get_admin_dashboard_metrics", { _time_range: "30d" }),
            supabase.rpc("get_properties_with_inspections"),
          ]);

          // Transform RPC results to match expected format
          if (inspectionsResult.data && !inspectionsResult.error) {
            // Convert dashboard metrics to inspection-like format for compatibility
            inspectionsResult = {
              data: [],
              error: null,
            };
          }
        } catch (error) {
          // Fallback to limited query for admin/auditor
          [inspectionsResult, propertiesResult] = await Promise.all([
            supabase
              .from("inspections")
              .select(
                `
                id,
                property_id,
                status,
                start_time,
                end_time,
                completed,
                properties:property_id (
                  id,
                  name,
                  address
                )
              `,
              )
              .order("updated_at", { ascending: false })
              .limit(20), // Limit for performance

            fetchPropertiesWithInspections(null),
          ]);
        }
      }

      const { data: inspectionsData, error: inspectionsError } =
        inspectionsResult;
      const { data: propertiesData, error: propertiesError } = propertiesResult;

      if (inspectionsError) {
        // Handle permission errors gracefully
        if (
          inspectionsError.code === "PGRST116" ||
          inspectionsError.message?.includes("permission") ||
          inspectionsError.message?.includes("RLS")
        ) {
          return { inspections: [], properties: propertiesData || [] };
        }

        throw new Error(`Database error: ${inspectionsError.message}`);
      }

      if (propertiesError) {
        // Continue with inspections only if properties fail
      }

      // REMOVED: Success logging to prevent infinite loops

      // Transform inspections with progress calculation
      const inspectionsWithProgress = await Promise.all(
        inspectionsData.map(async (inspection) => {
          try {
            const { data: checklistItems } = await supabase
              .from("checklist_items")
              .select("id, status")
              .eq("inspection_id", inspection.id);

            const totalItems = checklistItems?.length || 0;
            const completedItems =
              checklistItems?.filter((item) => item.status === "completed")
                .length || 0;
            const progressPercentage =
              totalItems > 0
                ? Math.round((completedItems / totalItems) * 100)
                : 0;

            return {
              ...inspection,
              property: inspection.properties,
              checklist_items_count: totalItems,
              completed_items_count: completedItems,
              progress_percentage: progressPercentage,
            } as InspectorInspection;
          } catch (error) {
            return {
              ...inspection,
              property: inspection.properties,
              checklist_items_count: 0,
              completed_items_count: 0,
              progress_percentage: 0,
            } as InspectorInspection;
          }
        }),
      );

      return {
        inspections: inspectionsWithProgress,
        properties: propertiesData || [],
      };
    },
    enabled: !!user?.id && !!userRole,
    retry: (failureCount, error) => {
      // Don't retry permission errors
      if (
        error?.message?.includes("permission") ||
        error?.message?.includes("RLS")
      ) {
        return false;
      }
      return failureCount < 2;
    },
    refetchInterval: false, // Disabled to prevent render loops - manual refresh only
  });

  // Extract data from the new structure
  const inspections = dashboardData.inspections;
  const properties = dashboardData.properties;

  // Calculate status counts from actual inspection data
  const statusCounts = {
    total: inspections.length,
    draft: 0,
    in_progress: 0,
    completed: 0,
    pending_review: 0,
    approved: 0,
  };

  // Count inspections with normalized status handling
  inspections.forEach((inspection: InspectorInspection) => {
    const normalizedStatus = normalizeStatus(inspection.status);
    switch (normalizedStatus) {
      case "draft":
        statusCounts.draft++;
        break;
      case "in_progress":
        statusCounts.in_progress++;
        break;
      case "completed":
        statusCounts.completed++;
        break;
      case "pending_review":
        statusCounts.pending_review++;
        break;
      case "approved":
        statusCounts.approved++;
        break;
    }
  });

  // REMOVED: Status counts logging to prevent infinite loops

  // Calculate property-level aggregations with fallback handling
  let propertyStats = {
    totalInspections: 0,
    activeInspections: 0,
    completedInspections: 0,
  };

  try {
    propertyStats = statusCountService.calculatePropertyStats(properties);
  } catch (error) {
    // Fallback calculation
    propertyStats = properties.reduce(
      (stats, property) => ({
        totalInspections:
          stats.totalInspections + (property.inspection_count || 0),
        activeInspections:
          stats.activeInspections + (property.active_inspection_count || 0),
        completedInspections:
          stats.completedInspections +
          (property.completed_inspection_count || 0),
      }),
      { totalInspections: 0, activeInspections: 0, completedInspections: 0 },
    );
  }

  const summary = {
    properties: properties.length,
    total_property_inspections: inspections.length,
    active_property_inspections: statusCounts.in_progress + statusCounts.draft,
    completed_property_inspections: statusCounts.completed,
    pending_review: statusCounts.pending_review + statusCounts.approved,
  };

  // REMOVED: Debug logging that was causing infinite console loops when navigating between admin/inspector views
  // The useEffect with object dependencies was triggering continuously due to object recreation on each render
  // To re-enable for debugging, add proper memoization with useMemo for statusCounts and summary objects

  // REMOVED: Debug logging that was causing infinite console loops
  //   id: p.property_id,
  //   name: p.property_name,
  //   total: p.inspection_count,
  //   active: p.active_inspection_count,
  //   completed: p.completed_inspection_count
  // })));

  // REMOVED: Debug information logging to prevent infinite loops
  // if (inspections.length === 0 && properties.length === 0) {
  // } else if (properties.length > 0 && inspections.length === 0) {
  // }

  // Get recent inspections (last 7 days)
  const recentInspections = inspections.filter(
    (inspection: InspectorInspection) => {
      if (!inspection.start_time) return false;
      const inspectionDate = new Date(inspection.start_time);
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      return inspectionDate >= sevenDaysAgo;
    },
  );

  return {
    inspections,
    properties,
    recentInspections,
    summary,
    isLoading,
    error,
    refetch,
  };
};
