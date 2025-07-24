import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface OptimizedPropertyData {
  id: string; // UUID from properties table
  name: string; // Property name from properties table
  address: string; // Property address from properties table
  vrbo_url: string;
  airbnb_url: string;
  status: string;
  created_at: string;
  inspection_count: number;
  completed_inspection_count: number;
  active_inspection_count: number;
  latest_inspection_id: string | null;
  latest_inspection_completed: boolean | null;
}

export const useOptimizedPropertyData = (userId?: string) => {
  return useQuery({
    queryKey: ["optimized-properties", userId],
    queryFn: async () => {
      const startTime = Date.now();

      // Use the optimized database function
      const { data, error } = await supabase.rpc(
        "get_properties_with_inspections_v2",
        {
          _user_id: userId || null,
        },
      );

      const fetchDuration = Date.now() - startTime;

      if (error) {
        throw error;
      }

      // Debug log removed to prevent infinite console loops
      // count: data?.length || 0,
      // fetchDuration,
      // timestamp: new Date().toISOString()

      return data as OptimizedPropertyData[];
    },
    staleTime: 30000, // Consider data fresh for 30 seconds
    gcTime: 300000, // Keep in cache for 5 minutes
    refetchOnWindowFocus: false,
    retry: 2,
  });
};

export const usePropertyStatusCalculator = () => {
  const getPropertyStatus = (completedCount: number, activeCount: number) => {
    if (activeCount > 0) {
      return {
        status: "in-progress",
        color: "bg-yellow-500",
        textLabel: "In Progress",
        badgeColor: "bg-yellow-100 text-yellow-800",
      };
    }

    if (completedCount > 0) {
      return {
        status: "completed",
        color: "bg-green-500",
        textLabel: "Completed",
        badgeColor: "bg-green-100 text-green-800",
      };
    }

    return {
      status: "pending",
      color: "bg-gray-500",
      textLabel: "Not Started",
      badgeColor: "bg-gray-100 text-gray-800",
    };
  };

  return { getPropertyStatus };
};
