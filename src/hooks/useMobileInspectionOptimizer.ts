
import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { MobileInspectionOptimizer } from "@/services/mobileInspectionOptimizer";

export const useMobileInspectionOptimizer = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  const startOrJoinInspection = useCallback(async (propertyId: string) => {
    if (!propertyId || isLoading) {
      console.warn('⚠️ Invalid property ID or operation already in progress');
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log('🚀 Starting optimized mobile inspection flow for:', propertyId);
      
      const result = await MobileInspectionOptimizer.getOrCreateInspectionOptimized(propertyId);
      
      // Assign inspector for new inspections
      if (result.isNew) {
        MobileInspectionOptimizer.assignInspectorOptimized(result.inspectionId);
      }
      
      const actionText = result.isNew ? 'created' : 'joined';
      const toastTitle = result.isNew ? 'Inspection Created' : 'Joining Inspection';
      const toastDescription = `${actionText} inspection for ${result.propertyName} with ${result.checklistItemsCount} items`;

      console.log(`✅ Successfully ${actionText} optimized inspection:`, result.inspectionId);
      
      toast({
        title: toastTitle,
        description: toastDescription,
      });

      // Navigate with optimized route
      navigate(`/inspection/${result.inspectionId}`, { replace: true });
      
      return result.inspectionId;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to start inspection';
      console.error('💥 Optimized mobile inspection flow error:', error);
      
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
