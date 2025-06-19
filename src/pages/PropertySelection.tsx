
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, ExternalLink, Plus } from "lucide-react";
import { LoadingSpinner } from "@/components/LoadingSpinner";

interface Property {
  id: string;
  name: string;
  address: string;
  vrbo_url: string | null;
  status: string | null;
}

interface Inspection {
  id: string;
  property_id: string;
  completed: boolean;
  start_time: string | null;
}

const PropertySelection = () => {
  const navigate = useNavigate();
  const [selectedProperty, setSelectedProperty] = useState<string | null>(null);

  const { data: properties = [], isLoading: propertiesLoading } = useQuery({
    queryKey: ['properties'],
    queryFn: async () => {
      console.log('Fetching properties...');
      
      const { data, error } = await supabase
        .from('properties')
        .select('*')
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

  const handleStartInspection = async () => {
    if (!selectedProperty) return;

    try {
      console.log('Creating new inspection for property:', selectedProperty);
      
      const { data: inspection, error } = await supabase
        .from('inspections')
        .insert({
          property_id: selectedProperty,
          start_time: new Date().toISOString(),
          completed: false
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating inspection:', error);
        throw error;
      }

      console.log('Created inspection:', inspection);
      navigate(`/inspection/${inspection.id}`);
    } catch (error) {
      console.error('Failed to start inspection:', error);
    }
  };

  const getPropertyStatus = (propertyId: string) => {
    const propertyInspections = inspections.filter(i => i.property_id === propertyId);
    const completedInspections = propertyInspections.filter(i => i.completed);
    const activeInspections = propertyInspections.filter(i => !i.completed);

    if (activeInspections.length > 0) {
      return { status: 'in-progress', color: 'bg-yellow-500', text: 'In Progress' };
    }
    if (completedInspections.length > 0) {
      return { status: 'completed', color: 'bg-green-500', text: 'Completed' };
    }
    return { status: 'pending', color: 'bg-gray-500', text: 'Not Started' };
  };

  if (propertiesLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="px-4 py-6">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900">DoubleCheck</h1>
            <p className="text-sm text-gray-600 mt-1">Powered by Rent Responsibly</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-4 py-6">
        <div className="text-center mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Choose a Property to Inspect
          </h2>
          <p className="text-gray-600">
            Select a property below to begin your inspection
          </p>
        </div>

        {properties.length === 0 ? (
          <div className="text-center py-12">
            <div className="bg-white rounded-lg border border-gray-200 p-8">
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No Properties Available
              </h3>
              <p className="text-gray-600 mb-4">
                There are no properties available for inspection at this time.
              </p>
              <Button variant="outline" className="gap-2">
                <Plus className="w-4 h-4" />
                Contact Admin to Add Properties
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {properties.map((property) => {
              const status = getPropertyStatus(property.id);
              const isSelected = selectedProperty === property.id;
              
              return (
                <Card 
                  key={property.id}
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    isSelected ? 'ring-2 ring-blue-500 bg-blue-50' : ''
                  }`}
                  onClick={() => setSelectedProperty(property.id)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg">{property.name}</CardTitle>
                        <CardDescription className="flex items-center gap-1 mt-1">
                          <MapPin className="w-4 h-4" />
                          {property.address}
                        </CardDescription>
                      </div>
                      <Badge className={`${status.color} text-white`}>
                        {status.text}
                      </Badge>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="pt-0">
                    {property.vrbo_url && (
                      <div className="flex items-center gap-2 text-sm text-blue-600">
                        <ExternalLink className="w-4 h-4" />
                        <span>View Vrbo Listing</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Start Inspection Button */}
        {selectedProperty && (
          <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4">
            <Button 
              onClick={handleStartInspection}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3"
              size="lg"
            >
              Start Inspection
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PropertySelection;
