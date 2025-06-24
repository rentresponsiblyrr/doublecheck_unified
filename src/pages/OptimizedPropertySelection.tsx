
import { PropertySelectionError } from "@/components/PropertySelectionError";
import { PropertySelectionLoading } from "@/components/PropertySelectionLoading";
import { PropertySelectionContent } from "@/components/PropertySelectionContent";
import { useOptimizedPropertySelection } from "@/hooks/useOptimizedPropertySelection";

const OptimizedPropertySelection = () => {
  console.log('🏠 OptimizedPropertySelection component mounting');

  const {
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
  } = useOptimizedPropertySelection();

  // Handle errors
  if (error) {
    return (
      <PropertySelectionError 
        error={error}
        onRetry={refetch}
      />
    );
  }

  // Show loading state
  if (isLoading) {
    return <PropertySelectionLoading />;
  }

  return (
    <PropertySelectionContent
      properties={properties}
      inspections={inspections}
      selectedProperty={selectedProperty}
      setSelectedProperty={setSelectedProperty}
      handleStartInspection={handleStartInspection}
      getPropertyStatus={getPropertyStatus}
      getButtonText={getButtonText}
      isCreatingInspection={isCreatingInspection}
      onPropertyDeleted={onPropertyDeleted}
    />
  );
};

export default OptimizedPropertySelection;
