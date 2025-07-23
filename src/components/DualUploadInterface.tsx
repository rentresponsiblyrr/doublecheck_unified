import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Camera, Video, AlertCircle } from "lucide-react";
import { PhotoCaptureGuide } from "@/components/PhotoCaptureGuide";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";

interface DualUploadInterfaceProps {
  category: string;
  label: string;
  isUploading: boolean;
  onFileSelect: (file: File, type: "photo" | "video") => void;
}

export const DualUploadInterface = ({
  category,
  label,
  isUploading,
  onFileSelect,
}: DualUploadInterfaceProps) => {
  const photoInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const isOnline = useNetworkStatus();

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    type: "photo" | "video",
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileSelect(file, type);
    }
  };

  return (
    <div className="space-y-4">
      {/* Photo Guidelines */}
      <PhotoCaptureGuide category={category} label={label} />

      {/* Hidden file inputs */}
      <input
        ref={photoInputRef}
        type="file"
        accept="image/*"
        onChange={(e) => handleFileChange(e, "photo")}
        capture="environment"
        className="hidden"
        disabled={isUploading}
      />

      <input
        ref={videoInputRef}
        type="file"
        accept="video/*"
        onChange={(e) => handleFileChange(e, "video")}
        capture="user"
        className="hidden"
        disabled={isUploading}
      />

      <div className="space-y-3">
        <div className="bg-blue-50 border-2 border-dashed border-blue-300 rounded-lg p-6 text-center">
          <div className="flex flex-col items-center gap-3">
            <div className="flex items-center gap-4">
              <Camera className="w-12 h-12 text-blue-500" />
              <span className="text-gray-400">or</span>
              <Video className="w-12 h-12 text-blue-500" />
            </div>
            <div>
              <p className="text-lg font-medium text-blue-900 mb-1">
                Capture Evidence
              </p>
              <p className="text-sm text-blue-600">
                Take a photo or record a video for this inspection item
              </p>
              {!isOnline && (
                <p className="text-xs text-yellow-600 mt-1">
                  📱 Offline mode: Media will be saved locally
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Photo and Video buttons */}
        <div className="grid grid-cols-2 gap-3">
          <Button
            onClick={() => photoInputRef.current?.click()}
            disabled={isUploading}
            className="h-16 text-lg bg-green-600 hover:bg-green-700 flex flex-col items-center justify-center gap-1"
          >
            {isUploading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                <span className="text-xs">
                  {isOnline ? "Uploading..." : "Saving..."}
                </span>
              </>
            ) : (
              <>
                <Camera className="w-6 h-6" />
                <span className="text-sm">Take Photo</span>
              </>
            )}
          </Button>

          <Button
            onClick={() => videoInputRef.current?.click()}
            disabled={isUploading}
            className="h-16 text-lg bg-red-600 hover:bg-red-700 flex flex-col items-center justify-center gap-1"
          >
            {isUploading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                <span className="text-xs">
                  {isOnline ? "Uploading..." : "Saving..."}
                </span>
              </>
            ) : (
              <>
                <Video className="w-6 h-6" />
                <span className="text-sm">Record Video</span>
              </>
            )}
          </Button>
        </div>

        <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
          <AlertCircle className="w-3 h-3" />
          <span>
            Max file size: 10MB • Photos: JPG, PNG, WebP • Videos: MP4, MOV,
            WebM
          </span>
        </div>
      </div>
    </div>
  );
};
