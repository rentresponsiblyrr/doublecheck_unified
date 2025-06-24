
import { ChecklistItemType } from '@/types/inspection';
import { CheckCircle, Clock, AlertTriangle, Minus } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

interface InspectionProgressTrackerProps {
  checklistItems: ChecklistItemType[];
  showDetailed?: boolean;
}

export const InspectionProgressTracker = ({ 
  checklistItems, 
  showDetailed = false 
}: InspectionProgressTrackerProps) => {
  const totalItems = checklistItems.length;
  const completedItems = checklistItems.filter(item => 
    item.status === 'completed' || item.status === 'failed' || item.status === 'not_applicable'
  ).length;
  const passedItems = checklistItems.filter(item => item.status === 'completed').length;
  const failedItems = checklistItems.filter(item => item.status === 'failed').length;
  const naItems = checklistItems.filter(item => item.status === 'not_applicable').length;
  const pendingItems = totalItems - completedItems;

  const progressPercentage = totalItems > 0 ? (completedItems / totalItems) * 100 : 0;
  const passRate = completedItems > 0 ? (passedItems / completedItems) * 100 : 0;

  if (!showDetailed) {
    return (
      <Card className="bg-white shadow-sm">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Progress</span>
            <span className="text-sm text-gray-600">
              {completedItems} of {totalItems}
            </span>
          </div>
          <Progress value={progressPercentage} className="h-2" />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>{Math.round(progressPercentage)}% complete</span>
            {completedItems > 0 && (
              <span>{Math.round(passRate)}% pass rate</span>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white shadow-sm">
      <CardContent className="p-4 space-y-4">
        {/* Overall Progress */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="font-medium text-gray-900">Overall Progress</span>
            <span className="text-sm text-gray-600">
              {completedItems}/{totalItems} items
            </span>
          </div>
          <Progress value={progressPercentage} className="h-3" />
          <p className="text-xs text-gray-500 mt-1">
            {Math.round(progressPercentage)}% complete
          </p>
        </div>

        {/* Detailed Breakdown */}
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span className="text-lg font-semibold text-green-600">{passedItems}</span>
            </div>
            <p className="text-xs text-gray-600">Passed</p>
          </div>

          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <AlertTriangle className="w-4 h-4 text-red-600" />
              <span className="text-lg font-semibold text-red-600">{failedItems}</span>
            </div>
            <p className="text-xs text-gray-600">Failed</p>
          </div>

          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Minus className="w-4 h-4 text-gray-600" />
              <span className="text-lg font-semibold text-gray-600">{naItems}</span>
            </div>
            <p className="text-xs text-gray-600">N/A</p>
          </div>

          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Clock className="w-4 h-4 text-blue-600" />
              <span className="text-lg font-semibold text-blue-600">{pendingItems}</span>
            </div>
            <p className="text-xs text-gray-600">Pending</p>
          </div>
        </div>

        {/* Pass Rate Indicator */}
        {completedItems > 0 && (
          <div className="pt-2 border-t border-gray-100">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Pass Rate</span>
              <span className={`text-sm font-medium ${passRate >= 80 ? 'text-green-600' : passRate >= 60 ? 'text-yellow-600' : 'text-red-600'}`}>
                {Math.round(passRate)}%
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
