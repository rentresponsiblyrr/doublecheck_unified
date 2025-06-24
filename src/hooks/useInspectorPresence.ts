import { useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

export const useInspectorPresence = (inspectionId: string) => {
  const { user } = useAuth();
  const { toast } = useToast();

  const updatePresence = useCallback(async (
    status: 'online' | 'offline' | 'viewing' | 'working',
    currentItemId?: string,
    metadata?: Record<string, any>
  ) => {
    if (!user || !inspectionId) return;

    try {
      const { error } = await supabase.rpc('update_inspector_presence', {
        p_inspection_id: inspectionId,
        p_status: status,
        p_current_item_id: currentItemId || null,
        p_metadata: metadata ? JSON.stringify(metadata) : '{}'
      });

      if (error) {
        console.error('Failed to update presence:', error);
        throw error;
      }
    } catch (error) {
      console.error('Error updating inspector presence:', error);
      toast({
        title: "Presence Update Failed",
        description: "Failed to update your presence status.",
        variant: "destructive",
      });
    }
  }, [user, inspectionId, toast]);

  // Update presence on mount and when user becomes active
  useEffect(() => {
    if (!user || !inspectionId) return;

    // Set initial presence
    updatePresence('online');

    // Update presence on visibility change
    const handleVisibilityChange = () => {
      updatePresence(document.hidden ? 'offline' : 'online');
    };

    // Update presence on beforeunload
    const handleBeforeUnload = () => {
      updatePresence('offline');
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);

    // Heartbeat to keep presence alive
    const heartbeat = setInterval(() => {
      if (!document.hidden) {
        updatePresence('online');
      }
    }, 30000); // Update every 30 seconds

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      clearInterval(heartbeat);
      // Mark as offline on cleanup
      updatePresence('offline');
    };
  }, [user, inspectionId, updatePresence]);

  return { updatePresence };
};
