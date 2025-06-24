
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, Filter, Eye, EyeOff } from "lucide-react";
import { ChecklistItemType } from "@/types/inspection";
import { useCategories } from "@/hooks/useCategories";
import { getCategoryColor } from "@/utils/categoryUtils";

interface InspectionFiltersProps {
  checklistItems: ChecklistItemType[];
  selectedCategory: string | null;
  onCategoryChange: (category: string | null) => void;
  showCompleted: boolean;
  onToggleCompleted: () => void;
  onRefresh: () => void;
  isRefetching: boolean;
}

export const InspectionFilters = ({
  checklistItems,
  selectedCategory,
  onCategoryChange,
  showCompleted,
  onToggleCompleted,
  onRefresh,
  isRefetching
}: InspectionFiltersProps) => {
  const { data: categories = [], isLoading: categoriesLoading } = useCategories();
  
  const getCategoryCount = (categoryName: string) => {
    return checklistItems.filter(item => item.category === categoryName).length;
  };

  // Only show categories that have items
  const categoriesWithItems = categories.filter(category => 
    getCategoryCount(category.name) > 0
  );

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-4">
      {/* Filter Controls */}
      <div className="flex items-center justify-between">
        <h3 className="font-medium text-gray-900">Filters</h3>
        <Button
          variant="outline"
          size="sm"
          onClick={onRefresh}
          disabled={isRefetching}
          className="flex items-center gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${isRefetching ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Category Filters */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant={selectedCategory === null ? "default" : "outline"}
          size="sm"
          onClick={() => onCategoryChange(null)}
          className="flex items-center gap-1"
        >
          <Filter className="w-3 h-3" />
          All ({checklistItems.length})
        </Button>
        
        {!categoriesLoading && categoriesWithItems.map(category => (
          <Badge
            key={category.id}
            className={`cursor-pointer border transition-all hover:shadow-sm ${
              selectedCategory === category.name 
                ? getCategoryColor(category) + ' ring-2 ring-offset-1 ring-blue-500' 
                : getCategoryColor(category) + ' opacity-70 hover:opacity-100'
            }`}
            onClick={() => onCategoryChange(selectedCategory === category.name ? null : category.name)}
          >
            <span className="capitalize">{category.name}</span>
            <span className="ml-1">({getCategoryCount(category.name)})</span>
          </Badge>
        ))}
      </div>

      {/* Show/Hide Completed */}
      <Button
        variant="outline"
        size="sm"
        onClick={onToggleCompleted}
        className="flex items-center gap-2"
      >
        {showCompleted ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        {showCompleted ? 'Hide' : 'Show'} Completed Items
      </Button>
    </div>
  );
};
