
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ChecklistItemType } from "@/types/inspection";
import { debugLogger } from "@/utils/debugLogger";

export const useSimplifiedInspectionData = (inspectionId: string | undefined) => {
  debugLogger.info('SimplifiedInspectionData', 'Hook initialized', { 
    inspectionId, 
    inspectionIdType: typeof inspectionId,
    inspectionIdLength: inspectionId?.length
  });

  const { data: checklistItems = [], isLoading, refetch, error } = useQuery({
    queryKey: ['simplified-checklist-items', inspectionId],
    queryFn: async () => {
      debugLogger.info('SimplifiedInspectionData', 'Starting fetch', { inspectionId });
      
      if (!inspectionId || inspectionId === 'undefined' || inspectionId.trim() === '') {
        debugLogger.error('SimplifiedInspectionData', 'Invalid inspection ID provided', {
          inspectionId,
          type: typeof inspectionId,
          length: inspectionId?.length
        });
        throw new Error(`Invalid inspection ID provided: "${inspectionId}"`);
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

        // Step 2: Check if inspection has specific checklist items in logs table
        debugLogger.debug('SimplifiedInspectionData', 'Fetching checklist items', {
          propertyId: inspectionCheck.property_id,
          inspectionId
        });
        
        // First try to get logs for this specific property
        const { data: items, error: itemsError } = await supabase
          .from('logs')
          .select('log_id, property_id, checklist_id, ai_result, inspector_remarks, pass, inspector_id, created_at, static_safety_items(id, label, category, evidence_type)')
          .eq('property_id', parseInt(inspectionCheck.property_id)) // Convert string to int for logs table
          .order('created_at', { ascending: true });

        if (itemsError) {
          debugLogger.warn('SimplifiedInspectionData', 'No existing logs found, will create from static items', {
            error: itemsError,
            propertyId: inspectionCheck.property_id
          });
          
          // If no logs exist, create checklist from static_safety_items
          const { data: staticItems, error: staticError } = await supabase
            .from('static_safety_items')
            .select('id, label, category, evidence_type')
            .eq('deleted', false)
            .order('category', { ascending: true });
            
          if (staticError) {
            debugLogger.error('SimplifiedInspectionData', 'Failed to fetch static checklist items', {
              error: staticError,
              code: staticError.code,
              message: staticError.message
            });
            throw new Error(`Failed to load checklist: ${staticError.message}`);
          }
          
          // Transform static items to checklist format
          const transformedItems: ChecklistItemType[] = (staticItems || []).map(item => ({
            id: `static_${item.id}`, // Prefix to avoid conflicts
            inspection_id: inspectionId,
            label: item.label || '',
            category: item.category || 'safety',
            evidence_type: item.evidence_type || 'photo',
            status: null, // Not started
            notes: '',
            created_at: new Date().toISOString()
          }));
          
          debugLogger.info('SimplifiedInspectionData', 'Created checklist from static items', {
            itemCount: transformedItems.length
          });
          
          return transformedItems;
        }

        debugLogger.info('SimplifiedInspectionData', 'Successfully fetched existing logs', { 
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
