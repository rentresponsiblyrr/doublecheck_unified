
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { usePropertySelection } from "@/hooks/usePropertySelection";
import { useRobustInspectionCreation } from "@/hooks/useRobustInspectionCreation";
import { PropertySelectionError } from "@/components/PropertySelectionError";
import { PropertySelectionLoading } from "@/components/PropertySelectionLoading";
import { PropertySelectionContent } from "@/components/PropertySelectionContent";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/components/AuthProvider";

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
  status: string;
}

const PropertySelection = () => {
  console.log('🏠 PropertySelection component mounting');
  const navigate = useNavigate();
  const { user } = useAuth();

  const { data: properties = [], isLoading: propertiesLoading, error: propertiesError, refetch: refetchProperties } = useQuery({
    queryKey: ['properties', user?.id],
    queryFn: async () => {
      if (!user?.id) {
        console.log('❌ No user ID available, returning empty properties');
        return [];
      }

      console.log('📊 Fetching properties with inspections for user:', user.id);
      
      // TEMPORARY FIX: Direct query instead of missing RPC function
      // Get all properties and manually aggregate inspection data
      const { data: propertiesData, error: propertiesError } = await supabase
        .from('properties')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (propertiesError) {
        console.error('❌ Error fetching properties:', propertiesError);
        throw propertiesError;
      }

      // Get inspection stats for each property
      const { data: inspectionsData, error: inspectionsError } = await supabase
        .from('inspections')
        .select('property_id, completed, status, id, created_at')
        .eq('inspector_id', user.id);

      if (inspectionsError) {
        console.error('❌ Error fetching inspections:', inspectionsError);
        throw inspectionsError;
      }

      // Aggregate data to match the expected PropertyData interface
      const enrichedProperties = propertiesData.map(property => {
        // Convert integer ID to UUID-like string for frontend compatibility
        const propertyIdUuid = `00000000-0000-0000-0000-${property.id.toString().padStart(12, '0')}`;
        
        // Filter inspections for this property
        const propertyInspections = inspectionsData.filter(
          inspection => inspection.property_id === property.id
        );

        // Calculate stats
        const totalCount = propertyInspections.length;
        const completedCount = propertyInspections.filter(
          i => i.completed || i.status === 'completed' || i.status === 'approved'
        ).length;
        const activeCount = propertyInspections.filter(
          i => !i.completed && (i.status === 'draft' || i.status === 'in_progress' || i.status === 'pending_review')
        ).length;

        // Find latest inspection
        const latestInspection = propertyInspections
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];

        return {
          property_id: propertyIdUuid,
          property_name: property.name,
          property_address: property.address,
          property_vrbo_url: property.vrbo_url,
          property_airbnb_url: property.airbnb_url,
          property_status: property.status || 'active',
          property_created_at: property.created_at,
          inspection_count: totalCount,
          completed_inspection_count: completedCount,
          active_inspection_count: activeCount,
          latest_inspection_id: latestInspection?.id || null,
          latest_inspection_completed: latestInspection?.completed || null
        } as PropertyData;
      });

      console.log('✅ Successfully fetched properties with manual aggregation:', enrichedProperties.length);
      return enrichedProperties;
    },
    enabled: !!user?.id, // Only run query when user is available
    retry: 2,
    staleTime: 0, // Always refetch to ensure fresh data
  });

  const { data: inspections = [], isLoading: inspectionsLoading, error: inspectionsError, refetch: refetchInspections } = useQuery({
    queryKey: ['inspections', user?.id],
    queryFn: async () => {
      if (!user?.id) {
        console.log('❌ No user ID available, returning empty inspections');
        return [];
      }

      console.log('📊 Fetching inspections from database for user:', user.id);
      
      // Get all inspections for this user's properties to check status
      const { data: userProperties } = await supabase
        .from('properties')
        .select('id')
        .eq('added_by', user.id);
      
      if (!userProperties || userProperties.length === 0) {
        return [];
      }
      
      const propertyIds = userProperties.map(p => p.id);
      
      const { data, error } = await supabase
        .from('inspections')
        .select('id, property_id, completed, start_time, status, inspector_id')
        .in('property_id', propertyIds);
      
      if (error) {
        console.error('❌ Error fetching inspections:', error);
        throw error;
      }

      console.log('✅ Successfully fetched inspections for user:', data?.length || 0);
      return data as Inspection[];
    },
    enabled: !!user?.id, // Only run query when user is available
    retry: 2,
    staleTime: 0, // Always refetch to ensure fresh data
  });

  const {
    selectedProperty,
    setSelectedProperty,
    handleStartInspection,
    handleRetryInspection,
    getPropertyStatus,
    getButtonText,
    isCreatingInspection,
    inspectionError,
    clearError
  } = usePropertySelection(inspections);

  // Use the robust creation hook as a fallback for custom inspection creation
  const { createInspection, isCreating } = useRobustInspectionCreation();

  const handleInspectionCreated = async () => {
    // Refresh data after successful creation
    await Promise.all([
      refetchProperties(),
      refetchInspections()
    ]);
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
      handleRetryInspection={handleRetryInspection}
      getPropertyStatus={getPropertyStatus}
      getButtonText={getButtonText}
      isCreatingInspection={isCreatingInspection}
      inspectionError={inspectionError}
      onPropertyDeleted={handlePropertyDeleted}
    />
  );
};

export default PropertySelection;
