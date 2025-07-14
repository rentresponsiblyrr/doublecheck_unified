
import { Button } from "@/components/ui/button";
import { Play, Users } from "lucide-react";

interface StartInspectionButtonProps {
  onStartInspection: () => void;
  isLoading: boolean;
  buttonText?: string;
  isJoining?: boolean;
  disabled?: boolean;
}

export const StartInspectionButton = ({ 
  onStartInspection, 
  isLoading,
  buttonText = "Start Inspection",
  isJoining = false,
  disabled = false
}: StartInspectionButtonProps) => {
  return (
    <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200 shadow-lg">
      <Button
        onClick={onStartInspection}
        disabled={isLoading || disabled}
        className="w-full py-4 text-lg font-semibold bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400"
        size="lg"
      >
        {isLoading ? (
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            {isJoining ? "Joining..." : "Creating..."}
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
