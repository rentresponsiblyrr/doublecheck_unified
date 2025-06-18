
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { MediaUpload } from "@/types/inspection";

export const useChecklistItemMedia = (checklistItemId: string) => {
  return useQuery({
    queryKey: ['checklist-item-media', checklistItemId],
    queryFn: async () => {
      console.log('Fetching media for checklist item:', checklistItemId);
      
      const { data, error } = await supabase
        .from('media')
        .select('*')
        .eq('checklist_item_id', checklistItemId)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching media:', error);
        throw error;
      }

      console.log('Fetched media:', data);
      
      return (data || []).map(item => ({
        id: item.id,
        checklist_item_id: item.checklist_item_id,
        type: item.type as 'photo' | 'video',
        url: item.url || '',
        created_at: item.created_at || new Date().toISOString()
      })) as MediaUpload[];
    },
    enabled: !!checklistItemId,
    refetchOnWindowFocus: false,
    staleTime: 30000,
  });
};
