
import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { RobustMobileInspectionService } from "@/services/robustMobileInspectionService";

export const useRobustMobileInspectionFlow = () => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  const startOrJoinInspection = useCallback(async (propertyId: string) => {
    if (!propertyId) {
      const errorMsg = 'No property ID provided';
      console.error('❌', errorMsg);
      setError(errorMsg);
      toast({
        title: "Invalid Property",
        description: errorMsg,
        variant: "destructive",
      });
      return null;
    }

    if (isLoading) {
      console.warn('⚠️ Inspection flow already in progress');
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log('🚀 Starting robust mobile inspection flow for property:', propertyId);
      
      const result = await RobustMobileInspectionService.getOrCreateInspectionRobust(propertyId);
      
      // Assign inspector if this is a new inspection or unassigned
      if (result.isNew) {
        await RobustMobileInspectionService.assignInspectorToInspection(result.inspectionId);
      }
      
      const actionText = result.isNew ? 'created' : 'joined';
      const toastTitle = result.isNew ? 'Inspection Created' : 'Joining Inspection';
      const toastDescription = result.isNew 
        ? `New inspection created with ${result.checklistItemsCount} checklist items`
        : `Joining inspection with ${result.checklistItemsCount} checklist items`;

      console.log(`✅ Successfully ${actionText} inspection:`, result.inspectionId);
      
      toast({
        title: toastTitle,
        description: toastDescription,
      });

      // Navigate to inspection page
      const navigationPath = `/inspection/${result.inspectionId}`;
      console.log('🧭 Mobile navigation to:', navigationPath);
      
      navigate(navigationPath, { replace: true });
      
      return result.inspectionId;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to start inspection';
      console.error('💥 Robust mobile inspection flow error:', error);
      
      setError(errorMessage);
      toast({
        title: "Inspection Failed",
        description: errorMessage,
        variant: "destructive",
      });
      
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, navigate, toast]);

  const clearError = useCallback(() => setError(null), []);

  return {
    startOrJoinInspection,
    isLoading,
    error,
    clearError
  };
};
