
import { useState } from "react";
import { PropertyHeader } from "@/components/PropertyHeader";
import { AddPropertyButton } from "@/components/AddPropertyButton";
import { MobileOptimizedPropertyList } from "@/components/MobileOptimizedPropertyList";
import { MobileErrorRecovery } from "@/components/MobileErrorRecovery";
import { useMobileAuth } from "@/hooks/useMobileAuth";
import { useMobilePropertyData, useMobilePropertyStatus } from "@/hooks/useMobilePropertyData";
import { useMobilePropertyActions } from "@/hooks/useMobilePropertyActions";
import { useRobustMobileInspectionFlow } from "@/hooks/useRobustMobileInspectionFlow";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, CheckCircle2 } from "lucide-react";

const MobileIndex = () => {
  const { user, isAuthenticated, loading: authLoading } = useMobileAuth();
  const { data: properties, isLoading, error, refetch, isFetching } = useMobilePropertyData(user?.id);
  const { handleEdit, handleDelete } = useMobilePropertyActions();
  const { startOrJoinInspection, isLoading: isCreatingInspection, error: inspectionError } = useRobustMobileInspectionFlow();
  const { getPropertyStatus } = useMobilePropertyStatus();

  const [selectedProperty, setSelectedProperty] = useState<string | null>(null);

  const handlePropertySelect = (propertyId: string) => {
    console.log('📱 Mobile property selected:', propertyId);
    setSelectedProperty(propertyId === selectedProperty ? null : propertyId);
  };

  const handleStartInspection = async (propertyId: string) => {
    console.log('📱 Starting inspection for property:', propertyId);
    
    // Select the property first if not already selected
    if (propertyId !== selectedProperty) {
      setSelectedProperty(propertyId);
    }
    
    await startOrJoinInspection(propertyId);
  };

  // Show loading while auth is initializing
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Initializing...</p>
        </div>
      </div>
    );
  }

  // Handle critical errors with mobile recovery
  if (error && !properties) {
    return (
      <MobileErrorRecovery
        error={error}
        onRetry={refetch}
        onNavigateHome={() => window.location.reload()}
        context="Property loading"
      />
    );
  }

  console.log('📱 MobileIndex optimized rendering:', { 
    isAuthenticated, 
    propertiesCount: properties?.length || 0, 
    isLoading, 
    error: !!error,
    selectedProperty,
    authLoading
  });

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <PropertyHeader 
        title="DoubleCheck Mobile"
        subtitle="Select a property to begin inspection"
      />

      {/* Inspection Error Alert */}
      {inspectionError && (
        <div className="px-4 py-2">
          <Alert className="bg-red-50 border-red-200">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              {inspectionError}
            </AlertDescription>
          </Alert>
        </div>
      )}

      {/* Property Selection Status */}
      {selectedProperty && properties && (
        <div className="px-4 py-2">
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="pt-3 pb-3">
              <div className="flex items-center justify-between">
                <div className="text-sm text-blue-800">
                  <div className="font-medium">
                    {properties.find(p => p.property_id === selectedProperty)?.property_name}
                  </div>
                  <div className="text-xs text-blue-600 mt-1 flex items-center">
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                    {getPropertyStatus(
                      properties.find(p => p.property_id === selectedProperty)?.completed_inspection_count || 0,
                      properties.find(p => p.property_id === selectedProperty)?.active_inspection_count || 0
                    ).textLabel}
                  </div>
                </div>
                {isCreatingInspection && (
                  <div className="flex items-center text-blue-600">
                    <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mr-2" />
                    <span className="text-xs">Creating...</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Properties List */}
      <MobileOptimizedPropertyList
        properties={properties || []}
        isLoading={isLoading}
        error={error}
        onRefresh={refetch}
        isFetching={isFetching}
        selectedProperty={selectedProperty}
        onPropertySelect={handlePropertySelect}
        onStartInspection={handleStartInspection}
        getPropertyStatus={getPropertyStatus}
        isCreatingInspection={isCreatingInspection}
      />

      {/* Add Property Button */}
      <div className="px-4 mt-auto pb-safe">
        <div className="py-4">
          <AddPropertyButton />
        </div>
      </div>
    </div>
  );
};

export default MobileIndex;
