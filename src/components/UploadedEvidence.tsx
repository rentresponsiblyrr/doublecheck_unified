
import { useState, useEffect } from "react";
import { Image as ImageIcon } from "lucide-react";
import { MediaUpload } from "@/types/inspection";
import { MediaLightbox } from "@/components/MediaLightbox";
import { MediaItem } from "@/components/MediaItem";
import { supabase } from "@/integrations/supabase/client";

interface MediaUploadWithAttribution extends MediaUpload {
  user_id?: string;
  uploaded_by_name?: string;
}

interface UploadedEvidenceProps {
  checklistItemId: string;
}

export const UploadedEvidence = ({ checklistItemId }: UploadedEvidenceProps) => {
  const [selectedMedia, setSelectedMedia] = useState<MediaUploadWithAttribution | null>(null);
  const [mediaItems, setMediaItems] = useState<MediaUploadWithAttribution[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load media items with user attribution
  useEffect(() => {
    const loadMediaItems = async () => {
      try {
        const { data, error } = await supabase
          .from('media')
          .select('*')
          .eq('checklist_item_id', checklistItemId)
          .order('created_at', { ascending: false });

        if (error) throw error;

        // Transform and properly type the data
        const transformedData: MediaUploadWithAttribution[] = (data || []).map(item => ({
          id: item.id,
          checklist_item_id: item.checklist_item_id,
          type: (item.type === 'photo' || item.type === 'video') ? item.type : 'photo',
          url: item.url || '',
          user_id: item.user_id || undefined,
          uploaded_by_name: item.uploaded_by_name || undefined,
          created_at: item.created_at || new Date().toISOString()
        }));

        setMediaItems(transformedData);
      } catch (error) {
        console.error('Failed to load media items:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadMediaItems();
  }, [checklistItemId]);

  // Real-time subscription for media updates
  useEffect(() => {
    const channel = supabase
      .channel(`media-${checklistItemId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'media',
          filter: `checklist_item_id=eq.${checklistItemId}`
        },
        (payload) => {
          console.log('Media update received:', payload);
          
          if (payload.eventType === 'INSERT') {
            const newItem: MediaUploadWithAttribution = {
              id: payload.new.id,
              checklist_item_id: payload.new.checklist_item_id,
              type: (payload.new.type === 'photo' || payload.new.type === 'video') ? payload.new.type : 'photo',
              url: payload.new.url || '',
              user_id: payload.new.user_id || undefined,
              uploaded_by_name: payload.new.uploaded_by_name || undefined,
              created_at: payload.new.created_at || new Date().toISOString()
            };
            setMediaItems(prev => [newItem, ...prev]);
          } else if (payload.eventType === 'DELETE') {
            setMediaItems(prev => prev.filter(item => item.id !== payload.old.id));
          } else if (payload.eventType === 'UPDATE') {
            const updatedItem: MediaUploadWithAttribution = {
              id: payload.new.id,
              checklist_item_id: payload.new.checklist_item_id,
              type: (payload.new.type === 'photo' || payload.new.type === 'video') ? payload.new.type : 'photo',
              url: payload.new.url || '',
              user_id: payload.new.user_id || undefined,
              uploaded_by_name: payload.new.uploaded_by_name || undefined,
              created_at: payload.new.created_at || new Date().toISOString()
            };
            setMediaItems(prev => prev.map(item => 
              item.id === payload.new.id ? updatedItem : item
            ));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [checklistItemId]);

  const handleDownload = async (media: MediaUploadWithAttribution) => {
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
            <MediaItem
              key={media.id}
              media={media}
              onMediaClick={setSelectedMedia}
              onDownload={handleDownload}
            />
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
