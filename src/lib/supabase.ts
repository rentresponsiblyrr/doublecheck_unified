
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
    console.log('Starting media upload...', { inspectionId, checklistItemId, fileName: file.name });
    
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}.${fileExt}`;
    const filePath = `${inspectionId}/${checklistItemId}/${fileName}`;
    
    console.log('Upload path:', filePath);
    
    const { data, error } = await supabase.storage
      .from('inspection-media')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error('Storage upload error:', error);
      return { url: null, error: error.message };
    }

    console.log('Upload successful:', data);

    // Get the public URL
    const { data: { publicUrl } } = supabase.storage
      .from('inspection-media')
      .getPublicUrl(filePath);

    console.log('Public URL generated:', publicUrl);

    return { url: publicUrl, error: null };
  } catch (error) {
    console.error('Upload function error:', error);
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
    console.log('Saving media record...', { checklistItemId, type, url, filePath });
    
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
      console.error('Database insert error:', error);
      throw error;
    }

    console.log('Media record saved:', data);
    return data;
  } catch (error) {
    console.error('Save media record error:', error);
    throw error;
  }
};

// Helper function to update checklist item status
export const updateChecklistItemStatus = async (
  checklistItemId: string,
  status: 'completed' | null
) => {
  try {
    console.log('Updating checklist item status...', { checklistItemId, status });
    
    // Phase 4 Fix: Use inspection_checklist_items (compatibility view)
    // Maps to production logs table with proper field transformations
    const { data, error } = await supabase
      .from('inspection_checklist_items')
      .update({ status })
      .eq('id', checklistItemId)
      .select()
      .single();

    if (error) {
      console.error('Status update error:', error);
      throw error;
    }

    console.log('Status updated:', data);
    return data;
  } catch (error) {
    console.error('Update status error:', error);
    throw error;
  }
};

// Helper function to get inspection details
export const getInspectionDetails = async (inspectionId: string) => {
  try {
    console.log('Fetching inspection details...', { inspectionId });
    
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
      console.error('Inspection fetch error:', error);
      throw error;
    }

    console.log('Inspection details fetched:', data);
    return data;
  } catch (error) {
    console.error('Get inspection details error:', error);
    throw error;
  }
};
