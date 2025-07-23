import { Badge } from "@/components/ui/badge";
import { Camera, Video } from "lucide-react";
import { ChecklistItemType } from "@/types/inspection";
import { useCategories } from "@/hooks/useCategories";
import { getCategoryColor, getCategoryIcon } from "@/utils/categoryUtils";

interface ChecklistItemHeaderProps {
  item: ChecklistItemType;
}

export const ChecklistItemHeader = ({ item }: ChecklistItemHeaderProps) => {
  const { data: categories = [] } = useCategories();

  // Find the category object for this item
  const categoryObj = categories.find((cat) => cat.name === item.category);

  const categoryColor = getCategoryColor(categoryObj || item.category);
  const CategoryIcon = getCategoryIcon(categoryObj || item.category);

  return (
    <div>
      <h3 className="font-semibold text-gray-900 text-xl leading-tight mb-3">
        {item.label}
      </h3>
      <div className="flex items-center gap-3 flex-wrap">
        <Badge className={`${categoryColor} border`}>
          <div className="flex items-center gap-1">
            <CategoryIcon className="w-4 h-4" />
            <span className="capitalize font-medium">{item.category}</span>
          </div>
        </Badge>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          {item.evidence_type === "photo" ? (
            <Camera className="w-4 h-4" />
          ) : (
            <Video className="w-4 h-4" />
          )}
          <span className="font-medium">{item.evidence_type} required</span>
        </div>
      </div>
    </div>
  );
};
