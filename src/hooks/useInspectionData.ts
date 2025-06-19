
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ChecklistItemType } from "@/types/inspection";

export const useInspectionData = (inspectionId: string) => {
  console.log('🔍 useInspectionData: Starting with inspectionId:', inspectionId);

  const { data: checklistItems = [], isLoading, refetch, isRefetching, error } = useQuery({
    queryKey: ['checklist-items', inspectionId],
    queryFn: async () => {
      console.log('📊 Fetching checklist items for inspection:', inspectionId);
      
      if (!inspectionId) {
        console.error('❌ No inspectionId provided to query');
        throw new Error('Inspection ID is required');
      }
      
      try {
        const { data, error } = await supabase
          .from('checklist_items')
          .select('*')
          .eq('inspection_id', inspectionId)
          .order('created_at', { ascending: true });
        
        if (error) {
          console.error('❌ Database error fetching checklist items:', error);
          throw error;
        }

        console.log('✅ Successfully fetched checklist items:', data?.length || 0, 'items');
        
        // If no items found, try to trigger the population
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
            // Return empty array for now - the trigger should have populated items
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
        return transformedData;
      } catch (fetchError) {
        console.error('💥 Error in checklist items query:', fetchError);
        throw fetchError;
      }
    },
    enabled: !!inspectionId,
    refetchOnWindowFocus: false,
    staleTime: 30000,
    retry: (failureCount, error) => {
      console.log(`🔄 Retry attempt ${failureCount} for checklist items:`, error);
      return failureCount < 2; // Only retry twice
    },
  });

  // Log state changes
  useEffect(() => {
    console.log('📊 useInspectionData state changed:', {
      inspectionId,
      isLoading,
      isRefetching,
      itemCount: checklistItems.length,
      hasError: !!error
    });
  }, [inspectionId, isLoading, isRefetching, checklistItems.length, error]);

  return {
    checklistItems,
    isLoading,
    refetch,
    isRefetching,
    error
  };
};
