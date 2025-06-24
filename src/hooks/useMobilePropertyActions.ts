
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useRobustInspectionCreation } from "@/hooks/useRobustInspectionCreation";

export const useMobilePropertyActions = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { createInspection, isCreating } = useRobustInspectionCreation();

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
    console.log('📱 Mobile start inspection for property:', propertyId);
    
    if (isCreating) {
      console.warn('⚠️ Inspection creation already in progress');
      return;
    }
    
    try {
      const inspectionId = await createInspection(propertyId);
      
      if (inspectionId) {
        console.log('✅ Mobile inspection created successfully:', {
          inspectionId,
          propertyId,
          navigationPath: `/inspection/${inspectionId}`
        });
        
        try {
          navigate(`/inspection/${inspectionId}`);
        } catch (navigationError) {
          console.error('💥 Navigation error after mobile inspection creation:', navigationError);
          toast({
            title: "Navigation Error", 
            description: "Inspection created but failed to navigate. Please check your inspections list.",
            variant: "destructive",
          });
        }
      } else {
        console.error('❌ Failed to create mobile inspection - no ID returned');
        toast({
          title: "Creation Failed", 
          description: "Failed to create inspection. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('💥 Mobile inspection creation error:', error);
      toast({
        title: "Inspection Failed", 
        description: error instanceof Error ? error.message : "Failed to start inspection. Please try again.",
        variant: "destructive",
      });
    }
  };

  return {
    handleEdit,
    handleDelete,
    handleStartInspection,
    isCreatingInspection: isCreating
  };
};
