
import { useState } from "react";
import { Play, Image as ImageIcon, Calendar } from "lucide-react";
import { MediaUpload } from "@/types/inspection";
import { MediaLightbox } from "@/components/MediaLightbox";
import { useChecklistItemMedia } from "@/hooks/useChecklistItemMedia";

interface UploadedEvidenceProps {
  checklistItemId: string;
}

export const UploadedEvidence = ({ checklistItemId }: UploadedEvidenceProps) => {
  const [selectedMedia, setSelectedMedia] = useState<MediaUpload | null>(null);
  const { data: mediaItems = [], isLoading } = useChecklistItemMedia(checklistItemId);

  if (isLoading) {
    return (
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded mb-2 w-24"></div>
          <div className="h-20 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (mediaItems.length === 0) {
    return null;
  }

  return (
    <>
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-gray-700 flex items-center gap-2">
          <ImageIcon className="w-4 h-4" />
          Uploaded Evidence ({mediaItems.length})
        </h4>
        
        <div className="grid grid-cols-2 gap-3">
          {mediaItems.map((media) => (
            <div
              key={media.id}
              className="relative bg-gray-100 rounded-lg overflow-hidden cursor-pointer hover:ring-2 hover:ring-blue-500 transition-all"
              onClick={() => setSelectedMedia(media)}
            >
              {media.type === 'photo' ? (
                <img 
                  src={media.url} 
                  alt="Evidence" 
                  className="w-full h-24 object-cover"
                  onError={(e) => {
                    console.error('Thumbnail failed to load:', media.url);
                    e.currentTarget.style.display = 'none';
                  }}
                />
              ) : (
                <div className="relative">
                  <video 
                    src={media.url} 
                    className="w-full h-24 object-cover"
                    onError={(e) => {
                      console.error('Video thumbnail failed to load:', media.url);
                    }}
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center">
                    <Play className="w-8 h-8 text-white" />
                  </div>
                </div>
              )}
              
              <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-70 text-white p-1">
                <div className="flex items-center gap-1 text-xs">
                  <Calendar className="w-3 h-3" />
                  <span>
                    {new Date(media.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {selectedMedia && (
        <MediaLightbox
          media={selectedMedia}
          isOpen={!!selectedMedia}
          onClose={() => setSelectedMedia(null)}
        />
      )}
    </>
  );
};
