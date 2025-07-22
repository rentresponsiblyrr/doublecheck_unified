
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { InspectionCreationService } from "@/services/inspectionCreationService";

export const useRobustInspectionCreation = () => {
  const [isCreating, setIsCreating] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const inspectionService = new InspectionCreationService();

  const createInspection = async (propertyId: string) => {
    if (isCreating) {
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
    
    logger.info('Starting inspection creation', {
      propertyId, 
      type: typeof propertyId, 
      isUUID: /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(propertyId) 
    });

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
