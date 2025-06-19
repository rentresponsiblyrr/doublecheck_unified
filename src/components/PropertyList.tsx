
import { PropertyCard } from "@/components/PropertyCard";
import { EmptyPropertiesState } from "@/components/EmptyPropertiesState";

interface Property {
  id: string;
  name: string;
  address: string;
  vrbo_url: string | null;
  status: string | null;
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
  getPropertyStatus: (propertyId: string) => {
    status: string;
    color: string;
    text: string;
  };
}

export const PropertyList = ({ 
  properties, 
  inspections, 
  selectedProperty, 
  onPropertySelect, 
  getPropertyStatus 
}: PropertyListProps) => {
  if (properties.length === 0) {
    return <EmptyPropertiesState />;
  }

  return (
    <div className="space-y-4">
      {properties.map((property) => {
        const status = getPropertyStatus(property.id);
        const isSelected = selectedProperty === property.id;
        
        return (
          <PropertyCard
            key={property.id}
            property={property}
            status={status}
            isSelected={isSelected}
            onSelect={onPropertySelect}
          />
        );
      })}
    </div>
  );
};
