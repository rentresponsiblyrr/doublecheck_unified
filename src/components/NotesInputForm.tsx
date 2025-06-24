
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { User } from "@supabase/supabase-js";

interface NotesInputFormProps {
  user: User | null;
  onSaveNote: (noteText: string) => Promise<boolean>;
}

export const NotesInputForm = ({ user, onSaveNote }: NotesInputFormProps) => {
  const [notes, setNotes] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const handleSaveNotes = async () => {
    setIsSaving(true);
    const success = await onSaveNote(notes);
    if (success) {
      setNotes(""); // Clear the input after successful save
    }
    setIsSaving(false);
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Add Notes {user && `(as ${user.user_metadata?.name || user.email?.split('@')[0]})`}
      </label>
      <Textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Add any observations, concerns, or additional details..."
        className="min-h-[100px] resize-none"
      />
      <Button
        onClick={handleSaveNotes}
        disabled={isSaving || !notes.trim() || !user}
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
          'Save & Share Notes'
        )}
      </Button>
      {!user && (
        <p className="text-xs text-gray-500 mt-1">
          You must be logged in to add notes.
        </p>
      )}
    </div>
  );
};
