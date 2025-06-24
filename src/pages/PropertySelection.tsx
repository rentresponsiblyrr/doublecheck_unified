
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { usePropertySelection } from "@/hooks/usePropertySelection";
import { useRobustInspectionCreation } from "@/hooks/useRobustInspectionCreation";
import { PropertySelectionError } from "@/components/PropertySelectionError";
import { PropertySelectionLoading } from "@/components/PropertySelectionLoading";
import { PropertySelectionContent } from "@/components/PropertySelectionContent";

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

const PropertySelection = () => {
  console.log('🏠 PropertySelection component mounting');

  const { data: properties = [], isLoading: propertiesLoading, error: propertiesError, refetch: refetchProperties } = useQuery({
    queryKey: ['properties'],
    queryFn: async () => {
      console.log('📊 Fetching properties with inspections from database...');
      
      const { data, error } = await supabase.rpc('get_properties_with_inspections');
      
      if (error) {
        console.error('❌ Error fetching properties:', error);
        throw error;
      }

      console.log('✅ Successfully fetched properties:', data?.length || 0);
      return data as PropertyData[];
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
    getPropertyStatus,
    getButtonText
  } = usePropertySelection(inspections);

  const { createInspection, isCreating } = useRobustInspectionCreation();

  const handleStartInspection = async () => {
    if (!selectedProperty) {
      console.error('❌ No property selected for inspection');
      return;
    }

    console.log('🚀 Starting inspection for property:', selectedProperty);
    
    const inspectionId = await createInspection(selectedProperty);
    
    if (inspectionId) {
      // Refresh data after successful creation
      await Promise.all([
        refetchProperties(),
        refetchInspections()
      ]);
      
      // Navigate to the inspection
      window.location.href = `/inspection/${inspectionId}`;
    }
  };

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
      getButtonText={getButtonText}
      isCreatingInspection={isCreating}
      onPropertyDeleted={handlePropertyDeleted}
    />
  );
};

export default PropertySelection;
