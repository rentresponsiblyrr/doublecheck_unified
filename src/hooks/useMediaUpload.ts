
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface UploadProgress {
  uploaded: number;
  total: number;
  percentage: number;
}

export const useMediaUpload = () => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null);
  const { toast } = useToast();

  const uploadFile = async (
    file: File,
    inspectionId: string,
    checklistItemId: string
  ): Promise<string | null> => {
    setIsUploading(true);
    setUploadProgress({ uploaded: 0, total: file.size, percentage: 0 });

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
      const filePath = `inspection-media/${inspectionId}/${checklistItemId}/${fileName}`;

      console.log('📤 Uploading file:', filePath);

      const { data, error } = await supabase.storage
        .from('inspection-media')
        .upload(filePath, file, {
          onUploadProgress: (progress) => {
            const percentage = Math.round((progress.loaded / progress.total) * 100);
            setUploadProgress({
              uploaded: progress.loaded,
              total: progress.total,
              percentage
            });
          }
        });

      if (error) {
        console.error('❌ Upload error:', error);
        toast({
          title: "Upload Failed",
          description: error.message,
          variant: "destructive",
        });
        return null;
      }

      console.log('✅ File uploaded successfully:', data.path);

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('inspection-media')
        .getPublicUrl(data.path);

      // Save media record to database
      const { error: dbError } = await supabase
        .from('media')
        .insert({
          checklist_item_id: checklistItemId,
          type: file.type.startsWith('image/') ? 'photo' : 'video',
          url: urlData.publicUrl,
          file_path: data.path
        });

      if (dbError) {
        console.error('❌ Database error:', dbError);
        toast({
          title: "Database Error",
          description: "File uploaded but failed to save to database",
          variant: "destructive",
        });
      }

      toast({
        title: "Upload Successful",
        description: "File uploaded and saved successfully",
      });

      return urlData.publicUrl;
    } catch (error) {
      console.error('💥 Upload error:', error);
      toast({
        title: "Upload Failed",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsUploading(false);
      setUploadProgress(null);
    }
  };

  const deleteFile = async (filePath: string): Promise<boolean> => {
    try {
      console.log('🗑️ Deleting file:', filePath);

      const { error } = await supabase.storage
        .from('inspection-media')
        .remove([filePath]);

      if (error) {
        console.error('❌ Delete error:', error);
        toast({
          title: "Delete Failed",
          description: error.message,
          variant: "destructive",
        });
        return false;
      }

      toast({
        title: "File Deleted",
        description: "File removed successfully",
      });

      return true;
    } catch (error) {
      console.error('💥 Delete error:', error);
      toast({
        title: "Delete Failed",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
      return false;
    }
  };

  return {
    uploadFile,
    deleteFile,
    isUploading,
    uploadProgress
  };
};
