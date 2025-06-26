
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Bug, Database, RefreshCw } from "lucide-react";

interface DebugPanelProps {
  inspectionId: string;
  checklistItemsCount: number;
  completedCount: number;
  totalCount: number;
  progressPercentage: number;
  onRunDatabaseTests: () => Promise<void>;
  onRefetch: () => void;
  isRefetching: boolean;
  debugInfo: any;
}

export const DebugPanel = ({
  inspectionId,
  checklistItemsCount,
  completedCount,
  totalCount,
  progressPercentage,
  onRunDatabaseTests,
  onRefetch,
  isRefetching,
  debugInfo
}: DebugPanelProps) => {
  const [showDebugPanel, setShowDebugPanel] = useState(true);

  if (!showDebugPanel) {
    return null;
  }

  return (
    <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center">
          <Bug className="w-5 h-5 text-yellow-600 mr-2" />
          <span className="text-yellow-800 font-medium">Debug Mode Active</span>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowDebugPanel(false)}
        >
          Hide Debug
        </Button>
      </div>
      
      <div className="space-y-2">
        <div className="text-sm text-yellow-700">
          <strong>Inspection ID:</strong> {inspectionId}
        </div>
        <div className="text-sm text-yellow-700">
          <strong>Items Loaded:</strong> {checklistItemsCount}
        </div>
        <div className="text-sm text-yellow-700">
          <strong>Progress:</strong> {completedCount}/{totalCount} ({progressPercentage}%)
        </div>
        
        <div className="flex gap-2 mt-3">
          <Button
            variant="outline"
            size="sm"
            onClick={onRunDatabaseTests}
            className="text-yellow-700 border-yellow-300"
          >
            <Database className="w-4 h-4 mr-1" />
            Test Database
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onRefetch}
            disabled={isRefetching}
            className="text-yellow-700 border-yellow-300"
          >
            <RefreshCw className={`w-4 h-4 mr-1 ${isRefetching ? 'animate-spin' : ''}`} />
            Reload Data
          </Button>
        </div>

        {debugInfo && (
          <div className="mt-3 p-3 bg-white rounded border border-yellow-200">
            <div className="text-xs text-gray-600 font-mono whitespace-pre-wrap">
              {JSON.stringify(debugInfo, null, 2)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
