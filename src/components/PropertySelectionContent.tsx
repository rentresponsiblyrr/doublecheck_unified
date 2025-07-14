
import { useState } from 'react';
import { PropertyHeader } from "@/components/PropertyHeader";
import { OptimizedPropertyList } from "@/components/OptimizedPropertyList";
import { StartInspectionButton } from "@/components/StartInspectionButton";
import { AddPropertyButton } from "@/components/AddPropertyButton";
import { QuickActions } from "@/components/QuickActions";
import { SearchAndFilter } from "@/components/SearchAndFilter";
import { PropertyErrorBoundary } from "@/components/PropertyErrorBoundary";
import { usePropertyActions } from "@/hooks/usePropertyActions";
import { useInspectorDashboard } from "@/hooks/useInspectorDashboard";
import { Card, CardContent } from "@/components/ui/card";
import { 
  TrendingUp, 
  Clock, 
  CheckCircle, 
  Play 
} from "lucide-react";

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

interface PropertySelectionContentProps {
  properties: PropertyData[];
  inspections: Inspection[];
  selectedProperty: string | null;
  setSelectedProperty: (propertyId: string | null) => void;
  handleStartInspection: () => void;
  getPropertyStatus: (propertyId: string) => {
    status: string;
    color: string;
    text: string;
    activeInspectionId?: string | null;
    shouldHide?: boolean;
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

  const { actionState, clearError } = usePropertyActions();
  const { summary } = useInspectorDashboard();

  console.log('🎯 PropertySelectionContent rendering with consolidated auth:', {
    propertiesCount: properties.length,
    inspectionsCount: inspections.length,
    selectedProperty,
    isCreatingInspection,
    isLoading,
    searchValue,
    activeFilters,
    actionError: actionState.error
  });

  const selectedPropertyStatus = selectedProperty ? getPropertyStatus(selectedProperty) : null;
  const buttonText = selectedProperty ? getButtonText(selectedProperty) : "Start Inspection";
  const isJoining = selectedPropertyStatus?.status === 'in-progress';
  const pendingInspections = inspections.filter(i => !i.completed).length;

  // Filter and sort properties - hide approved properties from inspector view
  const filteredProperties = properties.filter(property => {
    const propertyStatus = getPropertyStatus(property.property_id);
    
    // Hide approved properties from inspector list
    if (propertyStatus.shouldHide) {
      return false;
    }
    
    const matchesSearch = !searchValue || 
      property.property_name?.toLowerCase().includes(searchValue.toLowerCase()) ||
      property.property_address?.toLowerCase().includes(searchValue.toLowerCase());
    
    const matchesFilters = activeFilters.length === 0 || 
      activeFilters.some(filter => {
        const status = getPropertyStatus(property.property_id);
        return filter === status.status;
      });

    return matchesSearch && matchesFilters;
  }).sort((a, b) => {
    switch (activeSortId) {
      case 'name-asc':
        return (a.property_name || '').localeCompare(b.property_name || '');
      case 'name-desc':
        return (b.property_name || '').localeCompare(a.property_name || '');
      case 'status-asc':
        return getPropertyStatus(a.property_id).status.localeCompare(getPropertyStatus(b.property_id).status);
      case 'status-desc':
        return getPropertyStatus(b.property_id).status.localeCompare(getPropertyStatus(a.property_id).status);
      default:
        return 0;
    }
  });

  const filterOptions = [
    { id: 'pending', label: 'Available', count: properties.filter(p => {
      const status = getPropertyStatus(p.property_id);
      return status.status === 'pending' && !status.shouldHide;
    }).length },
    { id: 'in-progress', label: 'In Progress', count: properties.filter(p => {
      const status = getPropertyStatus(p.property_id);
      return status.status === 'in-progress' && !status.shouldHide;
    }).length },
    { id: 'completed', label: 'Under Review', count: properties.filter(p => {
      const status = getPropertyStatus(p.property_id);
      return status.status === 'completed' && !status.shouldHide;
    }).length }
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
        {/* Inspection Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Total</p>
                  <p className="text-2xl font-bold">{summary.total}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Play className="h-5 w-5 text-orange-600" />
                <div>
                  <p className="text-sm font-medium text-gray-600">In Progress</p>
                  <p className="text-2xl font-bold">{summary.in_progress}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Clock className="h-5 w-5 text-yellow-600" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Pending Review</p>
                  <p className="text-2xl font-bold">{summary.pending_review}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Approved</p>
                  <p className="text-2xl font-bold">{summary.approved}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <QuickActions 
          context="properties" 
          pendingInspections={pendingInspections}
        />

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

        <div className="text-sm text-gray-600">
          Showing {filteredProperties.length} of {properties.length} properties
          {searchValue && ` matching "${searchValue}"`}
        </div>

        <PropertyErrorBoundary
          onRetry={() => window.location.reload()}
          onNavigateHome={() => window.location.href = '/properties'}
          onAddProperty={() => window.location.href = '/add-property'}
        >
          <OptimizedPropertyList
            properties={filteredProperties}
            inspections={inspections}
            selectedProperty={selectedProperty}
            onPropertySelect={setSelectedProperty}
            onPropertyDeleted={onPropertyDeleted}
            getPropertyStatus={getPropertyStatus}
            isLoading={isLoading}
          />
        </PropertyErrorBoundary>

        <div className="mt-6">
          <AddPropertyButton />
        </div>

        {selectedProperty && (
          <StartInspectionButton 
            onStartInspection={handleStartInspection}
            isLoading={isCreatingInspection || actionState.isLoading}
            buttonText={buttonText}
            isJoining={isJoining}
            disabled={selectedPropertyStatus?.status === 'completed' || selectedPropertyStatus?.shouldHide}
          />
        )}
      </div>
    </div>
  );
};
