
import { useState, useEffect, memo } from "react";
import { ChecklistItemType } from "@/types/inspection";
import { MediaUploader } from "@/components/MediaUploader";
import { UploadedEvidence } from "@/components/UploadedEvidence";
import { ChecklistItemHeader } from "@/components/ChecklistItemHeader";
import { ChecklistItemNotes } from "@/components/ChecklistItemNotes";
import { ChecklistItemActions } from "@/components/ChecklistItemActions";
import { CompletedChecklistItem } from "@/components/CompletedChecklistItem";
import { NotesPromptDialog } from "@/components/NotesPromptDialog";
import { useToast } from "@/hooks/use-toast";
import { useChecklistItemMedia } from "@/hooks/useChecklistItemMedia";
import { useNotesHistory } from "@/hooks/useNotesHistory";
import { useInspectorPresence } from "@/hooks/useInspectorPresence";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Wifi, WifiOff } from "lucide-react";

interface OptimizedChecklistItemProps {
  item: ChecklistItemType;
  onComplete: () => void;
  priority?: 'high' | 'medium' | 'low';
}

export const OptimizedChecklistItem = memo(({ item, onComplete, priority = 'medium' }: OptimizedChecklistItemProps) => {
  const [currentNotes, setCurrentNotes] = useState(item.notes || "");
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showNotesPrompt, setShowNotesPrompt] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const [networkStatus, setNetworkStatus] = useState(navigator.onLine);
  
  const { toast } = useToast();
  const { data: mediaItems = [], refetch: refetchMedia } = useChecklistItemMedia(item.id);
  const { saveNote } = useNotesHistory(item.id);
  const { updatePresence } = useInspectorPresence(item.inspection_id);

  const isCompleted = item.status === 'completed' || item.status === 'failed' || item.status === 'not_applicable';
  const hasUploadedMedia = mediaItems.length > 0;

  // Network status monitoring
  useEffect(() => {
    const handleOnline = () => setNetworkStatus(true);
    const handleOffline = () => setNetworkStatus(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Optimized intersection observer for mobile performance
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsInView(entry.isIntersecting);
        if (entry.isIntersecting && networkStatus) {
          updatePresence('viewing', item.id);
        }
      },
      { 
        threshold: 0.3, // Trigger earlier for better mobile UX
        rootMargin: '50px' // Load before fully visible
      }
    );

    const element = document.getElementById(`checklist-item-${item.id}`);
    if (element) {
      observer.observe(element);
    }

    return () => {
      if (element) {
        observer.unobserve(element);
      }
    };
  }, [item.id, updatePresence, networkStatus]);

  // Optimized presence updates
  useEffect(() => {
    if (isInView && networkStatus && (isUploading || currentNotes.length > 0)) {
      updatePresence('working', item.id, { 
        hasNotes: currentNotes.length > 0,
        isUploading 
      });
    }
  }, [isInView, isUploading, currentNotes, item.id, updatePresence, networkStatus]);

  // If item is completed, show the completed state component
  if (isCompleted) {
    return <CompletedChecklistItem item={item} onComplete={onComplete} />;
  }

  const handleMediaUpload = async (file: File) => {
    if (!networkStatus) {
      toast({
        title: "Offline",
        description: "Please connect to internet to upload media.",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    updatePresence('working', item.id, { isUploading: true });
    
    try {
      console.log('Uploading media for item:', item.id);
      
      toast({
        title: "Upload started",
        description: `Uploading ${item.evidence_type}...`,
      });
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload failed",
        description: "Please try again when back online.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteMedia = async () => {
    if (mediaItems.length === 0) return;
    
    if (!networkStatus) {
      toast({
        title: "Offline",
        description: "Please connect to internet to delete media.",
        variant: "destructive",
      });
      return;
    }
    
    setIsDeleting(true);
    try {
      // Delete all media items for this checklist item
      const { error: mediaError } = await supabase
        .from('media')
        .delete()
        .eq('checklist_item_id', item.id);

      if (mediaError) throw mediaError;

      // Update checklist item status back to null (incomplete)
      const { error: statusError } = await supabase
        .from('checklist_items')
        .update({ status: null })
        .eq('id', item.id);

      if (statusError) throw statusError;

      toast({
        title: "Media deleted",
        description: "Evidence has been removed. You can now upload new evidence.",
      });

      await refetchMedia();
      onComplete();
    } catch (error) {
      console.error('Delete error:', error);
      toast({
        title: "Delete failed",
        description: "Failed to delete evidence. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleUploadComplete = async () => {
    setIsUploading(false);
    await refetchMedia();
    onComplete();
    setShowNotesPrompt(true);
  };

  const handleNotesChange = (notes: string) => {
    setCurrentNotes(notes);
    if (notes.length > 0 && networkStatus) {
      updatePresence('working', item.id, { hasNotes: true });
    }
  };

  const getPriorityColor = () => {
    switch (priority) {
      case 'high': return 'border-red-200 bg-red-50';
      case 'low': return 'border-gray-200 bg-gray-50';
      default: return 'border-blue-200 bg-blue-50';
    }
  };

  return (
    <>
      <Card 
        id={`checklist-item-${item.id}`}
        className={`shadow-sm hover:shadow-md transition-shadow ${getPriorityColor()}`}
      >
        <CardContent className="p-4 sm:p-6">
          <div className="space-y-4 sm:space-y-6">
            {/* Header with network status */}
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <ChecklistItemHeader item={item} />
              </div>
              <div className="flex items-center gap-2 ml-4">
                {priority === 'high' && (
                  <Badge variant="destructive" className="text-xs">
                    Priority
                  </Badge>
                )}
                <div className="flex items-center">
                  {networkStatus ? (
                    <Wifi className="w-3 h-3 text-green-600" />
                  ) : (
                    <WifiOff className="w-3 h-3 text-red-600" />
                  )}
                </div>
              </div>
            </div>

            {/* Show existing uploaded evidence */}
            {hasUploadedMedia && (
              <UploadedEvidence checklistItemId={item.id} />
            )}

            {/* Media Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Evidence Upload
                {!networkStatus && (
                  <span className="text-red-600 text-xs ml-2">(Offline)</span>
                )}
              </label>
              <MediaUploader
                evidenceType={item.evidence_type}
                onUpload={handleMediaUpload}
                isUploading={isUploading}
                checklistItemId={item.id}
                inspectionId={item.inspection_id}
                onComplete={handleUploadComplete}
                category={item.category}
                label={item.label}
                hasUploadedMedia={hasUploadedMedia}
                onDelete={handleDeleteMedia}
              />
            </div>

            {/* Notes */}
            <ChecklistItemNotes 
              itemId={item.id} 
              initialNotes={item.notes || ""} 
              onNotesChange={handleNotesChange}
            />

            {/* Actions with network awareness */}
            <ChecklistItemActions 
              itemId={item.id} 
              currentNotes={currentNotes} 
              onComplete={onComplete} 
              inspectionId={item.inspection_id}
            />
          </div>
        </CardContent>
      </Card>

      {/* Notes Prompt Dialog */}
      <NotesPromptDialog
        isOpen={showNotesPrompt}
        onClose={() => setShowNotesPrompt(false)}
        onSaveNote={saveNote}
        itemLabel={item.label}
      />
    </>
  );
});

OptimizedChecklistItem.displayName = 'OptimizedChecklistItem';
