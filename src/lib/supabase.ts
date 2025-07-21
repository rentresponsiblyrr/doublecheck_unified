
import { supabase } from "@/integrations/supabase/client";

// Export the real Supabase client
export { supabase };

// Helper function to upload media files to Supabase Storage
export const uploadMedia = async (
  file: File, 
  inspectionId: string, 
  checklistItemId: string
): Promise<{ url: string; error: null } | { url: null; error: string }> => {
  try {
    
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}.${fileExt}`;
    const filePath = `${inspectionId}/${checklistItemId}/${fileName}`;
    
    
    const { data, error } = await supabase.storage
      .from('inspection-media')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      return { url: null, error: error.message };
    }


    // Get the public URL
    const { data: { publicUrl } } = supabase.storage
      .from('inspection-media')
      .getPublicUrl(filePath);


    return { url: publicUrl, error: null };
  } catch (error) {
    return { url: null, error: error instanceof Error ? error.message : 'Upload failed' };
  }
};

// Helper function to save media record to database
export const saveMediaRecord = async (
  checklistItemId: string,
  type: 'photo' | 'video',
  url: string,
  filePath?: string
) => {
  try {
    
    const { data, error } = await supabase
      .from('media')
      .insert({
        checklist_item_id: checklistItemId,
        type,
        url,
        file_path: filePath,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    throw error;
  }
};

// Helper function to update checklist item status
export const updateChecklistItemStatus = async (
  checklistItemId: string,
  status: 'completed' | null
) => {
  try {
    
    // Phase 4 Fix: Use logs (compatibility view)
    // Maps to production logs table with proper field transformations
    const { data, error } = await supabase
      .from('logs')
      .update({ status })
      .eq('id', checklistItemId)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    throw error;
  }
};

// Helper function to get inspection details
export const getInspectionDetails = async (inspectionId: string) => {
  try {
    
    const { data, error } = await supabase
      .from('inspections')
      .select(`
        *,
        properties (
          name,
          address,
          vrbo_url
        )
      `)
      .eq('id', inspectionId)
      .single();

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    throw error;
  }
};
