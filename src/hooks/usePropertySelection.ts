
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Inspection {
  id: string;
  property_id: string;
  completed: boolean;
  start_time: string | null;
}

export const usePropertySelection = (inspections: Inspection[]) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [selectedProperty, setSelectedProperty] = useState<string | null>(null);
  const [isCreatingInspection, setIsCreatingInspection] = useState(false);

  const handleStartInspection = async () => {
    if (!selectedProperty) {
      console.warn('⚠️ No property selected for inspection');
      return;
    }

    setIsCreatingInspection(true);
    console.log('🚀 Starting inspection creation for property:', selectedProperty);

    try {
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
        console.error('❌ Error creating inspection:', error);
        toast({
          title: "Error",
          description: "Failed to create inspection. Please try again.",
          variant: "destructive",
        });
        throw error;
      }

      console.log('✅ Created inspection:', inspection.id);
      
      // Give a small delay to ensure the database trigger has time to run
      await new Promise(resolve => setTimeout(resolve, 500));
      
      toast({
        title: "Inspection Started",
        description: "Your inspection has been created successfully.",
      });
      
      console.log('🧭 Navigating to inspection:', inspection.id);
      navigate(`/inspection/${inspection.id}`);
    } catch (error) {
      console.error('💥 Failed to start inspection:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsCreatingInspection(false);
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
    isCreatingInspection
  };
};
