
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { PropertyHeader } from "@/components/PropertyHeader";
import { PropertyList } from "@/components/PropertyList";
import { StartInspectionButton } from "@/components/StartInspectionButton";
import { AddPropertyButton } from "@/components/AddPropertyButton";
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

const PropertySelection = () => {
  const { data: properties = [], isLoading: propertiesLoading } = useQuery({
    queryKey: ['properties'],
    queryFn: async () => {
      console.log('Fetching properties...');
      
      const { data, error } = await supabase
        .from('properties')
        .select('id, name, address, vrbo_url, airbnb_url, status')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching properties:', error);
        throw error;
      }

      console.log('Fetched properties:', data);
      return data as Property[];
    },
  });

  const { data: inspections = [] } = useQuery({
    queryKey: ['inspections'],
    queryFn: async () => {
      console.log('Fetching inspections...');
      
      const { data, error } = await supabase
        .from('inspections')
        .select('*');
      
      if (error) {
        console.error('Error fetching inspections:', error);
        throw error;
      }

      console.log('Fetched inspections:', data);
      return data as Inspection[];
    },
  });

  const {
    selectedProperty,
    setSelectedProperty,
    handleStartInspection,
    getPropertyStatus
  } = usePropertySelection(inspections);

  if (propertiesLoading) {
    return <LoadingSpinner message="Loading properties..." />;
  }

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
          getPropertyStatus={getPropertyStatus}
        />

        <div className="mt-6">
          <AddPropertyButton />
        </div>

        {selectedProperty && (
          <StartInspectionButton onStartInspection={handleStartInspection} />
        )}
      </div>
    </div>
  );
};

export default PropertySelection;
