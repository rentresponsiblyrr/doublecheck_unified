
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CheckCircle, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface ChecklistItemActionsProps {
  itemId: string;
  notes: string;
  onComplete: () => void;
}

export const ChecklistItemActions = ({ itemId, notes, onComplete }: ChecklistItemActionsProps) => {
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const handleStatusChange = async (newStatus: 'completed' | 'failed') => {
    setIsSaving(true);
    try {
      console.log('Updating status to:', newStatus, 'for item:', itemId);
      
      const { error } = await supabase
        .rpc('update_checklist_item_complete', {
          item_id: itemId,
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

  return (
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
  );
};
