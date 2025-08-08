import { useQuery } from "@tanstack/react-query";
import { useCallback } from "react";
import { debugLogger } from "@/lib/logger/debug-logger";
import { supabase } from "@/integrations/supabase/client";

interface MobilePropertyData {
  id: string; // UUID from properties table
  name: string; // Property name from properties table
  address: string; // Property address from properties table
  vrbo_url: string | null;
  airbnb_url: string | null;
  status: string;
  created_at: string;
  inspection_count: number;
  completed_inspection_count: number;
  active_inspection_count: number;
  latest_inspection_id: string | null;
  latest_inspection_completed: boolean | null;
}

export const useMobilePropertyData = (userId?: string) => {
  return useQuery({
    queryKey: ["mobile-properties", userId],
    queryFn: async () => {
      const startTime = Date.now();

      // Mobile-optimized query with timeout
      const queryPromise = supabase.rpc("get_properties_with_inspections_v2", {
        _user_id: userId || null,
      });

      // Mobile timeout (5 seconds)
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(
          () =>
            reject(
              new Error("Mobile query timeout - please check your connection"),
            ),
          5000,
        );
      });

      const { data, error } = (await Promise.race([
        queryPromise,
        timeoutPromise,
      ])) as { data: MobilePropertyData[] | null; error: Error | null };

      const fetchDuration = Date.now() - startTime;

      if (error) {
        throw new Error(`Failed to load properties: ${error.message}`);
      }

      debugLogger.debug("Mobile property fetch completed", {
        count: data?.length || 0,
        fetchDuration,
        timestamp: new Date().toISOString(),
      });

      return (data || []) as MobilePropertyData[];
    },
    staleTime: 30000, // 30 seconds stale time for mobile
    gcTime: 300000, // 5 minutes cache for mobile
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    retry: (failureCount, error) => {
      return failureCount < 1; // Only 1 retry on mobile
    },
    retryDelay: 2000,
    enabled: !!userId,
  });
};

export const useMobilePropertyStatus = () => {
  const getPropertyStatus = useCallback(
    (completedCount: number, activeCount: number) => {
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
    },
    [],
  );

  return { getPropertyStatus };
};
