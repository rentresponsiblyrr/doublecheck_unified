
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ChecklistItemType } from "@/types/inspection";
import { debugLogger } from "@/utils/debugLogger";

export const useInspectionData = (inspectionId: string) => {
  debugLogger.info('InspectionData', 'Hook initialized', { inspectionId });

  const { data: checklistItems = [], isLoading, refetch, isRefetching, error } = useQuery({
    queryKey: ['checklist-items', inspectionId],
    queryFn: async () => {
      debugLogger.info('InspectionData', 'Query starting', { inspectionId });
      
      if (!inspectionId) {
        debugLogger.error('InspectionData', 'No inspectionId provided');
        throw new Error('Inspection ID is required');
      }
      
      try {
        // First, verify the inspection exists
        debugLogger.debug('InspectionData', 'Verifying inspection exists');
        const { data: inspection, error: inspectionError } = await supabase
          .from('inspections')
          .select('id, property_id, status, completed')
          .eq('id', inspectionId)
          .single();

        if (inspectionError) {
          debugLogger.error('InspectionData', 'Inspection verification failed', inspectionError);
          throw new Error(`Inspection not found: ${inspectionError.message}`);
        }

        debugLogger.info('InspectionData', 'Inspection verified', inspection);

        // Check for any audit entries indicating duplicate detection
        const { data: auditData } = await supabase
          .from('checklist_operations_audit')
          .select('*')
          .eq('inspection_id', inspectionId)
          .eq('operation_type', 'duplicate_detected')
          .order('created_at', { ascending: false })
          .limit(1);

        if (auditData && auditData.length > 0) {
          debugLogger.warn('InspectionData', 'Duplicate checklist items detected', auditData[0]);
        }

        // Fetch checklist items
        debugLogger.debug('InspectionData', 'Fetching checklist items');
        const { data, error } = await supabase
          .from('checklist_items')
          .select('*')
          .eq('inspection_id', inspectionId)
          .order('created_at', { ascending: true });
        
        if (error) {
          debugLogger.error('InspectionData', 'Database error fetching checklist items', error);
          throw error;
        }

        debugLogger.info('InspectionData', 'Raw checklist items fetched', { 
          count: data?.length || 0,
          sampleItems: data?.slice(0, 3).map(i => ({ id: i.id, label: i.label })) || []
        });
        
        // Client-side duplicate removal as a safety measure
        const uniqueItems = data ? removeDuplicates(data) : [];
        
        if (uniqueItems.length !== (data?.length || 0)) {
          debugLogger.warn('InspectionData', 'Client-side duplicate removal occurred', {
            original: data?.length || 0,
            cleaned: uniqueItems.length
          });
        }
        
        // If no items found, provide helpful information
        if (!uniqueItems || uniqueItems.length === 0) {
          debugLogger.warn('InspectionData', 'No checklist items found', {
            inspectionExists: !!inspection,
            inspectionStatus: inspection?.status,
            inspectionCompleted: inspection?.completed
          });
          
          return [];
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
        
        debugLogger.info('InspectionData', 'Data transformation complete', {
          transformedCount: transformedData.length,
          completedItems: transformedData.filter(i => i.status === 'completed').length,
          pendingItems: transformedData.filter(i => !i.status).length
        });
        
        return transformedData;
      } catch (fetchError) {
        debugLogger.error('InspectionData', 'Query failed', fetchError);
        throw fetchError;
      }
    },
    enabled: !!inspectionId,
    refetchOnWindowFocus: false,
    staleTime: 30000,
    retry: (failureCount, error) => {
      debugLogger.info('InspectionData', 'Retry attempt', { failureCount, error: error.message });
      return failureCount < 2; // Only retry twice
    },
  });

  // Log state changes
  useEffect(() => {
    debugLogger.info('InspectionData', 'State update', {
      inspectionId,
      isLoading,
      isRefetching,
      itemCount: checklistItems.length,
      hasError: !!error,
      errorMessage: error?.message
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
      debugLogger.warn('InspectionData', 'Removing duplicate item', {
        id: item.id,
        label: item.label,
        static_item_id: item.static_item_id
      });
    }
  }
  
  return uniqueItems;
}
