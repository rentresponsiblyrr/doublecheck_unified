
import { useParams, useNavigate } from "react-router-dom";
import { useCleanAuth } from "@/hooks/useCleanAuth";
import { useDebugInspectionData } from "@/hooks/useDebugInspectionData";
import { debugLogger } from "@/utils/debugLogger";
import { InspectionLoadingState } from "@/components/InspectionLoadingState";
import { DebugInspectionContent } from "@/components/DebugInspectionContent";
import { MobileErrorRecovery } from "@/components/MobileErrorRecovery";
import { Button } from "@/components/ui/button";
import { AlertTriangle, ArrowLeft, Home } from "lucide-react";

export const DebugInspectionPage = () => {
  debugLogger.info('DebugInspectionPage', 'Component rendering');
  
  const params = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const inspectionId = params.id;

  const { user, loading: authLoading, error: authError, isAuthenticated } = useCleanAuth();
  
  debugLogger.info('DebugInspectionPage', 'Route and auth analysis', { 
    params, 
    inspectionId,
    isAuthenticated,
    authLoading,
    hasAuthError: !!authError,
    userId: user?.id
  });

  // Early validation - missing inspection ID
  if (!inspectionId) {
    debugLogger.error('DebugInspectionPage', 'No inspection ID in route params', {
      params,
      pathname: window.location.pathname
    });
    
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg p-6 shadow-lg max-w-md w-full text-center">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Debug Mode: Invalid Inspection</h2>
          <p className="text-gray-600 mb-4">No inspection ID found in the URL.</p>
          <div className="space-y-2">
            <Button onClick={() => navigate('/properties')} className="w-full">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Return to Properties
            </Button>
            <Button onClick={() => navigate('/')} variant="outline" className="w-full">
              <Home className="w-4 h-4 mr-2" />
              Go Home
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Auth loading state
  if (authLoading) {
    debugLogger.info('DebugInspectionPage', 'Showing auth loading state');
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Debug Mode: Authenticating...</p>
        </div>
      </div>
    );
  }

  // Auth error state
  if (authError) {
    debugLogger.error('DebugInspectionPage', 'Authentication error', authError);
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg p-6 shadow-lg max-w-md w-full text-center">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Debug Mode: Authentication Error</h2>
          <p className="text-gray-600 mb-4">{authError}</p>
          <Button onClick={() => window.location.reload()} className="w-full">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  // Not authenticated state
  if (!isAuthenticated) {
    debugLogger.warn('DebugInspectionPage', 'User not authenticated');
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg p-6 shadow-lg max-w-md w-full text-center">
          <AlertTriangle className="w-12 h-12 text-orange-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Debug Mode: Authentication Required</h2>
          <p className="text-gray-600 mb-4">Please sign in to view this inspection.</p>
          <Button onClick={() => navigate('/')} className="w-full">
            Go to Sign In
          </Button>
        </div>
      </div>
    );
  }

  return <DebugDataLoader inspectionId={inspectionId} />;
};

const DebugDataLoader = ({ inspectionId }: { inspectionId: string }) => {
  const navigate = useNavigate();
  const { checklistItems, isLoading, refetch, error } = useDebugInspectionData(inspectionId);

  debugLogger.info('DebugDataLoader', 'Data loader state', {
    inspectionId,
    isLoading,
    itemCount: checklistItems.length,
    hasError: !!error
  });

  // Handle data loading errors
  if (error) {
    debugLogger.error('DebugDataLoader', 'Data loading error', error);
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <MobileErrorRecovery
          error={error}
          onRetry={refetch}
          onNavigateHome={() => navigate('/properties')}
          context="Debug Mode: Loading inspection data"
        />
      </div>
    );
  }

  // Show loading state
  if (isLoading) {
    debugLogger.info('DebugDataLoader', 'Showing loading state');
    return <InspectionLoadingState inspectionId={inspectionId} />;
  }

  // Show success state with data
  debugLogger.info('DebugDataLoader', 'Rendering debug inspection content', {
    itemCount: checklistItems.length
  });

  return (
    <DebugInspectionContent
      inspectionId={inspectionId}
      checklistItems={checklistItems}
      onRefetch={refetch}
      isRefetching={false}
    />
  );
};
