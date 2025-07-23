import { useState } from "react";
import { PropertyActionsDropdown } from "@/components/PropertyActionsDropdown";
import { PropertyDeleteDialog } from "@/components/PropertyDeleteDialog";
import { usePropertyActions } from "@/hooks/usePropertyActions";

interface Property {
  id: string;
  name: string;
  address: string;
  vrbo_url: string | null;
  airbnb_url: string | null;
  status: string | null;
}

interface PropertyActionsProps {
  property: Property;
  onPropertyDeleted: () => void;
}

export const PropertyActions = ({
  property,
  onPropertyDeleted,
}: PropertyActionsProps) => {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { handleEdit, handleDelete } = usePropertyActions();

  const handleEditClick = () => {
    handleEdit(property.id);
  };

  const handleDeleteClick = async () => {
    setIsDeleting(true);
    try {
      await handleDelete(property.id);
      onPropertyDeleted();
    } catch (error) {
      // Error is already handled in the hook
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  return (
    <>
      <PropertyActionsDropdown
        onEdit={handleEditClick}
        onDelete={() => setShowDeleteDialog(true)}
      />

      <PropertyDeleteDialog
        property={property}
        isOpen={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        onConfirmDelete={handleDeleteClick}
        isDeleting={isDeleting}
      />
    </>
  );
};
