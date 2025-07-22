
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ChecklistItemType } from "@/types/inspection";
import { cache, CACHE_KEYS, CACHE_TTL } from "@/utils/cache";
import { log } from '@/lib/logging/enterprise-logger';

export const useOptimizedInspectionData = (inspectionId: string) => {
  // REMOVED: useOptimizedInspectionData logging to prevent infinite render loops

  const { data: checklistItems = [], isLoading, refetch, isRefetching, error } = useQuery({
    queryKey: ['optimized-checklist-items', inspectionId],
    queryFn: async () => {
      // REMOVED: Console logging to prevent infinite loops
      
      if (!inspectionId) {
        log.error('No inspectionId provided to query', undefined, {
          component: 'useOptimizedInspectionData',
          action: 'queryFn'
        }, 'NO_INSPECTION_ID_PROVIDED');
        throw new Error('Inspection ID is required');
      }

      // Check cache first
      const cachedData = cache.get<ChecklistItemType[]>(CACHE_KEYS.CHECKLIST_ITEMS(inspectionId));
      if (cachedData) {
        // REMOVED: Console logging to prevent infinite loops
        return cachedData;
      }
      
      try {
        // Try logs table first (production schema)
        let data, error;
        
        // First get the inspection to find its property_id
        const { data: inspection } = await supabase
          .from('inspections')
          .select('property_id')
          .eq('id', inspectionId)
          .single();

        if (!inspection) {
          throw new Error('Inspection not found');
        }

        // Use checklist_items table (correct schema)
        const checklistResult = await supabase
          .from('checklist_items')
          .select('id, inspection_id, title, category, evidence_type, status, created_at')
          .eq('inspection_id', inspection.id)
          .order('created_at', { ascending: true});
        
        data = checklistResult.data;
        error = checklistResult.error;

        // Log if there's an error
        if (error) {
          log.error('Error fetching checklist items', {
            error,
            component: 'useOptimizedInspectionData',
            action: 'queryFn',
            inspectionId,
            errorCode: error.code,
            fallbackTable: 'checklist_items'
          }, 'LOGS_TABLE_FALLBACK');
          
          const checklistResult = await supabase
            .from('checklist_items')
            .select('id, inspection_id, label, category, evidence_type, status, created_at')
            .eq('inspection_id', inspectionId)
            .order('created_at', { ascending: true });
            
          data = checklistResult.data;
          error = checklistResult.error;

          // If that also fails, try with different field names
          if (error && error.message?.includes('column')) {
            log.info('Trying checklist_items with alternative field names', {
              component: 'useOptimizedInspectionData',
              action: 'queryFn',
              inspectionId,
              errorMessage: error.message,
              fallbackApproach: 'alternative_fields'
            }, 'ALTERNATIVE_FIELDS_FALLBACK');
            
            const altResult = await supabase
              .from('checklist_items')
              .select('id, inspection_id, title, category, status, created_at')
              .eq('inspection_id', inspectionId)
              .order('created_at', { ascending: true });
              
            if (!altResult.error) {
              // Map alternative field names to expected format
              type LogsTableItem = {
                id: string;
                inspection_id: string;
                title: string;
                category: string;
                status: string;
                created_at: string;
              };
              data = altResult.data?.map((item: LogsTableItem) => ({
                ...item,
                label: item.title || '',
                evidence_type: 'photo' // Default fallback
              }));
              error = null;
            } else {
              data = altResult.data;
              error = altResult.error;
            }
          }
        }
        
        if (error) {
          log.error('Database error fetching checklist items', error, {
            component: 'useOptimizedInspectionData',
            action: 'queryFn',
            inspectionId,
            errorCode: error.code
          }, 'CHECKLIST_FETCH_ERROR');
          
          // If it's a 404 error, check if inspection exists
          if (error.code === 'PGRST116' || error.message?.includes('404') || error.message?.includes('does not exist')) {
            log.warn('Checklist table access failed, checking if inspection exists', {
              component: 'useOptimizedInspectionData',
              action: 'queryFn',
              inspectionId,
              errorCode: error.code,
              verificationStep: 'inspection_existence_check'
            }, 'CHECKLIST_ACCESS_FAILED');
            
            const { data: inspection, error: inspectionError } = await supabase
              .from('inspections')
              .select('id, property_id')
              .eq('id', inspectionId)
              .single();
              
            if (!inspectionError && inspection) {
              log.info('Inspection exists but no checklist items found - returning empty array', {
                component: 'useOptimizedInspectionData',
                action: 'queryFn',
                inspectionId,
                inspectionExists: true,
                checklistItemsCount: 0
              }, 'EMPTY_CHECKLIST_ITEMS');
              // Return empty array for now, the manual population should handle this
              return [];
            }
          }
          
          throw error;
        }

        // REMOVED: Console logging to prevent infinite loops
        
        // If no items found, check if inspection exists
        if (!data || data.length === 0) {
          log.warn('No checklist items found, checking if inspection exists', {
            component: 'useOptimizedInspectionData',
            action: 'queryFn',
            inspectionId,
            dataLength: data?.length || 0
          }, 'NO_CHECKLIST_ITEMS_FOUND');
          
          const { data: inspection, error: inspectionError } = await supabase
            .from('inspections')
            .select('id, property_id')
            .eq('id', inspectionId)
            .single();
            
          if (inspectionError) {
            log.error('Error checking inspection', inspectionError, {
              component: 'useOptimizedInspectionData',
              action: 'queryFn',
              inspectionId,
              verificationStep: 'inspection_existence_check'
            }, 'INSPECTION_CHECK_ERROR');
            throw new Error('Inspection not found');
          }
          
          if (inspection) {
            // REMOVED: Console logging to prevent infinite loops
            return [];
          }
        }
        
        // Transform the data to match our TypeScript interface
        const transformedData = (data || []).map(item => ({
          id: item.id,
          inspection_id: item.inspection_id,
          label: item.label || '',
          category: item.category, // Now supports any string value
          evidence_type: item.evidence_type as 'photo' | 'video',
          status: item.status as 'completed' | 'failed' | 'not_applicable' | null,
          created_at: item.created_at || new Date().toISOString()
        })) as ChecklistItemType[];
        
        // REMOVED: Console logging to prevent infinite loops
        
        // Cache the results
        cache.set(CACHE_KEYS.CHECKLIST_ITEMS(inspectionId), transformedData, CACHE_TTL.SHORT);
        
        return transformedData;
      } catch (fetchError) {
        log.error('Error in checklist items query', fetchError, {
          component: 'useOptimizedInspectionData',
          action: 'queryFn',
          inspectionId
        }, 'CHECKLIST_QUERY_ERROR');
        throw fetchError;
      }
    },
    enabled: !!inspectionId,
    refetchOnWindowFocus: false,
    staleTime: CACHE_TTL.SHORT, // 1 minute
    gcTime: CACHE_TTL.MEDIUM, // 5 minutes
    retry: (failureCount, error) => {
      // REMOVED: Console logging to prevent infinite loops
      return failureCount < 2; // Only retry twice
    },
  });

  // REMOVED: State change logging to prevent infinite loops
  // useEffect(() => {
  //     inspectionId,
  //     isLoading,
  //     isRefetching,
  //     itemCount: checklistItems.length,
  //     hasError: !!error
  //   });
  // }, [inspectionId, isLoading, isRefetching, checklistItems.length, error]);

  // Enhanced refetch that clears cache
  const optimizedRefetch = async () => {
    cache.delete(CACHE_KEYS.CHECKLIST_ITEMS(inspectionId));
    return refetch();
  };

  return {
    checklistItems,
    isLoading,
    refetch: optimizedRefetch,
    isRefetching,
    error
  };
};
