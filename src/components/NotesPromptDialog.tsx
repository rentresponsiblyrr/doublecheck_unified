
import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

interface NotesPromptDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveNote: (noteText: string) => Promise<boolean>;
  itemLabel: string;
}

export const NotesPromptDialog = ({ 
  isOpen, 
  onClose, 
  onSaveNote, 
  itemLabel 
}: NotesPromptDialogProps) => {
  const [noteText, setNoteText] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const handleSave = async () => {
    if (!noteText.trim()) {
      onClose();
      return;
    }

    setIsSaving(true);
    try {
      const success = await onSaveNote(noteText.trim());
      if (success) {
        setNoteText("");
        onClose();
        toast({
          title: "Notes saved",
          description: "Your notes have been added to this inspection item.",
        });
      }
    } catch (error) {
      console.error('Error saving note:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSkip = () => {
    setNoteText("");
    onClose();
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent className="sm:max-w-lg">
        <AlertDialogHeader>
          <AlertDialogTitle>Add Notes</AlertDialogTitle>
          <AlertDialogDescription>
            You've successfully uploaded evidence for "{itemLabel}". 
            Would you like to add any notes or observations?
          </AlertDialogDescription>
        </AlertDialogHeader>
        
        <div className="py-4">
          <Textarea
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            placeholder="Add any observations, concerns, or additional details..."
            className="min-h-[100px] resize-none"
          />
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleSkip} disabled={isSaving}>
            Skip
          </AlertDialogCancel>
          <AlertDialogAction 
            onClick={handleSave} 
            disabled={isSaving}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isSaving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Saving...
              </>
            ) : (
              'Save Notes'
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
