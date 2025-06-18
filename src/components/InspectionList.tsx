
import { ChecklistItem } from "@/components/ChecklistItem";
import { Button } from "@/components/ui/button";
import { ChecklistItemType } from "@/types/inspection";

interface InspectionListProps {
  items: ChecklistItemType[];
  showCompleted: boolean;
  selectedCategory: string | null;
  onComplete: () => void;
  onCategoryChange: (category: string | null) => void;
}

export const InspectionList = ({
  items,
  showCompleted,
  selectedCategory,
  onComplete,
  onCategoryChange
}: InspectionListProps) => {
  if (items.length === 0) {
    return (
      <div className="text-center py-12 bg-white border border-gray-200 rounded-lg">
        <p className="text-gray-500 text-lg">
          {showCompleted 
            ? "No completed items yet" 
            : selectedCategory 
              ? `No ${selectedCategory} items remaining`
              : "All items completed! 🎉"
          }
        </p>
        {!showCompleted && selectedCategory && (
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => onCategoryChange(null)}
          >
            View All Items
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {items.map((item) => (
        <ChecklistItem
          key={item.id}
          item={item}
          onComplete={onComplete}
        />
      ))}
    </div>
  );
};
