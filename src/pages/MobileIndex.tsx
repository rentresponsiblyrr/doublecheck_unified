
import { useAuth } from "@/components/MobileFastAuthProvider";
import { useOptimizedPropertyData } from "@/hooks/useOptimizedPropertyData";
import { PropertyHeader } from "@/components/PropertyHeader";
import { OptimizedPropertyCard } from "@/components/OptimizedPropertyCard";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { EmptyPropertiesState } from "@/components/EmptyPropertiesState";
import { AddPropertyButton } from "@/components/AddPropertyButton";
import { usePropertyActions } from "@/hooks/usePropertyActions";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { RefreshCw, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const MobileIndex = () => {
  const { user } = useAuth();
  const { data: properties, isLoading, error, refetch, isFetching } = useOptimizedPropertyData(user?.id);
  const { handleEdit, handleDelete, handleStartInspection } = usePropertyActions();

  console.log('📱 MobileIndex rendering:', { 
    hasUser: !!user, 
    propertiesCount: properties?.length || 0, 
    isLoading, 
    error: !!error 
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <PropertyHeader 
          title="DoubleCheck Mobile"
          subtitle="Loading your properties..."
        />
        <div className="flex items-center justify-center py-12 px-4">
          <LoadingSpinner message="Loading mobile properties..." />
        </div>
      </div>
    );
  }

  if (error) {
    console.error('📱 Mobile properties error:', error);
    return (
      <div className="min-h-screen bg-gray-50">
        <PropertyHeader 
          title="DoubleCheck Mobile"
          subtitle="Error loading properties"
        />
        <div className="px-4 py-6">
          <Alert className="border-red-200 bg-red-50">
            <AlertDescription className="text-red-800">
              Failed to load properties on mobile. Please check your connection and try again.
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => refetch()}
                className="ml-2"
              >
                <RefreshCw className="w-4 h-4 mr-1" />
                Retry
              </Button>
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <PropertyHeader 
        title="DoubleCheck Mobile"
        subtitle="Manage your property inspections"
      />
      
      {/* Mobile optimization indicator */}
      <div className="px-4 py-2">
        <Card className="bg-gradient-to-r from-blue-50 to-green-50 border-blue-200">
          <CardContent className="pt-3 pb-3">
            <div className="flex items-center gap-2 text-sm">
              <Smartphone className="w-4 h-4 text-blue-600" />
              <span className="text-blue-800">Mobile optimized</span>
              <div className="ml-auto flex items-center gap-1 text-xs text-gray-600">
                <span>{properties?.length || 0} properties</span>
                {isFetching && (
                  <div className="w-3 h-3 border border-blue-600 border-t-transparent rounded-full animate-spin" />
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="px-4 pb-6">
        {!properties || properties.length === 0 ? (
          <EmptyPropertiesState />
        ) : (
          <div className="space-y-4">
            {properties.map((property) => (
              <OptimizedPropertyCard
                key={property.property_id}
                property={property}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onStartInspection={handleStartInspection}
              />
            ))}
          </div>
        )}

        <div className="mt-6">
          <AddPropertyButton />
        </div>

        {/* Mobile refresh button */}
        <div className="mt-4">
          <Button
            variant="outline"
            onClick={() => refetch()}
            disabled={isFetching}
            className="w-full"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isFetching ? 'animate-spin' : ''}`} />
            {isFetching ? 'Refreshing mobile data...' : 'Refresh Properties'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default MobileIndex;
