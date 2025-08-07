/**
 * Virtual Scrolling Container for Checklist Items
 * Optimizes rendering for large lists on mobile devices
 */

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { FixedSizeList as List } from 'react-window';
import { OptimizedChecklistItem } from './OptimizedChecklistItem';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, Filter, Download, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { mobileOptimization } from '@/services/mobileOptimizationService';
import { useOfflineInspection } from '@/hooks/useOfflineInspection';
import { cn } from '@/lib/utils';

interface ChecklistItem {
  id: string;
  label: string;
  category: string;
  status: 'completed' | 'failed' | 'not_applicable' | 'pending' | null;
  notes?: string;
  media?: Array<{ url: string; type: string }>;
  ai_status?: string;
}

interface VirtualChecklistContainerProps {
  items: ChecklistItem[];
  inspectionId: string;
  propertyName?: string;
  onComplete?: () => void;
}

export const VirtualChecklistContainer: React.FC<VirtualChecklistContainerProps> = ({
  items,
  inspectionId,
  propertyName,
  onComplete
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [filteredItems, setFilteredItems] = useState(items);
  const listRef = useRef<List>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerHeight, setContainerHeight] = useState(window.innerHeight - 200);
  
  const { 
    isOnline, 
    pendingChanges, 
    completeInspection,
    forceSync 
  } = useOfflineInspection({ inspectionId });

  // Calculate categories and stats
  const { categories, stats } = useMemo(() => {
    const cats = new Set<string>();
    const statusCounts = {
      completed: 0,
      failed: 0,
      not_applicable: 0,
      pending: 0
    };

    items.forEach(item => {
      if (item.category) cats.add(item.category);
      if (item.status) {
        statusCounts[item.status]++;
      } else {
        statusCounts.pending++;
      }
    });

    return {
      categories: Array.from(cats),
      stats: statusCounts
    };
  }, [items]);

  // Filter items based on search and category
  useEffect(() => {
    let filtered = items;

    if (searchTerm) {
      filtered = filtered.filter(item =>
        item.label.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedCategory) {
      filtered = filtered.filter(item => item.category === selectedCategory);
    }

    setFilteredItems(filtered);
  }, [items, searchTerm, selectedCategory]);

  // Handle container resize
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setContainerHeight(window.innerHeight - rect.top - 100);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Row renderer for virtual list
  const Row = useCallback(({ index, style }: { index: number; style: React.CSSProperties }) => {
    const item = filteredItems[index];
    
    return (
      <div style={style}>
        <OptimizedChecklistItem
          item={item}
          inspectionId={inspectionId}
          isVisible={true}
        />
      </div>
    );
  }, [filteredItems, inspectionId]);

  const handleComplete = async () => {
    const result = await completeInspection();
    if (result.success && onComplete) {
      onComplete();
    }
  };

  const completionPercentage = Math.round(
    ((stats.completed + stats.failed + stats.not_applicable) / items.length) * 100
  );

  const isComplete = completionPercentage === 100;

  return (
    <div ref={containerRef} className="flex flex-col h-full bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10 px-4 py-3">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-lg font-semibold">{propertyName || 'Inspection Checklist'}</h2>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant={isOnline ? 'default' : 'secondary'}>
                {isOnline ? 'Online' : 'Offline'}
              </Badge>
              {pendingChanges > 0 && (
                <Badge variant="outline">
                  {pendingChanges} pending
                </Badge>
              )}
            </div>
          </div>
          
          {/* Progress indicator */}
          <div className="text-right">
            <div className="text-2xl font-bold text-blue-600">
              {completionPercentage}%
            </div>
            <div className="text-xs text-gray-500">
              {stats.completed + stats.failed + stats.not_applicable}/{items.length}
            </div>
          </div>
        </div>

        {/* Search and filters */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <Input
              type="search"
              placeholder="Search items..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 h-9"
            />
          </div>
          
          {pendingChanges > 0 && isOnline && (
            <Button
              size="sm"
              variant="outline"
              onClick={forceSync}
              className="h-9"
            >
              Sync
            </Button>
          )}
        </div>

        {/* Category filters */}
        {categories.length > 0 && (
          <div className="flex gap-2 mt-2 overflow-x-auto pb-2">
            <Button
              size="sm"
              variant={selectedCategory === null ? 'default' : 'outline'}
              onClick={() => setSelectedCategory(null)}
              className="whitespace-nowrap"
            >
              All ({items.length})
            </Button>
            {categories.map(cat => (
              <Button
                key={cat}
                size="sm"
                variant={selectedCategory === cat ? 'default' : 'outline'}
                onClick={() => setSelectedCategory(cat)}
                className="whitespace-nowrap"
              >
                {cat}
              </Button>
            ))}
          </div>
        )}

        {/* Status summary */}
        <div className="grid grid-cols-4 gap-2 mt-3">
          <div className="text-center">
            <div className="flex items-center justify-center">
              <CheckCircle className="w-4 h-4 text-green-600 mr-1" />
              <span className="text-sm font-medium">{stats.completed}</span>
            </div>
            <span className="text-xs text-gray-500">Pass</span>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center">
              <XCircle className="w-4 h-4 text-red-600 mr-1" />
              <span className="text-sm font-medium">{stats.failed}</span>
            </div>
            <span className="text-xs text-gray-500">Fail</span>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center">
              <AlertCircle className="w-4 h-4 text-gray-400 mr-1" />
              <span className="text-sm font-medium">{stats.not_applicable}</span>
            </div>
            <span className="text-xs text-gray-500">N/A</span>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center">
              <div className="w-4 h-4 border-2 border-gray-300 rounded mr-1" />
              <span className="text-sm font-medium">{stats.pending}</span>
            </div>
            <span className="text-xs text-gray-500">Pending</span>
          </div>
        </div>
      </div>

      {/* Virtual scrolling list */}
      <div className="flex-1 px-4 py-2">
        {filteredItems.length > 0 ? (
          <List
            ref={listRef}
            height={containerHeight}
            itemCount={filteredItems.length}
            itemSize={100} // Estimated height of each item
            width="100%"
            overscanCount={3} // Render 3 items outside viewport for smoother scrolling
          >
            {Row}
          </List>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <Search className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>No items found</p>
            {searchTerm && (
              <Button
                size="sm"
                variant="link"
                onClick={() => setSearchTerm('')}
                className="mt-2"
              >
                Clear search
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Bottom action bar */}
      <div className="bg-white border-t px-4 py-3 sticky bottom-0">
        <Button
          onClick={handleComplete}
          disabled={!isComplete}
          className={cn(
            'w-full',
            isComplete ? 'bg-green-600 hover:bg-green-700' : ''
          )}
        >
          {isComplete ? (
            <>
              <CheckCircle className="w-4 h-4 mr-2" />
              Complete Inspection
            </>
          ) : (
            `Complete ${stats.pending} pending items`
          )}
        </Button>
      </div>
    </div>
  );
};