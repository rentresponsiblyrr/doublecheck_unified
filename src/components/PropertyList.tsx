
import { PropertyCard } from "@/components/PropertyCard";
import { EmptyPropertiesState } from "@/components/EmptyPropertiesState";

interface Property {
  property_id?: string;
  id?: string;
  property_name?: string;
  name?: string;
  property_address?: string;
  address?: string;
  property_vrbo_url?: string | null;
  vrbo_url?: string | null;
  property_airbnb_url?: string | null;
  airbnb_url?: string | null;
  status?: string | null;
}

interface Inspection {
  id: string;
  property_id: string;
  completed: boolean;
  start_time: string | null;
}

interface PropertyListProps {
  properties: Property[];
  inspections: Inspection[];
  selectedProperty: string | null;
  onPropertySelect: (propertyId: string) => void;
  onPropertyDeleted: () => void;
  getPropertyStatus: (propertyId: string) => {
    status: string;
    color: string;
    text: string;
  };
  isLoading?: boolean;
  showInspectionActions?: boolean;
  onInspectionStart?: (propertyId: string, isResume: boolean) => void;
}

export const PropertyList = ({ 
  properties, 
  inspections, 
  selectedProperty, 
  onPropertySelect, 
  onPropertyDeleted,
  getPropertyStatus,
  showInspectionActions = false,
  onInspectionStart
}: PropertyListProps) => {
  if (properties.length === 0) {
    return <EmptyPropertiesState />;
  }

  return (
    <div id="property-list-container" className="space-y-4">
      {properties.map((property) => {
        // Handle both property formats (property_id vs id, property_name vs name, etc.)
        const propertyId = property.property_id || property.id || '';
        const propertyName = property.property_name || property.name || '';
        const propertyAddress = property.property_address || property.address || '';
        const vrboUrl = property.property_vrbo_url || property.vrbo_url;
        const airbnbUrl = property.property_airbnb_url || property.airbnb_url;
        
        const status = getPropertyStatus(propertyId);
        const isSelected = selectedProperty === propertyId;
        
        // Map to the format expected by PropertyCard
        const mappedProperty = {
          id: propertyId,
          name: propertyName,
          address: propertyAddress,
          vrbo_url: vrboUrl,
          airbnb_url: airbnbUrl,
          status: property.status
        };
        
        return (
          <PropertyCard
            key={propertyId}
            property={mappedProperty}
            status={status}
            isSelected={isSelected}
            onSelect={onPropertySelect}
            onPropertyDeleted={onPropertyDeleted}
            showInspectionActions={showInspectionActions}
            onInspectionStart={onInspectionStart}
          />
        );
      })}
    </div>
  );
};
