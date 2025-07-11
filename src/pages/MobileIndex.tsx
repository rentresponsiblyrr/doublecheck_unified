
import { useState } from "react";
import { PropertyHeader } from "@/components/PropertyHeader";
import { AddPropertyButton } from "@/components/AddPropertyButton";
import { MobileOptimizedPropertyList } from "@/components/MobileOptimizedPropertyList";
import { MobileErrorRecovery } from "@/components/MobileErrorRecovery";
import { useMobileAuth } from "@/hooks/useMobileAuth";
import { useMobileDataManager } from "@/hooks/useMobileDataManager";
import { useMobileInspectionOptimizer } from "@/hooks/useMobileInspectionOptimizer";
import { useMobilePropertyActions } from "@/hooks/useMobilePropertyActions";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, CheckCircle2, Zap } from "lucide-react";

const MobileIndex = () => {
  const { user, isAuthenticated, loading: authLoading, userRole } = useMobileAuth();
  const { 
    properties, 
    selectedProperty,
    isLoading, 
    error, 
    selectProperty,
    getPropertyStatus,
    refreshData,
    cacheStats
  } = useMobileDataManager(user?.id);
  
  const { 
    startOrJoinInspection, 
    isLoading: isCreatingInspection, 
    error: inspectionError 
  } = useMobileInspectionOptimizer();

  const { handleEdit } = useMobilePropertyActions();

  // Debug logging
  console.log('📱 MobileIndex Debug with Edit:', {
    userRole,
    hasUser: !!user,
    userEmail: user?.email,
    propertiesCount: properties?.length || 0,
    hasHandleEdit: !!handleEdit,
    isAdmin: userRole === 'admin'
  });

  const handlePropertySelect = (propertyId: string) => {
    console.log('📱 Mobile property selected:', propertyId);
    selectProperty(propertyId === selectedProperty ? null : propertyId);
  };

  const handleStartInspection = async (propertyId: string) => {
    console.log('📱 Starting optimized inspection for property:', propertyId);
    
    if (propertyId !== selectedProperty) {
      selectProperty(propertyId);
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
  if (error && !properties.length) {
    return (
      <MobileErrorRecovery
        error={new Error(error)}
        onRetry={refreshData}
        onNavigateHome={() => window.location.reload()}
        context="Property loading"
      />
    );
  }

  const selectedPropertyData = selectedProperty ? properties.find(p => p.property_id === selectedProperty) : null;
  const selectedPropertyStatus = selectedProperty ? getPropertyStatus(selectedProperty) : null;

  console.log('📱 MobileIndex optimized rendering:', { 
    isAuthenticated, 
    propertiesCount: properties?.length || 0, 
    isLoading, 
    error: !!error,
    selectedProperty,
    authLoading,
    cacheStats
  });

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <PropertyHeader 
        title="DoubleCheck Mobile"
        subtitle="Select a property to begin inspection"
      />

      {/* Performance Indicator */}
      {process.env.NODE_ENV === 'development' && (
        <div className="px-4 py-2">
          <div className="flex items-center gap-2 text-xs text-green-600 bg-green-50 p-2 rounded">
            <Zap className="w-3 h-3" />
            <span>Optimized • Cache: {cacheStats.size}/{cacheStats.maxSize}</span>
            {/* Debug role info */}
            <span>• Role: {userRole || 'Loading...'}</span>
          </div>
        </div>
      )}

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
      {selectedPropertyData && selectedPropertyStatus && (
        <div className="px-4 py-2">
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="pt-3 pb-3">
              <div className="flex items-center justify-between">
                <div className="text-sm text-blue-800">
                  <div className="font-medium">
                    {selectedPropertyData.property_name}
                  </div>
                  <div className="text-xs text-blue-600 mt-1 flex items-center">
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                    {selectedPropertyStatus.textLabel}
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
        error={error ? new Error(error) : null}
        onRefresh={refreshData}
        isFetching={false}
        selectedProperty={selectedProperty}
        onPropertySelect={handlePropertySelect}
        onStartInspection={handleStartInspection}
        onEdit={handleEdit} // Now passing the edit handler
        getPropertyStatus={(completed, active, draft) => {
          // Active inspections (in_progress) = property is currently being worked on
          if (active > 0) return { status: 'in-progress', color: 'bg-yellow-500', textLabel: 'In Progress', badgeColor: 'bg-yellow-500' };
          // Completed inspections = property work is done
          if (completed > 0) return { status: 'completed', color: 'bg-green-500', textLabel: 'Completed', badgeColor: 'bg-green-500' };
          // Draft inspections = property has been assigned but not started
          if (draft > 0) return { status: 'draft', color: 'bg-gray-500', textLabel: 'Not Started', badgeColor: 'bg-gray-500' };
          // No inspections = property is available for assignment
          return { status: 'available', color: 'bg-blue-500', textLabel: 'Available', badgeColor: 'bg-blue-500' };
        }}
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
