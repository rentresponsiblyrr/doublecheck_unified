
import { Button } from "@/components/ui/button";
import { AlertTriangle, ArrowLeft, Home } from "lucide-react";
import { useNavigate } from "react-router-dom";

export const InspectionInvalidState = () => {
  const navigate = useNavigate();

  const handleGoHome = () => {
    // REMOVED: console.log('🏠 Navigating to home from invalid inspection state');
    navigate('/', { replace: true });
  };

  const handleGoToProperties = () => {
    // REMOVED: console.log('📋 Navigating to properties from invalid inspection state');
    navigate('/properties', { replace: true });
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="text-center bg-white p-8 rounded-lg shadow-md max-w-md w-full">
        <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Invalid Inspection URL
        </h2>
        <p className="text-gray-600 mb-6">
          No inspection ID was found in the URL. Please select a property and start or join an inspection.
        </p>
        
        <div className="space-y-3">
          <Button onClick={handleGoHome} className="w-full">
            <Home className="w-4 h-4 mr-2" />
            Go to Home
          </Button>
          
          <Button onClick={handleGoToProperties} variant="outline" className="w-full">
            <ArrowLeft className="w-4 h-4 mr-2" />
            View Properties
          </Button>
        </div>
        
        <div className="mt-6 p-3 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-800">
            💡 To start an inspection: Select a property from the list and tap "Start Inspection" or "Join Inspection"
          </p>
        </div>
      </div>
    </div>
  );
};
