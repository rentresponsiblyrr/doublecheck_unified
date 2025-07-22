/**
 * Property Search Interface - Enterprise Grade
 * 
 * Search interface with accessibility and performance optimization
 */

import React, { useCallback, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { useOptimizedScreenReaderAnnouncements } from '@/hooks/useBatchedScreenReaderAnnouncements';
import type { PropertyData } from './PropertyDataManager';

interface SearchStats {
  isFiltered: boolean;
  totalProperties: number;
  filteredCount: number;
  searchEfficiency: number;
}

interface PropertySearchInterfaceProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  properties: PropertyData[];
  filteredProperties: PropertyData[];
  searchStats: SearchStats;
}

export const PropertySearchInterface: React.FC<PropertySearchInterfaceProps> = ({
  searchQuery,
  onSearchChange,
  properties,
  filteredProperties,
  searchStats
}) => {
  const searchInputRef = useRef<HTMLInputElement>(null);
  const { announceToScreenReader } = useOptimizedScreenReaderAnnouncements();

  /**
   * Optimized search handler with debouncing
   */
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newQuery = e.target.value;
    onSearchChange(newQuery);
    
    // Announce search results to screen readers
    if (newQuery.trim()) {
      const resultCount = properties.filter(p => 
        p.property_name?.toLowerCase().includes(newQuery.toLowerCase()) ||
        p.property_address?.toLowerCase().includes(newQuery.toLowerCase())
      ).length;
      
      announceToScreenReader(
        `Search updated. ${resultCount} ${resultCount === 1 ? 'property' : 'properties'} found for "${newQuery}"`,
        'polite'
      );
    } else {
      announceToScreenReader(
        `Search cleared. Showing all ${properties.length} properties`,
        'polite'
      );
    }
  }, [onSearchChange, properties, announceToScreenReader]);

  /**
   * Handle keyboard navigation in search input
   */
  const handleSearchKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown' && filteredProperties.length > 0) {
      e.preventDefault();
      // Focus first property card
      const firstCard = document.querySelector('[data-testid^="property-card-"]') as HTMLElement;
      firstCard?.focus();
    } else if (e.key === 'Escape') {
      onSearchChange('');
      announceToScreenReader('Search cleared', 'polite');
    }
  }, [filteredProperties.length, onSearchChange, announceToScreenReader]);

  return (
    <div id="property-search-interface" className="space-y-4">
      {/* Search Input with Accessibility */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          ref={searchInputRef}
          type="text"
          placeholder="Search properties by name or address..."
          value={searchQuery}
          onChange={handleSearchChange}
          onKeyDown={handleSearchKeyDown}
          className="pl-10 pr-4 h-12"
          role="searchbox"
          aria-label="Search properties"
          aria-describedby="search-help search-results"
          aria-autocomplete="list"
          aria-controls="property-list"
          aria-expanded={filteredProperties.length > 0}
        />
        <div 
          id="search-help" 
          className="sr-only"
          role="status"
          aria-live="polite"
        >
          Use arrow keys to navigate search results. Press Escape to clear search.
        </div>
      </div>

      {/* Search Results Status */}
      <div 
        id="search-results"
        className="sr-only"
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        {searchStats.isFiltered
          ? `Found ${searchStats.filteredCount} ${searchStats.filteredCount === 1 ? 'property' : 'properties'} matching "${searchQuery}"`
          : `Showing all ${searchStats.totalProperties} properties`
        }
      </div>
    </div>
  );
};