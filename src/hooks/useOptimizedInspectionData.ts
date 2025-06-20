
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ChecklistItemType } from "@/types/inspection";
import { cache, CACHE_KEYS, CACHE_TTL } from "@/utils/cache";

export const useOptimizedInspectionData = (inspectionId: string) => {
  console.log('🔍 useOptimizedInspectionData: Starting with inspectionId:', inspectionId);

  const { data: checklistItems = [], isLoading, refetch, isRefetching, error } = useQuery({
    queryKey: ['optimized-checklist-items', inspectionId],
    queryFn: async () => {
      console.log('📊 Fetching optimized checklist items for inspection:', inspectionId);
      
      if (!inspectionId) {
        console.error('❌ No inspectionId provided to query');
        throw new Error('Inspection ID is required');
      }

      // Check cache first
      const cachedData = cache.get<ChecklistItemType[]>(CACHE_KEYS.CHECKLIST_ITEMS(inspectionId));
      if (cachedData) {
        console.log('✅ Using cached checklist data');
        return cachedData;
      }
      
      try {
        // Use optimized query with specific fields only
        const { data, error } = await supabase
          .from('checklist_items')
          .select('id, inspection_id, label, category, evidence_type, status, created_at')
          .eq('inspection_id', inspectionId)
          .order('created_at', { ascending: true });
        
        if (error) {
          console.error('❌ Database error fetching checklist items:', error);
          throw error;
        }

        console.log('✅ Successfully fetched checklist items:', data?.length || 0, 'items');
        
        // If no items found, check if inspection exists
        if (!data || data.length === 0) {
          console.warn('⚠️ No checklist items found, checking if inspection exists...');
          
          const { data: inspection, error: inspectionError } = await supabase
            .from('inspections')
            .select('id, property_id')
            .eq('id', inspectionId)
            .single();
            
          if (inspectionError) {
            console.error('❌ Error checking inspection:', inspectionError);
            throw new Error('Inspection not found');
          }
          
          if (inspection) {
            console.log('📝 Inspection exists but no checklist items. This should have been populated by trigger.');
            return [];
          }
        }
        
        // Transform the data to match our TypeScript interface
        const transformedData = (data || []).map(item => ({
          id: item.id,
          inspection_id: item.inspection_id,
          label: item.label || '',
          category: item.category as 'safety' | 'amenity' | 'cleanliness' | 'maintenance',
          evidence_type: item.evidence_type as 'photo' | 'video',
          status: item.status === 'completed' ? 'completed' : null,
          created_at: item.created_at || new Date().toISOString()
        })) as ChecklistItemType[];
        
        console.log('🔄 Transformed checklist items:', transformedData.length);
        
        // Cache the results
        cache.set(CACHE_KEYS.CHECKLIST_ITEMS(inspectionId), transformedData, CACHE_TTL.SHORT);
        
        return transformedData;
      } catch (fetchError) {
        console.error('💥 Error in checklist items query:', fetchError);
        throw fetchError;
      }
    },
    enabled: !!inspectionId,
    refetchOnWindowFocus: false,
    staleTime: CACHE_TTL.SHORT, // 1 minute
    gcTime: CACHE_TTL.MEDIUM, // 5 minutes
    retry: (failureCount, error) => {
      console.log(`🔄 Retry attempt ${failureCount} for checklist items:`, error);
      return failureCount < 2; // Only retry twice
    },
  });

  // Log state changes
  useEffect(() => {
    console.log('📊 useOptimizedInspectionData state changed:', {
      inspectionId,
      isLoading,
      isRefetching,
      itemCount: checklistItems.length,
      hasError: !!error
    });
  }, [inspectionId, isLoading, isRefetching, checklistItems.length, error]);

  // Enhanced refetch that clears cache
  const optimizedRefetch = async () => {
    cache.delete(CACHE_KEYS.CHECKLIST_ITEMS(inspectionId));
    return refetch();
  };

  return {
    checklistItems,
    isLoading,
    refetch: optimizedRefetch,
    isRefetching,
    error
  };
};
