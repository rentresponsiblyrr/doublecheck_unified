/**
 * Virtualized Property List - Enterprise Grade
 *
 * High-performance virtualized list with accessibility and performance monitoring
 */

import React, { useRef, useCallback, useEffect, useState } from "react";
import { FixedSizeList as List } from "react-window";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Activity } from "lucide-react";
import { useOptimizedPropertyList } from "@/hooks/useVirtualizedPropertyList";
import { VirtualizedPropertyCard } from "./VirtualizedPropertyCard";
import { log } from "@/lib/logging/enterprise-logger";
import type { PropertyData } from "./PropertyDataManager";

interface VirtualizedPropertyListProps {
  properties: PropertyData[];
  searchQuery: string;
  containerHeight: number;
  selectedProperty?: PropertyData | null;
  onPropertySelect: (property: PropertyData) => void;
  onNewInspection: (property: PropertyData) => void;
  isLoading: boolean;
}

export const VirtualizedPropertyList: React.FC<
  VirtualizedPropertyListProps
> = ({
  properties,
  searchQuery,
  containerHeight,
  selectedProperty,
  onPropertySelect,
  onNewInspection,
  isLoading,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [lastSearchTime, setLastSearchTime] = useState<number>(0);

  /**
   * Initialize virtualized list with performance optimization
   */
  const {
    filteredProperties,
    virtualMetrics,
    searchStats,
    listRef,
    handleScroll,
    scrollToProperty,
    createItemRenderer,
    getAccessibilityProps,
    visibleRange,
    getPerformanceMetrics,
  } = useOptimizedPropertyList(properties, searchQuery, containerHeight);

  /**
   * Performance monitoring - log metrics every search
   */
  useEffect(() => {
    if (searchQuery) {
      const searchTime = performance.now();
      const timeSinceLastSearch = searchTime - lastSearchTime;

      if (timeSinceLastSearch > 100) {
        // Only log if significant time has passed
        const metrics = getPerformanceMetrics();

        log.info("Search performance metrics", {
          searchQuery,
          searchTime: timeSinceLastSearch,
          totalProperties: metrics.searchStats.totalProperties,
          filteredCount: metrics.searchStats.filteredCount,
          searchEfficiency: metrics.searchStats.searchEfficiency,
          renderEfficiency: metrics.memoryUsage.renderEfficiency,
        });

        setLastSearchTime(searchTime);
      }
    }
  }, [searchQuery, getPerformanceMetrics, lastSearchTime]);

  /**
   * Create optimized item renderer for virtual list
   */
  const itemRenderer = createItemRenderer(
    (property: PropertyData, index: number) => (
      <VirtualizedPropertyCard
        property={property}
        index={index}
        isSelected={selectedProperty?.property_id === property.property_id}
        onSelect={onPropertySelect}
        onNewInspection={onNewInspection}
      />
    ),
  );

  // Loading State
  if (isLoading) {
    return (
      <div
        id="loading-properties"
        className="space-y-3"
        aria-label="Loading properties"
      >
        {[1, 2, 3].map((i) => (
          <Card key={i} aria-hidden="true">
            <CardContent className="p-4">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-5 w-16" />
                </div>
                <Skeleton className="h-4 w-1/2" />
                <div className="flex gap-2">
                  <Skeleton className="h-6 w-16" />
                  <Skeleton className="h-6 w-16" />
                  <Skeleton className="h-6 w-16" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div id="virtualized-property-list" className="space-y-4">
      {/* Performance indicator */}
      <div className="flex items-center justify-between">
        <div>
          <span className="text-sm font-medium">Properties</span>
          {searchStats.isFiltered && (
            <span className="text-sm text-gray-500 ml-1">
              ({searchStats.filteredCount} of {searchStats.totalProperties})
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 text-xs text-gray-500">
          <Activity className="h-3 w-3" />
          <span>
            Rendering {visibleRange.end - visibleRange.start} of{" "}
            {virtualMetrics.itemCount}
          </span>
        </div>
      </div>

      {/* Virtual Scrolling List */}
      <div
        ref={containerRef}
        className="relative"
        style={{ height: containerHeight }}
      >
        {filteredProperties.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center text-gray-500">
            <Search className="h-12 w-12 mb-4 text-gray-300" />
            <h3 className="text-lg font-semibold mb-2">
              {searchQuery ? "No properties found" : "No properties available"}
            </h3>
            <p className="text-sm">
              {searchQuery
                ? `Try adjusting your search for "${searchQuery}"`
                : "Properties will appear here once they are added to your account"}
            </p>
          </div>
        ) : (
          <List
            ref={listRef}
            height={containerHeight}
            itemCount={virtualMetrics.itemCount}
            itemSize={virtualMetrics.itemHeight}
            overscanCount={virtualMetrics.overscanCount}
            onScroll={handleScroll}
            itemData={filteredProperties}
            id="property-list"
            {...getAccessibilityProps()}
          >
            {itemRenderer}
          </List>
        )}
      </div>
    </div>
  );
};
