
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PropertySelectionErrorProps {
  error: Error | { message: string };
  onRetry: () => void;
}

export const PropertySelectionError = ({ error, onRetry }: PropertySelectionErrorProps) => {
  
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center bg-white p-8 rounded-lg shadow-md max-w-md">
        <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Error Loading Data
        </h2>
        <p className="text-gray-600 mb-4">
          {error?.message || 'Failed to load properties and inspections.'}
        </p>
        <Button onClick={onRetry} className="w-full">
          Try Again
        </Button>
      </div>
    </div>
  );
};
