
import { ReactNode } from "react";
import { InspectionHeader } from "@/components/InspectionHeader";
import { ChecklistItemType } from "@/types/inspection";

interface InspectionLayoutProps {
  inspectionId: string;
  checklistItems: ChecklistItemType[];
  showCompleted: boolean;
  onToggleCompleted: () => void;
  children: ReactNode;
}

export const InspectionLayout = ({
  inspectionId,
  checklistItems,
  showCompleted,
  onToggleCompleted,
  children
}: InspectionLayoutProps) => {
  const completedCount = checklistItems.filter(item => item.status === 'completed').length;
  const totalCount = checklistItems.length;

  return (
    <div className="min-h-screen bg-gray-50">
      <InspectionHeader 
        inspectionId={inspectionId}
        showCompleted={showCompleted}
        onToggleCompleted={onToggleCompleted}
        completedCount={completedCount}
        totalCount={totalCount}
        checklistItems={checklistItems}
      />
      
      <main className="pb-6">
        <div className="px-4 space-y-4">
          {children}
        </div>
      </main>
    </div>
  );
};
