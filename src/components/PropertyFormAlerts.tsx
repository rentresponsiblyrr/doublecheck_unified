
import { Alert, AlertDescription } from "@/components/ui/alert";
import { WifiOff, AlertCircle } from "lucide-react";

interface PropertyFormAlertsProps {
  isOnline: boolean;
  user: any;
}

export const PropertyFormAlerts = ({ isOnline, user }: PropertyFormAlertsProps) => {
  return (
    <>
      {/* Network status alert */}
      {!isOnline && (
        <Alert className="mb-4 border-red-200 bg-red-50">
          <WifiOff className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            You're currently offline. Please check your internet connection before submitting.
          </AlertDescription>
        </Alert>
      )}

      {/* Authentication status alert */}
      {!user && (
        <Alert className="mb-4 border-yellow-200 bg-yellow-50">
          <AlertCircle className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-yellow-800">
            You need to be logged in to add or edit properties.
          </AlertDescription>
        </Alert>
      )}
    </>
  );
};
