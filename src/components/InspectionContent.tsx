
import { useState } from "react";
import { MobileOptimizedLayout } from "@/components/MobileOptimizedLayout";
import { InspectionProgressTracker } from "@/components/InspectionProgressTracker";
import { InspectionFilters } from "@/components/InspectionFilters";
import { InspectionList } from "@/components/InspectionList";
import { InspectionCompleteButton } from "@/components/InspectionCompleteButton";
import { ChecklistDiagnostics } from "@/components/ChecklistDiagnostics";
import { LoadingStateManager } from "@/components/LoadingStateManager";
import { useDataIntegrity } from "@/hooks/useDataIntegrity";
import { ChecklistItemType } from "@/types/inspection";
import { Button } from "@/components/ui/button";
import { AlertTriangle, CheckCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface InspectionContentProps {
  inspectionId: string;
  checklistItems: ChecklistItemType[];
  onRefetch: () => void;
  isRefetching: boolean;
}

export const InspectionContent = ({ 
  inspectionId, 
  checklistItems, 
  onRefetch, 
  isRefetching 
}: InspectionContentProps) => {
  const [showCompleted, setShowCompleted] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const { checks, isChecking, runIntegrityChecks, fixIssue, hasIssues, highPriorityIssues } = useDataIntegrity(inspectionId);

  const filteredItems = checklistItems.filter(item => {
    const matchesCompletedFilter = showCompleted || (!item.status || item.status === null);
    const matchesCategoryFilter = !selectedCategory || item.category === selectedCategory;
    return matchesCompletedFilter && matchesCategoryFilter;
  });

  const completedCount = checklistItems.filter(item => 
    item.status === 'completed' || item.status === 'failed' || item.status === 'not_applicable'
  ).length;
  const totalCount = checklistItems.length;
  const passedCount = checklistItems.filter(item => item.status === 'completed').length;
  const failedCount = checklistItems.filter(item => item.status === 'failed').length;
  const naCount = checklistItems.filter(item => item.status === 'not_applicable').length;
  const isAllCompleted = completedCount === totalCount && totalCount > 0;

  console.log('📊 Inspection render stats:', {
    totalItems: totalCount,
    completedItems: completedCount,
    passedItems: passedCount,
    failedItems: failedCount,
    naItems: naCount,
    filteredItems: filteredItems.length,
    isAllCompleted,
    hasDataIssues: hasIssues,
    highPriorityIssues
  });

  const headerActions = (
    <div className="flex items-center gap-2">
      {hasIssues && (
        <Button
          variant="outline"
          size="sm"
          onClick={runIntegrityChecks}
          className="text-red-600 border-red-200"
        >
          <AlertTriangle className="w-4 h-4" />
          {highPriorityIssues > 0 && (
            <span className="ml-1">{highPriorityIssues}</span>
          )}
        </Button>
      )}
    </div>
  );

  return (
    <MobileOptimizedLayout
      title="Inspection Checklist"
      subtitle={`${completedCount}/${totalCount} items completed`}
      showBackButton
      backTo="/properties"
      actions={headerActions}
    >
      <div className="px-3 sm:px-4 py-4 space-y-4 max-w-4xl mx-auto">
        {/* Data Integrity Alerts */}
        {hasIssues && (
          <Alert className="border-red-200 bg-red-50">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              <div className="space-y-2">
                <p className="font-medium">Data integrity issues detected:</p>
                {checks.map(check => (
                  <div key={check.id} className="flex items-center justify-between">
                    <span className="text-sm">{check.message}</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => fixIssue(check.id)}
                      className="ml-2"
                    >
                      Fix
                    </Button>
                  </div>
                ))}
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Progress Tracker */}
        <InspectionProgressTracker checklistItems={checklistItems} showDetailed />

        {/* Diagnostics (Development only) */}
        {process.env.NODE_ENV === 'development' && (
          <ChecklistDiagnostics inspectionId={inspectionId} />
        )}

        {/* Filters */}
        <InspectionFilters
          checklistItems={checklistItems}
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
          showCompleted={showCompleted}
          onToggleCompleted={() => setShowCompleted(!showCompleted)}
          onRefresh={onRefetch}
          isRefetching={isRefetching}
        />

        {/* Checklist Items */}
        <LoadingStateManager
          isLoading={isRefetching}
          error={null}
          isEmpty={filteredItems.length === 0}
          loadingMessage="Refreshing checklist..."
          emptyMessage={showCompleted ? "No completed items to show" : "No pending items remaining"}
        >
          <InspectionList
            items={filteredItems}
            showCompleted={showCompleted}
            selectedCategory={selectedCategory}
            onComplete={onRefetch}
            onCategoryChange={setSelectedCategory}
            inspectionId={inspectionId}
          />
        </LoadingStateManager>

        {/* Complete Button */}
        <InspectionCompleteButton
          inspectionId={inspectionId}
          isAllCompleted={isAllCompleted}
          passedCount={passedCount}
          failedCount={failedCount}
        />
      </div>
    </MobileOptimizedLayout>
  );
};
