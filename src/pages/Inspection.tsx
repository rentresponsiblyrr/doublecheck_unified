
import { useEffect } from "react";
import { useParams } from "react-router-dom";
import { useInspectionData } from "@/hooks/useInspectionData";
import { InspectionInvalidState } from "@/components/InspectionInvalidState";
import { InspectionLoadingState } from "@/components/InspectionLoadingState";
import { InspectionContent } from "@/components/InspectionContent";
import { MobileErrorRecovery } from "@/components/MobileErrorRecovery";
import { useMobileAuth } from "@/hooks/useMobileAuth";
import { useNavigate } from "react-router-dom";
import { debugLogger } from "@/utils/debugLogger";
import { Button } from "@/components/ui/button";
import { Bug } from "lucide-react";

const Inspection = () => {
  debugLogger.info('Inspection', 'Component mounting');
  
  const params = useParams<{ id?: string }>();
  const { isAuthenticated, loading: authLoading } = useMobileAuth();
  const navigate = useNavigate();
  
  // Get inspectionId from route parameters
  const inspectionId = params.id;

  debugLogger.info('Inspection', 'Route analysis', { 
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
    debugLogger.info('Inspection', 'Showing auth loading state');
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
    debugLogger.error('Inspection', 'No inspection ID in route params', {
      params,
      expectedParam: 'id',
      routeDefinition: '/inspection/:id',
      pathname: window.location.pathname,
      search: window.location.search,
      hash: window.location.hash
    });
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <InspectionInvalidState />
          <Button 
            onClick={() => navigate('/debug-inspection/550e8400-e29b-41d4-a716-446655440000')}
            className="mt-4"
            variant="outline"
          >
            <Bug className="w-4 h-4 mr-2" />
            Debug Mode
          </Button>
        </div>
      </div>
    );
  }

  // Validate UUID format
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(inspectionId)) {
    debugLogger.error('Inspection', 'Invalid inspection ID format', { inspectionId });
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <InspectionInvalidState />
          <Button 
            onClick={() => navigate(`/debug-inspection/${inspectionId}`)}
            className="mt-4"
            variant="outline"
          >
            <Bug className="w-4 h-4 mr-2" />
            Debug This ID
          </Button>
        </div>
      </div>
    );
  }

  const { 
    checklistItems, 
    isLoading,
    refetch, 
    isRefetching,
    error
  } = useInspectionData(inspectionId);

  // Initialize inspector presence tracking - RE-ENABLED after DB fixes

  // Log component state changes
  useEffect(() => {
    debugLogger.info('Inspection', 'State change', {
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


  // Handle errors with mobile-optimized recovery
  if (error) {
    debugLogger.error('Inspection', 'Page error', error);
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <MobileErrorRecovery
          error={error}
          onRetry={refetch}
          onNavigateHome={() => navigate('/properties')}
          context="Inspection loading"
        />
        <div className="text-center mt-4">
          <Button 
            onClick={() => navigate(`/debug-inspection/${inspectionId}`)}
            variant="outline"
          >
            <Bug className="w-4 h-4 mr-2" />
            Debug Mode
          </Button>
        </div>
      </div>
    );
  }

  // Show loading state
  if (isLoading) {
    debugLogger.info('Inspection', 'Showing loading state');
    return (
      <div className="min-h-screen bg-gray-50">
        <InspectionLoadingState inspectionId={inspectionId} />
        <div className="text-center mt-4">
          <Button 
            onClick={() => navigate(`/debug-inspection/${inspectionId}`)}
            variant="outline"
            size="sm"
          >
            <Bug className="w-4 h-4 mr-2" />
            Debug
          </Button>
        </div>
      </div>
    );
  }

  debugLogger.info('Inspection', 'Rendering content', {
    inspectionId,
    itemCount: checklistItems.length
  });

  return (
    <>
      <InspectionContent
        inspectionId={inspectionId}
        checklistItems={checklistItems}
        onRefetch={refetch}
        isRefetching={isRefetching}
      />
      
      {/* Debug button in development */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-4 right-4">
          <Button 
            onClick={() => navigate(`/debug-inspection/${inspectionId}`)}
            variant="outline"
            size="sm"
          >
            <Bug className="w-4 h-4 mr-2" />
            Debug
          </Button>
        </div>
      )}
    </>
  );
};

export default Inspection;
