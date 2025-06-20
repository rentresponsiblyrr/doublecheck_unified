
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { deletePropertyData } from "@/utils/propertyDeletion";
import { useSmartCache } from "@/hooks/useSmartCache";

export const usePropertyActions = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { invalidatePropertyData } = useSmartCache();

  const handleEdit = (propertyId: string) => {
    console.log('🔧 Editing property:', propertyId);
    navigate(`/add-property?edit=${propertyId}`);
  };

  const handleDelete = async (propertyId: string) => {
    try {
      await deletePropertyData(propertyId);
      
      toast({
        title: "Property Deleted",
        description: "The property and all associated data have been permanently removed.",
      });

      // Invalidate cache to refresh the UI
      invalidatePropertyData();
      
    } catch (error) {
      console.error('💥 Comprehensive deletion failed:', error);
      toast({
        title: "Deletion Failed",
        description: `Failed to delete property: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      });
    }
  };

  const handleStartInspection = (propertyId: string) => {
    console.log('🚀 Starting inspection for property:', propertyId);
    navigate(`/property-selection?propertyId=${propertyId}`);
  };

  return {
    handleEdit,
    handleDelete,
    handleStartInspection
  };
};
