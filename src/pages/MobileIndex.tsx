
import { useState } from "react";
import { PropertyHeader } from "@/components/PropertyHeader";
import { AddPropertyButton } from "@/components/AddPropertyButton";
import { MobilePropertyList } from "@/components/MobilePropertyList";
import { StartInspectionButton } from "@/components/StartInspectionButton";
import { useMobileAuth } from "@/hooks/useMobileAuth";
import { useMobilePropertyData } from "@/hooks/useMobilePropertyData";
import { useMobilePropertyActions } from "@/hooks/useMobilePropertyActions";
import { usePropertySelection } from "@/hooks/usePropertySelection";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";

const MobileIndex = () => {
  const { user, isAuthenticated } = useMobileAuth();
  const { data: properties, isLoading, error, refetch, isFetching } = useMobilePropertyData(user?.id);
  const { handleEdit, handleDelete } = useMobilePropertyActions();

  // Fetch inspections for property selection logic
  const { data: inspections = [] } = useQuery({
    queryKey: ['inspections'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('inspections')
        .select('*');
      
      if (error) throw error;
      return data || [];
    },
    retry: 2,
    staleTime: 0,
  });

  const {
    selectedProperty,
    setSelectedProperty,
    handleStartInspection,
    getPropertyStatus,
    getButtonText,
    isCreatingInspection
  } = usePropertySelection(inspections);

  // Unified inspection handler for both property cards and the main button
  const handleMobileStartInspection = async (propertyId?: string) => {
    console.log('📱 Mobile unified inspection start:', { propertyId, selectedProperty });
    
    // If propertyId is provided (from property card), select it first
    if (propertyId && propertyId !== selectedProperty) {
      console.log('📱 Selecting property from card:', propertyId);
      setSelectedProperty(propertyId);
      
      // Wait a moment for state to update, then start inspection
      setTimeout(async () => {
        console.log('📱 Starting inspection after property selection:', propertyId);
        await handleStartInspection();
      }, 100);
      return;
    }
    
    // If no propertyId provided, use selected property logic
    if (!selectedProperty && !propertyId) {
      console.warn('⚠️ No property selected for mobile inspection');
      return;
    }
    
    // Start inspection with current selection
    await handleStartInspection();
  };

  const handlePropertySelect = (propertyId: string) => {
    console.log('📱 Mobile property selected:', propertyId);
    setSelectedProperty(propertyId === selectedProperty ? null : propertyId);
  };

  // Handle property card inspection starts
  const handlePropertyCardInspection = async (propertyId: string) => {
    console.log('📱 Property card inspection start:', propertyId);
    await handleMobileStartInspection(propertyId);
  };

  console.log('📱 MobileIndex optimized rendering:', { 
    isAuthenticated, 
    propertiesCount: properties?.length || 0, 
    isLoading, 
    error: !!error,
    selectedProperty,
    inspectionsCount: inspections?.length || 0
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <PropertyHeader 
        title="DoubleCheck Mobile"
        subtitle="Select a property to begin inspection"
      />

      {/* Property Selection Status */}
      {selectedProperty && (
        <div className="px-4 py-2">
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="pt-3 pb-3">
              <div className="text-sm text-blue-800">
                <strong>Selected Property:</strong> {properties?.find(p => p.property_id === selectedProperty)?.property_name}
                <div className="text-xs text-blue-600 mt-1">
                  Status: {getPropertyStatus(selectedProperty).text}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <MobilePropertyList
        properties={properties || []}
        isLoading={isLoading}
        error={error}
        onRefresh={refetch}
        isFetching={isFetching}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onStartInspection={handlePropertyCardInspection}
        selectedProperty={selectedProperty}
        onPropertySelect={handlePropertySelect}
        getPropertyStatus={getPropertyStatus}
      />

      <div className="px-4 mt-6 pb-6">
        <AddPropertyButton />
      </div>

      {/* Start/Join Inspection Button - Uses unified logic */}
      {selectedProperty && (
        <StartInspectionButton 
          onStartInspection={() => handleMobileStartInspection()}
          isLoading={isCreatingInspection}
          buttonText={getButtonText(selectedProperty)}
          isJoining={getPropertyStatus(selectedProperty).status === 'in-progress'}
        />
      )}
    </div>
  );
};

export default MobileIndex;
