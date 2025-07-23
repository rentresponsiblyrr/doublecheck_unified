import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MediaUpload } from "@/types/inspection";

interface MediaLightboxProps {
  media: MediaUpload;
  isOpen: boolean;
  onClose: () => void;
}

export const MediaLightbox = ({
  media,
  isOpen,
  onClose,
}: MediaLightboxProps) => {
  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4"
      onClick={handleBackdropClick}
    >
      <div className="relative max-w-4xl max-h-full w-full">
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-4 right-4 z-10 bg-black bg-opacity-50 hover:bg-opacity-70 text-white"
          onClick={onClose}
        >
          <X className="w-6 h-6" />
        </Button>

        <div className="bg-white rounded-lg overflow-hidden">
          {media.type === "photo" ? (
            <img
              src={media.url}
              alt="Evidence"
              className="w-full h-auto max-h-[80vh] object-contain"
              onError={(e) => {}}
            />
          ) : (
            <video
              src={media.url}
              controls
              autoPlay
              className="w-full h-auto max-h-[80vh]"
              onError={(e) => {}}
            />
          )}

          <div className="p-4 bg-gray-50">
            <p className="text-sm text-gray-600">
              Uploaded: {new Date(media.created_at).toLocaleDateString()} at{" "}
              {new Date(media.created_at).toLocaleTimeString()}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
