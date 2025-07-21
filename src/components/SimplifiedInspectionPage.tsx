
import { useParams, useNavigate } from "react-router-dom";
import { useCallback, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { useSimplifiedInspectionData } from "@/hooks/useSimplifiedInspectionData";
import { debugLogger } from "@/utils/debugLogger";
import { InspectionLoadingState } from "@/components/InspectionLoadingState";
import { InspectionContent } from "@/components/InspectionContent";
import { MobileErrorRecovery } from "@/components/MobileErrorRecovery";
import { Button } from "@/components/ui/button";
import { AlertTriangle, ArrowLeft, RefreshCw } from "lucide-react";

export const SimplifiedInspectionPage = () => {
  debugLogger.info('SimplifiedInspectionPage', 'Component rendering');
  
  const params = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const inspectionId = params.id;

  const { user, loading: authLoading, error: authError, refetch: refetchAuth } = useAuth();
  const isAuthenticated = !!user;
  const [authRetryKey, setAuthRetryKey] = useState(0);

  /**
   * WCAG 2.1 AA Compliance: Screen reader announcements
   * Announces all status changes to assistive technology users
   */
  const announceToScreenReader = useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', priority);
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only';
    announcement.textContent = message;
    document.body.appendChild(announcement);
    
    // Clean up announcement after screen readers have processed it
    setTimeout(() => {
      if (document.body.contains(announcement)) {
        document.body.removeChild(announcement);
      }
    }, 2000);
  }, []);
  
  debugLogger.info('SimplifiedInspectionPage', 'Route and auth analysis', { 
    params, 
    inspectionId,
    isAuthenticated,
    authLoading,
    hasAuthError: !!authError,
    userId: user?.id
  });

  // Early validation - missing inspection ID
  if (!inspectionId) {
    debugLogger.error('SimplifiedInspectionPage', 'No inspection ID in route params', {
      params,
      pathname: window.location.pathname
    });
    
    // WCAG 2.1 AA: Announce error to screen readers
    announceToScreenReader('Error: Invalid inspection URL. No inspection ID found.', 'assertive');
    
    return (
      <main 
        className="min-h-screen bg-gray-50 flex items-center justify-center p-4"
        aria-labelledby="invalid-inspection-title"
      >
        <div 
          className="bg-white rounded-lg p-6 shadow-lg max-w-md w-full text-center"
          role="alert"
          aria-live="assertive"
        >
          <AlertTriangle 
            className="w-12 h-12 text-red-500 mx-auto mb-4" 
            aria-hidden="true"
          />
          <h1 
            id="invalid-inspection-title"
            className="text-xl font-semibold text-gray-900 mb-2"
          >
            Invalid Inspection URL
          </h1>
          <p className="text-gray-600 mb-4" role="status">
            No inspection ID found in the URL. Please check the link and try again.
          </p>
          <Button 
            onClick={() => {
              announceToScreenReader('Navigating back to properties page.', 'polite');
              navigate('/properties');
            }} 
            className="w-full h-12 touch-manipulation focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            aria-label="Return to properties page to select a valid inspection"
          >
            <ArrowLeft className="w-4 h-4 mr-2" aria-hidden="true" />
            Return to Properties
          </Button>
        </div>
      </main>
    );
  }

  // Validate UUID format
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(inspectionId)) {
    debugLogger.error('SimplifiedInspectionPage', 'Invalid UUID format', { inspectionId });
    
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg p-6 shadow-lg max-w-md w-full text-center">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Invalid Inspection ID</h2>
          <p className="text-gray-600 mb-4">The inspection ID format is invalid.</p>
          <Button onClick={() => navigate('/properties')} className="w-full">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Return to Properties
          </Button>
        </div>
      </div>
    );
  }

  // Auth loading state
  if (authLoading) {
    debugLogger.info('SimplifiedInspectionPage', 'Showing auth loading state');
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Authenticating...</p>
        </div>
      </div>
    );
  }

  // Auth error state
  if (authError) {
    debugLogger.error('SimplifiedInspectionPage', 'Authentication error', authError);
    
    // WCAG 2.1 AA: Announce authentication error
    announceToScreenReader(`Authentication error: ${authError}`, 'assertive');
    
    return (
      <main 
        className="min-h-screen bg-gray-50 flex items-center justify-center p-4"
        aria-labelledby="auth-error-title"
      >
        <div 
          className="bg-white rounded-lg p-6 shadow-lg max-w-md w-full text-center"
          role="alert"
          aria-live="assertive"
        >
          <AlertTriangle 
            className="w-12 h-12 text-red-500 mx-auto mb-4" 
            aria-hidden="true"
          />
          <h1 
            id="auth-error-title"
            className="text-xl font-semibold text-gray-900 mb-2"
          >
            Authentication Error
          </h1>
          <p className="text-gray-600 mb-4" role="status">
            {authError}
          </p>
          <div className="space-y-2">
            <Button 
              onClick={() => {
                announceToScreenReader('Retrying authentication...', 'polite');
                // WCAG 2.1 AA: Professional error recovery - trigger auth retry without destroying session
                setAuthRetryKey(prev => prev + 1);
                if (refetchAuth) {
                  refetchAuth();
                } else {
                  // Graceful fallback: navigate to sign-in without nuclear reload
                  navigate('/', { replace: true });
                }
              }} 
              className="w-full h-12 touch-manipulation focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              aria-label="Retry authentication to access inspection"
            >
              <RefreshCw className="w-4 h-4 mr-2" aria-hidden="true" />
              Try Again
            </Button>
            <Button 
              variant="outline"
              onClick={() => {
                announceToScreenReader('Navigating to properties page.', 'polite');
                navigate('/properties');
              }} 
              className="w-full h-12 touch-manipulation focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              aria-label="Return to properties page without retrying authentication"
            >
              <ArrowLeft className="w-4 h-4 mr-2" aria-hidden="true" />
              Return to Properties
            </Button>
          </div>
        </div>
      </main>
    );
  }

  // Not authenticated state
  if (!isAuthenticated) {
    debugLogger.warn('SimplifiedInspectionPage', 'User not authenticated');
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg p-6 shadow-lg max-w-md w-full text-center">
          <AlertTriangle className="w-12 h-12 text-orange-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Authentication Required</h2>
          <p className="text-gray-600 mb-4">Please sign in to view this inspection.</p>
          <Button onClick={() => navigate('/')} className="w-full">
            Go to Sign In
          </Button>
        </div>
      </div>
    );
  }

  return <InspectionDataLoader inspectionId={inspectionId} />;
};

