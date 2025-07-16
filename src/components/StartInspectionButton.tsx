
import { Button } from "@/components/ui/button";
import { Play, Users, AlertCircle, RefreshCw } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface StartInspectionButtonProps {
  onStartInspection: () => void;
  isLoading: boolean;
  buttonText?: string;
  isJoining?: boolean;
  disabled?: boolean;
  error?: string | null;
  onRetry?: () => void;
}

export const StartInspectionButton = ({ 
  onStartInspection, 
  isLoading,
  buttonText = "Start Inspection",
  isJoining = false,
  disabled = false,
  error = null,
  onRetry
}: StartInspectionButtonProps) => {
  const hasError = error !== null;
  const handleClick = hasError && onRetry ? onRetry : onStartInspection;
  
  return (
    <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200 shadow-lg">
      {/* Error Message Display */}
      {hasError && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <div className="flex items-center justify-between">
              <span className="text-sm">{error}</span>
              {onRetry && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onRetry}
                  className="ml-2 h-8 px-3"
                >
                  <RefreshCw className="h-3 w-3 mr-1" />
                  Retry
                </Button>
              )}
            </div>
          </AlertDescription>
        </Alert>
      )}
      
      {/* Main Action Button */}
      <Button
        onClick={handleClick}
        disabled={isLoading || disabled}
        className={`w-full py-4 text-lg font-semibold ${
          hasError 
            ? 'bg-red-600 hover:bg-red-700 disabled:bg-red-400' 
            : 'bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400'
        }`}
        size="lg"
      >
        {isLoading ? (
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            {isJoining ? "Joining..." : "Creating..."}
          </div>
        ) : hasError ? (
          <div className="flex items-center gap-2">
            <RefreshCw className="w-5 h-5" />
            Try Again
          </div>
        ) : (
          <div className="flex items-center gap-2">
            {isJoining ? <Users className="w-5 h-5" /> : <Play className="w-5 h-5" />}
            {buttonText}
          </div>
        )}
      </Button>
    </div>
  );
};
