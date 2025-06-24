
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useRobustInspectionCreation } from "@/hooks/useRobustInspectionCreation";

interface Inspection {
  id: string;
  property_id: string;
  completed: boolean;
  start_time: string | null;
}

export const usePropertySelection = (inspections: Inspection[]) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { createInspection, isCreating } = useRobustInspectionCreation();
  const [selectedProperty, setSelectedProperty] = useState<string | null>(null);

  const handleStartInspection = async () => {
    if (!selectedProperty) {
      console.warn('⚠️ No property selected for inspection');
      return;
    }

    console.log('🚀 Starting inspection creation for property:', selectedProperty);

    try {
      const inspectionId = await createInspection(selectedProperty);
      
      if (inspectionId) {
        console.log('✅ Created inspection:', inspectionId);
        toast({
          title: "Inspection Started",
          description: "Your inspection has been created successfully.",
        });
        
        console.log('🧭 Navigating to inspection:', inspectionId);
        navigate(`/inspection/${inspectionId}`);
      }
    } catch (error) {
      console.error('💥 Failed to start inspection:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getPropertyStatus = (propertyId: string) => {
    const propertyInspections = inspections.filter(i => i.property_id === propertyId);
    const completedInspections = propertyInspections.filter(i => i.completed);
    const activeInspections = propertyInspections.filter(i => !i.completed);

    if (activeInspections.length > 0) {
      return { status: 'in-progress', color: 'bg-yellow-500', text: 'In Progress' };
    }
    if (completedInspections.length > 0) {
      return { status: 'completed', color: 'bg-green-500', text: 'Completed' };
    }
    return { status: 'pending', color: 'bg-gray-500', text: 'Not Started' };
  };

  return {
    selectedProperty,
    setSelectedProperty,
    handleStartInspection,
    getPropertyStatus,
    isCreatingInspection: isCreating
  };
};
