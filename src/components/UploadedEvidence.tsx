import { useState, useEffect, useRef } from "react";
import { Image as ImageIcon } from "lucide-react";
import { MediaUpload } from "@/types/inspection";
import { MediaLightbox } from "@/components/MediaLightbox";
import { MediaItem } from "@/components/MediaItem";
import { supabase } from "@/integrations/supabase/client";
import { useChannelManager } from "@/hooks/useChannelManager";
import { ApiResponse } from "@/types/payload-types";

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
  const { createChannel, subscribeChannel, cleanupChannel } = useChannelManager();
  const isMountedRef = useRef(true);

  // Load media items with user attribution
  useEffect(() => {
    isMountedRef.current = true;

    const loadMediaItems = async () => {
      if (!isMountedRef.current) return;
      
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

        if (isMountedRef.current) {
          setMediaItems(transformedData);
          setIsLoading(false);
        }
      } catch (error) {
        if (isMountedRef.current) {
          setIsLoading(false);
        }
      }
    };

    loadMediaItems();

    return () => {
      isMountedRef.current = false;
    };
  }, [checklistItemId]);

  // Real-time subscription for media updates (temporarily disabled to prevent WebSocket errors)
  useEffect(() => {
    // Temporarily disable realtime to prevent WebSocket connection failures
    const ENABLE_REALTIME = false; // Can be enabled later when WebSocket issues are resolved
    
    if (!ENABLE_REALTIME) {
      return;
    }
    
    isMountedRef.current = true;

    const setupSubscription = async () => {
      try {
        // Create unique channel name
        const channelName = `media-${checklistItemId}`;

        const channel = createChannel(channelName, {
          mediaChanges: {
            filter: {
              event: '*',
              schema: 'public',
              table: 'media',
              filter: `checklist_item_id=eq.${checklistItemId}`
            },
            callback: (payload: { eventType: string; new: MediaUpload; old?: MediaUpload }) => {
              
              if (!isMountedRef.current) return;
              
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
          }
        });

        // Subscribe to the channel with comprehensive error handling
        await subscribeChannel(channelName, (status: string) => {
          if (status === 'CHANNEL_ERROR') {
            // App will continue to work with manual refreshes
            console.warn('Channel error, continuing with manual refresh capability');
          } else if (status === 'CLOSED') {
            console.info('Channel closed');
          }
        });

      } catch (error) {
        // Continue without realtime - component will still work with initial data load
      }
    };

    setupSubscription().catch(error => {
      // Gracefully continue without realtime capabilities
    });

    return () => {
      isMountedRef.current = false;
      
      // Clean up channel with error handling
      try {
        const channelName = `media-${checklistItemId}`;
        cleanupChannel(channelName);
      } catch (error) {
        console.warn('Error cleaning up media channel:', error);
      }
    };
  }, [checklistItemId, createChannel, subscribeChannel, cleanupChannel]);

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
      console.warn('Error downloading media file:', error);
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
