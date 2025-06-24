
import { useState } from 'react';
import { PropertyHeader } from "@/components/PropertyHeader";
import { OptimizedPropertyList } from "@/components/OptimizedPropertyList";
import { StartInspectionButton } from "@/components/StartInspectionButton";
import { AddPropertyButton } from "@/components/AddPropertyButton";
import { QuickActions } from "@/components/QuickActions";
import { SearchAndFilter } from "@/components/SearchAndFilter";

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
  const [searchValue, setSearchValue] = useState('');
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [activeSortId, setActiveSortId] = useState('name-asc');

  console.log('🎯 PropertySelectionContent rendering with simplified approach:', {
    propertiesCount: properties.length,
    inspectionsCount: inspections.length,
    selectedProperty,
    isCreatingInspection,
    isLoading,
    searchValue,
    activeFilters
  });

  const selectedPropertyStatus = selectedProperty ? getPropertyStatus(selectedProperty) : null;
  const buttonText = selectedProperty ? getButtonText(selectedProperty) : "Start Inspection";
  const isJoining = selectedPropertyStatus?.status === 'in-progress';
  const pendingInspections = inspections.filter(i => !i.completed).length;

  // Filter and sort properties
  const filteredProperties = properties.filter(property => {
    const matchesSearch = !searchValue || 
      property.name?.toLowerCase().includes(searchValue.toLowerCase()) ||
      property.address?.toLowerCase().includes(searchValue.toLowerCase());
    
    const matchesFilters = activeFilters.length === 0 || 
      activeFilters.some(filter => {
        const status = getPropertyStatus(property.id);
        return filter === status.status;
      });

    return matchesSearch && matchesFilters;
  }).sort((a, b) => {
    switch (activeSortId) {
      case 'name-asc':
        return (a.name || '').localeCompare(b.name || '');
      case 'name-desc':
        return (b.name || '').localeCompare(a.name || '');
      case 'status-asc':
        return getPropertyStatus(a.id).status.localeCompare(getPropertyStatus(b.id).status);
      case 'status-desc':
        return getPropertyStatus(b.id).status.localeCompare(getPropertyStatus(a.id).status);
      default:
        return 0;
    }
  });

  const filterOptions = [
    { id: 'available', label: 'Available', count: properties.filter(p => getPropertyStatus(p.id).status === 'available').length },
    { id: 'in-progress', label: 'In Progress', count: properties.filter(p => getPropertyStatus(p.id).status === 'in-progress').length },
    { id: 'completed', label: 'Completed', count: properties.filter(p => getPropertyStatus(p.id).status === 'completed').length }
  ];

  const sortOptions = [
    { id: 'name-asc', label: 'Name A-Z', direction: 'asc' as const },
    { id: 'name-desc', label: 'Name Z-A', direction: 'desc' as const },
    { id: 'status-asc', label: 'Status A-Z', direction: 'asc' as const },
    { id: 'status-desc', label: 'Status Z-A', direction: 'desc' as const }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <PropertyHeader 
        title="Choose a Property to Inspect" 
        subtitle="Select a property below to begin your inspection" 
      />

      <div className="px-4 py-6 space-y-6">
        {/* Quick Actions */}
        <QuickActions 
          context="properties" 
          pendingInspections={pendingInspections}
        />

        {/* Search and Filter */}
        <SearchAndFilter
          searchPlaceholder="Search properties by name or address..."
          searchValue={searchValue}
          onSearchChange={setSearchValue}
          filterOptions={filterOptions}
          activeFilters={activeFilters}
          onFilterChange={setActiveFilters}
          sortOptions={sortOptions}
          activeSortId={activeSortId}
          onSortChange={setActiveSortId}
        />

        {/* Results Summary */}
        <div className="text-sm text-gray-600">
          Showing {filteredProperties.length} of {properties.length} properties
          {searchValue && ` matching "${searchValue}"`}
        </div>

        <OptimizedPropertyList
          properties={filteredProperties}
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
