
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
        // First, verify the inspection exists and user has access
        debugLogger.debug('InspectionData', 'Verifying inspection exists');
        const { data: inspection, error: inspectionError } = await supabase
          .from('inspections')
          .select('id, property_id, status, completed')
          .eq('id', inspectionId)
          .single();

        if (inspectionError) {
          debugLogger.error('InspectionData', 'Inspection verification failed', {
            error: inspectionError,
            code: inspectionError.code,
            message: inspectionError.message
          });
          
          if (inspectionError.code === 'PGRST116') {
            throw new Error('Inspection not found or you do not have permission to access it');
          }
          
          throw new Error(`Failed to load inspection: ${inspectionError.message}`);
        }

        debugLogger.info('InspectionData', 'Inspection verified', inspection);

        // Fetch checklist items with error handling - CORRECTED: logs table uses property_id, not inspection_id
        debugLogger.debug('InspectionData', 'Fetching checklist items', { 
          propertyId: inspection.property_id,
          inspectionId 
        });
        const { data: items, error: itemsError } = await supabase
          .from('logs')
          .select('log_id, property_id, checklist_id, ai_result, inspector_remarks, pass, inspector_id, created_at, static_safety_items(id, label, category)')
          .eq('property_id', inspection.property_id)
          .order('created_at', { ascending: true });
        
        if (itemsError) {
          debugLogger.error('InspectionData', 'Database error fetching checklist items', {
            error: itemsError,
            code: itemsError.code,
            message: itemsError.message
          });
          throw new Error(`Failed to load checklist items: ${itemsError.message}`);
        }

        debugLogger.info('InspectionData', 'Raw checklist items fetched', { 
          count: items?.length || 0,
          sampleItems: items?.slice(0, 3).map(i => ({ 
            id: i.log_id, 
            label: i.static_safety_items?.label, 
            pass: i.pass 
          })) || []
        });
        
        // If no items found, provide helpful information
        if (!items || items.length === 0) {
          debugLogger.warn('InspectionData', 'No checklist items found', {
            inspectionExists: !!inspection,
            inspectionStatus: inspection?.status,
            inspectionCompleted: inspection?.completed
          });
          
          // This is normal - return empty array and let UI handle it
          return [];
        }
        
        // Transform the data to match our TypeScript interface - CORRECTED for logs table schema
        const transformedData: ChecklistItemType[] = items.map(item => ({
          id: item.log_id.toString(), // Convert integer to string for compatibility
          inspection_id: inspectionId, // Use the passed inspectionId since logs doesn't store it
          label: item.static_safety_items?.label || '',
          category: item.static_safety_items?.category || 'safety',
          evidence_type: 'photo', // Default to photo for now
          status: item.pass === true ? 'completed' : item.pass === false ? 'failed' : null,
          notes: item.inspector_remarks || '',
          created_at: item.created_at || new Date().toISOString()
        }));
        
        debugLogger.info('InspectionData', 'Data transformation complete', {
          transformedCount: transformedData.length,
          completedItems: transformedData.filter(i => i.status === 'completed').length,
          pendingItems: transformedData.filter(i => !i.status).length
        });
        
        return transformedData;
      } catch (fetchError) {
        debugLogger.error('InspectionData', 'Query failed', {
          error: fetchError,
          message: fetchError instanceof Error ? fetchError.message : 'Unknown error',
          inspectionId
        });
        throw fetchError;
      }
    },
    enabled: !!inspectionId,
    refetchOnWindowFocus: false,
    staleTime: 30000,
    retry: (failureCount, error) => {
      debugLogger.info('InspectionData', 'Retry attempt', { 
        failureCount, 
        error: error?.message,
        maxRetries: 2
      });
      return failureCount < 2;
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
