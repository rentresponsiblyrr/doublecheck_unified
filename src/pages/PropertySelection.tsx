import React from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { usePropertySelection } from "@/hooks/usePropertySelection";
import { useRobustInspectionCreation } from "@/hooks/useRobustInspectionCreation";
import { PropertySelectionError } from "@/components/PropertySelectionError";
import { PropertySelectionLoading } from "@/components/PropertySelectionLoading";
import { PropertySelectionContent } from "@/components/PropertySelectionContent";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Tables } from "@/integrations/supabase/types";

// Use proper TypeScript types from Supabase
type Property = Tables<"properties">;
type Inspection = Tables<"inspections">;

interface PropertyData {
  property_id: string; // UUID from database - keeping as string for frontend consistency
  property_name: string;
  property_address: string;
  property_vrbo_url: string | null;
  property_airbnb_url: string | null;
  property_status?: string;
  property_created_at?: string;
  inspection_count?: number;
  completed_inspection_count?: number;
  active_inspection_count?: number;
  draft_inspection_count?: number;
  review_pipeline_count?: number;
  approved_count?: number;
  rejected_count?: number;
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
  // Mount logging removed to prevent infinite console loops
  const navigate = useNavigate();
  const { user } = useAuth();

  const {
    data: properties = [],
    isLoading: propertiesLoading,
    error: propertiesError,
    refetch: refetchProperties,
  } = useQuery({
    queryKey: ["properties", user?.id],
    queryFn: async () => {
      if (!user?.id) {
        // REMOVED: Console logging to prevent infinite loops
        return [];
      }

      // REMOVED: Console logging to prevent infinite loops

      // Use the existing get_properties_with_inspections function that works
      const { data: propertiesData, error: propertiesError } =
        await supabase.rpc("get_properties_with_inspections", {
          _user_id: user.id,
        });

      if (propertiesError) {
        throw propertiesError;
      }

      // Debug logs removed to prevent infinite console loops
      // Properties fetched successfully: ${propertiesData?.length || 0}

      // The function returns the exact data structure we need
      return propertiesData || [];
    },
    enabled: !!user?.id, // Only run query when user is available
    retry: 2,
    staleTime: 5 * 60 * 1000, // 5 minutes - prevent infinite refetch loop
  });

  // FIXED: Use computed_status from RPC instead of incorrectly deriving status
  const inspections = React.useMemo(() => {
    if (!properties?.length) return [];

    return properties
      .filter(
        (property) =>
          property.latest_inspection_id ||
          property.computed_status !== "not_started",
      )
      .map((property) => ({
        id: property.latest_inspection_id || `temp-${property.property_id}`,
        property_id: property.property_id, // FIXED: Use correct field from RPC function
        completed: property.latest_inspection_completed || false,
        start_time: null,
        // CRITICAL FIX: Use computed_status from RPC function instead of deriving incorrectly
        status:
          property.computed_status === "in_progress"
            ? "in_progress"
            : property.computed_status === "completed"
              ? "completed"
              : property.computed_status === "not_started"
                ? "draft"
                : "draft",
      }));
  }, [properties]);

  const inspectionsLoading = propertiesLoading;
  const inspectionsError = propertiesError;
  const refetchInspections = refetchProperties;

  const {
    selectedProperty,
    setSelectedProperty,
    handleStartInspection,
    handleRetryInspection,
    getPropertyStatus,
    getButtonText,
    isCreatingInspection,
    inspectionError,
    clearError,
  } = usePropertySelection(inspections);

  // Use the robust creation hook as a fallback for custom inspection creation
  const { createInspection, isCreating } = useRobustInspectionCreation();

  const handleInspectionCreated = async () => {
    // Refresh data after successful creation (only need to refetch properties)
    await refetchProperties();
  };

  const handlePropertyDeleted = async () => {
    // REMOVED: Console logging to prevent infinite loops

    // Clear selection immediately
    setSelectedProperty(null);

    try {
      // Force immediate refresh of properties data (contains inspection info)
      await refetchProperties();

      // REMOVED: Console logging to prevent infinite loops
    } catch (error) {
      // Use proper error handling instead of nuclear reload
      // Clear the query cache and try again
      try {
        await refetchProperties();
      } catch (retryError) {
        // Last resort: navigate to home page instead of reload
        navigate("/", { replace: true });
      }
    }
  };

  const handleRetry = async () => {
    try {
      await Promise.all([refetchProperties(), refetchInspections()]);
    } catch (error) {}
  };

  // Handle errors
  if (propertiesError || inspectionsError) {
    const error = propertiesError || inspectionsError;
    return <PropertySelectionError error={error} onRetry={handleRetry} />;
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
