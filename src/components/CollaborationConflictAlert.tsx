
import { useState, useEffect } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Users, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useInspectorCollaboration } from "@/hooks/useInspectorCollaboration";

interface CollaborationConflictAlertProps {
  inspectionId: string;
  checklistItemId?: string;
}

export const CollaborationConflictAlert = ({ 
  inspectionId, 
  checklistItemId 
}: CollaborationConflictAlertProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  // const { conflicts, resolveConflict } = useInspectorCollaboration(inspectionId); // DISABLED - missing table
  const conflicts = []; // Placeholder
  const resolveConflict = async () => null; // Placeholder

  const relevantConflicts = conflicts.filter(
    conflict => !checklistItemId || conflict.checklist_item_id === checklistItemId
  );

  if (relevantConflicts.length === 0) return null;

  const handleResolveConflict = async (conflictId: string, resolution: 'resolved' | 'escalated') => {
    await resolveConflict(conflictId, resolution);
  };

  return (
    <div className="space-y-3">
      {relevantConflicts.map((conflict) => (
        <Alert key={conflict.id} variant="destructive" className="border-orange-200 bg-orange-50">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle className="flex items-center gap-2">
            Collaboration Conflict Detected
            <Badge variant="outline" className="text-xs">
              {conflict.conflict_type.replace('_', ' ')}
            </Badge>
          </AlertTitle>
          <AlertDescription className="space-y-3">
            <p className="text-sm">
              Multiple inspectors are working on the same item simultaneously. 
              This may result in conflicting changes.
            </p>
            
            <div className="flex items-center gap-2 text-xs text-gray-600">
              <Clock className="w-3 h-3" />
              {new Date(conflict.created_at).toLocaleString()}
              <Users className="w-3 h-3 ml-2" />
              2 inspectors involved
            </div>

            {(conflict.inspector_1 === user?.id || conflict.inspector_2 === user?.id) && (
              <div className="flex gap-2 mt-3">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleResolveConflict(conflict.id, 'resolved')}
                >
                  Mark Resolved
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => handleResolveConflict(conflict.id, 'escalated')}
                >
                  Escalate
                </Button>
              </div>
            )}
          </AlertDescription>
        </Alert>
      ))}
    </div>
  );
};
