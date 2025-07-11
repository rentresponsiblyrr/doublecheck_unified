
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import type { Tables } from "@/integrations/supabase/types";

type InspectorPresence = Tables<'inspector_presence'> & {
  metadata: Record<string, any>;
};

type CollaborationConflict = Tables<'collaboration_conflicts'> & {
  inspector_1_action: Record<string, any>;
  inspector_2_action: Record<string, any>;
};

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

      if (error) {
        // If table doesn't exist, just set empty array and don't retry
        if (error.code === '42P01' || error.message.includes('relation') || error.message.includes('does not exist')) {
          console.warn('Inspector presence table not available, collaboration features disabled');
          setActiveInspectors([]);
          return;
        }
        throw error;
      }

      // Transform the data to ensure metadata is properly typed
      const transformedData: InspectorPresence[] = (data || []).map(item => ({
        ...item,
        metadata: (item.metadata as Record<string, any>) || {}
      }));

      setActiveInspectors(transformedData);
    } catch (error) {
      console.error('Error fetching active inspectors:', error);
      // Don't set empty array here to avoid clearing valid data on temporary errors
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

      if (error) {
        // If table doesn't exist, just set empty array and don't retry
        if (error.code === '42P01' || error.message.includes('relation') || error.message.includes('does not exist')) {
          console.warn('Collaboration conflicts table not available, conflict features disabled');
          setConflicts([]);
          return;
        }
        throw error;
      }

      // Transform the data to ensure actions are properly typed
      const transformedData: CollaborationConflict[] = (data || []).map(item => ({
        ...item,
        inspector_1_action: (item.inspector_1_action as Record<string, any>) || {},
        inspector_2_action: (item.inspector_2_action as Record<string, any>) || {}
      }));

      setConflicts(transformedData);
    } catch (error) {
      console.error('Error fetching conflicts:', error);
      // Don't set empty array here to avoid clearing valid data on temporary errors
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
