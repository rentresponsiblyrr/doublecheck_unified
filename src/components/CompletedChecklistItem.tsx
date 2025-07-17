
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Camera, Video, Check, Clock, AlertTriangle, Trash2, CheckCircle, X } from "lucide-react";
import { ChecklistItemType } from "@/types/inspection";
import { UploadedEvidence } from "@/components/UploadedEvidence";
import { useToast } from "@/hooks/use-toast";
import { useChecklistItemMedia } from "@/hooks/useChecklistItemMedia";
import { supabase } from "@/integrations/supabase/client";

interface CompletedChecklistItemProps {
  item: ChecklistItemType;
  onComplete: () => void;
}

export const CompletedChecklistItem = ({ item, onComplete }: CompletedChecklistItemProps) => {
  const [isDeleting, setIsDeleting] = useState(false);
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
        .from('inspection_checklist_items')
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

  const hasUploadedMedia = mediaItems.length > 0;

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
};
