
import { useState, useEffect } from "react";
import { ChecklistItemType } from "@/types/inspection";
import { UploadedEvidence } from "@/components/UploadedEvidence";
import { ChecklistItemHeader } from "@/components/ChecklistItemHeader";
import { ChecklistItemNotes } from "@/components/ChecklistItemNotes";
import { ChecklistItemActions } from "@/components/ChecklistItemActions";
import { NotesPromptDialog } from "@/components/NotesPromptDialog";
import { MediaUploader } from "@/components/MediaUploader";
import { useToast } from "@/hooks/use-toast";
import { useChecklistItemMedia } from "@/hooks/useChecklistItemMedia";
import { useNotesHistory } from "@/hooks/useNotesHistory";
import { useInspectorPresence } from "@/hooks/useInspectorPresence";
import { supabase } from "@/integrations/supabase/client";

interface OptimizedChecklistItemCoreProps {
  item: ChecklistItemType;
  onComplete: () => void;
  networkStatus: boolean;
  isInView: boolean;
}

export const OptimizedChecklistItemCore = ({ 
  item, 
  onComplete, 
  networkStatus, 
  isInView 
}: OptimizedChecklistItemCoreProps) => {
  const [currentNotes, setCurrentNotes] = useState(item.notes || "");
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showNotesPrompt, setShowNotesPrompt] = useState(false);
  
  const { toast } = useToast();
  const { data: mediaItems = [], refetch: refetchMedia } = useChecklistItemMedia(item.id);
  const { saveNote } = useNotesHistory(item.id);
  // const { updatePresence } = useInspectorPresence(item.inspection_id); // DISABLED - missing table
  const updatePresence = () => {}; // Placeholder

  const hasUploadedMedia = mediaItems.length > 0;

  // Optimized presence updates
  useEffect(() => {
    if (isInView && networkStatus && (isUploading || currentNotes.length > 0)) {
      updatePresence('working', item.id, { 
        hasNotes: currentNotes.length > 0,
        isUploading 
      });
    }
  }, [isInView, isUploading, currentNotes, item.id, updatePresence, networkStatus]);

  // Update presence when item comes into view
  useEffect(() => {
    if (isInView && networkStatus) {
      updatePresence('viewing', item.id);
    }
  }, [isInView, item.id, updatePresence, networkStatus]);

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

  return (
    <>
      {/* Header */}
      <ChecklistItemHeader item={item} />

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

      {/* Notes Prompt Dialog */}
      <NotesPromptDialog
        isOpen={showNotesPrompt}
        onClose={() => setShowNotesPrompt(false)}
        onSaveNote={saveNote}
        itemLabel={item.label}
      />
    </>
  );
};
