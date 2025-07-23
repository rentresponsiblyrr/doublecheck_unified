import { ReactNode } from "react";
import { InspectionHeader } from "@/components/InspectionHeader";
import { ChecklistItemType } from "@/types/inspection";
import { useKeyboardNavigation } from "@/hooks/useKeyboardNavigation";

interface InspectionLayoutProps {
  inspectionId: string;
  checklistItems: ChecklistItemType[];
  showCompleted: boolean;
  onToggleCompleted: () => void;
  children: ReactNode;
  currentItemIndex?: number;
  onNavigateToItem?: (index: number) => void;
}

export const InspectionLayout = ({
  inspectionId,
  checklistItems,
  showCompleted,
  onToggleCompleted,
  children,
  currentItemIndex = 0,
  onNavigateToItem,
}: InspectionLayoutProps) => {
  const completedCount = checklistItems.filter(
    (item) => item.status === "completed",
  ).length;
  const totalCount = checklistItems.length;

  // Keyboard navigation for accessibility
  useKeyboardNavigation({
    onArrowUp: () => {
      if (onNavigateToItem && currentItemIndex > 0) {
        onNavigateToItem(currentItemIndex - 1);
      }
    },
    onArrowDown: () => {
      if (onNavigateToItem && currentItemIndex < checklistItems.length - 1) {
        onNavigateToItem(currentItemIndex + 1);
      }
    },
    enabled: !!onNavigateToItem,
  });

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Sticky header for better mobile UX */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 shadow-sm">
        <InspectionHeader
          inspectionId={inspectionId}
          showCompleted={showCompleted}
          onToggleCompleted={onToggleCompleted}
          completedCount={completedCount}
          totalCount={totalCount}
          checklistItems={checklistItems}
        />
      </div>

      {/* Main content area with proper mobile spacing */}
      <main
        className="flex-1 pb-6 overflow-auto"
        role="main"
        aria-label="Inspection checklist content"
      >
        <div className="px-3 sm:px-4 py-4 space-y-3 sm:space-y-4 max-w-4xl mx-auto">
          {/* Progress indicator for mobile */}
          <div className="sm:hidden bg-white rounded-lg p-3 shadow-sm border">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Progress</span>
              <span className="font-medium text-blue-600">
                {completedCount} of {totalCount} completed
              </span>
            </div>
            <div className="mt-2 bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                style={{
                  width: `${totalCount > 0 ? (completedCount / totalCount) * 100 : 0}%`,
                }}
                role="progressbar"
                aria-valuenow={completedCount}
                aria-valuemin={0}
                aria-valuemax={totalCount}
                aria-label={`${completedCount} of ${totalCount} items completed`}
              />
            </div>
          </div>

          {children}
        </div>
      </main>

      {/* Skip links for accessibility */}
      <div className="sr-only">
        <a
          href="#main-content"
          className="absolute top-4 left-4 bg-blue-600 text-white px-4 py-2 rounded focus:not-sr-only focus:z-50"
        >
          Skip to main content
        </a>
      </div>
    </div>
  );
};
