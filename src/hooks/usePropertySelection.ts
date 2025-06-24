
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

    console.log('🚀 Starting inspection for property:', selectedProperty);

    // Check if there's an active inspection for this property
    const activeInspection = inspections.find(
      i => i.property_id === selectedProperty && !i.completed
    );

    if (activeInspection) {
      // Join existing inspection
      console.log('🔄 Joining existing inspection:', activeInspection.id);
      toast({
        title: "Joining Inspection",
        description: "Joining inspection already in progress...",
      });
      
      console.log('🧭 Navigating to existing inspection:', activeInspection.id);
      navigate(`/inspection/${activeInspection.id}`);
      return;
    }

    // Create new inspection
    try {
      const inspectionId = await createInspection(selectedProperty);
      
      if (inspectionId) {
        console.log('✅ Created new inspection:', inspectionId);
        toast({
          title: "Inspection Started",
          description: "Your inspection has been created successfully.",
        });
        
        console.log('🧭 Navigating to new inspection:', inspectionId);
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
      return { 
        status: 'in-progress', 
        color: 'bg-yellow-500', 
        text: 'In Progress',
        activeInspectionId: activeInspections[0].id
      };
    }
    if (completedInspections.length > 0) {
      return { 
        status: 'completed', 
        color: 'bg-green-500', 
        text: 'Completed',
        activeInspectionId: null
      };
    }
    return { 
      status: 'pending', 
      color: 'bg-gray-500', 
      text: 'Not Started',
      activeInspectionId: null
    };
  };

  const getButtonText = (propertyId: string) => {
    const status = getPropertyStatus(propertyId);
    if (status.status === 'in-progress') {
      return 'Join Inspection';
    }
    return 'Start Inspection';
  };

  return {
    selectedProperty,
    setSelectedProperty,
    handleStartInspection,
    getPropertyStatus,
    getButtonText,
    isCreatingInspection: isCreating
  };
};
