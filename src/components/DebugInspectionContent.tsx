
import { useState, useEffect } from "react";
import { ChecklistItemType } from "@/types/inspection";
import { InspectionProgress } from "@/components/InspectionProgress";
import { InspectionHeader } from "@/components/InspectionHeader";
import { ChecklistItemContainer } from "@/components/ChecklistItemContainer";
import { DebugPanel } from "@/components/DebugPanel";
import { DebugEmptyState } from "@/components/DebugEmptyState";
import { useDebugDatabaseTester } from "@/components/DebugDatabaseTester";
import { debugLogger } from "@/utils/debugLogger";

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
  const [showCompleted, setShowCompleted] = useState(true);
  const { runDatabaseTests } = useDebugDatabaseTester(inspectionId);

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

  const handleRunDatabaseTests = async () => {
    const result = await runDatabaseTests();
    setDebugInfo(result);
  };

  // Filter items based on showCompleted state
  const filteredItems = showCompleted 
    ? checklistItems 
    : checklistItems.filter(item => item.status !== 'completed');

  const handleItemComplete = () => {
    debugLogger.info('DebugInspectionContent', 'Item completed, refetching data', {
      inspectionId
    });
    onRefetch();
  };

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
      
      <DebugPanel
        inspectionId={inspectionId}
        checklistItemsCount={checklistItems.length}
        completedCount={completedCount}
        totalCount={totalCount}
        progressPercentage={progressPercentage}
        onRunDatabaseTests={handleRunDatabaseTests}
        onRefetch={onRefetch}
        isRefetching={isRefetching}
        debugInfo={debugInfo}
      />

      <InspectionProgress items={filteredItems} />

      <div className="p-4 space-y-4">
        {filteredItems.length === 0 ? (
          <DebugEmptyState
            checklistItemsLength={checklistItems.length}
            showCompleted={showCompleted}
            onRefetch={onRefetch}
            isRefetching={isRefetching}
          />
        ) : (
          filteredItems.map((item) => (
            <ChecklistItemContainer
              key={item.id}
              item={item}
              onComplete={handleItemComplete}
            />
          ))
        )}
      </div>
    </div>
  );
};
