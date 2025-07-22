/**
 * Inspection Queue Filters - Focused Component
 * 
 * Handles search and filter controls for inspection queue
 */

import React from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Search } from 'lucide-react';

interface InspectionQueueFiltersProps {
  searchQuery: string;
  filterStatus: string;
  filterPriority: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  onSearchChange: (query: string) => void;
  onFilterStatusChange: (status: string) => void;
  onFilterPriorityChange: (priority: string) => void;
  onSortChange: (sortBy: string) => void;
  onSortOrderToggle: () => void;
}

export const InspectionQueueFilters: React.FC<InspectionQueueFiltersProps> = ({
  searchQuery,
  filterStatus,
  filterPriority,
  sortBy,
  sortOrder,
  onSearchChange,
  onFilterStatusChange,
  onFilterPriorityChange,
  onSortChange,
  onSortOrderToggle
}) => {
  return (
    <div className="space-y-4" id="inspection-queue-filters">
      {/* Search and Filter Row */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              placeholder="Search by property, inspector, or ID..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-8"
              aria-label="Search inspections"
            />
          </div>
        </div>
        <Select value={filterStatus} onValueChange={onFilterStatusChange}>
          <SelectTrigger className="w-48" aria-label="Filter by status">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending_review">Pending Review</SelectItem>
            <SelectItem value="in_review">In Review</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterPriority} onValueChange={onFilterPriorityChange}>
          <SelectTrigger className="w-48" aria-label="Filter by priority">
            <SelectValue placeholder="All Priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Priority</SelectItem>
            <SelectItem value="high">High Priority</SelectItem>
            <SelectItem value="medium">Medium Priority</SelectItem>
            <SelectItem value="low">Low Priority</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Sort Controls */}
      <div className="flex items-center space-x-4">
        <span className="text-sm font-medium">Sort by:</span>
        <Select value={sortBy} onValueChange={onSortChange}>
          <SelectTrigger className="w-32" aria-label="Sort by">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="submittedAt">Date</SelectItem>
            <SelectItem value="priority">Priority</SelectItem>
            <SelectItem value="aiScore">AI Score</SelectItem>
          </SelectContent>
        </Select>
        <Button
          variant="outline"
          size="sm"
          onClick={onSortOrderToggle}
          aria-label={`Sort ${sortOrder === 'asc' ? 'descending' : 'ascending'}`}
        >
          {sortOrder === 'asc' ? '↑' : '↓'}
        </Button>
      </div>
    </div>
  );
};