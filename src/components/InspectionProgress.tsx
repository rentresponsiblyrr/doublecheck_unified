
import { CheckCircle, Clock, AlertCircle } from "lucide-react";
import { ChecklistItemType } from "@/types/inspection";

interface InspectionProgressProps {
  items: ChecklistItemType[];
}

export const InspectionProgress = ({ items }: InspectionProgressProps) => {
  const completedItems = items.filter(item => item.status === 'completed').length;
  const totalItems = items.length;
  const progressPercentage = totalItems > 0 ? (completedItems / totalItems) * 100 : 0;

  const safetyItems = items.filter(item => item.category === 'safety');
  const completedSafetyItems = safetyItems.filter(item => item.status === 'completed').length;

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4 shadow-sm">
      <div className="space-y-4">
        {/* Overall Progress */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-medium text-gray-900">Inspection Progress</h3>
            <span className="text-sm font-medium text-gray-600">
              {completedItems} of {totalItems} completed
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div 
              className="bg-blue-600 h-3 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">
            {progressPercentage.toFixed(0)}% complete
          </p>
        </div>

        {/* Category Breakdown */}
        <div className="grid grid-cols-2 gap-4 pt-2 border-t border-gray-100">
          {/* Safety Items */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <AlertCircle className="w-4 h-4 text-red-500" />
              <span className="text-sm font-medium text-gray-700">Safety</span>
            </div>
            <div className="flex items-center gap-1">
              <CheckCircle className="w-3 h-3 text-green-500" />
              <span className="text-xs text-gray-600">
                {completedSafetyItems}/{safetyItems.length}
              </span>
            </div>
          </div>

          {/* Time Estimate */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4 text-blue-500" />
              <span className="text-sm font-medium text-gray-700">Est. Time</span>
            </div>
            <span className="text-xs text-gray-600">
              {Math.max(1, Math.ceil((totalItems - completedItems) * 2))} min
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
