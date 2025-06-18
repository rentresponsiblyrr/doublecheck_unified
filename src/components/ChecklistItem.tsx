
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Camera, Video, Check, Clock, AlertTriangle } from "lucide-react";
import { ChecklistItemType } from "@/types/inspection";
import { MediaUploader } from "@/components/MediaUploader";
import { UploadedEvidence } from "@/components/UploadedEvidence";
import { useToast } from "@/hooks/use-toast";

interface ChecklistItemProps {
  item: ChecklistItemType;
  onComplete: () => void;
}

export const ChecklistItem = ({ item, onComplete }: ChecklistItemProps) => {
  const [notes, setNotes] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const { toast } = useToast();

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

  const handleMediaUpload = async (file: File) => {
    setIsUploading(true);
    try {
      console.log('Uploading media for item:', item.id);
      
      // Create a temporary URL for immediate preview
      const tempUrl = URL.createObjectURL(file);
      setMediaUrl(tempUrl);
      
      // The actual upload will be handled by MediaUploader
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

  if (item.status === 'completed') {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
            <Check className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-green-900 text-lg leading-tight">
              {item.label}
            </h3>
            <div className="flex items-center gap-2 mt-2">
              <Badge className={`${getCategoryColor(item.category)} border`}>
                <div className="flex items-center gap-1">
                  {getCategoryIcon(item.category)}
                  <span className="capitalize">{item.category}</span>
                </div>
              </Badge>
              <div className="flex items-center gap-1 text-sm text-green-600">
                <Check className="w-4 h-4" />
                <span>Completed</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Show uploaded evidence for completed items */}
        <div className="mt-4">
          <UploadedEvidence checklistItemId={item.id} />
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
        <UploadedEvidence checklistItemId={item.id} />

        {/* Media Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Evidence Upload
          </label>
          <MediaUploader
            evidenceType={item.evidence_type}
            onUpload={handleMediaUpload}
            isUploading={isUploading}
            uploadedUrl={mediaUrl}
            checklistItemId={item.id}
            inspectionId={item.inspection_id}
            onComplete={onComplete}
          />
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Additional Notes (Optional)
          </label>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add any observations, concerns, or additional details..."
            className="min-h-[100px] resize-none"
          />
        </div>

        {/* Submit Button */}
        <Button
          onClick={() => {
            if (!mediaUrl) {
              toast({
                title: "Evidence required",
                description: `Please upload a ${item.evidence_type} before completing this item.`,
                variant: "destructive",
              });
              return;
            }
            onComplete();
          }}
          disabled={!mediaUrl || isUploading}
          className="w-full h-14 text-lg font-semibold bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
        >
          {isUploading ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
              Processing...
            </>
          ) : (
            <>
              <Check className="w-6 h-6 mr-3" />
              Complete Item
            </>
          )}
        </Button>
      </div>
    </div>
  );
};
