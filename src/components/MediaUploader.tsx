
import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Camera, Video, Upload } from "lucide-react";
import { uploadMedia, saveMediaRecord, updateChecklistItemStatus } from "@/lib/supabase";

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

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    console.log('File selected:', file.name, file.type, file.size);
    
    try {
      // Call the onUpload prop to set loading state
      onUpload(file);
      
      // Upload to Supabase Storage
      const uploadResult = await uploadMedia(file, inspectionId, checklistItemId);
      
      if (uploadResult.error) {
        console.error('Upload failed:', uploadResult.error);
        alert('Upload failed: ' + uploadResult.error);
        return;
      }

      if (!uploadResult.url) {
        console.error('No URL returned from upload');
        alert('Upload failed: No URL returned');
        return;
      }

      // Save media record to database
      await saveMediaRecord(checklistItemId, evidenceType, uploadResult.url);
      
      // Mark checklist item as completed
      await updateChecklistItemStatus(checklistItemId, 'completed');
      
      // Trigger refresh of the checklist
      onComplete();
      
      console.log('Media upload and save completed successfully');
      
    } catch (error) {
      console.error('Error in file upload process:', error);
      alert('Upload failed: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  const acceptTypes = evidenceType === 'photo' 
    ? 'image/*' 
    : 'video/*';

  return (
    <div className="space-y-3">
      <input
        ref={fileInputRef}
        type="file"
        accept={acceptTypes}
        onChange={handleFileSelect}
        capture={evidenceType === 'photo' ? 'environment' : 'user'}
        className="hidden"
      />
      
      {uploadedUrl ? (
        <div className="space-y-3">
          <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-4">
            {evidenceType === 'photo' ? (
              <img 
                src={uploadedUrl} 
                alt="Uploaded evidence" 
                className="w-full h-48 object-cover rounded"
              />
            ) : (
              <video 
                src={uploadedUrl} 
                controls 
                className="w-full h-48 rounded"
              />
            )}
          </div>
          <Button
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            className="w-full h-12"
            disabled={isUploading}
          >
            <Upload className="w-5 h-5 mr-2" />
            Replace {evidenceType}
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          <Button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="w-full h-16 text-lg"
          >
            {isUploading ? (
              "Uploading..."
            ) : (
              <>
                {evidenceType === 'photo' ? (
                  <Camera className="w-6 h-6 mr-3" />
                ) : (
                  <Video className="w-6 h-6 mr-3" />
                )}
                Take {evidenceType}
              </>
            )}
          </Button>
          <p className="text-xs text-gray-500 text-center">
            Tap to {evidenceType === 'photo' ? 'take photo' : 'record video'} or select from gallery
          </p>
        </div>
      )}
    </div>
  );
};
