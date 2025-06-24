
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export const useMobilePropertyActions = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

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

  // Simplified handler that just triggers property selection
  const handleStartInspection = async (propertyId: string) => {
    console.log('📱 Mobile property card inspection trigger for:', propertyId);
    
    // This will be handled by the parent component's property selection logic
    // We return the propertyId to let the parent handle the actual inspection creation
    return propertyId;
  };

  return {
    handleEdit,
    handleDelete,
    handleStartInspection,
    isCreatingInspection: false // No longer managing creation state here
  };
};
