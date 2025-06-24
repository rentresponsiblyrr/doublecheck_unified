
import { useState } from "react";
import { uploadMedia, saveMediaRecord, updateChecklistItemStatus } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { useOfflineStorage } from "@/hooks/useOfflineStorage";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

interface UseFileUploadProps {
  evidenceType: 'photo' | 'video';
  checklistItemId: string;
  inspectionId: string;
  onComplete: () => void;
}

export const useFileUpload = ({ 
  evidenceType, 
  checklistItemId, 
  inspectionId, 
  onComplete 
}: UseFileUploadProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const { toast } = useToast();
  const { isOnline, savePhotoOffline } = useOfflineStorage();
  const { user } = useAuth();

  const validateFile = (file: File): { isValid: boolean; detectedType: 'photo' | 'video' } => {
    // Detect the actual file type based on MIME type
    const isPhoto = file.type.startsWith('image/');
    const isVideo = file.type.startsWith('video/');
    const detectedType: 'photo' | 'video' = isPhoto ? 'photo' : 'video';

    if (!isPhoto && !isVideo) {
      toast({
        title: "Invalid file type",
        description: "Please select a photo or video file.",
        variant: "destructive",
      });
      return { isValid: false, detectedType };
    }

    // Validate file size (10MB limit)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      toast({
        title: "File too large",
        description: "Please select a file smaller than 10MB.",
        variant: "destructive",
      });
      return { isValid: false, detectedType };
    }

    return { isValid: true, detectedType };
  };

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

  const handleFileUpload = async (file: File) => {
    const validation = validateFile(file);
    if (!validation.isValid) return;

    console.log('File selected:', file.name, file.type, file.size, 'Detected type:', validation.detectedType);
    setIsUploading(true);
    
    try {
      // If offline and it's a photo, save locally
      if (!isOnline && validation.detectedType === 'photo') {
        await savePhotoOffline(file, checklistItemId, inspectionId);
        setUploadSuccess(true);
        toast({
          title: "Saved offline",
          description: "Photo saved locally and will sync when online.",
        });
        onComplete();
        return;
      }
      
      // Upload to Supabase Storage
      const uploadResult = await uploadMedia(file, inspectionId, checklistItemId);
      
      if (uploadResult.error) {
        console.error('Upload failed:', uploadResult.error);
        
        // If upload fails and it's a photo, try saving offline
        if (validation.detectedType === 'photo') {
          await savePhotoOffline(file, checklistItemId, inspectionId);
          setUploadSuccess(true);
          toast({
            title: "Saved offline",
            description: "Upload failed, but photo saved locally for later sync.",
          });
          onComplete();
          return;
        }
        
        toast({
          title: "Upload failed",
          description: uploadResult.error,
          variant: "destructive",
        });
        return;
      }

      if (!uploadResult.url) {
        console.error('No URL returned from upload');
        toast({
          title: "Upload failed",
          description: "No URL returned from upload",
          variant: "destructive",
        });
        return;
      }

      // Save media record to database with user attribution and detected type
      await saveMediaRecordWithAttribution(checklistItemId, validation.detectedType, uploadResult.url);
      
      // Update checklist item status to completed
      await updateChecklistItemStatus(checklistItemId, 'completed');
      
      setUploadSuccess(true);
      toast({
        title: "Upload successful",
        description: `${validation.detectedType} evidence uploaded successfully.`,
      });
      
      // Trigger refresh of the checklist
      onComplete();
      
      console.log('Media upload and save completed successfully');
      
    } catch (error) {
      console.error('Error in file upload process:', error);
      
      // If error and it's a photo, try saving offline as fallback
      if (validation.detectedType === 'photo') {
        try {
          await savePhotoOffline(file, checklistItemId, inspectionId);
          setUploadSuccess(true);
          toast({
            title: "Saved offline",
            description: "Upload failed, but photo saved locally for later sync.",
          });
          onComplete();
          return;
        } catch (offlineError) {
          console.error('Offline save also failed:', offlineError);
        }
      }
      
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const resetUpload = () => {
    setUploadSuccess(false);
  };

  return {
    isUploading,
    uploadSuccess,
    handleFileUpload,
    resetUpload
  };
};
