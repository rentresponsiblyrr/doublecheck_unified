
import { useState } from "react";
import { ChecklistItemType } from "@/types/inspection";
import { ChecklistItemUploadSection } from "@/components/ChecklistItemUploadSection";
import { ChecklistItemHeader } from "@/components/ChecklistItemHeader";
import { ChecklistItemNotes } from "@/components/ChecklistItemNotes";
import { ChecklistItemActions } from "@/components/ChecklistItemActions";
import { useToast } from "@/hooks/use-toast";
import { useChecklistItemMedia } from "@/hooks/useChecklistItemMedia";
import { useNotesHistory } from "@/hooks/useNotesHistory";
import { supabase } from "@/integrations/supabase/client";

interface ChecklistItemCoreProps {
  item: ChecklistItemType;
  onComplete: () => void;
  onNotesChange: (notes: string) => void;
  onUploadingChange: (isUploading: boolean) => void;
}

export const ChecklistItemCore = ({ 
  item, 
  onComplete, 
  onNotesChange,
  onUploadingChange 
}: ChecklistItemCoreProps) => {
  const [currentNotes, setCurrentNotes] = useState(item.notes || "");
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const { toast } = useToast();
  const { data: mediaItems = [], refetch: refetchMedia } = useChecklistItemMedia(item.id);
  const { saveNote } = useNotesHistory(item.id);

  const hasUploadedMedia = mediaItems.length > 0;

  const handleMediaUpload = async (file: File) => {
    setIsUploading(true);
    onUploadingChange(true);
    
    try {
      
      toast({
        title: "Upload started",
        description: `Uploading ${item.evidence_type}...`,
      });
    } catch (error) {
      toast({
        title: "Upload failed",
        description: "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      onUploadingChange(false);
    }
  };

  const handleDeleteMedia = async () => {
    if (mediaItems.length === 0) return;
    
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
        .from('logs')
        .update({ status: null })
        .eq('id', item.id);

      if (statusError) throw statusError;

      toast({
        title: "Media deleted",
        description: "Evidence has been removed. You can now upload new evidence.",
      });

      // Refresh media and trigger parent refresh
      await refetchMedia();
      onComplete();
    } catch (error) {
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
    onUploadingChange(false);
    await refetchMedia();
    
    // DO NOT auto-complete - user must still mark pass/fail/NA
  };

  const handleNotesChange = (notes: string) => {
    setCurrentNotes(notes);
    onNotesChange(notes);
  };

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <ChecklistItemHeader item={item} />

        {/* Upload Section */}
        <ChecklistItemUploadSection
          item={item}
          hasUploadedMedia={hasUploadedMedia}
          isUploading={isUploading}
          isDeleting={isDeleting}
          onMediaUpload={handleMediaUpload}
          onUploadComplete={handleUploadComplete}
          onDeleteMedia={handleDeleteMedia}
        />

        {/* Notes */}
        <ChecklistItemNotes 
          itemId={item.id} 
          initialNotes={item.notes || ""} 
          onNotesChange={handleNotesChange}
        />

        {/* Pass/Fail/N/A Actions */}
        <ChecklistItemActions 
          itemId={item.id} 
          currentNotes={currentNotes} 
          onComplete={onComplete} 
          inspectionId={item.inspection_id}
        />
      </div>

    </>
  );
};
