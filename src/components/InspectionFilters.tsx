
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RefreshCw, Filter, Eye, EyeOff, Search, SortAsc, SortDesc, X } from "lucide-react";
import { ChecklistItemType } from "@/types/inspection";
import { useCategories } from "@/hooks/useCategories";
import { getCategoryColor } from "@/utils/categoryUtils";

export type SortOption = 'order' | 'priority' | 'category' | 'status' | 'title';
export type SortDirection = 'asc' | 'desc';

interface InspectionFiltersProps {
  checklistItems: ChecklistItemType[];
  selectedCategory: string | null;
  onCategoryChange: (category: string | null) => void;
  showCompleted: boolean;
  onToggleCompleted: () => void;
  onRefresh: () => void;
  isRefetching: boolean;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  sortBy?: SortOption;
  sortDirection?: SortDirection;
  onSortChange?: (sortBy: SortOption, direction: SortDirection) => void;
}

export const InspectionFilters = ({
  checklistItems,
  selectedCategory,
  onCategoryChange,
  showCompleted,
  onToggleCompleted,
  onRefresh,
  isRefetching,
  searchQuery = "",
  onSearchChange,
  sortBy = "order",
  sortDirection = "asc",
  onSortChange
}: InspectionFiltersProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const { data: categories = [], isLoading: categoriesLoading } = useCategories();
  
  const getCategoryCount = (categoryName: string) => {
    return checklistItems.filter(item => item.category === categoryName).length;
  };

  // Only show categories that have items
  const categoriesWithItems = categories.filter(category => 
    getCategoryCount(category.name) > 0
  );

  const handleSortToggle = () => {
    if (onSortChange) {
      const newDirection = sortDirection === 'asc' ? 'desc' : 'asc';
      onSortChange(sortBy, newDirection);
    }
  };

  const clearFilters = () => {
    onCategoryChange(null);
    onSearchChange?.("");
    onSortChange?.("order", "asc");
  };

  const hasActiveFilters = selectedCategory !== null || searchQuery.trim() !== "" || sortBy !== "order" || sortDirection !== "asc";

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-4">
      {/* Filter Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="font-medium text-gray-900">Filters & Search</h3>
          {hasActiveFilters && (
            <Badge variant="secondary" className="text-xs">
              {[selectedCategory, searchQuery.trim(), sortBy !== "order" ? "sorted" : null].filter(Boolean).length} active
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="text-xs"
            >
              <X className="w-3 h-3 mr-1" />
              Clear
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="lg:hidden"
          >
            <Filter className="w-4 h-4" />
          </Button>
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
      </div>

      {/* Quick Search */}
      <div className={`space-y-4 ${isExpanded ? 'block' : 'hidden lg:block'}`}>
        {onSearchChange && (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search checklist items..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10 pr-10"
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onSearchChange("")}
                className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
              >
                <X className="w-3 h-3" />
              </Button>
            )}
          </div>
        )}

        {/* Sort Controls */}
        {onSortChange && (
          <div className="flex items-center gap-3">
            <Label className="text-sm font-medium text-gray-700">Sort by:</Label>
            <Select
              value={sortBy}
              onValueChange={(value: SortOption) => onSortChange(value, sortDirection)}
            >
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="order">Default Order</SelectItem>
                <SelectItem value="priority">Priority</SelectItem>
                <SelectItem value="title">Title</SelectItem>
                <SelectItem value="category">Category</SelectItem>
                <SelectItem value="status">Status</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSortToggle}
              className="flex items-center gap-1 px-2"
            >
              {sortDirection === 'asc' ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />}
              {sortDirection === 'asc' ? 'A-Z' : 'Z-A'}
            </Button>
          </div>
        )}

        {/* Category Filters */}
        <div className="space-y-3">
          <Label className="text-sm font-medium text-gray-700">Filter by Category:</Label>
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
        </div>

        {/* Show/Hide Completed */}
        <div className="pt-2 border-t">
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
      </div>
    </div>
  );
};
