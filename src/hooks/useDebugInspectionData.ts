
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ChecklistItemType } from "@/types/inspection";
import { debugLogger } from "@/utils/debugLogger";

export const useDebugInspectionData = (inspectionId: string) => {
  debugLogger.info('DebugInspectionData', 'Hook initialized', { inspectionId });

  const { data: checklistItems = [], isLoading, refetch, error } = useQuery({
    queryKey: ['debug-checklist-items', inspectionId],
    queryFn: async () => {
      debugLogger.info('DebugInspectionData', 'Starting comprehensive debug fetch', { inspectionId });
      
      if (!inspectionId) {
        debugLogger.error('DebugInspectionData', 'No inspection ID provided');
        throw new Error('Inspection ID is required');
      }

      try {
        // Step 1: Test data access with debug function
        debugLogger.debug('DebugInspectionData', 'Testing data access');
        const { data: accessTest, error: accessError } = await supabase.rpc('debug_data_access');
        
        if (accessError) {
          debugLogger.error('DebugInspectionData', 'Data access test failed', accessError);
        } else {
          debugLogger.info('DebugInspectionData', 'Data access test results', accessTest);
        }

        // Step 2: Verify inspection exists
        debugLogger.debug('DebugInspectionData', 'Checking inspection exists');
        const { data: inspectionCheck, error: inspectionError } = await supabase
          .from('inspections')
          .select('*')
          .eq('id', inspectionId)
          .single();

        if (inspectionError) {
          debugLogger.error('DebugInspectionData', 'Inspection verification failed', {
            error: inspectionError,
            code: inspectionError.code,
            message: inspectionError.message,
            details: inspectionError.details
          });
          throw new Error(`Inspection not found: ${inspectionError.message}`);
        }

        debugLogger.info('DebugInspectionData', 'Inspection verified', inspectionCheck);

        // Step 3: Fetch checklist items with comprehensive logging
        debugLogger.debug('DebugInspectionData', 'Fetching checklist items');
        const { data: items, error: itemsError } = await supabase
          .from('checklist_items')
          .select('*')
          .eq('inspection_id', inspectionId)
          .order('created_at', { ascending: true });

        if (itemsError) {
          debugLogger.error('DebugInspectionData', 'Failed to fetch checklist items', {
            error: itemsError,
            code: itemsError.code,
            message: itemsError.message,
            details: itemsError.details,
            hint: itemsError.hint
          });
          throw new Error(`Failed to load checklist: ${itemsError.message}`);
        }

        debugLogger.info('DebugInspectionData', 'Raw checklist items fetched', { 
          count: items?.length || 0,
          items: items?.slice(0, 3) || []
        });

        // Step 4: Transform data with error handling
        const transformedItems: ChecklistItemType[] = (items || []).map((item, index) => {
          try {
            const transformed = {
              id: item.id,
              inspection_id: item.inspection_id,
              label: item.label || `Item ${index + 1}`,
              category: item.category || 'safety',
              evidence_type: item.evidence_type as 'photo' | 'video',
              status: item.status as 'completed' | 'failed' | 'not_applicable' | null,
              notes: item.notes,
              created_at: item.created_at || new Date().toISOString()
            };

            debugLogger.debug('DebugInspectionData', `Transformed item ${index}`, {
              original: item,
              transformed
            });

            return transformed;
          } catch (transformError) {
            debugLogger.error('DebugInspectionData', `Error transforming item ${index}`, {
              error: transformError,
              item
            });
            throw transformError;
          }
        });

        debugLogger.info('DebugInspectionData', 'Data transformation complete', {
          originalCount: items?.length || 0,
          transformedCount: transformedItems.length,
          completedItems: transformedItems.filter(i => i.status === 'completed').length
        });

        return transformedItems;

      } catch (error) {
        debugLogger.error('DebugInspectionData', 'Query failed with comprehensive error info', {
          error,
          message: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined,
          inspectionId,
          timestamp: new Date().toISOString()
        });
        throw error;
      }
    },
    enabled: !!inspectionId,
    staleTime: 30000,
    gcTime: 60000,
    retry: (failureCount, error) => {
      debugLogger.warn('DebugInspectionData', 'Retry attempt', { 
        failureCount, 
        error: error?.message,
        maxRetries: 3
      });
      return failureCount < 3;
    },
    refetchOnWindowFocus: false
  });

  debugLogger.info('DebugInspectionData', 'Hook state', {
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
