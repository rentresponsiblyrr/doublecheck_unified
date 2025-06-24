
import { usePropertyLoader } from "@/hooks/usePropertyLoader";
import { usePropertySelection } from "@/hooks/usePropertySelection";

export const useOptimizedPropertySelection = () => {
  const {
    properties,
    inspections,
    isLoading,
    error,
    refetch
  } = usePropertyLoader();

  const {
    selectedProperty,
    setSelectedProperty,
    handleStartInspection,
    getPropertyStatus,
    getButtonText,
    isCreatingInspection
  } = usePropertySelection(inspections);

  const onPropertyDeleted = () => {
    // Clear selection if the deleted property was selected
    if (selectedProperty) {
      const stillExists = properties.some(p => p.id === selectedProperty);
      if (!stillExists) {
        setSelectedProperty(null);
      }
    }
    refetch();
  };

  return {
    properties,
    inspections,
    selectedProperty,
    setSelectedProperty,
    handleStartInspection,
    getPropertyStatus,
    getButtonText,
    isCreatingInspection,
    onPropertyDeleted,
    isLoading,
    error,
    refetch
  };
};
