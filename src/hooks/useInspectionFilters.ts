
import { useState, useMemo } from "react";
import { ChecklistItemType } from "@/types/inspection";

export type FilterStatus = 'all' | 'pending' | 'completed' | 'failed';

export const useInspectionFilters = (items: ChecklistItemType[]) => {
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredItems = useMemo(() => {
    let filtered = items;

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(item => {
        switch (statusFilter) {
          case 'pending':
            return item.status === 'pending';
          case 'completed':
            return item.status === 'completed';
          case 'failed':
            return item.status === 'failed';
          default:
            return true;
        }
      });
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(item =>
        item.description?.toLowerCase().includes(query) ||
        item.category?.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [items, statusFilter, searchQuery]);

  return {
    statusFilter,
    setStatusFilter,
    searchQuery,
    setSearchQuery,
    filteredItems,
    totalCount: items.length,
    filteredCount: filteredItems.length
  };
};
