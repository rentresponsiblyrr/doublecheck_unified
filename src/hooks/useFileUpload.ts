
import { useState } from "react";
import { uploadMedia, saveMediaRecord, updateChecklistItemStatus } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { useOfflineStorage } from "@/hooks/useOfflineStorage";

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

  const validateFile = (file: File): boolean => {
    // Validate file type
    const isValidType = evidenceType === 'photo' 
      ? file.type.startsWith('image/')
      : file.type.startsWith('video/');

    if (!isValidType) {
      toast({
        title: "Invalid file type",
        description: `Please select a ${evidenceType} file.`,
        variant: "destructive",
      });
      return false;
    }

    // Validate file size (10MB limit)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      toast({
        title: "File too large",
        description: "Please select a file smaller than 10MB.",
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  const handleFileUpload = async (file: File) => {
    if (!validateFile(file)) return;

    console.log('File selected:', file.name, file.type, file.size);
    setIsUploading(true);
    
    try {
      // If offline, save photo locally
      if (!isOnline && evidenceType === 'photo') {
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
        if (evidenceType === 'photo') {
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

      // Save media record to database
      await saveMediaRecord(checklistItemId, evidenceType, uploadResult.url);
      
      // Update checklist item status to completed
      await updateChecklistItemStatus(checklistItemId, 'completed');
      
      setUploadSuccess(true);
      toast({
        title: "Upload successful",
        description: `${evidenceType} evidence uploaded successfully.`,
      });
      
      // Trigger refresh of the checklist
      onComplete();
      
      console.log('Media upload and save completed successfully');
      
    } catch (error) {
      console.error('Error in file upload process:', error);
      
      // If error and it's a photo, try saving offline as fallback
      if (evidenceType === 'photo') {
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
