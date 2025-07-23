import React from "react";
import { FixedSizeList as List } from "react-window";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Home, Plus } from "lucide-react";
import { PropertyCard } from "./PropertyCard";

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
}

interface VirtualListData {
  properties: PropertyData[];
  selectedProperty: any;
  onPropertySelect: (property: PropertyData) => void;
}

interface PropertyListProps {
  properties: PropertyData[];
  selectedProperty: any;
  onPropertySelect: (property: PropertyData) => void;
  isLoading?: boolean;
  searchQuery?: string;
  onShowAddForm: () => void;
}

// Virtual list item component
const PropertyListItem = React.memo<{
  index: number;
  style: React.CSSProperties;
  data: VirtualListData;
}>(({ index, style, data }) => {
  const { properties, selectedProperty, onPropertySelect } = data;
  const property = properties[index];

  if (!property) return null;

  const isSelected = selectedProperty?.property_id === property.property_id;

  return (
    <PropertyCard
      property={property}
      isSelected={isSelected}
      onClick={onPropertySelect}
      style={style}
    />
  );
});

PropertyListItem.displayName = "PropertyListItem";

export function PropertyList({
  properties,
  selectedProperty,
  onPropertySelect,
  isLoading = false,
  searchQuery = "",
  onShowAddForm,
}: PropertyListProps) {
  // Virtual list data for react-window
  const virtualListData: VirtualListData = {
    properties,
    selectedProperty,
    onPropertySelect,
  };

  // Loading state
  if (isLoading) {
    return (
      <div
        className="grid gap-4"
        role="status"
        aria-live="polite"
        aria-label="Loading properties"
      >
        {[1, 2, 3].map((i) => (
          <Card key={i} aria-hidden="true">
            <CardContent className="p-6">
              <div className="space-y-3">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
                <div className="flex gap-2">
                  <Skeleton className="h-6 w-16" />
                  <Skeleton className="h-6 w-20" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        <div className="sr-only">Loading properties, please wait...</div>
      </div>
    );
  }

  // Empty state
  if (properties.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <Home className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
            No Properties Found
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {searchQuery
              ? "No properties match your search criteria."
              : "No properties available. Add a property to get started."}
          </p>
          <Button
            onClick={onShowAddForm}
            className="h-12 px-6 text-base touch-manipulation"
          >
            <Plus className="h-5 w-5 mr-2" />
            Add Property
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Properties list with virtualization for performance
  return (
    <div className="h-[600px] w-full" role="grid" aria-label="Properties list">
      <List
        height={600}
        itemCount={properties.length}
        itemSize={220} // Height per item (card + padding)
        itemData={virtualListData}
        width="100%"
      >
        {PropertyListItem}
      </List>
    </div>
  );
}
