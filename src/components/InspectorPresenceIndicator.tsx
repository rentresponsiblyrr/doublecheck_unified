
import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Users, Eye, Wrench } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface InspectorPresence {
  id: string;
  inspector_id: string;
  status: string;
  last_seen: string;
  current_item_id: string | null;
  metadata: Record<string, any>;
}

interface InspectorPresenceIndicatorProps {
  inspectionId: string;
  currentItemId?: string;
}

export const InspectorPresenceIndicator = ({ 
  inspectionId, 
  currentItemId 
}: InspectorPresenceIndicatorProps) => {
  const [presenceData, setPresenceData] = useState<InspectorPresence[]>([]);

  useEffect(() => {
    if (!inspectionId) return;

    const fetchPresence = async () => {
      try {
        const { data, error } = await supabase
          .from('inspector_presence')
          .select('*')
          .eq('inspection_id', inspectionId)
          .neq('status', 'offline')
          .gte('last_seen', new Date(Date.now() - 5 * 60 * 1000).toISOString());

        if (error) throw error;
        setPresenceData(data || []);
      } catch (error) {
        console.error('Error fetching presence:', error);
      }
    };

    fetchPresence();

    // Subscribe to real-time updates
    const channel = supabase
      .channel(`presence-indicator-${inspectionId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'inspector_presence',
          filter: `inspection_id=eq.${inspectionId}`
        },
        () => {
          fetchPresence();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [inspectionId]);

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
