
import { useState } from "react";
import { Play, Image as ImageIcon, Calendar, Download, ExternalLink } from "lucide-react";
import { MediaUpload } from "@/types/inspection";
import { MediaLightbox } from "@/components/MediaLightbox";
import { useChecklistItemMedia } from "@/hooks/useChecklistItemMedia";
import { Button } from "@/components/ui/button";

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

  const handleDownload = async (media: MediaUpload) => {
    try {
      const response = await fetch(media.url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `evidence-${media.id}.${media.type === 'photo' ? 'jpg' : 'mp4'}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  return (
    <>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-medium text-gray-700 flex items-center gap-2">
            <ImageIcon className="w-4 h-4" />
            Uploaded Evidence ({mediaItems.length})
          </h4>
          {mediaItems.length > 0 && (
            <div className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full">
              ✓ Complete
            </div>
          )}
        </div>
        
        <div className="grid grid-cols-1 gap-3">
          {mediaItems.map((media) => (
            <div
              key={media.id}
              className="relative bg-gray-100 rounded-lg overflow-hidden border border-gray-200 hover:border-blue-300 transition-colors"
            >
              {/* Media Preview */}
              <div className="relative">
                {media.type === 'photo' ? (
                  <img 
                    src={media.url} 
                    alt="Evidence" 
                    className="w-full h-32 object-cover cursor-pointer"
                    onClick={() => setSelectedMedia(media)}
                    onError={(e) => {
                      console.error('Thumbnail failed to load:', media.url);
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                ) : (
                  <div 
                    className="relative cursor-pointer"
                    onClick={() => setSelectedMedia(media)}
                  >
                    <video 
                      src={media.url} 
                      className="w-full h-32 object-cover"
                      onError={(e) => {
                        console.error('Video thumbnail failed to load:', media.url);
                      }}
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center">
                      <Play className="w-8 h-8 text-white" />
                    </div>
                  </div>
                )}
              </div>
              
              {/* Media Info and Actions */}
              <div className="p-3 bg-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs text-gray-600">
                    <Calendar className="w-3 h-3" />
                    <span>
                      {new Date(media.created_at).toLocaleDateString()} at{' '}
                      {new Date(media.created_at).toLocaleTimeString([], { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDownload(media)}
                      className="h-6 w-6 p-0 hover:bg-gray-100"
                    >
                      <Download className="w-3 h-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setSelectedMedia(media)}
                      className="h-6 w-6 p-0 hover:bg-gray-100"
                    >
                      <ExternalLink className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
                
                <div className="mt-2">
                  <div className="text-xs text-gray-500 capitalize">
                    {media.type} Evidence
                  </div>
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
