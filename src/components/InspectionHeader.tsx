
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, RefreshCw, Users, Eye } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ChecklistItemType } from "@/types/inspection";
import { InspectorPresenceIndicator } from "@/components/InspectorPresenceIndicator";

interface InspectionHeaderProps {
  inspectionId: string;
  showCompleted: boolean;
  onToggleCompleted: () => void;
  completedCount: number;
  totalCount: number;
  checklistItems: ChecklistItemType[];
}

export const InspectionHeader = ({
  inspectionId,
  showCompleted,
  onToggleCompleted,
  completedCount,
  totalCount
}: InspectionHeaderProps) => {
  const navigate = useNavigate();

  const progressPercentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <div className="bg-white border-b border-gray-200 px-4 py-3">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/properties')}
            className="p-2"
            aria-label="Back to properties"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-semibold text-gray-900">
              Inspection
            </h1>
            
            {/* Multi-inspector indicator */}
            <InspectorPresenceIndicator inspectionId={inspectionId} />
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={onToggleCompleted}
          className="flex items-center gap-2"
        >
          <Eye className="w-4 h-4" />
          {showCompleted ? 'Hide' : 'Show'} Completed
        </Button>
      </div>

      {/* Progress */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Progress</span>
          <div className="flex items-center gap-2">
            <span className="font-medium text-gray-900">
              {completedCount} of {totalCount} completed
            </span>
            <Badge variant="secondary" className="text-xs">
              {progressPercentage}%
            </Badge>
          </div>
        </div>
        
        <div className="bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progressPercentage}%` }}
            role="progressbar"
            aria-valuenow={completedCount}
            aria-valuemin={0}
            aria-valuemax={totalCount}
            aria-label={`${completedCount} of ${totalCount} items completed`}
          />
        </div>
      </div>
    </div>
  );
};
