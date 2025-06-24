
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { usePropertySelection } from "@/hooks/usePropertySelection";

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

export const useOptimizedPropertySelection = () => {
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
    staleTime: 0,
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

  const onPropertyDeleted = async () => {
    // Clear selection if the deleted property was selected
    if (selectedProperty) {
      const stillExists = properties.some(p => p.id === selectedProperty);
      if (!stillExists) {
        setSelectedProperty(null);
      }
    }
    
    // Refresh both properties and inspections
    await Promise.all([
      refetchProperties(),
      refetchInspections()
    ]);
  };

  const isLoading = propertiesLoading || inspectionsLoading;
  const error = propertiesError || inspectionsError;

  const refetch = async () => {
    await Promise.all([
      refetchProperties(),
      refetchInspections()
    ]);
  };

  return {
    properties,
    inspections,
    selectedProperty,
    setSelectedProperty,
    handleStartInspection,
    getPropertyStatus,
    getButtonText,
    isCreatingInspection,
    onPropertyDeleted,
    isLoading,
    error,
    refetch
  };
};
