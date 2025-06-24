
import { useEffect } from "react";
import { useParams } from "react-router-dom";
import { useInspectionData } from "@/hooks/useInspectionData";
import { useInspectorPresence } from "@/hooks/useInspectorPresence";
import { InspectionInvalidState } from "@/components/InspectionInvalidState";
import { InspectionLoadingState } from "@/components/InspectionLoadingState";
import { InspectionContent } from "@/components/InspectionContent";
import { MobileErrorRecovery } from "@/components/MobileErrorRecovery";
import { useMobileAuth } from "@/hooks/useMobileAuth";
import { useNavigate } from "react-router-dom";

const Inspection = () => {
  console.log('🏗️ Inspection component mounting');
  
  const params = useParams<{ id?: string }>();
  const { isAuthenticated, loading: authLoading } = useMobileAuth();
  const navigate = useNavigate();
  
  // Get inspectionId from route parameters (using 'id' to match route)
  const inspectionId = params.id;

  console.log('🔗 Inspection route params:', { 
    params, 
    inspectionId,
    paramKeys: Object.keys(params),
    urlPath: window.location.pathname,
    currentRoute: 'inspection/:id',
    isAuthenticated,
    authLoading
  });

  // Show loading while auth is initializing
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Initializing...</p>
        </div>
      </div>
    );
  }

  // Early return for missing inspectionId with detailed logging
  if (!inspectionId) {
    console.error('❌ No inspectionId in route params:', {
      params,
      expectedParam: 'id',
      routeDefinition: '/inspection/:id',
      pathname: window.location.pathname,
      search: window.location.search,
      hash: window.location.hash
    });
    return <InspectionInvalidState />;
  }

  // Validate UUID format
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(inspectionId)) {
    console.error('❌ Invalid inspection ID format:', inspectionId);
    return <InspectionInvalidState />;
  }

  const { 
    checklistItems, 
    isLoading,
    refetch, 
    isRefetching,
    error
  } = useInspectionData(inspectionId);

  // Initialize inspector presence tracking
  const { updatePresence } = useInspectorPresence(inspectionId);

  // Log component state changes
  useEffect(() => {
    console.log('🔄 Inspection component state:', {
      inspectionId,
      isLoading,
      isRefetching,
      itemCount: checklistItems.length,
      hasError: !!error,
      pathname: window.location.pathname,
      routeMatch: 'success',
      isAuthenticated
    });
  }, [inspectionId, isLoading, isRefetching, checklistItems.length, error, isAuthenticated]);

  // Update presence when page loads
  useEffect(() => {
    if (inspectionId && isAuthenticated) {
      console.log('📍 Updating inspector presence for:', inspectionId);
      updatePresence('online');
    }
  }, [inspectionId, isAuthenticated, updatePresence]);

  // Handle errors with mobile-optimized recovery
  if (error) {
    console.error('💥 Inspection page error:', error);
    return (
      <MobileErrorRecovery
        error={error}
        onRetry={refetch}
        onNavigateHome={() => navigate('/properties')}
        context="Inspection loading"
      />
    );
  }

  // Show loading state
  if (isLoading) {
    return <InspectionLoadingState inspectionId={inspectionId} />;
  }

  return (
    <InspectionContent
      inspectionId={inspectionId}
      checklistItems={checklistItems}
      onRefetch={refetch}
      isRefetching={isRefetching}
    />
  );
};

export default Inspection;
