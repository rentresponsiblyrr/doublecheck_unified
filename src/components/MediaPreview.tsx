
import { Play, Image as ImageIcon } from "lucide-react";
import { MediaUpload } from "@/types/inspection";

interface MediaPreviewProps {
  media: MediaUpload;
  onMediaClick: (media: MediaUpload) => void;
}

export const MediaPreview = ({ media, onMediaClick }: MediaPreviewProps) => {
  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    console.error('Thumbnail failed to load:', media.url);
    e.currentTarget.style.display = 'none';
  };

  const handleVideoError = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    console.error('Video thumbnail failed to load:', media.url);
  };

  return (
    <div className="relative">
      {media.type === 'photo' ? (
        <img 
          src={media.url} 
          alt="Evidence" 
          className="w-full h-32 object-cover cursor-pointer"
          onClick={() => onMediaClick(media)}
          onError={handleImageError}
        />
      ) : (
        <div 
          className="relative cursor-pointer"
          onClick={() => onMediaClick(media)}
        >
          <video 
            src={media.url} 
            className="w-full h-32 object-cover"
            onError={handleVideoError}
          />
          <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center">
            <Play className="w-8 h-8 text-white" />
          </div>
        </div>
      )}
    </div>
  );
};
