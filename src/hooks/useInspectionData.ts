
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

        // Fetch checklist items with error handling
        debugLogger.debug('InspectionData', 'Fetching checklist items');
        const { data: items, error: itemsError } = await supabase
          .from('checklist_items')
          .select('id, inspection_id, label, category, evidence_type, status, notes, created_at')
          .eq('inspection_id', inspectionId)
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
          sampleItems: items?.slice(0, 3).map(i => ({ id: i.id, label: i.label, status: i.status })) || []
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
        
        // Transform the data to match our TypeScript interface
        const transformedData: ChecklistItemType[] = items.map(item => ({
          id: item.id,
          inspection_id: item.inspection_id,
          label: item.label || '',
          category: item.category || 'safety',
          evidence_type: item.evidence_type as 'photo' | 'video',
          status: item.status as 'completed' | 'failed' | 'not_applicable' | null,
          notes: item.notes,
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
