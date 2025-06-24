
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { MobileInspectionService } from "@/services/mobileInspectionService";

export const useMobileInspectionFlow = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  const startOrJoinInspection = async (propertyId: string) => {
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

    setIsLoading(true);
    setError(null);

    try {
      console.log('🚀 Starting mobile inspection flow for property:', propertyId);
      
      const result = await MobileInspectionService.getOrCreateInspection(propertyId);
      
      const actionText = result.isNew ? 'created' : 'joined';
      const toastTitle = result.isNew ? 'Inspection Created' : 'Joining Inspection';
      const toastDescription = result.isNew 
        ? 'New inspection created successfully'
        : 'Joining inspection in progress';

      console.log(`✅ Successfully ${actionText} inspection:`, result.inspectionId);
      
      toast({
        title: toastTitle,
        description: toastDescription,
      });

      // Navigate with correct route parameter
      const navigationPath = `/inspection/${result.inspectionId}`;
      console.log('🧭 Mobile navigation to:', navigationPath);
      
      navigate(navigationPath, { replace: true });
      
      return result.inspectionId;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to start inspection';
      console.error('💥 Mobile inspection flow error:', error);
      
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
  };

  const clearError = () => setError(null);

  return {
    startOrJoinInspection,
    isLoading,
    error,
    clearError
  };
};