const InspectionDataLoader = ({ inspectionId }: { inspectionId: string }) => {
  const navigate = useNavigate();
  const { checklistItems, isLoading, refetch, error } = useSimplifiedInspectionData(inspectionId);

  debugLogger.info('InspectionDataLoader', 'Data loader state', {
    inspectionId,
    isLoading,
    itemCount: checklistItems.length,
    hasError: !!error
  });

  // Handle data loading errors
  if (error) {
    debugLogger.error('InspectionDataLoader', 'Data loading error', { 
      message: error.message,
      name: error.name,
      stack: error.stack
    });
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <MobileErrorRecovery
          error={error}
          onRetry={refetch}
          onNavigateHome={() => navigate('/properties')}
          context="Loading inspection data"
        />
      </div>
    );
  }

  // Show loading state
  if (isLoading) {
    debugLogger.info('InspectionDataLoader', 'Showing loading state');
    return <InspectionLoadingState inspectionId={inspectionId} />;
  }

  // Show success state with data
  debugLogger.info('InspectionDataLoader', 'Rendering inspection content', {
    itemCount: checklistItems.length
  });

  return (
    <InspectionContent
      inspectionId={inspectionId}
      checklistItems={checklistItems}
      onRefetch={refetch}
      isRefetching={false}
    />
  );
};
