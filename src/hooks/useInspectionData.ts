
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
        // First, check for any audit entries indicating duplicate detection
        const { data: auditData } = await supabase
          .from('checklist_operations_audit')
          .select('*')
          .eq('inspection_id', inspectionId)
          .eq('operation_type', 'duplicate_detected')
          .order('created_at', { ascending: false })
          .limit(1);

        if (auditData && auditData.length > 0) {
          console.warn('⚠️ Duplicate checklist items detected for inspection:', inspectionId);
        }

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
        
        // Client-side duplicate removal as a safety measure
        const uniqueItems = data ? removeDuplicates(data) : [];
        
        if (uniqueItems.length !== (data?.length || 0)) {
          console.warn('⚠️ Client-side duplicate removal occurred:', {
            original: data?.length || 0,
            cleaned: uniqueItems.length
          });
        }
        
        // If no items found, try to trigger the population
        if (!uniqueItems || uniqueItems.length === 0) {
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
        const transformedData = uniqueItems.map(item => ({
          id: item.id,
          inspection_id: item.inspection_id,
          label: item.label || '',
          category: item.category, // Now supports any string value
          evidence_type: item.evidence_type as 'photo' | 'video',
          status: item.status as 'completed' | 'failed' | 'not_applicable' | null,
          notes: item.notes,
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

// Helper function to remove duplicates based on inspection_id + static_item_id + label
function removeDuplicates(items: any[]): any[] {
  const seen = new Set<string>();
  const uniqueItems: any[] = [];
  
  for (const item of items) {
    const key = `${item.inspection_id}-${item.static_item_id}-${item.label}`;
    if (!seen.has(key)) {
      seen.add(key);
      uniqueItems.push(item);
    } else {
      console.warn('🔄 Removing duplicate item:', {
        id: item.id,
        label: item.label,
        static_item_id: item.static_item_id
      });
    }
  }
  
  return uniqueItems;
}
