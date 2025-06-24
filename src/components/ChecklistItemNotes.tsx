
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { User, Clock } from "lucide-react";

interface NotesHistoryEntry {
  text: string;
  user_id: string;
  user_name: string;
  timestamp: string;
}

interface ChecklistItemNotesProps {
  itemId: string;
  initialNotes: string;
}

export const ChecklistItemNotes = ({ itemId, initialNotes }: ChecklistItemNotesProps) => {
  const [notes, setNotes] = useState(initialNotes || "");
  const [notesHistory, setNotesHistory] = useState<NotesHistoryEntry[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();

  // Load notes history on component mount
  useEffect(() => {
    const loadNotesHistory = async () => {
      try {
        const { data, error } = await supabase
          .from('checklist_items')
          .select('notes_history')
          .eq('id', itemId)
          .single();

        if (error) throw error;

        // Properly cast and validate the JSON data
        const history = Array.isArray(data.notes_history) 
          ? data.notes_history as NotesHistoryEntry[] 
          : [];
        setNotesHistory(history);
      } catch (error) {
        console.error('Failed to load notes history:', error);
      } finally {
        setIsLoadingHistory(false);
      }
    };

    loadNotesHistory();
  }, [itemId]);

  // Real-time subscription for notes updates
  useEffect(() => {
    const channel = supabase
      .channel(`checklist-item-${itemId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'checklist_items',
          filter: `id=eq.${itemId}`
        },
        (payload) => {
          // Properly cast and validate the payload data
          const newHistory = Array.isArray(payload.new.notes_history) 
            ? payload.new.notes_history as NotesHistoryEntry[] 
            : [];
          setNotesHistory(newHistory);
          
          // Update current notes if it's different from what we have
          if (payload.new.notes !== notes) {
            setNotes(payload.new.notes || "");
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [itemId, notes]);

  const handleSaveNotes = async () => {
    if (!user || !notes.trim()) {
      if (!notes.trim()) {
        toast({
          title: "No notes to save",
          description: "Please enter some notes before saving.",
          variant: "destructive",
        });
      }
      return;
    }

    setIsSaving(true);
    try {
      const userName = user.user_metadata?.name || user.email?.split('@')[0] || 'Unknown Inspector';
      
      const { error } = await supabase.rpc('append_user_note', {
        item_id: itemId,
        note_text: notes.trim(),
        user_id: user.id,
        user_name: userName
      });

      if (error) throw error;

      toast({
        title: "Notes saved",
        description: "Your notes have been saved and shared with the team.",
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

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString() + ' at ' + date.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <div className="space-y-4">
      {/* Notes History */}
      {notesHistory.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
            <User className="w-4 h-4" />
            <span>Inspector Notes ({notesHistory.length})</span>
          </div>
          
          {isLoadingHistory ? (
            <div className="animate-pulse">
              <div className="h-16 bg-gray-100 rounded-lg"></div>
            </div>
          ) : (
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {notesHistory.map((entry, index) => (
                <div key={index} className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-blue-700">
                      {entry.user_name}
                    </span>
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <Clock className="w-3 h-3" />
                      <span>{formatTimestamp(entry.timestamp)}</span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-700">{entry.text}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Add New Notes */}
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
    </div>
  );
};
