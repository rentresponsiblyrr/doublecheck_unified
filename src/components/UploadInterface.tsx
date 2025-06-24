
import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Camera, Video, AlertCircle } from "lucide-react";
import { PhotoCaptureGuide } from "@/components/PhotoCaptureGuide";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";

interface UploadInterfaceProps {
  evidenceType: 'photo' | 'video';
  category: string; // Changed from hardcoded union to string
  label: string;
  isUploading: boolean;
  onFileSelect: (file: File) => void;
}

export const UploadInterface = ({ 
  evidenceType, 
  category, 
  label, 
  isUploading, 
  onFileSelect 
}: UploadInterfaceProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isOnline = useNetworkStatus();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileSelect(file);
    }
  };

  const acceptTypes = evidenceType === 'photo' ? 'image/*' : 'video/*';
  const maxFileSize = "10MB";

  return (
    <div className="space-y-4">
      {/* Photo Guidelines - only show for photos */}
      {evidenceType === 'photo' && (
        <PhotoCaptureGuide category={category} label={label} />
      )}
      
      <input
        ref={fileInputRef}
        type="file"
        accept={acceptTypes}
        onChange={handleFileChange}
        capture={evidenceType === 'photo' ? 'environment' : 'user'}
        className="hidden"
        disabled={isUploading}
      />
      
      <div className="space-y-3">
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
              {!isOnline && evidenceType === 'photo' && (
                <p className="text-xs text-yellow-600 mt-1">
                  📱 Offline mode: Photo will be saved locally
                </p>
              )}
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
              {isOnline ? 'Uploading...' : 'Saving offline...'}
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
