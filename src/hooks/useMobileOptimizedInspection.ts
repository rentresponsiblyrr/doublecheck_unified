
import { useState, useCallback, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ChecklistItemType } from "@/types/inspection";

interface MobileInspectionState {
  inspectionId: string;
  checklistItems: ChecklistItemType[];
  completedCount: number;
  totalCount: number;
  progressPercentage: number;
}

export const useMobileOptimizedInspection = (inspectionId: string) => {
  const [localState, setLocalState] = useState<Partial<MobileInspectionState>>({});
  const stateRef = useRef<Partial<MobileInspectionState>>({});
  const lastUpdateRef = useRef<number>(0);

  // Mobile-optimized query with aggressive caching
  const { data: checklistItems = [], isLoading, refetch, error } = useQuery({
    queryKey: ['mobile-inspection', inspectionId],
    queryFn: async () => {
      console.log('📱 Mobile inspection fetch:', inspectionId);
      
      if (!inspectionId) {
        throw new Error('Inspection ID is required');
      }

      const { data, error } = await supabase
        .from('checklist_items')
        .select('*')
        .eq('inspection_id', inspectionId)
        .order('created_at', { ascending: true });
      
      if (error) {
        console.error('❌ Mobile inspection query error:', error);
        throw error;
      }

      console.log('✅ Mobile inspection loaded:', data?.length || 0, 'items');
      
      // Transform data to match TypeScript interface
      const transformedData: ChecklistItemType[] = (data || []).map(item => ({
        id: item.id,
        inspection_id: item.inspection_id,
        label: item.label || '',
        category: item.category || 'safety',
        evidence_type: item.evidence_type as 'photo' | 'video', // Type assertion for database string
        status: item.status as 'completed' | 'failed' | 'not_applicable' | null,
        notes: item.notes,
        notes_history: item.notes_history,
        created_at: item.created_at || new Date().toISOString()
      }));
      
      return transformedData;
    },
    enabled: !!inspectionId,
    staleTime: 60000, // 1 minute stale time for mobile
    gcTime: 300000, // 5 minutes cache
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    retry: 1
  });

  // Calculate progress efficiently
  const updateProgress = useCallback((items: ChecklistItemType[]) => {
    const now = Date.now();
    
    // Throttle updates to prevent excessive re-renders
    if (now - lastUpdateRef.current < 100) {
      return stateRef.current;
    }
    
    const completedCount = items.filter(item => item.status === 'completed').length;
    const totalCount = items.length;
    const progressPercentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
    
    const newState = {
      inspectionId,
      checklistItems: items,
      completedCount,
      totalCount,
      progressPercentage
    };
    
    stateRef.current = newState;
    lastUpdateRef.current = now;
    
    return newState;
  }, [inspectionId]);

  // Update state when data changes
  useEffect(() => {
    if (checklistItems.length > 0) {
      const newState = updateProgress(checklistItems);
      setLocalState(newState);
    }
  }, [checklistItems, updateProgress]);

  // Mobile-optimized item update
  const updateItemStatus = useCallback(async (itemId: string, status: 'completed' | 'failed' | 'not_applicable' | null) => {
    try {
      console.log('📱 Mobile item update:', itemId, status);
      
      const { error } = await supabase
        .from('checklist_items')
        .update({ status })
        .eq('id', itemId);
      
      if (error) throw error;
      
      // Optimistically update local state with proper typing
      const updatedItems: ChecklistItemType[] = checklistItems.map(item =>
        item.id === itemId ? { ...item, status } : item
      );
      
      const newState = updateProgress(updatedItems);
      setLocalState(newState);
      
      // Trigger a background refetch
      setTimeout(() => refetch(), 500);
      
    } catch (error) {
      console.error('❌ Mobile item update error:', error);
      throw error;
    }
  }, [checklistItems, updateProgress, refetch]);

  return {
    ...localState,
    isLoading,
    error,
    refetch,
    updateItemStatus,
    checklistItems: localState.checklistItems || checklistItems
  };
};
