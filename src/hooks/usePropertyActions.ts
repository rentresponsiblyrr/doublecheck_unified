
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { deletePropertyData } from "@/utils/propertyDeletion";

interface Property {
  id: string;
  name: string;
  address: string;
  vrbo_url: string | null;
  airbnb_url: string | null;
  status: string | null;
}

export const usePropertyActions = (property: Property, onPropertyDeleted: () => void) => {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleEdit = () => {
    console.log('🔧 Editing property:', property.id);
    navigate(`/add-property?edit=${property.id}`);
  };

  const handleDelete = async () => {
    setIsDeleting(true);

    try {
      await deletePropertyData(property.id);
      
      toast({
        title: "Property Deleted",
        description: "The property and all associated data have been permanently removed.",
      });

      // Trigger UI refresh
      onPropertyDeleted();
      
    } catch (error) {
      console.error('💥 Comprehensive deletion failed:', error);
      toast({
        title: "Deletion Failed",
        description: `Failed to delete property: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  return {
    showDeleteDialog,
    setShowDeleteDialog,
    isDeleting,
    handleEdit,
    handleDelete
  };
};
