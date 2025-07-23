import React from "react";
import { ChecklistItemType } from "@/types/inspection";
import { ChecklistItemContainer } from "@/components/ChecklistItemContainer";
import { Card, CardContent } from "@/components/ui/card";
import { ClipboardList } from "lucide-react";

interface InspectionListProps {
  items: ChecklistItemType[];
  showCompleted: boolean;
  selectedCategory: string | null;
  onComplete: () => void;
  onCategoryChange: (category: string | null) => void;
  inspectionId: string;
}

export const InspectionList: React.FC<InspectionListProps> = ({
  items,
  showCompleted,
  selectedCategory,
  onComplete,
  onCategoryChange,
  inspectionId,
}) => {
  // If no items, show empty state
  if (items.length === 0) {
    return (
      <Card
        id="inspection-list-empty-state"
        className="bg-gray-50 border-gray-200"
      >
        <CardContent className="p-8 text-center">
          <ClipboardList className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-600 mb-2">
            No items to display
          </h3>
          <p className="text-gray-500">
            {selectedCategory
              ? `No items found in the "${selectedCategory}" category${showCompleted ? "" : " that need completion"}.`
              : `No checklist items${showCompleted ? "" : " that need completion"}.`}
          </p>
          {selectedCategory && (
            <button
              onClick={() => onCategoryChange(null)}
              className="mt-4 text-sm text-blue-600 hover:text-blue-700 underline"
            >
              Show all categories
            </button>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <div id="inspection-list-container" className="space-y-4">
      {items.map((item) => (
        <ChecklistItemContainer
          key={item.id}
          item={item}
          onComplete={onComplete}
        />
      ))}
    </div>
  );
};
