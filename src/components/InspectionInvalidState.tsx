
import { Button } from "@/components/ui/button";
import { AlertTriangle, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

export const InspectionInvalidState = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center bg-white p-8 rounded-lg shadow-md max-w-md">
        <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Invalid Inspection
        </h2>
        <p className="text-gray-600 mb-4">
          No inspection ID was provided in the URL.
        </p>
        <Button onClick={() => navigate('/properties')} className="w-full">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Return to Properties
        </Button>
      </div>
    </div>
  );
};
