
import { CheckCircle, Clock, AlertTriangle, Wrench, Camera, Sparkles } from "lucide-react";
import { ChecklistItemType } from "@/types/inspection";

interface EnhancedProgressIndicatorProps {
  items: ChecklistItemType[];
}

export const EnhancedProgressIndicator = ({ items }: EnhancedProgressIndicatorProps) => {
  const totalItems = items.length;
  const completedItems = items.filter(item => item.status === 'completed').length;
  const progressPercentage = totalItems > 0 ? (completedItems / totalItems) * 100 : 0;

  const categoryStats = {
    safety: {
      total: items.filter(item => item.category === 'safety').length,
      completed: items.filter(item => item.category === 'safety' && item.status === 'completed').length,
      icon: AlertTriangle,
      color: 'text-red-600',
      bgColor: 'bg-red-100',
      progressColor: 'bg-red-500'
    },
    amenity: {
      total: items.filter(item => item.category === 'amenity').length,
      completed: items.filter(item => item.category === 'amenity' && item.status === 'completed').length,
      icon: Camera,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
      progressColor: 'bg-blue-500'
    },
    cleanliness: {
      total: items.filter(item => item.category === 'cleanliness').length,
      completed: items.filter(item => item.category === 'cleanliness' && item.status === 'completed').length,
      icon: Sparkles,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      progressColor: 'bg-green-500'
    },
    maintenance: {
      total: items.filter(item => item.category === 'maintenance').length,
      completed: items.filter(item => item.category === 'maintenance' && item.status === 'completed').length,
      icon: Wrench,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100',
      progressColor: 'bg-yellow-500'
    }
  };

  const estimatedTimeRemaining = Math.max(1, Math.ceil((totalItems - completedItems) * 2));

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-5 mb-4 shadow-sm">
      <div className="space-y-5">
        {/* Overall Progress Header */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-gray-900 text-lg">Inspection Progress</h3>
            <p className="text-sm text-gray-600">
              {completedItems} of {totalItems} items completed
            </p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-blue-600">{progressPercentage.toFixed(0)}%</div>
            <div className="flex items-center gap-1 text-sm text-gray-500">
              <Clock className="w-4 h-4" />
              <span>{estimatedTimeRemaining} min left</span>
            </div>
          </div>
        </div>

        {/* Overall Progress Bar */}
        <div className="space-y-2">
          <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
            <div 
              className="bg-gradient-to-r from-blue-500 to-blue-600 h-4 rounded-full transition-all duration-500 ease-out relative"
              style={{ width: `${progressPercentage}%` }}
            >
              <div className="absolute inset-0 bg-white opacity-20 animate-pulse"></div>
            </div>
          </div>
        </div>

        {/* Category Breakdown */}
        <div className="space-y-3">
          <h4 className="font-medium text-gray-700 text-sm">Progress by Category</h4>
          <div className="grid grid-cols-2 gap-3">
            {Object.entries(categoryStats).map(([category, stats]) => {
              const { total, completed, icon: Icon, color, bgColor, progressColor } = stats;
              const categoryProgress = total > 0 ? (completed / total) * 100 : 0;
              
              if (total === 0) return null;
              
              return (
                <div key={category} className={`${bgColor} rounded-lg p-3 border`}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Icon className={`w-4 h-4 ${color}`} />
                      <span className="text-sm font-medium text-gray-700 capitalize">
                        {category}
                      </span>
                    </div>
                    <span className="text-xs font-bold text-gray-600">
                      {completed}/{total}
                    </span>
                  </div>
                  
                  <div className="w-full bg-gray-200 bg-opacity-50 rounded-full h-2">
                    <div 
                      className={`${progressColor} h-2 rounded-full transition-all duration-300 ease-out`}
                      style={{ width: `${categoryProgress}%` }}
                    />
                  </div>
                  
                  <div className="text-xs text-gray-600 mt-1">
                    {categoryProgress.toFixed(0)}% complete
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Priority Items Alert */}
        {categoryStats.safety.total > 0 && categoryStats.safety.completed < categoryStats.safety.total && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              <div>
                <p className="text-sm font-medium text-red-800">
                  Priority: {categoryStats.safety.total - categoryStats.safety.completed} safety items remaining
                </p>
                <p className="text-xs text-red-600">
                  Complete safety inspections first for guest protection
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
