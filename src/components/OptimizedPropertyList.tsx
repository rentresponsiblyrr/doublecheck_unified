
import { PropertyCard } from "@/components/PropertyCard";
import { EmptyPropertiesState } from "@/components/EmptyPropertiesState";
import { Skeleton } from "@/components/ui/skeleton";
import { memo } from "react";

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

interface OptimizedPropertyListProps {
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
}

const PropertyCardSkeleton = () => (
  <div className="p-4 border border-gray-200 rounded-lg">
    <div className="flex items-start justify-between mb-3">
      <div className="flex-1">
        <Skeleton className="h-5 w-48 mb-2" />
        <Skeleton className="h-4 w-64" />
      </div>
      <div className="flex items-center gap-2">
        <Skeleton className="h-6 w-20" />
        <Skeleton className="h-8 w-8" />
      </div>
    </div>
    <Skeleton className="h-4 w-32" />
  </div>
);

export const OptimizedPropertyList = memo(({ 
  properties, 
  inspections, 
  selectedProperty, 
  onPropertySelect, 
  onPropertyDeleted,
  getPropertyStatus,
  isLoading = false
}: OptimizedPropertyListProps) => {
  console.log('🏗️ OptimizedPropertyList rendering:', {
    propertiesCount: properties.length,
    isLoading,
    selectedProperty
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, index) => (
          <PropertyCardSkeleton key={index} />
        ))}
      </div>
    );
  }

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
            onPropertyDeleted={onPropertyDeleted}
          />
        );
      })}
    </div>
  );
});

OptimizedPropertyList.displayName = 'OptimizedPropertyList';
