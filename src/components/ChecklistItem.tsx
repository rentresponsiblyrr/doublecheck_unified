
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Camera, Video, Upload, Check } from "lucide-react";
import { ChecklistItemType } from "@/types/inspection";
import { MediaUploader } from "@/components/MediaUploader";
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
      case 'safety': return 'bg-red-100 text-red-800';
      case 'amenity': return 'bg-blue-100 text-blue-800';
      case 'cleanliness': return 'bg-green-100 text-green-800';
      case 'maintenance': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleMediaUpload = async (file: File) => {
    setIsUploading(true);
    try {
      console.log('Uploading media for item:', item.id);
      
      // In real implementation:
      // const fileName = `${Date.now()}-${file.name}`;
      // const filePath = `inspection-media/${item.inspection_id}/${item.id}/${fileName}`;
      // 
      // const { data: uploadData, error: uploadError } = await supabase.storage
      //   .from('inspection-evidence')
      //   .upload(filePath, file);
      //
      // if (uploadError) throw uploadError;
      //
      // const { data: urlData } = supabase.storage
      //   .from('inspection-evidence')
      //   .getPublicUrl(filePath);
      //
      // const { error: insertError } = await supabase
      //   .from('media')
      //   .insert({
      //     checklist_item_id: item.id,
      //     type: item.evidence_type,
      //     url: urlData.publicUrl,
      //     created_at: new Date().toISOString()
      //   });

      // Mock success for demo
      const mockUrl = URL.createObjectURL(file);
      setMediaUrl(mockUrl);
      
      toast({
        title: "Media uploaded successfully",
        description: `${item.evidence_type} evidence added to checklist item.`,
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

  const handleSubmit = async () => {
    if (!mediaUrl) {
      toast({
        title: "Evidence required",
        description: `Please upload a ${item.evidence_type} before submitting.`,
        variant: "destructive",
      });
      return;
    }

    try {
      // In real implementation:
      // const { error } = await supabase
      //   .from('checklist_items')
      //   .update({ status: 'completed' })
      //   .eq('id', item.id);

      console.log('Submitting item:', item.id, 'with notes:', notes);
      
      toast({
        title: "Item completed",
        description: "Evidence submitted successfully.",
      });
      
      onComplete();
    } catch (error) {
      console.error('Submit error:', error);
      toast({
        title: "Submission failed",
        description: "Please try again.",
        variant: "destructive",
      });
    }
  };

  if (item.status === 'completed') {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
            <Check className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="font-medium text-green-900">{item.label}</h3>
            <Badge className={`mt-1 ${getCategoryColor(item.category)}`}>
              {item.category}
            </Badge>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
      <div className="space-y-4">
        {/* Header */}
        <div>
          <h3 className="font-medium text-gray-900 text-lg leading-tight">
            {item.label}
          </h3>
          <div className="flex items-center gap-2 mt-2">
            <Badge className={getCategoryColor(item.category)}>
              {item.category}
            </Badge>
            <div className="flex items-center gap-1 text-sm text-gray-500">
              {item.evidence_type === 'photo' ? (
                <Camera className="w-4 h-4" />
              ) : (
                <Video className="w-4 h-4" />
              )}
              <span>{item.evidence_type} required</span>
            </div>
          </div>
        </div>

        {/* Media Upload */}
        <MediaUploader
          evidenceType={item.evidence_type}
          onUpload={handleMediaUpload}
          isUploading={isUploading}
          uploadedUrl={mediaUrl}
        />

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Notes (optional)
          </label>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add any additional observations..."
            className="min-h-[80px]"
          />
        </div>

        {/* Submit Button */}
        <Button
          onClick={handleSubmit}
          disabled={!mediaUrl || isUploading}
          className="w-full h-12 text-lg font-medium"
        >
          {isUploading ? (
            "Uploading..."
          ) : (
            <>
              <Check className="w-5 h-5 mr-2" />
              Complete Item
            </>
          )}
        </Button>
      </div>
    </div>
  );
};
