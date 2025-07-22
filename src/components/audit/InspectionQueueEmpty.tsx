/**
 * Inspection Queue Empty - Focused Component
 * 
 * Displays empty state when no inspections are found
 */

import React from 'react';
import { FileText } from 'lucide-react';

interface InspectionQueueEmptyProps {
  searchQuery: string;
  hasActiveFilters: boolean;
}

export const InspectionQueueEmpty: React.FC<InspectionQueueEmptyProps> = ({
  searchQuery,
  hasActiveFilters
}) => {
  return (
    <div className="text-center py-8" id="inspection-queue-empty">
      <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
      <p className="text-gray-500">No inspections found</p>
      {(searchQuery || hasActiveFilters) && (
        <p className="text-sm text-gray-400">Try adjusting your filters</p>
      )}
    </div>
  );
};