
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { usePropertySelection } from "@/hooks/usePropertySelection";
import { PropertySelectionError } from "@/components/PropertySelectionError";
import { PropertySelectionLoading } from "@/components/PropertySelectionLoading";
import { PropertySelectionContent } from "@/components/PropertySelectionContent";

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
    staleTime: 0, // Always refetch to ensure fresh data
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
    staleTime: 0, // Always refetch to ensure fresh data
  });

  const {
    selectedProperty,
    setSelectedProperty,
    handleStartInspection,
    getPropertyStatus,
    isCreatingInspection
  } = usePropertySelection(inspections);

  const handlePropertyDeleted = async () => {
    console.log('🔄 Property deleted, performing comprehensive data refresh...');
    
    // Clear selection immediately
    setSelectedProperty(null);
    
    try {
      // Force immediate refresh of both properties and inspections with fresh data
      await Promise.all([
        refetchProperties(),
        refetchInspections()
      ]);
      
      console.log('✅ Data refresh completed successfully after property deletion');
    } catch (error) {
      console.error('❌ Error during data refresh:', error);
      // Force a hard refresh if normal refetch fails
      window.location.reload();
    }
  };

  const handleRetry = async () => {
    try {
      await Promise.all([
        refetchProperties(),
        refetchInspections()
      ]);
    } catch (error) {
      console.error('❌ Retry failed:', error);
    }
  };

  // Handle errors
  if (propertiesError || inspectionsError) {
    const error = propertiesError || inspectionsError;
    return (
      <PropertySelectionError 
        error={error}
        onRetry={handleRetry}
      />
    );
  }

  // Show loading state
  if (propertiesLoading || inspectionsLoading) {
    return <PropertySelectionLoading />;
  }

  return (
    <PropertySelectionContent
      properties={properties}
      inspections={inspections}
      selectedProperty={selectedProperty}
      setSelectedProperty={setSelectedProperty}
      handleStartInspection={handleStartInspection}
      getPropertyStatus={getPropertyStatus}
      isCreatingInspection={isCreatingInspection}
      onPropertyDeleted={handlePropertyDeleted}
    />
  );
};

export default PropertySelection;
