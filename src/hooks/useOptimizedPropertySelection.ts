
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { usePropertySelection } from "@/hooks/usePropertySelection";
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
}

export const useOptimizedPropertySelection = () => {
  const { user } = useAuth();

  const { data: properties = [], isLoading: propertiesLoading, error: propertiesError, refetch: refetchProperties } = useQuery({
    queryKey: ['properties', user?.id],
    queryFn: async () => {
      if (!user?.id) {
        console.log('❌ No user ID available, returning empty properties');
        return [];
      }

      console.log('📊 Fetching properties with inspections for user:', user.id);
      
      const { data, error } = await supabase.rpc('get_properties_with_inspections', {
        _user_id: user.id
      });
      
      if (error) {
        console.error('❌ Error fetching properties:', error);
        throw error;
      }

      console.log('✅ Successfully fetched properties for user:', data?.length || 0);
      return data as PropertyData[];
    },
    enabled: !!user?.id,
    retry: 2,
    staleTime: 5 * 60 * 1000, // 5 minutes - prevent infinite refetch loop
  });

  const { data: inspections = [], isLoading: inspectionsLoading, error: inspectionsError, refetch: refetchInspections } = useQuery({
    queryKey: ['inspections', user?.id],
    queryFn: async () => {
      if (!user?.id) {
        console.log('❌ No user ID available, returning empty inspections');
        return [];
      }

      console.log('📊 Fetching inspections for user:', user.id);
      
      const { data, error } = await supabase
        .from('inspections')
        .select('*')
        .eq('inspector_id', user.id);
      
      if (error) {
        console.error('❌ Error fetching inspections:', error);
        throw error;
      }

      console.log('✅ Successfully fetched inspections for user:', data?.length || 0);
      return data as Inspection[];
    },
    enabled: !!user?.id,
    retry: 2,
    staleTime: 5 * 60 * 1000, // 5 minutes - prevent infinite refetch loop
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
      const stillExists = properties.some(p => p.property_id === selectedProperty);
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
