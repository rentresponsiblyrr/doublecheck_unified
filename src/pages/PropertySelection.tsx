
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { PropertyHeader } from "@/components/PropertyHeader";
import { PropertyList } from "@/components/PropertyList";
import { StartInspectionButton } from "@/components/StartInspectionButton";
import { AddPropertyButton } from "@/components/AddPropertyButton";
import { usePropertySelection } from "@/hooks/usePropertySelection";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

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

const PropertySelection = () => {
  console.log('🏠 PropertySelection component mounting');

  const { data: properties = [], isLoading: propertiesLoading, error: propertiesError, refetch: refetchProperties } = useQuery({
    queryKey: ['properties'],
    queryFn: async () => {
      console.log('📊 Fetching properties from database...');
      
      const { data, error } = await supabase
        .from('properties')
        .select('id, name, address, vrbo_url, airbnb_url, status')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('❌ Error fetching properties:', error);
        throw error;
      }

      console.log('✅ Successfully fetched properties:', data?.length || 0);
      return data as Property[];
    },
    retry: 2,
    staleTime: 30000,
  });

  const { data: inspections = [], isLoading: inspectionsLoading, error: inspectionsError, refetch: refetchInspections } = useQuery({
    queryKey: ['inspections'],
    queryFn: async () => {
      console.log('📊 Fetching inspections from database...');
      
      const { data, error } = await supabase
        .from('inspections')
        .select('*');
      
      if (error) {
        console.error('❌ Error fetching inspections:', error);
        throw error;
      }

      console.log('✅ Successfully fetched inspections:', data?.length || 0);
      return data as Inspection[];
    },
    retry: 2,
    staleTime: 30000,
  });

  const {
    selectedProperty,
    setSelectedProperty,
    handleStartInspection,
    getPropertyStatus,
    isCreatingInspection
  } = usePropertySelection(inspections);

  const handlePropertyDeleted = () => {
    console.log('🔄 Property deleted, refreshing data...');
    refetchProperties();
    refetchInspections();
    setSelectedProperty(null); // Clear selection if deleted property was selected
  };

  // Handle errors
  if (propertiesError || inspectionsError) {
    const error = propertiesError || inspectionsError;
    console.error('💥 PropertySelection error:', error);
    
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center bg-white p-8 rounded-lg shadow-md max-w-md">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Error Loading Data
          </h2>
          <p className="text-gray-600 mb-4">
            {error?.message || 'Failed to load properties and inspections.'}
          </p>
          <Button onClick={() => refetchProperties()} className="w-full">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  // Show loading state
  if (propertiesLoading || inspectionsLoading) {
    console.log('⏳ PropertySelection showing loading state');
    return (
      <div className="min-h-screen bg-gray-50">
        <PropertyHeader 
          title="DoubleCheck" 
          subtitle="Loading your properties..." 
        />
        <div className="px-4 py-6">
          <LoadingSpinner message="Loading properties and inspections..." />
        </div>
      </div>
    );
  }

  console.log('🎯 PropertySelection rendering with:', {
    propertiesCount: properties.length,
    inspectionsCount: inspections.length,
    selectedProperty,
    isCreatingInspection
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <PropertyHeader 
        title="Choose a Property to Inspect" 
        subtitle="Select a property below to begin your inspection" 
      />

      <div className="px-4 py-6">
        <div className="text-center mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Choose a Property to Inspect
          </h2>
          <p className="text-gray-600">
            Select a property below to begin your inspection
          </p>
        </div>

        <PropertyList
          properties={properties}
          inspections={inspections}
          selectedProperty={selectedProperty}
          onPropertySelect={setSelectedProperty}
          onPropertyDeleted={handlePropertyDeleted}
          getPropertyStatus={getPropertyStatus}
        />

        <div className="mt-6">
          <AddPropertyButton />
        </div>

        {selectedProperty && (
          <StartInspectionButton 
            onStartInspection={handleStartInspection}
            isLoading={isCreatingInspection}
          />
        )}
      </div>
    </div>
  );
};

export default PropertySelection;
