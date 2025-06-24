
import { useState } from "react";
import { PropertyHeader } from "@/components/PropertyHeader";
import { AddPropertyButton } from "@/components/AddPropertyButton";
import { MobilePropertyList } from "@/components/MobilePropertyList";
import { StartInspectionButton } from "@/components/StartInspectionButton";
import { useMobileAuth } from "@/hooks/useMobileAuth";
import { useMobilePropertyData } from "@/hooks/useMobilePropertyData";
import { useMobilePropertyActions } from "@/hooks/useMobilePropertyActions";
import { useMobileInspectionFlow } from "@/hooks/useMobileInspectionFlow";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";

const MobileIndex = () => {
  const { user, isAuthenticated, loading: authLoading } = useMobileAuth();
  const { data: properties, isLoading, error, refetch, isFetching } = useMobilePropertyData(user?.id);
  const { handleEdit, handleDelete } = useMobilePropertyActions();
  const { startOrJoinInspection, isLoading: isCreatingInspection, error: inspectionError } = useMobileInspectionFlow();

  const [selectedProperty, setSelectedProperty] = useState<string | null>(null);

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
    retry: 1,
    staleTime: 30000,
    enabled: isAuthenticated
  });

  const handlePropertySelect = (propertyId: string) => {
    console.log('📱 Mobile property selected:', propertyId);
    setSelectedProperty(propertyId === selectedProperty ? null : propertyId);
  };

  const handleStartInspection = async () => {
    if (!selectedProperty) {
      console.warn('⚠️ No property selected for inspection');
      return;
    }

    await startOrJoinInspection(selectedProperty);
  };

  const handlePropertyCardInspection = async (propertyId: string) => {
    console.log('📱 Property card inspection start:', propertyId);
    
    // Select the property first if not already selected
    if (propertyId !== selectedProperty) {
      setSelectedProperty(propertyId);
    }
    
    await startOrJoinInspection(propertyId);
  };

  const getPropertyStatus = (propertyId: string) => {
    const propertyInspections = inspections.filter(i => i.property_id === propertyId);
    const completedInspections = propertyInspections.filter(i => i.completed);
    const activeInspections = propertyInspections.filter(i => !i.completed);

    if (activeInspections.length > 0) {
      return { 
        status: 'in-progress', 
        color: 'bg-yellow-500', 
        text: 'In Progress',
        activeInspectionId: activeInspections[0].id
      };
    }
    if (completedInspections.length > 0) {
      return { 
        status: 'completed', 
        color: 'bg-green-500', 
        text: 'Completed',
        activeInspectionId: null
      };
    }
    return { 
      status: 'pending', 
      color: 'bg-gray-500', 
      text: 'Not Started',
      activeInspectionId: null
    };
  };

  const getButtonText = (propertyId: string) => {
    const status = getPropertyStatus(propertyId);
    if (status.status === 'in-progress') {
      return 'Join Inspection';
    }
    return 'Start Inspection';
  };

  // Show loading while auth is initializing
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  console.log('📱 MobileIndex optimized rendering:', { 
    isAuthenticated, 
    propertiesCount: properties?.length || 0, 
    isLoading, 
    error: !!error,
    selectedProperty,
    inspectionsCount: inspections?.length || 0,
    authLoading
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <PropertyHeader 
        title="DoubleCheck Mobile"
        subtitle="Select a property to begin inspection"
      />

      {/* Inspection Error Alert */}
      {inspectionError && (
        <div className="px-4 py-2">
          <Alert className="bg-red-50 border-red-200">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              {inspectionError}
            </AlertDescription>
          </Alert>
        </div>
      )}

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

      {/* Start/Join Inspection Button */}
      {selectedProperty && (
        <StartInspectionButton 
          onStartInspection={handleStartInspection}
          isLoading={isCreatingInspection}
          buttonText={getButtonText(selectedProperty)}
          isJoining={getPropertyStatus(selectedProperty).status === 'in-progress'}
        />
      )}
    </div>
  );
};

export default MobileIndex;
