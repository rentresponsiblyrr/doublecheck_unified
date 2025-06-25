
import { useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

export const useInspectorPresence = (inspectionId: string) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const retryTimeoutRef = useRef<NodeJS.Timeout>();
  const isUpdatingRef = useRef(false);
  const isMountedRef = useRef(true);

  const updatePresence = useCallback(async (
    status: 'online' | 'offline' | 'viewing' | 'working',
    currentItemId?: string,
    metadata?: Record<string, any>
  ) => {
    if (!user || !inspectionId || isUpdatingRef.current || !isMountedRef.current) return;

    isUpdatingRef.current = true;

    try {
      const { error } = await supabase.rpc('update_inspector_presence', {
        p_inspection_id: inspectionId,
        p_status: status,
        p_current_item_id: currentItemId || null,
        p_metadata: metadata ? JSON.stringify(metadata) : '{}'
      });

      if (error) {
        console.error('Failed to update presence:', error);
        
        // Only show toast for critical errors, not for routine connection issues
        if (error.code !== 'PGRST301' && !error.message.includes('infinite recursion')) {
          toast({
            title: "Presence Update Failed",
            description: "Failed to update your presence status.",
            variant: "destructive",
          });
        }
        
        // Retry after a delay for certain types of errors
        if (retryTimeoutRef.current) clearTimeout(retryTimeoutRef.current);
        if (isMountedRef.current) {
          retryTimeoutRef.current = setTimeout(() => {
            if (isMountedRef.current) {
              updatePresence(status, currentItemId, metadata);
            }
          }, 3000);
        }
        
        throw error;
      }

      // Clear any pending retries on success
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
        retryTimeoutRef.current = undefined;
      }

    } catch (error) {
      console.error('Error updating inspector presence:', error);
      // Don't throw here to prevent cascading errors
    } finally {
      isUpdatingRef.current = false;
    }
  }, [user, inspectionId, toast]);

  // Update presence on mount and when user becomes active
  useEffect(() => {
    if (!user || !inspectionId) return;

    let heartbeatInterval: NodeJS.Timeout;
    isMountedRef.current = true;

    // Set initial presence with error handling
    const setInitialPresence = async () => {
      if (!isMountedRef.current) return;
      
      try {
        await updatePresence('online');
      } catch (error) {
        console.error('Failed to set initial presence:', error);
      }
    };

    setInitialPresence();

    // Update presence on visibility change
    const handleVisibilityChange = () => {
      if (!isMountedRef.current) return;
      
      try {
        updatePresence(document.hidden ? 'offline' : 'online');
      } catch (error) {
        console.error('Failed to update presence on visibility change:', error);
      }
    };

    // Update presence on beforeunload
    const handleBeforeUnload = () => {
      if (!isMountedRef.current) return;
      
      try {
        // Use sendBeacon for more reliable cleanup on page unload
        const presenceData = {
          inspection_id: inspectionId,
          status: 'offline',
          inspector_id: user.id
        };
        
        if (navigator.sendBeacon) {
          navigator.sendBeacon('/api/presence-cleanup', JSON.stringify(presenceData));
        } else {
          updatePresence('offline');
        }
      } catch (error) {
        console.error('Failed to update presence on beforeunload:', error);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);

    // Heartbeat to keep presence alive (reduced frequency to avoid excessive calls)
    heartbeatInterval = setInterval(() => {
      if (!document.hidden && isMountedRef.current) {
        updatePresence('online');
      }
    }, 45000); // Increased to 45 seconds

    return () => {
      isMountedRef.current = false;
      
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      
      if (heartbeatInterval) clearInterval(heartbeatInterval);
      if (retryTimeoutRef.current) clearTimeout(retryTimeoutRef.current);
      
      // Mark as offline on cleanup (but don't block component unmounting)
      updatePresence('offline').catch(console.error);
    };
  }, [user, inspectionId, updatePresence]);

  return { updatePresence };
};
