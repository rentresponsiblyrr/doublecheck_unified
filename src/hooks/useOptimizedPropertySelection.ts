
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { usePropertySelection } from "@/hooks/usePropertySelection";
import { cache, CACHE_KEYS, CACHE_TTL } from "@/utils/cache";

interface OptimizedProperty {
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

interface TransformedProperty {
  id: string;
  name: string;
  address: string;
  vrbo_url: string | null;
  airbnb_url: string | null;
  status: string | null;
}

interface TransformedInspection {
  id: string;
  property_id: string;
  completed: boolean;
  start_time: string | null;
}

export const useOptimizedPropertySelection = () => {
  console.log('🚀 useOptimizedPropertySelection: Starting optimized data fetch');

  const { data: optimizedData = [], isLoading, error, refetch } = useQuery({
    queryKey: ['optimized-properties-with-inspections'],
    queryFn: async () => {
      console.log('📊 Fetching optimized properties and inspections data...');
      
      // Check cache first
      const cachedData = cache.get<OptimizedProperty[]>(CACHE_KEYS.PROPERTIES);
      if (cachedData) {
        console.log('✅ Using cached property data');
        return cachedData;
      }

      const { data, error } = await supabase
        .rpc('get_properties_with_inspections');
      
      if (error) {
        console.error('❌ Error fetching optimized data:', error);
        throw error;
      }

      console.log('✅ Successfully fetched optimized data:', data?.length || 0, 'properties');
      
      // Cache the results
      cache.set(CACHE_KEYS.PROPERTIES, data, CACHE_TTL.MEDIUM);
      
      return data as OptimizedProperty[];
    },
    retry: 2,
    staleTime: CACHE_TTL.SHORT, // 1 minute
    gcTime: CACHE_TTL.MEDIUM, // 5 minutes
    refetchOnWindowFocus: false,
  });

  // Transform the optimized data into the expected format
  const properties: TransformedProperty[] = optimizedData.map(item => ({
    id: item.property_id,
    name: item.property_name,
    address: item.property_address,
    vrbo_url: item.property_vrbo_url,
    airbnb_url: item.property_airbnb_url,
    status: item.property_status,
  }));

  const inspections: TransformedInspection[] = optimizedData
    .filter(item => item.latest_inspection_id)
    .map(item => ({
      id: item.latest_inspection_id!,
      property_id: item.property_id,
      completed: item.latest_inspection_completed || false,
      start_time: null, // We don't need this for status calculation
    }));

  // Enhanced property status calculation using database function results
  const getPropertyStatus = (propertyId: string) => {
    const propertyData = optimizedData.find(p => p.property_id === propertyId);
    if (!propertyData) {
      return { status: 'pending', color: 'bg-gray-500', text: 'Not Started' };
    }

    const { active_inspection_count, completed_inspection_count } = propertyData;
    
    if (active_inspection_count > 0) {
      return { status: 'in-progress', color: 'bg-yellow-500', text: 'In Progress' };
    }
    if (completed_inspection_count > 0) {
      return { status: 'completed', color: 'bg-green-500', text: 'Completed' };
    }
    return { status: 'pending', color: 'bg-gray-500', text: 'Not Started' };
  };

  const {
    selectedProperty,
    setSelectedProperty,
    handleStartInspection,
    isCreatingInspection
  } = usePropertySelection(inspections);

  const handlePropertyDeleted = async () => {
    console.log('🔄 Property deleted, clearing cache and refreshing...');
    
    // Clear relevant caches
    cache.delete(CACHE_KEYS.PROPERTIES);
    cache.delete(CACHE_KEYS.INSPECTIONS);
    
    // Clear selection immediately
    setSelectedProperty(null);
    
    try {
      // Force immediate refresh
      await refetch();
      console.log('✅ Data refresh completed successfully after property deletion');
    } catch (error) {
      console.error('❌ Error during data refresh:', error);
      // Force a hard refresh if normal refetch fails
      window.location.reload();
    }
  };

  const handleRetry = async () => {
    try {
      // Clear cache before retry
      cache.delete(CACHE_KEYS.PROPERTIES);
      await refetch();
    } catch (error) {
      console.error('❌ Retry failed:', error);
    }
  };

  console.log('📊 useOptimizedPropertySelection state:', {
    isLoading,
    propertiesCount: properties.length,
    inspectionsCount: inspections.length,
    selectedProperty,
    hasError: !!error
  });

  return {
    properties,
    inspections,
    selectedProperty,
    setSelectedProperty,
    handleStartInspection,
    getPropertyStatus,
    isCreatingInspection,
    onPropertyDeleted: handlePropertyDeleted,
    isLoading,
    error,
    refetch: handleRetry
  };
};
