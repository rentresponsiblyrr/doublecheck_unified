
import { useState, useEffect } from "react";
import { ChecklistItemType } from "@/types/inspection";
import { InspectionProgress } from "@/components/InspectionProgress";
import { InspectionHeader } from "@/components/InspectionHeader";
import { ChecklistItem } from "@/components/ChecklistItem";
import { Button } from "@/components/ui/button";
import { RefreshCw, Bug, Database, AlertCircle } from "lucide-react";
import { debugLogger } from "@/utils/debugLogger";
import { supabase } from "@/integrations/supabase/client";

interface DebugInspectionContentProps {
  inspectionId: string;
  checklistItems: ChecklistItemType[];
  onRefetch: () => void;
  isRefetching: boolean;
}

export const DebugInspectionContent = ({
  inspectionId,
  checklistItems,
  onRefetch,
  isRefetching
}: DebugInspectionContentProps) => {
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [showDebugPanel, setShowDebugPanel] = useState(true);
  const [showCompleted, setShowCompleted] = useState(true);

  const completedCount = checklistItems.filter(item => item.status === 'completed').length;
  const totalCount = checklistItems.length;
  const progressPercentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  useEffect(() => {
    debugLogger.info('DebugInspectionContent', 'Component mounted', {
      inspectionId,
      itemCount: checklistItems.length,
      completedCount,
      progressPercentage
    });
  }, [inspectionId, checklistItems.length, completedCount, progressPercentage]);

  const runDatabaseTests = async () => {
    try {
      debugLogger.info('DebugInspectionContent', 'Running database tests');
      
      // Test data access
      const { data: accessTest, error: accessError } = await supabase.rpc('debug_data_access');
      
      // Get recent debug logs
      const recentLogs = debugLogger.getRecentLogs(20);
      
      // Test specific inspection query
      const { data: inspectionTest, error: inspectionError } = await supabase
        .from('inspections')
        .select('*')
        .eq('id', inspectionId)
        .single();

      setDebugInfo({
        timestamp: new Date().toISOString(),
        accessTest: accessError ? { error: accessError } : accessTest,
        inspectionTest: inspectionError ? { error: inspectionError } : inspectionTest,
        recentLogs: recentLogs.slice(-10),
        auth: {
          user: (await supabase.auth.getUser()).data.user?.id,
          session: !!(await supabase.auth.getSession()).data.session
        }
      });

      debugLogger.info('DebugInspectionContent', 'Database tests completed', {
        accessTestSuccess: !accessError,
        inspectionTestSuccess: !inspectionError
      });
    } catch (error) {
      debugLogger.error('DebugInspectionContent', 'Database tests failed', error);
      setDebugInfo({
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  // Filter items based on showCompleted state
  const filteredItems = showCompleted 
    ? checklistItems 
    : checklistItems.filter(item => item.status !== 'completed');

  return (
    <div className="min-h-screen bg-gray-50">
      <InspectionHeader 
        inspectionId={inspectionId}
        showCompleted={showCompleted}
        onToggleCompleted={() => setShowCompleted(!showCompleted)}
        completedCount={completedCount}
        totalCount={totalCount}
        checklistItems={checklistItems}
      />
      
      {/* Debug Panel */}
      {showDebugPanel && (
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
              <strong>Items Loaded:</strong> {checklistItems.length}
            </div>
            <div className="text-sm text-yellow-700">
              <strong>Progress:</strong> {completedCount}/{totalCount} ({progressPercentage}%)
            </div>
            
            <div className="flex gap-2 mt-3">
              <Button
                variant="outline"
                size="sm"
                onClick={runDatabaseTests}
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
      )}

      <InspectionProgress items={filteredItems} />

      <div className="p-4 space-y-4">
        {filteredItems.length === 0 ? (
          <div className="text-center py-8">
            <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {checklistItems.length === 0 ? 'No Checklist Items' : 'No Items to Show'}
            </h3>
            <p className="text-gray-500 mb-4">
              {checklistItems.length === 0 
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
        ) : (
          filteredItems.map((item) => (
            <ChecklistItem
              key={item.id}
              item={item}
              onStatusUpdate={(itemId, status) => {
                debugLogger.info('DebugInspectionContent', 'Status update requested', {
                  itemId,
                  status,
                  inspectionId
                });
                // Status update will be handled by the parent component
              }}
            />
          ))
        )}
      </div>
    </div>
  );
};
