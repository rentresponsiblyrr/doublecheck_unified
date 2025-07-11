
import { useState, useEffect } from "react";
import { Textarea } from "@/components/ui/textarea";
import { User } from "@supabase/supabase-js";

interface NotesInputFormProps {
  user: User | null;
  onSaveNote: (noteText: string) => Promise<boolean>;
  onNotesChange?: (notes: string) => void;
}

export const NotesInputForm = ({ user, onSaveNote, onNotesChange }: NotesInputFormProps) => {
  const [notes, setNotes] = useState("");

  // Notify parent of notes changes
  useEffect(() => {
    if (onNotesChange) {
      onNotesChange(notes);
    }
  }, [notes, onNotesChange]);

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
      {!user && (
        <p className="text-xs text-gray-500 mt-1">
          You must be logged in to add notes.
        </p>
      )}
      <p className="text-xs text-gray-500 mt-2">
        Notes will be saved when you mark the item as Pass, Fail, or N/A below.
      </p>
    </div>
  );
};
