
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/AuthProvider";

export const useMediaRecordService = () => {
  const { user } = useAuth();

  const saveMediaRecordWithAttribution = async (
    checklistItemId: string,
    type: 'photo' | 'video',
    url: string,
    filePath?: string
  ) => {
    try {
      console.log('Saving media record with user attribution...', { 
        checklistItemId, 
        type, 
        url, 
        filePath,
        userId: user?.id,
        userEmail: user?.email 
      });
      
      // Get user name from auth metadata or email
      const userName = user?.user_metadata?.name || user?.email?.split('@')[0] || 'Unknown Inspector';
      
      const { data, error } = await supabase
        .from('media')
        .insert({
          checklist_item_id: checklistItemId,
          type,
          url,
          file_path: filePath,
          user_id: user?.id,
          uploaded_by_name: userName,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        console.error('Database insert error:', error);
        throw error;
      }

      console.log('Media record saved with attribution:', data);
      return data;
    } catch (error) {
      console.error('Save media record error:', error);
      throw error;
    }
  };

  return { saveMediaRecordWithAttribution };
};
