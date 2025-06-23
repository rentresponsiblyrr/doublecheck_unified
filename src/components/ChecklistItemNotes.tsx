
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface ChecklistItemNotesProps {
  itemId: string;
  initialNotes: string;
}

export const ChecklistItemNotes = ({ itemId, initialNotes }: ChecklistItemNotesProps) => {
  const [notes, setNotes] = useState(initialNotes || "");
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const handleSaveNotes = async () => {
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('checklist_items')
        .update({ notes })
        .eq('id', itemId);

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

  return (
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
      {notes !== initialNotes && (
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
  );
};
