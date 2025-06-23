
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface MobilePropertyData {
  property_id: string;
  property_name: string;
  property_address: string;
  property_vrbo_url: string;
  property_airbnb_url: string;
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
      console.log('📱 Fetching mobile property data...');
      const startTime = Date.now();

      // Mobile-optimized query with timeout
      const queryPromise = supabase.rpc('get_properties_with_inspections', {
        _user_id: userId || null
      });

      // Mobile timeout (3 seconds)
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Mobile query timeout')), 3000);
      });

      const { data, error } = await Promise.race([queryPromise, timeoutPromise]) as any;

      const fetchDuration = Date.now() - startTime;
      
      if (error) {
        console.error('❌ Mobile property fetch error:', error);
        throw error;
      }

      console.log(`✅ Mobile properties loaded in ${fetchDuration}ms`, {
        count: data?.length || 0,
        fetchDuration,
        timestamp: new Date().toISOString()
      });

      return data as MobilePropertyData[];
    },
    staleTime: 60000, // 1 minute stale time for mobile
    gcTime: 600000, // 10 minutes cache for mobile
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    retry: 1, // Only 1 retry on mobile
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
