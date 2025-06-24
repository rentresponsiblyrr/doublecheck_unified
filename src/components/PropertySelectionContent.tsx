
import { PropertyHeader } from "@/components/PropertyHeader";
import { OptimizedPropertyList } from "@/components/OptimizedPropertyList";
import { StartInspectionButton } from "@/components/StartInspectionButton";
import { AddPropertyButton } from "@/components/AddPropertyButton";

interface Property {
  id: string;
  name: string;
  address: string;
  vrbo_url: string | null;
  airbnb_url: string | null;
  status: string | null;
}

interface Inspection {
  id: string;
  property_id: string;
  completed: boolean;
  start_time: string | null;
}

interface PropertySelectionContentProps {
  properties: Property[];
  inspections: Inspection[];
  selectedProperty: string | null;
  setSelectedProperty: (propertyId: string | null) => void;
  handleStartInspection: () => void;
  getPropertyStatus: (propertyId: string) => {
    status: string;
    color: string;
    text: string;
    activeInspectionId?: string | null;
  };
  getButtonText: (propertyId: string) => string;
  isCreatingInspection: boolean;
  onPropertyDeleted: () => void;
  isLoading?: boolean;
}

export const PropertySelectionContent = ({
  properties,
  inspections,
  selectedProperty,
  setSelectedProperty,
  handleStartInspection,
  getPropertyStatus,
  getButtonText,
  isCreatingInspection,
  onPropertyDeleted,
  isLoading = false
}: PropertySelectionContentProps) => {
  console.log('🎯 PropertySelectionContent rendering with:', {
    propertiesCount: properties.length,
    inspectionsCount: inspections.length,
    selectedProperty,
    isCreatingInspection,
    isLoading
  });

  const selectedPropertyStatus = selectedProperty ? getPropertyStatus(selectedProperty) : null;
  const buttonText = selectedProperty ? getButtonText(selectedProperty) : "Start Inspection";
  const isJoining = selectedPropertyStatus?.status === 'in-progress';

  return (
    <div className="min-h-screen bg-gray-50">
      <PropertyHeader 
        title="Choose a Property to Inspect" 
        subtitle="Select a property below to begin your inspection" 
      />

      <div className="px-4 py-6">
        <div className="text-center mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Choose a Property to Inspect
          </h2>
          <p className="text-gray-600">
            Select a property below to begin your inspection
          </p>
        </div>

        <OptimizedPropertyList
          properties={properties}
          inspections={inspections}
          selectedProperty={selectedProperty}
          onPropertySelect={setSelectedProperty}
          onPropertyDeleted={onPropertyDeleted}
          getPropertyStatus={getPropertyStatus}
          isLoading={isLoading}
        />

        <div className="mt-6">
          <AddPropertyButton />
        </div>

        {selectedProperty && (
          <StartInspectionButton 
            onStartInspection={handleStartInspection}
            isLoading={isCreatingInspection}
            buttonText={buttonText}
            isJoining={isJoining}
          />
        )}
      </div>
    </div>
  );
};
