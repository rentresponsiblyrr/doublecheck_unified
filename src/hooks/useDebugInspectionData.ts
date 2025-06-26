
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ChecklistItemType } from "@/types/inspection";
import { debugLogger } from "@/utils/debugLogger";

export const useDebugInspectionData = (inspectionId: string) => {
  debugLogger.info('InspectionData', 'Hook initialized', { inspectionId });

  const { data: checklistItems = [], isLoading, refetch, error } = useQuery({
    queryKey: ['debug-checklist-items', inspectionId],
    queryFn: async () => {
      debugLogger.info('InspectionData', 'Starting query', { inspectionId });
      
      if (!inspectionId) {
        debugLogger.error('InspectionData', 'No inspection ID provided');
        throw new Error('Inspection ID is required');
      }

      try {
        // Step 1: Check if inspection exists
        debugLogger.debug('InspectionData', 'Checking inspection exists');
        const { data: inspection, error: inspectionError } = await supabase
          .from('inspections')
          .select('id, property_id, status')
          .eq('id', inspectionId)
          .single();

        if (inspectionError) {
          debugLogger.error('InspectionData', 'Inspection check failed', inspectionError);
          throw new Error(`Inspection not found: ${inspectionError.message}`);
        }

        debugLogger.info('InspectionData', 'Inspection found', inspection);

        // Step 2: Fetch checklist items
        debugLogger.debug('InspectionData', 'Fetching checklist items');
        const { data: items, error: itemsError } = await supabase
          .from('checklist_items')
          .select('*')
          .eq('inspection_id', inspectionId)
          .order('created_at', { ascending: true });

        if (itemsError) {
          debugLogger.error('InspectionData', 'Checklist items fetch failed', itemsError);
          throw itemsError;
        }

        debugLogger.info('InspectionData', 'Raw checklist items fetched', { 
          count: items?.length || 0,
          items: items?.map(i => ({ id: i.id, label: i.label, status: i.status })) || []
        });

        // Step 3: Transform data
        const transformedData: ChecklistItemType[] = (items || []).map(item => {
          const transformed = {
            id: item.id,
            inspection_id: item.inspection_id,
            label: item.label || '',
            category: item.category || 'safety',
            evidence_type: item.evidence_type as 'photo' | 'video',
            status: item.status as 'completed' | 'failed' | 'not_applicable' | null,
            notes: item.notes,
            created_at: item.created_at || new Date().toISOString()
          };

          debugLogger.debug('InspectionData', 'Transformed item', {
            id: transformed.id,
            label: transformed.label,
            status: transformed.status
          });

          return transformed;
        });

        debugLogger.info('InspectionData', 'Data transformation complete', {
          originalCount: items?.length || 0,
          transformedCount: transformedData.length
        });

        return transformedData;
      } catch (err) {
        debugLogger.error('InspectionData', 'Query failed', err);
        throw err;
      }
    },
    enabled: !!inspectionId,
    staleTime: 0, // Always fetch fresh data for debugging
    gcTime: 0, // Don't cache for debugging
    retry: 1,
    refetchOnWindowFocus: false
  });

  debugLogger.info('InspectionData', 'Hook state', {
    inspectionId,
    isLoading,
    itemCount: checklistItems.length,
    hasError: !!error,
    errorMessage: error?.message
  });

  return {
    checklistItems,
    isLoading,
    refetch,
    error
  };
};
