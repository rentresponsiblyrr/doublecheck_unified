
import { Button } from "@/components/ui/button";
import { AlertTriangle, ArrowLeft, Home } from "lucide-react";
import { debugLogger } from "@/utils/debugLogger";

interface DebugAuthStatesProps {
  inspectionId?: string;
  authLoading: boolean;
  authError: string | null;
  isAuthenticated: boolean;
  navigate: (path: string) => void;
}

export const DebugAuthStates = ({
  inspectionId,
  authLoading,
  authError,
  isAuthenticated,
  navigate
}: DebugAuthStatesProps) => {
  // Early validation - missing inspection ID
  if (!inspectionId) {
    debugLogger.error('DebugAuthStates', 'No inspection ID in route params', {
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
    debugLogger.info('DebugAuthStates', 'Showing auth loading state');
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
    debugLogger.error('DebugAuthStates', 'Authentication error', authError);
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg p-6 shadow-lg max-w-md w-full text-center">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Debug Mode: Authentication Error</h2>
          <p className="text-gray-600 mb-4">{authError}</p>
          <Button onClick={() => window.location.replace(window.location.pathname)} className="w-full">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  // Not authenticated state
  if (!isAuthenticated) {
    debugLogger.warn('DebugAuthStates', 'User not authenticated');
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

  // Return null if no auth state needs to be handled
  return null;
};
