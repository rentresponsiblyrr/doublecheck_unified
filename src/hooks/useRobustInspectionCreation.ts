
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { InspectionCreationService } from "@/services/inspectionCreationService";

export const useRobustInspectionCreation = () => {
  const [isCreating, setIsCreating] = useState(false);
  const { toast } = useToast();
  const inspectionService = new InspectionCreationService();

  const createInspection = async (propertyId: string) => {
    if (isCreating) {
      console.warn('⚠️ Inspection creation already in progress, ignoring duplicate request');
      return null;
    }

    setIsCreating(true);
    console.log('🚀 Starting robust inspection creation for property:', propertyId);

    try {
      // Check for existing active inspections first
      const existingInspectionId = await inspectionService.checkForExistingInspection(propertyId);
      
      if (existingInspectionId) {
        toast({
          title: "Active inspection found",
          description: "Redirecting to existing inspection...",
        });
        return existingInspectionId;
      }

      // Create new inspection
      const inspectionId = await inspectionService.createNewInspection(propertyId);

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
