
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

interface Inspection {
  id: string;
  property_id: string;
  completed: boolean;
  start_time: string | null;
}

export const usePropertySelection = (inspections: Inspection[]) => {
  const navigate = useNavigate();
  const [selectedProperty, setSelectedProperty] = useState<string | null>(null);

  const handleStartInspection = async () => {
    if (!selectedProperty) return;

    try {
      console.log('Creating new inspection for property:', selectedProperty);
      
      const { data: inspection, error } = await supabase
        .from('inspections')
        .insert({
          property_id: selectedProperty,
          start_time: new Date().toISOString(),
          completed: false
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating inspection:', error);
        throw error;
      }

      console.log('Created inspection:', inspection);
      navigate(`/inspection/${inspection.id}`);
    } catch (error) {
      console.error('Failed to start inspection:', error);
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
    getPropertyStatus
  };
};
