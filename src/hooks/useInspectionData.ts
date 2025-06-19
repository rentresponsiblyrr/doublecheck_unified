
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ChecklistItemType } from "@/types/inspection";

export const useInspectionData = (inspectionId: string) => {
  const { data: checklistItems = [], isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['checklist-items', inspectionId],
    queryFn: async () => {
      console.log('Fetching checklist items from Supabase...');
      
      const { data, error } = await supabase
        .from('checklist_items')
        .select('*')
        .eq('inspection_id', inspectionId)
        .order('created_at', { ascending: true });
      
      if (error) {
        console.error('Error fetching checklist items:', error);
        throw error;
      }

      console.log('Fetched checklist items:', data);
      
      // Transform the data to match our TypeScript interface
      return (data || []).map(item => ({
        id: item.id,
        inspection_id: item.inspection_id,
        label: item.label || '',
        category: item.category as 'safety' | 'amenity' | 'cleanliness' | 'maintenance',
        evidence_type: item.evidence_type as 'photo' | 'video',
        status: item.status === 'completed' ? 'completed' : null,
        created_at: item.created_at || new Date().toISOString()
      })) as ChecklistItemType[];
    },
    refetchOnWindowFocus: false,
    staleTime: 30000, // 30 seconds
  });

  // Regular refresh for existing items
  useEffect(() => {
    if (checklistItems.length > 0) {
      const interval = setInterval(() => {
        if (!isRefetching) {
          refetch();
        }
      }, 30000);

      return () => clearInterval(interval);
    }
  }, [refetch, isRefetching, checklistItems.length]);

  return {
    checklistItems,
    isLoading,
    refetch,
    isRefetching
  };
};
