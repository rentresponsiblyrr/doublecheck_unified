
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CheckCircle, X, MinusCircle } from "lucide-react";
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

  const handleStatusChange = async (newStatus: 'completed' | 'failed' | 'not_applicable') => {
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

      let statusMessage = '';
      switch (newStatus) {
        case 'completed':
          statusMessage = 'passed';
          break;
        case 'failed':
          statusMessage = 'failed';
          break;
        case 'not_applicable':
          statusMessage = 'not applicable';
          break;
      }

      toast({
        title: "Status updated",
        description: `Item marked as ${statusMessage}.`,
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
      <div className="flex flex-col gap-3">
        {/* Pass button */}
        <Button
          onClick={() => handleStatusChange('completed')}
          disabled={isSaving}
          className="w-full bg-green-600 hover:bg-green-700 text-white h-12"
        >
          {isSaving ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
          ) : (
            <CheckCircle className="w-5 h-5 mr-2" />
          )}
          Mark as Passed
        </Button>
        
        {/* Fail and N/A buttons in a row */}
        <div className="flex gap-3">
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
          
          <Button
            onClick={() => handleStatusChange('not_applicable')}
            disabled={isSaving}
            variant="outline"
            className="flex-1 h-12 border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            {isSaving ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400 mr-2"></div>
            ) : (
              <MinusCircle className="w-5 h-5 mr-2" />
            )}
            Mark as N/A
          </Button>
        </div>
      </div>
      
      <p className="text-xs text-gray-500 text-center mt-2">
        You can change the status later if needed
      </p>
    </div>
  );
};
