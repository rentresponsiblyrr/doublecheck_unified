/**
 * Property Data Manager - Enterprise Grade
 *
 * Handles property data fetching, caching, and state management
 * following enterprise render props pattern for clean component separation
 */

import React, { useCallback, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { log } from "@/lib/logging/enterprise-logger";

export interface PropertyData {
  property_id: string;
  property_name: string;
  property_address: string;
  property_vrbo_url: string | null;
  property_airbnb_url: string | null;
  property_status?: string;
  property_created_at?: string;
  inspection_count?: number;
  completed_inspection_count?: number;
  active_inspection_count?: number;
  latest_inspection_id?: string | null;
  latest_inspection_completed?: boolean | null;
}

interface PropertyDataManagerProps {
  children: (propertyData: {
    properties: PropertyData[];
    isLoading: boolean;
    error: Error | null;
    refetch: () => void;
    isRefetching: boolean;
  }) => React.ReactNode;
}

export const PropertyDataManager: React.FC<PropertyDataManagerProps> = ({
  children,
}) => {
  const { user } = useAuth();
  const mountedRef = useRef(true);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  /**
   * Fetch properties with caching and error handling
   */
  const {
    data: properties = [],
    isLoading,
    error,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ["properties", user?.id],
    queryFn: async () => {
      const startTime = performance.now();

      if (!user?.id) {
        throw new Error("User not authenticated");
      }

      const { data, error } = await supabase
        .rpc("get_properties_with_inspections")
        .order("property_created_at", { ascending: false });

      if (error) {
        log.error("Failed to fetch properties", { error, userId: user.id });
        throw error;
      }

      const endTime = performance.now();
      if (mountedRef.current) {
        log.info("Properties fetched successfully", {
          count: data?.length || 0,
          loadTime: endTime - startTime,
          userId: user.id,
        });
      }

      return data || [];
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5, // 5 minutes
    cacheTime: 1000 * 60 * 30, // 30 minutes
    refetchOnWindowFocus: false,
    retry: 3,
  });

  return (
    <>
      {children({
        properties,
        isLoading,
        error: error as Error | null,
        refetch,
        isRefetching,
      })}
    </>
  );
};
