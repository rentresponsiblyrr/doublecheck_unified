
import { MediaPreview } from "@/components/MediaPreview";
import { MediaActions } from "@/components/MediaActions";
import { MediaInfo } from "@/components/MediaInfo";
import { MediaUpload } from "@/types/inspection";

interface MediaUploadWithAttribution extends MediaUpload {
  user_id?: string;
  uploaded_by_name?: string;
}

interface MediaItemProps {
  media: MediaUploadWithAttribution;
  onMediaClick: (media: MediaUploadWithAttribution) => void;
  onDownload: (media: MediaUploadWithAttribution) => void;
}

export const MediaItem = ({ media, onMediaClick, onDownload }: MediaItemProps) => {
  return (
    <div className="relative bg-gray-100 rounded-lg overflow-hidden border border-gray-200 hover:border-blue-300 transition-colors">
      <MediaPreview media={media} onMediaClick={onMediaClick} />
      
      <div className="absolute top-2 right-2">
        <MediaActions 
          media={media} 
          onDownload={onDownload} 
          onView={onMediaClick} 
        />
      </div>
      
      <MediaInfo media={media} />
    </div>
  );
};
