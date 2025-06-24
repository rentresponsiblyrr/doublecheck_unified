
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
import { Smartphone, Zap, Clock } from "lucide-react";

const MobileIndex = () => {
  const { user, isAuthenticated } = useMobileAuth();
  const { data: properties, isLoading, error, refetch, isFetching } = useMobilePropertyData(user?.id);
  const { handleEdit, handleDelete, handleStartInspection, isCreatingInspection } = useMobilePropertyActions();

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
    handleStartInspection: handlePropertyInspection,
    getPropertyStatus,
    getButtonText,
    isCreatingInspection: isCreatingPropertyInspection
  } = usePropertySelection(inspections);

  // Enhanced mobile start inspection handler
  const handleMobileStartInspection = async () => {
    if (!selectedProperty) {
      console.warn('⚠️ No property selected for mobile inspection');
      return;
    }
    
    console.log('📱 Mobile starting inspection for property:', selectedProperty);
    
    // Use the property selection hook's logic
    await handlePropertyInspection();
  };

  const handlePropertySelect = (propertyId: string) => {
    console.log('📱 Mobile property selected:', propertyId);
    setSelectedProperty(propertyId === selectedProperty ? null : propertyId);
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
      
      {/* Mobile Performance Dashboard */}
      <div className="px-4 py-2">
        <Card className="bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
          <CardContent className="pt-3 pb-3">
            <div className="flex items-center gap-3 text-sm">
              <div className="flex items-center gap-1">
                <Smartphone className="w-4 h-4 text-green-600" />
                <span className="text-green-800 font-medium">Mobile Optimized</span>
              </div>
              <div className="flex items-center gap-1">
                <Zap className="w-4 h-4 text-blue-600" />
                <span className="text-blue-800">Fast Loading</span>
              </div>
              <div className="flex items-center gap-1 ml-auto">
                <Clock className="w-3 h-3 text-gray-600" />
                <span className="text-gray-600 text-xs">
                  {properties?.length || 0} properties
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

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
        onStartInspection={handleStartInspection}
        selectedProperty={selectedProperty}
        onPropertySelect={handlePropertySelect}
        getPropertyStatus={getPropertyStatus}
      />

      <div className="px-4 mt-6 pb-6">
        <AddPropertyButton />
      </div>

      {/* Start/Join Inspection Button - Core Mobile Functionality */}
      {selectedProperty && (
        <StartInspectionButton 
          onStartInspection={handleMobileStartInspection}
          isLoading={isCreatingInspection || isCreatingPropertyInspection}
          buttonText={getButtonText(selectedProperty)}
          isJoining={getPropertyStatus(selectedProperty).status === 'in-progress'}
        />
      )}
    </div>
  );
};

export default MobileIndex;
