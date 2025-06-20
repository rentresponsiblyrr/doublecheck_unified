
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

export const PropertyActions = ({ property, onPropertyDeleted }: PropertyActionsProps) => {
  const {
    showDeleteDialog,
    setShowDeleteDialog,
    isDeleting,
    handleEdit,
    handleDelete
  } = usePropertyActions(property, onPropertyDeleted);

  return (
    <>
      <PropertyActionsDropdown
        onEdit={handleEdit}
        onDelete={() => setShowDeleteDialog(true)}
      />

      <PropertyDeleteDialog
        property={property}
        isOpen={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        onConfirmDelete={handleDelete}
        isDeleting={isDeleting}
      />
    </>
  );
};
