import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Save, User } from "lucide-react";

interface User {
  id: string;
  name?: string;
  email?: string;
}

interface NotesInputFormProps {
  user: User | null;
  onSaveNote: (note: string) => Promise<void>;
  onNotesChange?: (notes: string) => void;
}

export const NotesInputForm: React.FC<NotesInputFormProps> = ({
  user,
  onSaveNote,
  onNotesChange
}) => {
  const [note, setNote] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const handleNoteChange = (value: string) => {
    setNote(value);
    onNotesChange?.(value);
  };

  const handleSaveNote = async () => {
    if (!note.trim()) return;

    setIsSaving(true);
    try {
      await onSaveNote(note.trim());
      setNote(""); // Clear the input after saving
    } catch (error) {
      console.error("Failed to save note:", error);
    } finally {
      setIsSaving(false);
    }
  };

  if (!user) {
    return (
      <Card className="bg-gray-50">
        <CardContent className="p-4 text-center text-gray-600">
          <User className="w-6 h-6 mx-auto mb-2" />
          <p>Please log in to add notes</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card id="notes-input-form">
      <CardContent className="p-4">
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">
              Add Note
            </label>
            <Textarea
              value={note}
              onChange={(e) => handleNoteChange(e.target.value)}
              placeholder="Add your notes here..."
              className="min-h-[80px]"
              disabled={isSaving}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="text-xs text-gray-500">
              Saving as: {user.name || user.email || "Unknown User"}
            </div>
            <Button 
              onClick={handleSaveNote}
              disabled={!note.trim() || isSaving}
              size="sm"
            >
              {isSaving ? (
                <div className="flex items-center">
                  <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Saving...
                </div>
              ) : (
                <div className="flex items-center">
                  <Save className="w-3 h-3 mr-1" />
                  Save Note
                </div>
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};