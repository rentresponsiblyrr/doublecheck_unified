
import { useState } from "react";
import { InspectionLayout } from "@/components/InspectionLayout";
import { InspectionFilters } from "@/components/InspectionFilters";
import { InspectionList } from "@/components/InspectionList";
import { InspectionCompleteButton } from "@/components/InspectionCompleteButton";
import { ChecklistDiagnostics } from "@/components/ChecklistDiagnostics";
import { ChecklistItemType } from "@/types/inspection";

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
    isAllCompleted
  });

  return (
    <InspectionLayout
      inspectionId={inspectionId}
      checklistItems={checklistItems}
      showCompleted={showCompleted}
      onToggleCompleted={() => setShowCompleted(!showCompleted)}
    >
      <ChecklistDiagnostics inspectionId={inspectionId} />

      <InspectionFilters
        checklistItems={checklistItems}
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
        showCompleted={showCompleted}
        onToggleCompleted={() => setShowCompleted(!showCompleted)}
        onRefresh={onRefetch}
        isRefetching={isRefetching}
      />

      <InspectionList
        items={filteredItems}
        showCompleted={showCompleted}
        selectedCategory={selectedCategory}
        onComplete={onRefetch}
        onCategoryChange={setSelectedCategory}
        inspectionId={inspectionId}
      />

      <InspectionCompleteButton
        inspectionId={inspectionId}
        isAllCompleted={isAllCompleted}
        passedCount={passedCount}
        failedCount={failedCount}
      />
    </InspectionLayout>
  );
};
