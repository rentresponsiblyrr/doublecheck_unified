
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, Filter, Eye, EyeOff } from "lucide-react";
import { ChecklistItemType } from "@/types/inspection";

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
  const categories = ['safety', 'amenity', 'cleanliness', 'maintenance'];
  
  const getCategoryCount = (category: string) => {
    return checklistItems.filter(item => item.category === category).length;
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'safety': return 'bg-red-100 text-red-800 border-red-200';
      case 'amenity': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'cleanliness': return 'bg-green-100 text-green-800 border-green-200';
      case 'maintenance': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

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
        {categories.map(category => (
          <Badge
            key={category}
            className={`cursor-pointer border transition-all hover:shadow-sm ${
              selectedCategory === category 
                ? getCategoryColor(category) + ' ring-2 ring-offset-1 ring-blue-500' 
                : getCategoryColor(category) + ' opacity-70 hover:opacity-100'
            }`}
            onClick={() => onCategoryChange(selectedCategory === category ? null : category)}
          >
            <span className="capitalize">{category}</span>
            <span className="ml-1">({getCategoryCount(category)})</span>
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
