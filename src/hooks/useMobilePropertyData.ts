
import { useQuery } from "@tanstack/react-query";
import { useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

interface MobilePropertyData {
  property_id: string;
  property_name: string;
  property_address: string;
  property_vrbo_url: string | null;
  property_airbnb_url: string | null;
  property_status: string;
  property_created_at: string;
  inspection_count: number;
  completed_inspection_count: number;
  active_inspection_count: number;
  latest_inspection_id: string | null;
  latest_inspection_completed: boolean | null;
}

export const useMobilePropertyData = (userId?: string) => {
  return useQuery({
    queryKey: ['mobile-properties', userId],
    queryFn: async () => {
      const startTime = Date.now();

      try {
        // Mobile-optimized query with timeout
        const queryPromise = supabase.rpc('get_properties_with_inspections', {
          _user_id: userId || null
        });

        // Mobile timeout (5 seconds)
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Mobile query timeout - please check your connection')), 5000);
        });

        const { data, error } = await Promise.race([queryPromise, timeoutPromise]) as any;

        const fetchDuration = Date.now() - startTime;
        
        if (error) {
          throw new Error(`Failed to load properties: ${error.message}`);
        }

        console.debug('Mobile property fetch completed', {
          count: data?.length || 0,
          fetchDuration,
          timestamp: new Date().toISOString()
        });

        return (data || []) as MobilePropertyData[];
      } catch (error) {
        throw error;
      }
    },
    staleTime: 30000, // 30 seconds stale time for mobile
    gcTime: 300000, // 5 minutes cache for mobile
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    retry: (failureCount, error) => {
      return failureCount < 1; // Only 1 retry on mobile
    },
    retryDelay: 2000,
    enabled: !!userId
  });
};

export const useMobilePropertyStatus = () => {
  const getPropertyStatus = useCallback((completedCount: number, activeCount: number) => {
    if (activeCount > 0) {
      return {
        status: 'in-progress',
        color: 'bg-yellow-500',
        textLabel: 'In Progress',
        badgeColor: 'bg-yellow-100 text-yellow-800'
      };
    }
    
    if (completedCount > 0) {
      return {
        status: 'completed',
        color: 'bg-green-500',
        textLabel: 'Completed',
        badgeColor: 'bg-green-100 text-green-800'
      };
    }
    
    return {
      status: 'pending',
      color: 'bg-gray-500',
      textLabel: 'Not Started',
      badgeColor: 'bg-gray-100 text-gray-800'
    };
  }, []);

  return { getPropertyStatus };
};
