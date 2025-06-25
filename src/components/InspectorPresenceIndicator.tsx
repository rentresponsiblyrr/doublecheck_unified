import { useState, useEffect, useRef } from "react";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Users, Eye, Wrench, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useChannelManager } from "@/hooks/useChannelManager";
import type { Tables } from "@/integrations/supabase/types";

type InspectorPresence = Tables<'inspector_presence'> & {
  metadata: Record<string, any>;
};

interface InspectorPresenceIndicatorProps {
  inspectionId: string;
  currentItemId?: string;
}

export const InspectorPresenceIndicator = ({ 
  inspectionId, 
  currentItemId 
}: InspectorPresenceIndicatorProps) => {
  const [presenceData, setPresenceData] = useState<InspectorPresence[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { createChannel, subscribeChannel, cleanupChannel } = useChannelManager();
  const isMountedRef = useRef(true);
  const retryTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (!inspectionId) {
      setIsLoading(false);
      return;
    }

    isMountedRef.current = true;

    const fetchPresence = async () => {
      if (!isMountedRef.current) return;
      
      try {
        setError(null);
        
        const { data, error } = await supabase
          .from('inspector_presence')
          .select('*')
          .eq('inspection_id', inspectionId)
          .neq('status', 'offline')
          .gte('last_seen', new Date(Date.now() - 5 * 60 * 1000).toISOString());

        if (error) {
          console.error('Error fetching presence:', error);
          setError(error.message);
          
          // Retry after 5 seconds if there's an error
          if (isMountedRef.current) {
            retryTimeoutRef.current = setTimeout(() => {
              if (isMountedRef.current) fetchPresence();
            }, 5000);
          }
          return;
        }
        
        // Transform the data to ensure metadata is properly typed
        const transformedData: InspectorPresence[] = (data || []).map(item => ({
          ...item,
          metadata: (item.metadata as Record<string, any>) || {}
        }));
        
        if (isMountedRef.current) {
          setPresenceData(transformedData);
          setIsLoading(false);
        }
      } catch (fetchError) {
        console.error('Error fetching presence:', fetchError);
        if (isMountedRef.current) {
          setError('Failed to load presence data');
          setIsLoading(false);
          
          // Retry after 5 seconds
          retryTimeoutRef.current = setTimeout(() => {
            if (isMountedRef.current) fetchPresence();
          }, 5000);
        }
      }
    };

    const setupRealtimeSubscription = () => {
      try {
        // Create unique channel name
        const channelName = `presence-indicator-${inspectionId}`;
        console.log('Setting up presence channel:', channelName);
        
        const channel = createChannel(channelName, {
          presenceChanges: {
            filter: {
              event: '*',
              schema: 'public',
              table: 'inspector_presence',
              filter: `inspection_id=eq.${inspectionId}`
            },
            callback: (payload: any) => {
              console.log('Presence update received:', payload);
              if (isMountedRef.current) {
                fetchPresence();
              }
            }
          }
        });

        // Subscribe to the channel
        subscribeChannel(channelName, (status: string) => {
          console.log('Presence subscription status:', status);
          if (status === 'SUBSCRIBED' && isMountedRef.current) {
            fetchPresence();
          } else if (status === 'CHANNEL_ERROR') {
            console.error('Channel subscription error');
          }
        });

      } catch (subscriptionError) {
        console.error('Error setting up presence subscription:', subscriptionError);
        // Fall back to periodic polling if realtime fails
        if (isMountedRef.current) {
          const pollInterval = setInterval(() => {
            if (isMountedRef.current) fetchPresence();
          }, 30000);
          
          return () => {
            clearInterval(pollInterval);
          };
        }
      }
    };

    // Initial fetch
    fetchPresence();
    
    // Setup realtime subscription
    const cleanup = setupRealtimeSubscription();

    return () => {
      isMountedRef.current = false;
      
      if (retryTimeoutRef.current) clearTimeout(retryTimeoutRef.current);
      
      // Clean up channel
      const channelName = `presence-indicator-${inspectionId}`;
      cleanupChannel(channelName);
      
      if (cleanup) cleanup();
    };
  }, [inspectionId, createChannel, subscribeChannel, cleanupChannel]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'viewing':
        return <Eye className="w-3 h-3" />;
      case 'working':
        return <Wrench className="w-3 h-3" />;
      default:
        return <Users className="w-3 h-3" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online':
        return 'bg-green-500';
      case 'viewing':
        return 'bg-blue-500';
      case 'working':
        return 'bg-orange-500';
      default:
        return 'bg-gray-500';
    }
  };

  // Show error state
  if (error && !isLoading) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger>
            <Badge variant="outline" className="flex items-center gap-1 text-red-600 border-red-200">
              <AlertCircle className="w-3 h-3" />
              Connection issue
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <p>Unable to load presence data: {error}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // Show loading state
  if (isLoading) {
    return (
      <Badge variant="outline" className="flex items-center gap-1 animate-pulse">
        <Users className="w-3 h-3" />
        Loading...
      </Badge>
    );
  }

  const activeInspectorsOnItem = presenceData.filter(
    p => p.current_item_id === currentItemId && currentItemId
  );

  const totalActiveInspectors = presenceData.length;

  if (totalActiveInspectors === 0) return null;

  return (
    <TooltipProvider>
      <div className="flex items-center gap-2">
        <Tooltip>
          <TooltipTrigger>
            <Badge variant="outline" className="flex items-center gap-1">
              <Users className="w-3 h-3" />
              {totalActiveInspectors} active
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <p>{totalActiveInspectors} inspector(s) currently working on this inspection</p>
          </TooltipContent>
        </Tooltip>

        {activeInspectorsOnItem.length > 0 && (
          <Tooltip>
            <TooltipTrigger>
              <Badge className={`flex items-center gap-1 ${getStatusColor(activeInspectorsOnItem[0].status)}`}>
                {getStatusIcon(activeInspectorsOnItem[0].status)}
                {activeInspectorsOnItem.length}
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <p>{activeInspectorsOnItem.length} inspector(s) working on this item</p>
            </TooltipContent>
          </Tooltip>
        )}
      </div>
    </TooltipProvider>
  );
};
