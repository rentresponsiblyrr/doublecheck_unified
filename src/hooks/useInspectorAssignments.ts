
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface InspectorAssignment {
  id: string;
  inspection_id: string;
  inspector_id: string;
  assigned_by: string | null;
  status: 'assigned' | 'active' | 'completed' | 'reassigned';
  assigned_at: string;
  started_at: string | null;
  completed_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export const useInspectorAssignments = (inspectionId: string) => {
  const { user } = useAuth();
  const { toast } = useToast();

  const { data: assignments = [], isLoading, refetch } = useQuery({
    queryKey: ['inspector-assignments', inspectionId],
    queryFn: async () => {
      if (!inspectionId) return [];

      const { data, error } = await supabase
        .from('inspector_assignments')
        .select('*')
        .eq('inspection_id', inspectionId)
        .order('assigned_at', { ascending: false });

      if (error) {
        console.error('Error fetching inspector assignments:', error);
        throw error;
      }

      return data as InspectorAssignment[];
    },
    enabled: !!inspectionId,
    refetchOnWindowFocus: false,
    staleTime: 30000,
  });

  const assignInspector = async (inspectorId: string, notes?: string) => {
    if (!user || !inspectionId) return;

    try {
      const { error } = await supabase
        .from('inspector_assignments')
        .insert({
          inspection_id: inspectionId,
          inspector_id: inspectorId,
          assigned_by: user.id,
          status: 'assigned',
          notes: notes || null
        });

      if (error) throw error;

      toast({
        title: "Inspector Assigned",
        description: "Inspector has been successfully assigned to this inspection.",
      });

      refetch();
    } catch (error) {
      console.error('Error assigning inspector:', error);
      toast({
        title: "Assignment Failed",
        description: "Failed to assign inspector. Please try again.",
        variant: "destructive",
      });
    }
  };

  const updateAssignmentStatus = async (
    assignmentId: string, 
    status: InspectorAssignment['status'],
    notes?: string
  ) => {
    try {
      const { error } = await supabase
        .from('inspector_assignments')
        .update({
          status,
          notes: notes || null,
          started_at: status === 'active' ? new Date().toISOString() : undefined,
          completed_at: status === 'completed' ? new Date().toISOString() : undefined,
          updated_at: new Date().toISOString()
        })
        .eq('id', assignmentId);

      if (error) throw error;

      toast({
        title: "Status Updated",
        description: `Assignment status updated to ${status}.`,
      });

      refetch();
    } catch (error) {
      console.error('Error updating assignment status:', error);
      toast({
        title: "Update Failed",
        description: "Failed to update assignment status.",
        variant: "destructive",
      });
    }
  };

  return {
    assignments,
    isLoading,
    assignInspector,
    updateAssignmentStatus,
    refetch
  };
};
