
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Camera, Video, Check, Clock, AlertTriangle, Trash2, X, CheckCircle } from "lucide-react";
import { ChecklistItemType } from "@/types/inspection";
import { MediaUploader } from "@/components/MediaUploader";
import { UploadedEvidence } from "@/components/UploadedEvidence";
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
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();
  const { data: mediaItems = [], refetch: refetchMedia } = useChecklistItemMedia(item.id);

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'safety': return 'bg-red-100 text-red-800 border-red-200';
      case 'amenity': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'cleanliness': return 'bg-green-100 text-green-800 border-green-200';
      case 'maintenance': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'safety': return <AlertTriangle className="w-4 h-4" />;
      case 'amenity': return item.evidence_type === 'photo' ? <Camera className="w-4 h-4" /> : <Video className="w-4 h-4" />;
      case 'cleanliness': return <Check className="w-4 h-4" />;
      case 'maintenance': return <Clock className="w-4 h-4" />;
      default: return <Check className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-50 border-green-200';
      case 'failed': return 'bg-red-50 border-red-200';
      default: return 'bg-white border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-6 h-6 text-green-500" />;
      case 'failed': return <X className="w-6 h-6 text-red-500" />;
      default: return <Clock className="w-6 h-6 text-gray-400" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed': return 'Passed';
      case 'failed': return 'Failed';
      default: return 'Pending';
    }
  };

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

  const handleStatusChange = async (newStatus: 'completed' | 'failed') => {
    setIsSaving(true);
    try {
      console.log('Updating status to:', newStatus, 'for item:', item.id);
      
      const { error } = await supabase
        .rpc('update_checklist_item_complete', {
          item_id: item.id,
          item_status: newStatus,
          item_notes: notes || null
        });

      if (error) throw error;

      toast({
        title: "Status updated",
        description: `Item marked as ${newStatus === 'completed' ? 'passed' : 'failed'}.`,
      });

      onComplete();
    } catch (error) {
      console.error('Status update error:', error);
      toast({
        title: "Update failed",
        description: "Failed to update status. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveNotes = async () => {
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('checklist_items')
        .update({ notes })
        .eq('id', item.id);

      if (error) throw error;

      toast({
        title: "Notes saved",
        description: "Your notes have been saved successfully.",
      });
    } catch (error) {
      console.error('Notes save error:', error);
      toast({
        title: "Save failed",
        description: "Failed to save notes. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
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

  const hasUploadedMedia = mediaItems.length > 0;
  const isCompleted = item.status === 'completed' || item.status === 'failed';

  if (isCompleted) {
    return (
      <div className={`${getStatusColor(item.status)} border rounded-lg p-4 shadow-sm`}>
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0">
            {getStatusIcon(item.status)}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-gray-900 text-lg leading-tight">
              {item.label}
            </h3>
            <div className="flex items-center gap-2 mt-2">
              <Badge className={`${getCategoryColor(item.category)} border`}>
                <div className="flex items-center gap-1">
                  {getCategoryIcon(item.category)}
                  <span className="capitalize">{item.category}</span>
                </div>
              </Badge>
              <div className={`flex items-center gap-1 text-sm ${
                item.status === 'completed' ? 'text-green-600' : 'text-red-600'
              }`}>
                {getStatusIcon(item.status)}
                <span>{getStatusText(item.status)}</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Show uploaded evidence for completed items */}
        {hasUploadedMedia && (
          <div className="mt-4">
            <UploadedEvidence checklistItemId={item.id} />
          </div>
        )}

        {/* Show notes if they exist */}
        {item.notes && (
          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <h5 className="text-sm font-medium text-gray-700 mb-1">Notes:</h5>
            <p className="text-sm text-gray-600">{item.notes}</p>
          </div>
        )}

        {/* Add option to retake/delete for completed items */}
        <div className="mt-4 pt-4 border-t">
          <Button
            onClick={handleDeleteMedia}
            disabled={isDeleting}
            variant="outline"
            size="sm"
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            {isDeleting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600 mr-2"></div>
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4 mr-2" />
                Delete & Retake
              </>
            )}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h3 className="font-semibold text-gray-900 text-xl leading-tight mb-3">
            {item.label}
          </h3>
          <div className="flex items-center gap-3 flex-wrap">
            <Badge className={`${getCategoryColor(item.category)} border`}>
              <div className="flex items-center gap-1">
                {getCategoryIcon(item.category)}
                <span className="capitalize font-medium">{item.category}</span>
              </div>
            </Badge>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              {item.evidence_type === 'photo' ? (
                <Camera className="w-4 h-4" />
              ) : (
                <Video className="w-4 h-4" />
              )}
              <span className="font-medium">{item.evidence_type} required</span>
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
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Notes (Optional)
          </label>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add any observations, concerns, or additional details..."
            className="min-h-[100px] resize-none"
          />
          {notes !== (item.notes || "") && (
            <Button
              onClick={handleSaveNotes}
              disabled={isSaving}
              variant="outline"
              size="sm"
              className="mt-2"
            >
              {isSaving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                  Saving...
                </>
              ) : (
                'Save Notes'
              )}
            </Button>
          )}
        </div>

        {/* Pass/Fail Actions */}
        <div className="pt-4 border-t border-gray-200">
          <div className="flex gap-3">
            <Button
              onClick={() => handleStatusChange('completed')}
              disabled={isSaving}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white h-12"
            >
              {isSaving ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              ) : (
                <CheckCircle className="w-5 h-5 mr-2" />
              )}
              Mark as Passed
            </Button>
            
            <Button
              onClick={() => handleStatusChange('failed')}
              disabled={isSaving}
              variant="destructive"
              className="flex-1 h-12"
            >
              {isSaving ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              ) : (
                <X className="w-5 h-5 mr-2" />
              )}
              Mark as Failed
            </Button>
          </div>
          
          <p className="text-xs text-gray-500 text-center mt-2">
            You can change the status later if needed
          </p>
        </div>
      </div>
    </div>
  );
};
