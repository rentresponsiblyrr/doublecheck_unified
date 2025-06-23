
import { LoadingSpinner } from "@/components/LoadingSpinner";

interface InspectionLoadingStateProps {
  inspectionId: string;
}

export const InspectionLoadingState = ({ inspectionId }: InspectionLoadingStateProps) => {
  console.log('⏳ Showing loading state for inspection:', inspectionId);
  
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="px-4 py-6">
        <LoadingSpinner message="Loading inspection checklist..." />
      </div>
    </div>
  );
};
