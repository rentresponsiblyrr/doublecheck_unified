
import { useState } from "react";
import { uploadMedia, updateChecklistItemStatus } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { useOfflineStorage } from "@/hooks/useOfflineStorage";
import { useFileValidation } from "@/utils/fileValidation";
import { useMediaRecordService } from "@/services/mediaRecordService";

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
  const { validateFile } = useFileValidation();
  const { saveMediaRecordWithAttribution } = useMediaRecordService();

  const handleFileUpload = async (file: File) => {
    const validation = validateFile(file);
    if (!validation.isValid) return;

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
        toast({
          title: "Upload failed",
          description: "No URL returned from upload",
          variant: "destructive",
        });
        return;
      }

      // Save media record to database with user attribution and detected type
      await saveMediaRecordWithAttribution(checklistItemId, validation.detectedType, uploadResult.url);
      
      // Note: Status will be updated when user explicitly marks Pass/Fail/NA
      // This preserves the evidence-note pairing requirement
      
      setUploadSuccess(true);
      toast({
        title: "Upload successful",
        description: `${validation.detectedType} evidence uploaded successfully.`,
      });
      
      // Trigger refresh of the checklist
      onComplete();
      
      
    } catch (error) {
      
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
