
import { Button } from "@/components/ui/button";
import { AlertTriangle, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface InspectionErrorStateProps {
  error: Error;
  onRetry: () => void;
}

export const InspectionErrorState = ({ error, onRetry }: InspectionErrorStateProps) => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center bg-white p-8 rounded-lg shadow-md max-w-md">
        <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Error Loading Inspection
        </h2>
        <p className="text-gray-600 mb-4">
          {error.message || 'An unexpected error occurred while loading the inspection.'}
        </p>
        <div className="space-y-2">
          <Button onClick={onRetry} className="w-full">
            Try Again
          </Button>
          <Button 
            variant="outline" 
            onClick={() => navigate('/properties')} 
            className="w-full"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Return to Properties
          </Button>
        </div>
      </div>
    </div>
  );
};
