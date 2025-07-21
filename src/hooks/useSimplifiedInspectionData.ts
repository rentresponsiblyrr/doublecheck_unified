
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

        // Step 2: Fetch checklist items - CORRECTED: logs table uses property_id, not inspection_id
        debugLogger.debug('SimplifiedInspectionData', 'Fetching checklist items', {
          propertyId: inspectionCheck.property_id,
          inspectionId
        });
        const { data: items, error: itemsError } = await supabase
          .from('logs')
          .select('log_id, property_id, checklist_id, ai_result, inspector_remarks, pass, created_at, static_safety_items(id, label, category)')
          .eq('property_id', inspectionCheck.property_id)
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
            id: i.log_id, 
            label: i.static_safety_items?.label, 
            pass: i.pass 
          })) || []
        });

        // Step 3: Transform data safely - CORRECTED for logs table schema
        const transformedItems: ChecklistItemType[] = (items || []).map(item => ({
          id: item.log_id.toString(), // Convert integer to string for compatibility
          inspection_id: inspectionId, // Use the passed inspectionId since logs doesn't store it
          label: item.static_safety_items?.label || '',
          category: item.static_safety_items?.category || 'safety',
          evidence_type: 'photo', // Default to photo for now
          status: item.pass === true ? 'completed' : item.pass === false ? 'failed' : null,
          notes: item.inspector_remarks || '',
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
