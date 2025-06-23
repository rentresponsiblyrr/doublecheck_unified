
import { useState } from "react";
import { ChecklistItemType } from "@/types/inspection";
import { MediaUploader } from "@/components/MediaUploader";
import { UploadedEvidence } from "@/components/UploadedEvidence";
import { ChecklistItemHeader } from "@/components/ChecklistItemHeader";
import { ChecklistItemNotes } from "@/components/ChecklistItemNotes";
import { ChecklistItemActions } from "@/components/ChecklistItemActions";
import { CompletedChecklistItem } from "@/components/CompletedChecklistItem";
import { useToast } from "@/hooks/use-toast";
import { useChecklistItemMedia } from "@/hooks/useChecklistItemMedia";
import { supabase } from "@/integrations/supabase/client";

interface ChecklistItemProps {
  item: ChecklistItemType;
  onComplete: () => void;
}

export const ChecklistItem = ({ item, onComplete }: ChecklistItemProps) => {
  const [notes, setNotes] = useState(item.notes || "");
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();
  const { data: mediaItems = [], refetch: refetchMedia } = useChecklistItemMedia(item.id);

  const isCompleted = item.status === 'completed' || item.status === 'failed';
  const hasUploadedMedia = mediaItems.length > 0;

  // If item is completed, show the completed state component
  if (isCompleted) {
    return <CompletedChecklistItem item={item} onComplete={onComplete} />;
  }

  const handleMediaUpload = async (file: File) => {
    setIsUploading(true);
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
        description: "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
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
        .from('checklist_items')
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
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
      <div className="space-y-6">
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
        />

        {/* Pass/Fail Actions */}
        <ChecklistItemActions 
          itemId={item.id} 
          notes={notes} 
          onComplete={onComplete} 
        />
      </div>
    </div>
  );
};
