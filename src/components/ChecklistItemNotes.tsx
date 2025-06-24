
import { useNotesHistory } from "@/hooks/useNotesHistory";
import { NotesHistoryList } from "@/components/NotesHistoryList";
import { NotesInputForm } from "@/components/NotesInputForm";

interface ChecklistItemNotesProps {
  itemId: string;
  initialNotes: string;
  onNotesChange?: (notes: string) => void;
}

export const ChecklistItemNotes = ({ itemId, onNotesChange }: ChecklistItemNotesProps) => {
  const { notesHistory, isLoading, saveNote, user } = useNotesHistory(itemId);

  return (
    <div className="space-y-4">
      <NotesHistoryList 
        notesHistory={notesHistory} 
        isLoading={isLoading} 
      />
      <NotesInputForm 
        user={user} 
        onSaveNote={saveNote} 
        onNotesChange={onNotesChange}
      />
    </div>
  );
};
