
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ChecklistItemType } from "@/types/inspection";
import { debugLogger } from "@/utils/debugLogger";

export const useSimplifiedInspectionData = (inspectionId: string) => {
  debugLogger.info('SimplifiedInspectionData', 'Hook initialized', { inspectionId });

  const { data: checklistItems = [], isLoading, refetch, error } = useQuery({
    queryKey: ['simplified-checklist-items', inspectionId],
    queryFn: async () => {
      debugLogger.info('SimplifiedInspectionData', 'Starting fetch', { inspectionId });
      
      if (!inspectionId) {
        debugLogger.error('SimplifiedInspectionData', 'No inspection ID provided');
        throw new Error('Inspection ID is required');
      }

      try {
        // Step 1: Verify inspection exists first
        debugLogger.debug('SimplifiedInspectionData', 'Checking inspection exists');
        const { data: inspectionCheck, error: inspectionError } = await supabase
          .from('inspections')
          .select('id, property_id, status, completed')
          .eq('id', inspectionId)
          .single();

        if (inspectionError) {
          debugLogger.error('SimplifiedInspectionData', 'Inspection verification failed', {
            error: inspectionError,
            code: inspectionError.code,
            message: inspectionError.message
          });
          throw new Error(`Inspection not found: ${inspectionError.message}`);
        }

        debugLogger.info('SimplifiedInspectionData', 'Inspection verified', inspectionCheck);

        // Step 2: Fetch checklist items with minimal fields to avoid RLS issues
        debugLogger.debug('SimplifiedInspectionData', 'Fetching checklist items');
        const { data: items, error: itemsError } = await supabase
          .from('checklist_items')
          .select('id, inspection_id, label, category, evidence_type, status, notes, created_at')
          .eq('inspection_id', inspectionId)
          .order('created_at', { ascending: true });

        if (itemsError) {
          debugLogger.error('SimplifiedInspectionData', 'Failed to fetch checklist items', {
            error: itemsError,
            code: itemsError.code,
            message: itemsError.message
          });
          throw new Error(`Failed to load checklist: ${itemsError.message}`);
        }

        debugLogger.info('SimplifiedInspectionData', 'Successfully fetched items', { 
          count: items?.length || 0,
          sampleItems: items?.slice(0, 3).map(i => ({ 
            id: i.id, 
            label: i.label, 
            status: i.status 
          })) || []
        });

        // Step 3: Transform data safely
        const transformedItems: ChecklistItemType[] = (items || []).map(item => ({
          id: item.id,
          inspection_id: item.inspection_id,
          label: item.label || '',
          category: item.category || 'safety',
          evidence_type: item.evidence_type as 'photo' | 'video',
          status: item.status as 'completed' | 'failed' | 'not_applicable' | null,
          notes: item.notes,
          created_at: item.created_at || new Date().toISOString()
        }));

        debugLogger.info('SimplifiedInspectionData', 'Data transformation complete', {
          transformedCount: transformedItems.length,
          completedItems: transformedItems.filter(i => i.status === 'completed').length
        });

        return transformedItems;

      } catch (error) {
        debugLogger.error('SimplifiedInspectionData', 'Query failed with error', {
          error,
          message: error instanceof Error ? error.message : 'Unknown error',
          inspectionId
        });
        throw error;
      }
    },
    enabled: !!inspectionId,
    staleTime: 30000,
    gcTime: 60000,
    retry: (failureCount, error) => {
      debugLogger.warn('SimplifiedInspectionData', 'Retry attempt', { 
        failureCount, 
        error: error?.message,
        maxRetries: 2
      });
      return failureCount < 2;
    },
    refetchOnWindowFocus: false
  });

  debugLogger.info('SimplifiedInspectionData', 'Hook state', {
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
