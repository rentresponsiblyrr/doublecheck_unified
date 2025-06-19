
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface StartInspectionButtonProps {
  onStartInspection: () => void;
  isLoading?: boolean;
}

export const StartInspectionButton = ({ onStartInspection, isLoading = false }: StartInspectionButtonProps) => {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4">
      <Button 
        onClick={onStartInspection}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3"
        size="lg"
        disabled={isLoading}
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Creating Inspection...
          </>
        ) : (
          "Start Inspection"
        )}
      </Button>
    </div>
  );
};
