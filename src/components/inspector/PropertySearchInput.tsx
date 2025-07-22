/**
 * Property Search Input - Focused Component
 * 
 * Handles property search with accessibility and performance optimization
 */

import React from 'react';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';

interface PropertySearchInputProps {
  searchQuery: string;
  onSearch: (query: string) => void;
  placeholder?: string;
}

export const PropertySearchInput: React.FC<PropertySearchInputProps> = ({
  searchQuery,
  onSearch,
  placeholder = "Search properties..."
}) => {
  return (
    <div className="relative" id="property-search-input">
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
      <Input
        placeholder={placeholder}
        value={searchQuery}
        onChange={(e) => onSearch(e.target.value)}
        className="pl-10"
        aria-label="Search properties"
      />
    </div>
  );
};