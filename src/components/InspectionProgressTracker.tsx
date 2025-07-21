import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Clock, AlertCircle } from "lucide-react";

interface ProgressStats {
  total: number;
  completed: number;
  pending: number;
  failed: number;
}

interface InspectionProgressTrackerProps {
  stats: ProgressStats;
  inspectionId?: string;
  className?: string;
}

/**
 * InspectionProgressTracker component for showing inspection progress statistics
 * 
 * @param {InspectionProgressTrackerProps} props - Component props
 * @param {ProgressStats} props.stats - Progress statistics
 * @param {string} [props.inspectionId] - Optional inspection ID
 * @param {string} [props.className] - Additional CSS classes
 * @returns {JSX.Element} The InspectionProgressTracker component
 */
export const InspectionProgressTracker = ({ 
  stats, 
  inspectionId,
  className = "" 
}: InspectionProgressTrackerProps) => {
  const completionPercentage = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;

  return (
    <Card id="inspection-progress-tracker-container" className={className}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Inspection Progress</span>
          {inspectionId && (
            <Badge variant="outline" className="text-xs">
              {inspectionId.slice(0, 8)}...
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      
      <CardContent id="progress-tracker-content" className="space-y-4">
        <div id="progress-bar-section">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium">Overall Progress</span>
            <span className="text-sm text-gray-600">{completionPercentage}%</span>
          </div>
          <Progress value={completionPercentage} className="h-2" />
        </div>

        <div id="progress-stats-grid" className="grid grid-cols-3 gap-4">
          <div className="flex items-center space-x-2">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <div>
              <p className="text-xs text-gray-600">Completed</p>
              <p className="font-semibold text-green-600">{stats.completed}</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Clock className="h-4 w-4 text-yellow-600" />
            <div>
              <p className="text-xs text-gray-600">Pending</p>
              <p className="font-semibold text-yellow-600">{stats.pending}</p>
            </div>
          </div>

          {stats.failed > 0 && (
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <div>
                <p className="text-xs text-gray-600">Failed</p>
                <p className="font-semibold text-red-600">{stats.failed}</p>
              </div>
            </div>
          )}
        </div>

        <div id="progress-summary" className="text-xs text-gray-600 pt-2 border-t">
          Total items: {stats.total}
        </div>
      </CardContent>
    </Card>
  );
};