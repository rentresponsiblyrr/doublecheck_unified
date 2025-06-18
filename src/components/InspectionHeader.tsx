
import { Switch } from "@/components/ui/switch";

interface InspectionHeaderProps {
  inspectionId: string;
  showCompleted: boolean;
  onToggleCompleted: () => void;
  completedCount: number;
  totalCount: number;
}

export const InspectionHeader = ({
  inspectionId,
  showCompleted,
  onToggleCompleted,
  completedCount,
  totalCount
}: InspectionHeaderProps) => {
  const progressPercentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
      <div className="px-4 py-4">
        {/* Brand Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="flex-shrink-0">
            <img 
              src="/lovable-uploads/0a50e8a6-9077-4594-a62f-b9afd7bac687.png" 
              alt="DoubleCheck Logo" 
              className="w-12 h-12 object-contain"
            />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">DoubleCheck Inspection</h1>
            <p className="text-sm text-gray-600">Powered by Rent Responsibly</p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">
              Progress: {completedCount}/{totalCount}
            </span>
            <span className="text-sm font-medium text-blue-600">
              {progressPercentage}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between">
          <div className="text-xs text-gray-500 font-mono">
            ID: {inspectionId}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-700">Show completed</span>
            <Switch
              checked={showCompleted}
              onCheckedChange={onToggleCompleted}
            />
          </div>
        </div>
      </div>
    </header>
  );
};
