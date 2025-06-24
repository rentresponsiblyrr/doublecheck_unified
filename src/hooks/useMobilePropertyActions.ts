
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
      // First delete related inspections and their data
      const { data: inspections, error: fetchError } = await supabase
        .from('inspections')
        .select('id')
        .eq('property_id', propertyId);

      if (fetchError) throw fetchError;

      if (inspections && inspections.length > 0) {
        const inspectionIds = inspections.map(i => i.id);
        
        // Delete checklist items
        const { error: checklistError } = await supabase
          .from('checklist_items')
          .delete()
          .in('inspection_id', inspectionIds);
        
        if (checklistError) console.warn('⚠️ Checklist deletion warning:', checklistError);
        
        // Delete inspections
        const { error: inspectionError } = await supabase
          .from('inspections')
          .delete()
          .eq('property_id', propertyId);
        
        if (inspectionError) throw inspectionError;
      }

      // Finally delete the property
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

  return {
    handleEdit,
    handleDelete
  };
};
