
import { useState } from "react";
import { MobileOptimizedLayout } from "@/components/MobileOptimizedLayout";
import { InspectionProgressTracker } from "@/components/InspectionProgressTracker";
import { InspectionFilters } from "@/components/InspectionFilters";
import { InspectionList } from "@/components/InspectionList";
import { InspectionCompleteButton } from "@/components/InspectionCompleteButton";
import { ChecklistItemType } from "@/types/inspection";
import { debugLogger } from "@/utils/debugLogger";

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

  debugLogger.info('InspectionContent', 'Rendering with data', {
    inspectionId,
    itemCount: checklistItems.length,
    isRefetching
  });

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
  const isAllCompleted = completedCount === totalCount && totalCount > 0;

  debugLogger.info('InspectionContent', 'Render stats', {
    totalItems: totalCount,
    completedItems: completedCount,
    filteredItems: filteredItems.length,
    isAllCompleted
  });

  return (
    <MobileOptimizedLayout
      title="Inspection Checklist"
      subtitle={totalCount > 0 ? `${completedCount}/${totalCount} items completed` : "Loading checklist..."}
      showBackButton
      backTo="/properties"
    >
      <div className="px-3 sm:px-4 py-4 space-y-4 max-w-4xl mx-auto">
        {/* Progress Tracker - only show if we have items */}
        {totalCount > 0 && (
          <InspectionProgressTracker checklistItems={checklistItems} showDetailed />
        )}

        {/* Filters - only show if we have items */}
        {totalCount > 0 && (
          <InspectionFilters
            checklistItems={checklistItems}
            selectedCategory={selectedCategory}
            onCategoryChange={setSelectedCategory}
            showCompleted={showCompleted}
            onToggleCompleted={() => setShowCompleted(!showCompleted)}
            onRefresh={onRefetch}
            isRefetching={isRefetching}
          />
        )}

        {/* Loading state during refetch */}
        {isRefetching && (
          <div className="text-center py-4">
            <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <p className="text-sm text-gray-600">Refreshing checklist...</p>
          </div>
        )}

        {/* Checklist Items or Empty State */}
        <InspectionList
          items={filteredItems}
          showCompleted={showCompleted}
          selectedCategory={selectedCategory}
          onComplete={onRefetch}
          onCategoryChange={setSelectedCategory}
          inspectionId={inspectionId}
        />

        {/* Complete Button - only show if we have completed items */}
        {totalCount > 0 && (
          <InspectionCompleteButton
            inspectionId={inspectionId}
            isAllCompleted={isAllCompleted}
            passedCount={passedCount}
            failedCount={failedCount}
          />
        )}
      </div>
    </MobileOptimizedLayout>
  );
};
