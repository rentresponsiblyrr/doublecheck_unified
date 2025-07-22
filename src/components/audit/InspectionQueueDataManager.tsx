/**
 * Inspection Queue Data Manager - Enterprise Grade
 * 
 * Handles inspection data filtering, sorting, and state management
 * with render props pattern for clean component separation
 */

import React, { useState, useMemo } from 'react';
import type { Inspection } from './InspectionQueueManager';

interface InspectionQueueDataManagerProps {
  inspections: Inspection[];
  children: (data: {
    filteredInspections: Inspection[];
    filterStatus: string;
    filterPriority: string;
    searchQuery: string;
    sortBy: string;
    sortOrder: 'asc' | 'desc';
    onSearchChange: (query: string) => void;
    onFilterStatusChange: (status: string) => void;
    onFilterPriorityChange: (priority: string) => void;
    onSortChange: (sortBy: string) => void;
    onSortOrderToggle: () => void;
  }) => React.ReactNode;
}

export const InspectionQueueDataManager: React.FC<InspectionQueueDataManagerProps> = ({
  inspections,
  children
}) => {
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<string>('submittedAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Filter and sort inspections
  const filteredInspections = useMemo(() => {
    return inspections
      .filter(inspection => {
        if (filterStatus !== 'all' && inspection.status !== filterStatus) return false;
        if (filterPriority !== 'all' && inspection.priority !== filterPriority) return false;
        if (searchQuery.trim()) {
          const query = searchQuery.toLowerCase();
          return (
            inspection.propertyAddress.toLowerCase().includes(query) ||
            inspection.inspectorName.toLowerCase().includes(query) ||
            inspection.id.toLowerCase().includes(query)
          );
        }
        return true;
      })
      .sort((a, b) => {
        type SortableValue = string | number | Date;
        
        const getSortValue = (item: Inspection, key: string): SortableValue => {
          const value = item[key as keyof Inspection];
          if (typeof value === 'string' || typeof value === 'number' || value instanceof Date) {
            return value;
          }
          return String(value || '');
        };
        
        let aValue: SortableValue = getSortValue(a, sortBy);
        let bValue: SortableValue = getSortValue(b, sortBy);
        
        if (sortBy === 'submittedAt') {
          aValue = new Date(aValue as string).getTime();
          bValue = new Date(bValue as string).getTime();
        } else if (sortBy === 'priority') {
          const priorityOrder = { high: 3, medium: 2, low: 1 };
          aValue = priorityOrder[aValue as keyof typeof priorityOrder] || 1;
          bValue = priorityOrder[bValue as keyof typeof priorityOrder] || 1;
        }
        
        if (sortOrder === 'asc') {
          return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
        } else {
          return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
        }
      });
  }, [inspections, filterStatus, filterPriority, searchQuery, sortBy, sortOrder]);

  return (
    <div id="inspection-queue-data-manager">
      {children({
        filteredInspections,
        filterStatus,
        filterPriority,
        searchQuery,
        sortBy,
        sortOrder,
        onSearchChange: setSearchQuery,
        onFilterStatusChange: setFilterStatus,
        onFilterPriorityChange: setFilterPriority,
        onSortChange: setSortBy,
        onSortOrderToggle: () => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
      })}
    </div>
  );
};