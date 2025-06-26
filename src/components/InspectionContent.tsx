
import { useState } from "react";
import { MobileOptimizedLayout } from "@/components/MobileOptimizedLayout";
import { InspectionProgressTracker } from "@/components/InspectionProgressTracker";
import { InspectionFilters } from "@/components/InspectionFilters";
import { InspectionList } from "@/components/InspectionList";
import { InspectionCompleteButton } from "@/components/InspectionCompleteButton";
import { ChecklistItemType } from "@/types/inspection";
import { debugLogger } from "@/utils/debugLogger";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { InfoIcon } from "lucide-react";

interface InspectionContentProps {
  inspectionId: string;
  checklistItems: ChecklistItemType[];
  onRefetch: () => void;
  isRefetching?: boolean;
}

export const InspectionContent = ({ 
  inspectionId, 
  checklistItems, 
  onRefetch, 
  isRefetching = false 
}: InspectionContentProps) => {
  const [showCompleted, setShowCompleted] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  debugLogger.info('InspectionContent', 'Rendering with data', {
    inspectionId,
    itemCount: checklistItems.length,
    isRefetching
  });

  // Defensive programming - handle null/undefined data
  const safeChecklistItems = Array.isArray(checklistItems) ? checklistItems : [];

  const filteredItems = safeChecklistItems.filter(item => {
    if (!item || !item.id) return false; // Safety check
    
    const matchesCompletedFilter = showCompleted || (!item.status || item.status === null);
    const matchesCategoryFilter = !selectedCategory || item.category === selectedCategory;
    return matchesCompletedFilter && matchesCategoryFilter;
  });

  const completedCount = safeChecklistItems.filter(item => 
    item && (item.status === 'completed' || item.status === 'failed' || item.status === 'not_applicable')
  ).length;
  const totalCount = safeChecklistItems.length;
  const passedCount = safeChecklistItems.filter(item => item && item.status === 'completed').length;
  const failedCount = safeChecklistItems.filter(item => item && item.status === 'failed').length;
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
        {/* Loading state during refetch */}
        {isRefetching && (
          <div className="text-center py-4">
            <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <p className="text-sm text-gray-600">Refreshing checklist...</p>
          </div>
        )}

        {/* Empty state with helpful message */}
        {totalCount === 0 && !isRefetching && (
          <Alert className="bg-blue-50 border-blue-200">
            <InfoIcon className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800">
              This inspection doesn't have any checklist items yet. Checklist items are usually generated automatically when a property is added. 
              You can add items manually using the "Add Item" button below.
            </AlertDescription>
          </Alert>
        )}

        {/* Progress Tracker - only show if we have items */}
        {totalCount > 0 && (
          <InspectionProgressTracker checklistItems={safeChecklistItems} showDetailed />
        )}

        {/* Filters - only show if we have items */}
        {totalCount > 0 && (
          <InspectionFilters
            checklistItems={safeChecklistItems}
            selectedCategory={selectedCategory}
            onCategoryChange={setSelectedCategory}
            showCompleted={showCompleted}
            onToggleCompleted={() => setShowCompleted(!showCompleted)}
            onRefresh={onRefetch}
            isRefetching={isRefetching}
          />
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
