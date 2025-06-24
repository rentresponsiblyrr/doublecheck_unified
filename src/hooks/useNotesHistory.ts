
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

export interface NotesHistoryEntry {
  text: string;
  user_id: string;
  user_name: string;
  timestamp: string;
}

export const useNotesHistory = (itemId: string) => {
  const [notesHistory, setNotesHistory] = useState<NotesHistoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

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

        // Properly validate and cast the JSON data
        let history: NotesHistoryEntry[] = [];
        if (data.notes_history && Array.isArray(data.notes_history)) {
          history = data.notes_history.filter(entry => 
            entry && 
            typeof entry === 'object' && 
            'text' in entry && 
            'user_id' in entry && 
            'user_name' in entry && 
            'timestamp' in entry
          ) as NotesHistoryEntry[];
        }
        setNotesHistory(history);
      } catch (error) {
        console.error('Failed to load notes history:', error);
      } finally {
        setIsLoading(false);
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
          // Properly validate and cast the payload data
          let newHistory: NotesHistoryEntry[] = [];
          if (payload.new.notes_history && Array.isArray(payload.new.notes_history)) {
            newHistory = payload.new.notes_history.filter(entry => 
              entry && 
              typeof entry === 'object' && 
              'text' in entry && 
              'user_id' in entry && 
              'user_name' in entry && 
              'timestamp' in entry
            ) as NotesHistoryEntry[];
          }
          setNotesHistory(newHistory);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [itemId]);

  const saveNote = async (noteText: string) => {
    if (!user || !noteText.trim()) {
      if (!noteText.trim()) {
        toast({
          title: "No notes to save",
          description: "Please enter some notes before saving.",
          variant: "destructive",
        });
      }
      return false;
    }

    try {
      const userName = user.user_metadata?.name || user.email?.split('@')[0] || 'Unknown Inspector';
      
      const { error } = await supabase.rpc('append_user_note', {
        item_id: itemId,
        note_text: noteText.trim(),
        user_id: user.id,
        user_name: userName
      });

      if (error) throw error;

      toast({
        title: "Notes saved",
        description: "Your notes have been saved and shared with the team.",
      });
      return true;
    } catch (error) {
      console.error('Notes save error:', error);
      toast({
        title: "Save failed",
        description: "Failed to save notes. Please try again.",
        variant: "destructive",
      });
      return false;
    }
  };

  return {
    notesHistory,
    isLoading,
    saveNote,
    user
  };
};
