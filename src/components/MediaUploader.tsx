
import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Camera, Video, Upload } from "lucide-react";

interface MediaUploaderProps {
  evidenceType: 'photo' | 'video';
  onUpload: (file: File) => void;
  isUploading: boolean;
  uploadedUrl?: string | null;
}

export const MediaUploader = ({ 
  evidenceType, 
  onUpload, 
  isUploading, 
  uploadedUrl 
}: MediaUploaderProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onUpload(file);
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
