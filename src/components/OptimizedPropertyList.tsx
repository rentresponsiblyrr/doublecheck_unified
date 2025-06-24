
import React from "react";
import { OptimizedPropertyCard } from "@/components/OptimizedPropertyCard";
import { EmptyPropertiesState } from "@/components/EmptyPropertiesState";
import { Loader2 } from "lucide-react";

interface PropertyData {
  property_id: string;
  property_name: string;
  property_address: string;
  property_vrbo_url: string | null;
  property_airbnb_url: string | null;
  property_status?: string;
  property_created_at?: string;
  inspection_count?: number;
  completed_inspection_count?: number;
  active_inspection_count?: number;
  latest_inspection_id?: string | null;
  latest_inspection_completed?: boolean | null;
}

interface Inspection {
  id: string;
  property_id: string;
  completed: boolean;
  start_time: string | null;
}

interface OptimizedPropertyListProps {
  properties: PropertyData[];
  inspections: Inspection[];
  selectedProperty: string | null;
  onPropertySelect: (propertyId: string | null) => void;
  onPropertyDeleted: () => void;
  getPropertyStatus: (propertyId: string) => {
    status: string;
    color: string;
    text: string;
    activeInspectionId?: string | null;
  };
  isLoading?: boolean;
}

export const OptimizedPropertyList = ({
  properties,
  inspections,
  selectedProperty,
  onPropertySelect,
  onPropertyDeleted,
  getPropertyStatus,
  isLoading = false
}: OptimizedPropertyListProps) => {

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-600">Loading properties...</span>
      </div>
    );
  }

  if (properties.length === 0) {
    return <EmptyPropertiesState />;
  }

  return (
    <div className="space-y-3">
      {properties.map((property) => {
        const status = getPropertyStatus(property.property_id);
        const isSelected = selectedProperty === property.property_id;

        return (
          <OptimizedPropertyCard
            key={property.property_id}
            property={property}
            isSelected={isSelected}
            onSelect={() => {
              if (isSelected) {
                onPropertySelect(null);
              } else {
                onPropertySelect(property.property_id);
              }
            }}
            status={status}
            onPropertyDeleted={onPropertyDeleted}
          />
        );
      })}
    </div>
  );
};
