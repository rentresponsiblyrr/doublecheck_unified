
import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Camera, Video, Upload, AlertCircle, CheckCircle } from "lucide-react";
import { uploadMedia, saveMediaRecord, updateChecklistItemStatus } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";

interface MediaUploaderProps {
  evidenceType: 'photo' | 'video';
  onUpload: (file: File) => void;
  isUploading: boolean;
  uploadedUrl?: string | null;
  checklistItemId: string;
  inspectionId: string;
  onComplete: () => void;
}

export const MediaUploader = ({ 
  evidenceType, 
  onUpload, 
  isUploading, 
  uploadedUrl,
  checklistItemId,
  inspectionId,
  onComplete
}: MediaUploaderProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

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
      return;
    }

    // Validate file size (10MB limit)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      toast({
        title: "File too large",
        description: "Please select a file smaller than 10MB.",
        variant: "destructive",
      });
      return;
    }

    console.log('File selected:', file.name, file.type, file.size);
    
    try {
      // Call the onUpload prop to set loading state
      onUpload(file);
      
      // Upload to Supabase Storage
      const uploadResult = await uploadMedia(file, inspectionId, checklistItemId);
      
      if (uploadResult.error) {
        console.error('Upload failed:', uploadResult.error);
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
      
      toast({
        title: "Upload successful",
        description: `${evidenceType} evidence uploaded and saved.`,
      });
      
      // Trigger refresh of the checklist
      onComplete();
      
      console.log('Media upload and save completed successfully');
      
    } catch (error) {
      console.error('Error in file upload process:', error);
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        variant: "destructive",
      });
    }
  };

  const acceptTypes = evidenceType === 'photo' 
    ? 'image/*' 
    : 'video/*';

  const maxFileSize = "10MB";

  return (
    <div className="space-y-3">
      <input
        ref={fileInputRef}
        type="file"
        accept={acceptTypes}
        onChange={handleFileSelect}
        capture={evidenceType === 'photo' ? 'environment' : 'user'}
        className="hidden"
        disabled={isUploading}
      />
      
      <div className="space-y-2">
        <div className="bg-blue-50 border-2 border-dashed border-blue-300 rounded-lg p-6 text-center">
          <div className="flex flex-col items-center gap-3">
            {evidenceType === 'photo' ? (
              <Camera className="w-12 h-12 text-blue-500" />
            ) : (
              <Video className="w-12 h-12 text-blue-500" />
            )}
            <div>
              <p className="text-lg font-medium text-blue-900 mb-1">
                {evidenceType === 'photo' ? 'Take Photo' : 'Record Video'}
              </p>
              <p className="text-sm text-blue-600">
                Add evidence for this inspection item
              </p>
            </div>
          </div>
        </div>
        
        <Button
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="w-full h-16 text-lg bg-blue-600 hover:bg-blue-700"
        >
          {isUploading ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
              Uploading...
            </>
          ) : (
            <>
              {evidenceType === 'photo' ? (
                <Camera className="w-6 h-6 mr-3" />
              ) : (
                <Video className="w-6 h-6 mr-3" />
              )}
              Capture {evidenceType}
            </>
          )}
        </Button>
        
        <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
          <AlertCircle className="w-3 h-3" />
          <span>Max file size: {maxFileSize} • {evidenceType === 'photo' ? 'JPG, PNG, WebP' : 'MP4, MOV, WebM'}</span>
        </div>
      </div>
    </div>
  );
};
