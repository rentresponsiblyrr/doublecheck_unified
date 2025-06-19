
import { Button } from "@/components/ui/button";

interface StartInspectionButtonProps {
  onStartInspection: () => void;
}

export const StartInspectionButton = ({ onStartInspection }: StartInspectionButtonProps) => {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4">
      <Button 
        onClick={onStartInspection}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3"
        size="lg"
      >
        Start Inspection
      </Button>
    </div>
  );
};
