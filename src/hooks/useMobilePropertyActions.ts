
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export const useMobilePropertyActions = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isCreatingInspection, setIsCreatingInspection] = useState(false);

  const handleEdit = (propertyId: string) => {
    console.log('📱 Mobile edit property:', propertyId);
    navigate(`/add-property?edit=${propertyId}`);
  };

  const handleDelete = async (propertyId: string, propertyName: string) => {
    console.log('📱 Mobile delete property:', propertyId);
    
    try {
      const { error } = await supabase
        .from('properties')
        .delete()
        .eq('id', propertyId);

      if (error) throw error;

      toast({
        title: "Property Deleted",
        description: `${propertyName} has been deleted successfully.`,
      });
    } catch (error) {
      console.error('❌ Mobile delete error:', error);
      toast({
        title: "Delete Failed",
        description: "Failed to delete property. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleStartInspection = async (propertyId: string) => {
    console.log('📱 Mobile start inspection:', propertyId);
    
    if (isCreatingInspection) return;
    
    setIsCreatingInspection(true);
    
    try {
      const { data, error } = await supabase
        .from('inspections')
        .insert({
          property_id: propertyId,
          start_time: new Date().toISOString(),
          completed: false
        })
        .select()
        .single();

      if (error) throw error;

      console.log('✅ Mobile inspection created:', data.id);
      navigate(`/inspection/${data.id}`);
    } catch (error) {
      console.error('❌ Mobile inspection creation error:', error);
      toast({
        title: "Inspection Failed",
        description: "Failed to start inspection. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsCreatingInspection(false);
    }
  };

  return {
    handleEdit,
    handleDelete,
    handleStartInspection,
    isCreatingInspection
  };
};
