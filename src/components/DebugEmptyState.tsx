
import { Button } from "@/components/ui/button";
import { RefreshCw, AlertCircle } from "lucide-react";

interface DebugEmptyStateProps {
  checklistItemsLength: number;
  showCompleted: boolean;
  onRefetch: () => void;
  isRefetching: boolean;
}

export const DebugEmptyState = ({
  checklistItemsLength,
  showCompleted,
  onRefetch,
  isRefetching
}: DebugEmptyStateProps) => {
  return (
    <div className="text-center py-8">
      <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
      <h3 className="text-lg font-medium text-gray-900 mb-2">
        {checklistItemsLength === 0 ? 'No Checklist Items' : 'No Items to Show'}
      </h3>
      <p className="text-gray-500 mb-4">
        {checklistItemsLength === 0 
          ? 'No checklist items found for this inspection.'
          : showCompleted 
            ? 'All items are completed. Toggle to show completed items.'
            : 'No incomplete items found.'
        }
      </p>
      <Button onClick={onRefetch} disabled={isRefetching}>
        <RefreshCw className={`w-4 h-4 mr-2 ${isRefetching ? 'animate-spin' : ''}`} />
        Try Again
      </Button>
    </div>
  );
};
