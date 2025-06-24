
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface InspectorPresence {
  id: string;
  inspection_id: string;
  inspector_id: string;
  status: string;
  last_seen: string;
  current_item_id: string | null;
  metadata: Record<string, any>;
  created_at: string;
}

interface CollaborationConflict {
  id: string;
  inspection_id: string;
  checklist_item_id: string | null;
  conflict_type: string;
  inspector_1: string;
  inspector_2: string;
  inspector_1_action: Record<string, any>;
  inspector_2_action: Record<string, any>;
  resolution_status: 'pending' | 'resolved' | 'escalated';
  resolved_by: string | null;
  resolved_at: string | null;
  resolution_notes: string | null;
  created_at: string;
  updated_at: string;
}

export const useInspectorCollaboration = (inspectionId: string) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeInspectors, setActiveInspectors] = useState<InspectorPresence[]>([]);
  const [conflicts, setConflicts] = useState<CollaborationConflict[]>([]);

  // Subscribe to inspector presence updates
  useEffect(() => {
    if (!inspectionId) return;

    const presenceChannel = supabase
      .channel(`inspector-presence-${inspectionId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'inspector_presence',
          filter: `inspection_id=eq.${inspectionId}`
        },
        (payload) => {
          console.log('Presence update:', payload);
          fetchActiveInspectors();
        }
      )
      .subscribe();

    // Subscribe to collaboration conflicts
    const conflictsChannel = supabase
      .channel(`conflicts-${inspectionId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'collaboration_conflicts',
          filter: `inspection_id=eq.${inspectionId}`
        },
        (payload) => {
          console.log('Conflict update:', payload);
          fetchConflicts();
        }
      )
      .subscribe();

    // Initial data fetch
    fetchActiveInspectors();
    fetchConflicts();

    return () => {
      supabase.removeChannel(presenceChannel);
      supabase.removeChannel(conflictsChannel);
    };
  }, [inspectionId]);

  const fetchActiveInspectors = useCallback(async () => {
    if (!inspectionId) return;

    try {
      const { data, error } = await supabase
        .from('inspector_presence')
        .select('*')
        .eq('inspection_id', inspectionId)
        .neq('status', 'offline')
        .gte('last_seen', new Date(Date.now() - 5 * 60 * 1000).toISOString()); // Active in last 5 minutes

      if (error) throw error;

      setActiveInspectors(data || []);
    } catch (error) {
      console.error('Error fetching active inspectors:', error);
    }
  }, [inspectionId]);

  const fetchConflicts = useCallback(async () => {
    if (!inspectionId) return;

    try {
      const { data, error } = await supabase
        .from('collaboration_conflicts')
        .select('*')
        .eq('inspection_id', inspectionId)
        .eq('resolution_status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setConflicts(data || []);
    } catch (error) {
      console.error('Error fetching conflicts:', error);
    }
  }, [inspectionId]);

  const assignChecklistItem = useCallback(async (itemId: string) => {
    if (!user) return;

    try {
      const { data, error } = await supabase.rpc('assign_checklist_item', {
        p_item_id: itemId,
        p_inspector_id: user.id
      });

      if (error) throw error;

      toast({
        title: "Item Assigned",
        description: "You've been assigned to this checklist item.",
      });

      return data;
    } catch (error) {
      console.error('Error assigning checklist item:', error);
      toast({
        title: "Assignment Failed",
        description: "Failed to assign item. It may already be assigned to another inspector.",
        variant: "destructive",
      });
      return null;
    }
  }, [user, toast]);

  const resolveConflict = useCallback(async (
    conflictId: string,
    resolution: 'resolved' | 'escalated',
    notes?: string
  ) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('collaboration_conflicts')
        .update({
          resolution_status: resolution,
          resolved_by: user.id,
          resolved_at: new Date().toISOString(),
          resolution_notes: notes || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', conflictId);

      if (error) throw error;

      toast({
        title: "Conflict Resolved",
        description: `Conflict has been ${resolution}.`,
      });

      fetchConflicts();
    } catch (error) {
      console.error('Error resolving conflict:', error);
      toast({
        title: "Resolution Failed",
        description: "Failed to resolve conflict. Please try again.",
        variant: "destructive",
      });
    }
  }, [user, toast, fetchConflicts]);

  return {
    activeInspectors,
    conflicts,
    assignChecklistItem,
    resolveConflict,
    fetchActiveInspectors,
    fetchConflicts
  };
};
