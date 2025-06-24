
import React, { useState, useEffect } from 'react';
import { Search, Filter, X, SortAsc, SortDesc } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Card, CardContent } from '@/components/ui/card';

interface FilterOption {
  id: string;
  label: string;
  count?: number;
}

interface SortOption {
  id: string;
  label: string;
  direction: 'asc' | 'desc';
}

interface SearchAndFilterProps {
  searchPlaceholder?: string;
  searchValue: string;
  onSearchChange: (value: string) => void;
  filterOptions?: FilterOption[];
  activeFilters: string[];
  onFilterChange: (filters: string[]) => void;
  sortOptions?: SortOption[];
  activeSortId?: string;
  onSortChange?: (sortId: string) => void;
  showClearAll?: boolean;
}

export const SearchAndFilter = ({
  searchPlaceholder = 'Search...',
  searchValue,
  onSearchChange,
  filterOptions = [],
  activeFilters,
  onFilterChange,
  sortOptions = [],
  activeSortId,
  onSortChange,
  showClearAll = true
}: SearchAndFilterProps) => {
  const [localSearchValue, setLocalSearchValue] = useState(searchValue);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      onSearchChange(localSearchValue);
    }, 300);

    return () => clearTimeout(timer);
  }, [localSearchValue, onSearchChange]);

  const handleFilterToggle = (filterId: string) => {
    const newFilters = activeFilters.includes(filterId)
      ? activeFilters.filter(f => f !== filterId)
      : [...activeFilters, filterId];
    onFilterChange(newFilters);
  };

  const clearAllFilters = () => {
    setLocalSearchValue('');
    onFilterChange([]);
  };

  const hasActiveFilters = activeFilters.length > 0 || searchValue.length > 0;
  const activeSort = sortOptions.find(s => s.id === activeSortId);

  return (
    <Card className="shadow-sm">
      <CardContent className="p-4 space-y-4">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder={searchPlaceholder}
            value={localSearchValue}
            onChange={(e) => setLocalSearchValue(e.target.value)}
            className="pl-10 pr-10"
          />
          {localSearchValue && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLocalSearchValue('')}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 h-6 w-6"
            >
              <X className="w-3 h-3" />
            </Button>
          )}
        </div>

        {/* Filter and Sort Controls */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            {/* Filter Dropdown */}
            {filterOptions.length > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2">
                    <Filter className="w-3 h-3" />
                    Filter
                    {activeFilters.length > 0 && (
                      <Badge variant="secondary" className="ml-1 text-xs">
                        {activeFilters.length}
                      </Badge>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-56">
                  <DropdownMenuLabel>Filter Options</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {filterOptions.map((option) => (
                    <DropdownMenuItem
                      key={option.id}
                      onClick={() => handleFilterToggle(option.id)}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 border rounded ${
                          activeFilters.includes(option.id) 
                            ? 'bg-blue-600 border-blue-600' 
                            : 'border-gray-300'
                        }`} />
                        <span>{option.label}</span>
                      </div>
                      {option.count !== undefined && (
                        <Badge variant="outline" className="text-xs">
                          {option.count}
                        </Badge>
                      )}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            {/* Sort Dropdown */}
            {sortOptions.length > 0 && onSortChange && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2">
                    {activeSort?.direction === 'asc' ? (
                      <SortAsc className="w-3 h-3" />
                    ) : (
                      <SortDesc className="w-3 h-3" />
                    )}
                    Sort
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  <DropdownMenuLabel>Sort By</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {sortOptions.map((option) => (
                    <DropdownMenuItem
                      key={option.id}
                      onClick={() => onSortChange(option.id)}
                      className="flex items-center gap-2"
                    >
                      {option.direction === 'asc' ? (
                        <SortAsc className="w-3 h-3" />
                      ) : (
                        <SortDesc className="w-3 h-3" />
                      )}
                      <span>{option.label}</span>
                      {activeSortId === option.id && (
                        <Badge variant="secondary" className="ml-auto text-xs">
                          Active
                        </Badge>
                      )}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          {/* Clear All */}
          {showClearAll && hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAllFilters}
              className="text-gray-600 hover:text-red-600"
            >
              Clear All
            </Button>
          )}
        </div>

        {/* Active Filter Tags */}
        {activeFilters.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {activeFilters.map((filterId) => {
              const option = filterOptions.find(f => f.id === filterId);
              return option ? (
                <Badge
                  key={filterId}
                  variant="secondary"
                  className="flex items-center gap-1 text-xs"
                >
                  {option.label}
                  <X
                    className="w-3 h-3 cursor-pointer hover:text-red-600"
                    onClick={() => handleFilterToggle(filterId)}
                  />
                </Badge>
              ) : null;
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
