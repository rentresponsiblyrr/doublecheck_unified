import React, { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { User as UserIcon } from "lucide-react";

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
  onNotesChange,
}) => {
  const [note, setNote] = useState("");

  const handleNoteChange = (value: string) => {
    setNote(value);
    onNotesChange?.(value);
  };

  if (!user) {
    return (
      <Card className="bg-gray-50">
        <CardContent className="p-4 text-center text-gray-600">
          <UserIcon className="w-6 h-6 mx-auto mb-2" />
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
            />
          </div>

          <div className="text-xs text-gray-500">
            Notes are automatically saved when you mark items as Pass/Fail/N/A
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
