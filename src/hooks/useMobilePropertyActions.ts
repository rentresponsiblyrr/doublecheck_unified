
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useMobileInspectionFlow } from "@/hooks/useMobileInspectionFlow";
import { deletePropertyData } from "@/utils/propertyDeletion";

export const useMobilePropertyActions = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { startOrJoinInspection } = useMobileInspectionFlow();

  const handleEdit = (propertyId: string) => {
    navigate(`/add-property?edit=${propertyId}`);
  };

  const handleDelete = async (propertyId: string, propertyName: string) => {
    
    try {
      // Use comprehensive deletion utility to handle all cascades properly
      await deletePropertyData(propertyId);

      toast({
        title: "Property Deleted",
        description: `${propertyName} has been deleted successfully.`,
      });
    } catch (error) {
      
      // Handle specific error messages from the deletion utility
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete property. Please try again.';
      
      toast({
        title: "Delete Failed",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const handleStartInspection = async (propertyId: string) => {
    await startOrJoinInspection(propertyId);
  };

  return {
    handleEdit,
    handleDelete,
    handleStartInspection
  };
};
