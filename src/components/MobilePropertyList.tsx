
import { memo } from "react";
import { OptimizedPropertyCard } from "@/components/OptimizedPropertyCard";
import { EmptyPropertiesState } from "@/components/EmptyPropertiesState";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { RefreshCw, Smartphone } from "lucide-react";

interface MobilePropertyData {
  property_id: string;
  property_name: string;
  property_address: string;
  property_vrbo_url: string;
  property_airbnb_url: string;
  property_status: string;
  property_created_at: string;
  inspection_count: number;
  completed_inspection_count: number;
  active_inspection_count: number;
  latest_inspection_id: string | null;
  latest_inspection_completed: boolean | null;
}

interface MobilePropertyListProps {
  properties: MobilePropertyData[];
  isLoading: boolean;
  error: any;
  onRefresh: () => void;
  isFetching: boolean;
  onEdit: (propertyId: string) => void;
  onDelete: (propertyId: string, propertyName: string) => void;
  onStartInspection: (propertyId: string) => void;
}

export const MobilePropertyList = memo(({
  properties,
  isLoading,
  error,
  onRefresh,
  isFetching,
  onEdit,
  onDelete,
  onStartInspection
}: MobilePropertyListProps) => {
  console.log('📱 Mobile Property List rendering:', {
    propertiesCount: properties?.length || 0,
    isLoading,
    error: !!error,
    isFetching
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner message="Loading mobile properties..." />
      </div>
    );
  }

  if (error) {
    return (
      <Alert className="mx-4 my-4 border-red-200 bg-red-50">
        <AlertDescription className="text-red-800">
          Failed to load properties on mobile. Please try again.
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onRefresh}
            className="ml-2"
          >
            <RefreshCw className="w-4 h-4 mr-1" />
            Retry
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  if (!properties || properties.length === 0) {
    return <EmptyPropertiesState />;
  }

  return (
    <div className="space-y-4">
      {/* Mobile Performance Indicator */}
      <div className="px-4">
        <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 p-3 rounded-lg">
          <Smartphone className="w-4 h-4" />
          <span>Mobile optimized • {properties.length} properties</span>
          {isFetching && (
            <div className="w-3 h-3 border border-green-600 border-t-transparent rounded-full animate-spin ml-auto" />
          )}
        </div>
      </div>

      {/* Property Grid */}
      <div className="grid gap-4 px-4">
        {properties.map((property) => (
          <OptimizedPropertyCard
            key={property.property_id}
            property={property}
            onEdit={onEdit}
            onDelete={onDelete}
            onStartInspection={onStartInspection}
          />
        ))}
      </div>

      {/* Mobile Refresh */}
      <div className="px-4 pb-4">
        <Button
          variant="outline"
          onClick={onRefresh}
          disabled={isFetching}
          className="w-full"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${isFetching ? 'animate-spin' : ''}`} />
          {isFetching ? 'Refreshing mobile data...' : 'Refresh Properties'}
        </Button>
      </div>
    </div>
  );
});

MobilePropertyList.displayName = 'MobilePropertyList';
