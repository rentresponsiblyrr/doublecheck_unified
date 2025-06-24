
import { useFileUpload } from "@/hooks/useFileUpload";
import { UploadSuccessState } from "@/components/UploadSuccessState";
import { UploadInterface } from "@/components/UploadInterface";

interface MediaUploaderProps {
  evidenceType: 'photo' | 'video';
  onUpload: (file: File) => void;
  isUploading: boolean;
  uploadedUrl?: string | null;
  checklistItemId: string;
  inspectionId: string;
  onComplete: () => void;
  category: string; // Changed from hardcoded union to string
  label: string;
  hasUploadedMedia?: boolean;
  onDelete?: () => void;
}

export const MediaUploader = ({ 
  evidenceType, 
  onUpload, 
  isUploading, 
  uploadedUrl,
  checklistItemId,
  inspectionId,
  onComplete,
  category,
  label,
  hasUploadedMedia = false,
  onDelete
}: MediaUploaderProps) => {
  const { 
    isUploading: hookIsUploading, 
    uploadSuccess, 
    handleFileUpload, 
    resetUpload 
  } = useFileUpload({
    evidenceType,
    checklistItemId,
    inspectionId,
    onComplete
  });

  const handleFileSelect = async (file: File) => {
    // Call the onUpload prop to set loading state in parent
    onUpload(file);
    // Handle the actual upload
    await handleFileUpload(file);
  };

  const handleRetake = () => {
    resetUpload();
  };

  // Show success state if upload was successful or if there's already uploaded media
  if (uploadSuccess || hasUploadedMedia) {
    return (
      <UploadSuccessState
        evidenceType={evidenceType}
        onRetake={handleRetake}
        onDelete={onDelete}
        isUploading={isUploading || hookIsUploading}
      />
    );
  }

  return (
    <UploadInterface
      evidenceType={evidenceType}
      category={category}
      label={label}
      isUploading={isUploading || hookIsUploading}
      onFileSelect={handleFileSelect}
    />
  );
};
