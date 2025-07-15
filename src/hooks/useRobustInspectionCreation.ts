
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/components/AuthProvider";
import { InspectionCreationService } from "@/services/inspectionCreationService";

export const useRobustInspectionCreation = () => {
  const [isCreating, setIsCreating] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const inspectionService = new InspectionCreationService();

  const createInspection = async (propertyId: string) => {
    if (isCreating) {
      console.warn('⚠️ Inspection creation already in progress, ignoring duplicate request');
      return null;
    }

    if (!user?.id) {
      toast({
        title: "Authentication required",
        description: "You must be logged in to create an inspection.",
        variant: "destructive",
      });
      return null;
    }

    setIsCreating(true);
    console.log('🚀 Starting robust inspection creation for property:', propertyId);

    try {
      // Check for existing active inspections first
      const existingInspectionId = await inspectionService.checkForExistingInspection(propertyId);
      
      if (existingInspectionId) {
        toast({
          title: "Resuming existing inspection",
          description: "Only one inspection per property is allowed. Continuing your existing inspection...",
        });
        return existingInspectionId;
      }

      // Create new inspection with current user as inspector
      const inspectionId = await inspectionService.createNewInspection(propertyId, user.id);

      toast({
        title: "Inspection created",
        description: "Ready to start the inspection process.",
      });

      return inspectionId;

    } catch (error) {
      console.error('💥 Inspection creation failed:', error);
      toast({
        title: "Failed to create inspection",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsCreating(false);
    }
  };

  return {
    createInspection,
    isCreating
  };
};
