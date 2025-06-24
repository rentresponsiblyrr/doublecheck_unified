
import { useState } from "react";
import { useMobileInspectionFlow } from "@/hooks/useMobileInspectionFlow";

interface Inspection {
  id: string;
  property_id: string;
  completed: boolean;
  start_time: string | null;
}

export const usePropertySelection = (inspections: Inspection[]) => {
  const { startOrJoinInspection, isLoading: isCreatingInspection } = useMobileInspectionFlow();
  const [selectedProperty, setSelectedProperty] = useState<string | null>(null);

  const handleStartInspection = async () => {
    if (!selectedProperty) {
      console.warn('⚠️ No property selected for inspection');
      return;
    }

    console.log('🚀 Starting inspection for property:', selectedProperty);
    await startOrJoinInspection(selectedProperty);
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
    isCreatingInspection
  };
};
