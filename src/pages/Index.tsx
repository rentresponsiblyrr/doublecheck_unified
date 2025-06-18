
import { useState } from "react";
import { InspectionLayout } from "@/components/InspectionLayout";
import { InspectionFilters } from "@/components/InspectionFilters";
import { InspectionList } from "@/components/InspectionList";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { useInspectionData } from "@/hooks/useInspectionData";

// Demo inspection ID - in a real app this would come from routing/context
const CURRENT_INSPECTION_ID = "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11";

const Index = () => {
  const [showCompleted, setShowCompleted] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const { checklistItems, isLoading, refetch, isRefetching } = useInspectionData(CURRENT_INSPECTION_ID);

  const filteredItems = checklistItems.filter(item => {
    const matchesCompletedFilter = showCompleted || !item.status;
    const matchesCategoryFilter = !selectedCategory || item.category === selectedCategory;
    return matchesCompletedFilter && matchesCategoryFilter;
  });

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <InspectionLayout
      inspectionId={CURRENT_INSPECTION_ID}
      checklistItems={checklistItems}
      showCompleted={showCompleted}
      onToggleCompleted={() => setShowCompleted(!showCompleted)}
    >
      <InspectionFilters
        checklistItems={checklistItems}
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
        showCompleted={showCompleted}
        onToggleCompleted={() => setShowCompleted(!showCompleted)}
        onRefresh={refetch}
        isRefetching={isRefetching}
      />

      <InspectionList
        items={filteredItems}
        showCompleted={showCompleted}
        selectedCategory={selectedCategory}
        onComplete={refetch}
        onCategoryChange={setSelectedCategory}
      />
    </InspectionLayout>
  );
};

export default Index;
