
import React from "react";
import { RefreshCw, AlertCircle, Wifi, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { MobileInspectionCard } from "@/components/MobileInspectionCard";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";

interface PropertyStatus {
  status: string;
  color: string;
  textLabel: string;
  badgeColor: string;
}

interface Property {
  property_id: string;
  property_name: string;
  property_address: string;
  property_vrbo_url?: string | null;
  property_airbnb_url?: string | null;
  inspection_count?: number;
  completed_inspection_count?: number;
  active_inspection_count?: number;
}

interface MobileOptimizedPropertyListProps {
  properties: Property[];
  isLoading: boolean;
  error?: Error | null;
  onRefresh: () => void;
  isFetching: boolean;
  selectedProperty: string | null;
  onPropertySelect: (propertyId: string) => void;
  onStartInspection: (propertyId: string) => void;
  onEdit?: (propertyId: string) => void;
  getPropertyStatus: (completedCount: number, activeCount: number) => PropertyStatus;
  isCreatingInspection?: boolean;
}

export const MobileOptimizedPropertyList: React.FC<MobileOptimizedPropertyListProps> = ({
  properties,
  isLoading,
  error,
  onRefresh,
  isFetching,
  selectedProperty,
  onPropertySelect,
  onStartInspection,
  onEdit,
  getPropertyStatus,
  isCreatingInspection = false
}) => {
  const isOnline = useNetworkStatus();

  // Loading state
  if (isLoading && properties.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading properties...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error && properties.length === 0) {
    return (
      <div className="flex-1 p-4">
        <Alert className="bg-red-50 border-red-200">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            {error instanceof Error ? error.message : 'Failed to load properties'}
          </AlertDescription>
        </Alert>
        
        <div className="mt-4 text-center">
          <Button 
            onClick={onRefresh} 
            variant="outline"
            disabled={!isOnline}
            className="mobile-touch-target"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            {isOnline ? 'Try Again' : 'Waiting for connection...'}
          </Button>
        </div>
      </div>
    );
  }

  // Empty state
  if (!isLoading && properties.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Properties Found</h3>
          <p className="text-gray-600 mb-4">Add a property to start creating inspections.</p>
          <Button onClick={onRefresh} variant="outline" className="mobile-touch-target">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1">
      {/* Network Status */}
      <div className="px-4 py-2">
        <div className={`flex items-center justify-between text-xs ${
          isOnline ? 'text-green-600' : 'text-red-600'
        }`}>
          <div className="flex items-center">
            {isOnline ? <Wifi className="w-3 h-3 mr-1" /> : <WifiOff className="w-3 h-3 mr-1" />}
            {isOnline ? 'Online' : 'Offline'}
          </div>
          {isFetching && (
            <div className="flex items-center text-blue-600">
              <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
              Updating...
            </div>
          )}
        </div>
      </div>

      {/* Properties List */}
      <div className="px-4 pb-4 space-y-3">
        {properties.map((property) => {
          const propertyStatus = getPropertyStatus(
            property.completed_inspection_count || 0,
            property.active_inspection_count || 0
          );

          return (
            <MobileInspectionCard
              key={property.property_id}
              property={property}
              propertyStatus={propertyStatus}
              isSelected={selectedProperty === property.property_id}
              onSelect={onPropertySelect}
              onStartInspection={onStartInspection}
              onEdit={onEdit}
              isLoading={isCreatingInspection && selectedProperty === property.property_id}
            />
          );
        })}
      </div>

      {/* Pull to refresh hint */}
      {!isFetching && (
        <div className="text-center py-4 text-xs text-gray-500">
          Pull down to refresh
        </div>
      )}
    </div>
  );
};
