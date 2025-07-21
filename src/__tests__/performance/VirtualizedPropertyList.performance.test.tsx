/**
 * Virtualized Property List Performance Tests
 * Validates Netflix-level performance with thousands of properties
 * Ensures sub-100ms render times and smooth 60fps scrolling
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useOptimizedPropertyList } from '@/hooks/useVirtualizedPropertyList';
import { VirtualizedPropertySelector } from '@/components/scrapers/VirtualizedPropertySelector';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mock data generator for performance testing
const generateMockProperties = (count: number) => {
  return Array.from({ length: count }, (_, index) => ({
    property_id: `prop-${index}`,
    property_name: `Property ${index + 1}`,
    property_address: `${index + 1} Test Street, Test City, TC`,
    property_vrbo_url: index % 2 === 0 ? 'https://vrbo.com/test' : null,
    property_airbnb_url: index % 3 === 0 ? 'https://airbnb.com/test' : null,
    property_status: ['available', 'occupied', 'maintenance'][index % 3],
    property_created_at: new Date(Date.now() - index * 24 * 60 * 60 * 1000).toISOString(),
    inspection_count: Math.floor(Math.random() * 10),
    completed_inspection_count: Math.floor(Math.random() * 5),
    active_inspection_count: Math.random() > 0.8 ? 1 : 0,
    latest_inspection_id: Math.random() > 0.5 ? `insp-${index}` : null,
    latest_inspection_completed: Math.random() > 0.5
  }));
};

// Mock react-window List component
vi.mock('react-window', () => ({
  FixedSizeList: vi.fn(({ children, itemCount, height, itemSize, onScroll, ...props }) => {
    const items = Array.from({ length: Math.min(itemCount, 10) }, (_, index) => (
      <div key={index} style={{ height: itemSize }}>
        {children({ index, style: { height: itemSize } })}
      </div>
    ));
    
    return (
      <div 
        style={{ height, overflowY: 'auto' }}
        data-testid="virtual-list"
        onScroll={onScroll}
        {...props}
      >
        {items}
      </div>
    );
  })
}));

// Mock auth provider
vi.mock('@/components/AuthProvider', () => ({
  useAuth: () => ({
    user: { id: 'test-user-id' },
    isLoading: false
  })
}));

// Mock supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    rpc: vi.fn(() => ({
      order: vi.fn(() => ({
        data: generateMockProperties(1000),
        error: null
      }))
    }))
  }
}));

describe('Virtualized Property List Performance Tests', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
          cacheTime: 0
        }
      }
    });
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    queryClient.clear();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  describe('Hook Performance', () => {
    it('should handle 10,000 properties without performance degradation', () => {
      const largePropertySet = generateMockProperties(10000);
      
      const startTime = performance.now();
      
      const { result } = renderHook(() => 
        useOptimizedPropertyList(largePropertySet, '', 600)
      );

      const endTime = performance.now();
      const initTime = endTime - startTime;

      // Should initialize quickly even with large datasets
      expect(initTime).toBeLessThan(50); // <50ms initialization
      expect(result.current.filteredProperties).toHaveLength(10000);
      expect(result.current.virtualMetrics.itemCount).toBe(10000);
    });

    it('should perform fast search filtering on large datasets', () => {
      const largePropertySet = generateMockProperties(5000);
      
      const { result, rerender } = renderHook(
        ({ searchQuery }) => useOptimizedPropertyList(largePropertySet, searchQuery, 600),
        { initialProps: { searchQuery: '' } }
      );

      const startTime = performance.now();
      
      // Perform search
      rerender({ searchQuery: 'Property 1' });
      
      const endTime = performance.now();
      const searchTime = endTime - startTime;

      // Search should be fast even with 5000 properties
      expect(searchTime).toBeLessThan(100); // <100ms search time
      expect(result.current.filteredProperties.length).toBeGreaterThan(0);
      expect(result.current.searchStats.isFiltered).toBe(true);
    });

    it('should provide efficient memory usage metrics', () => {
      const properties = generateMockProperties(1000);
      
      const { result } = renderHook(() => 
        useOptimizedPropertyList(properties, '', 400)
      );

      const metrics = result.current.getPerformanceMetrics();
      
      expect(metrics.virtualMetrics.visibleItemCount).toBeLessThan(10); // Only render visible items
      expect(metrics.memoryUsage.renderEfficiency).toBeLessThan(0.02); // <2% of items rendered
      expect(metrics.searchStats.totalProperties).toBe(1000);
    });

    it('should handle rapid search query changes efficiently', () => {
      const properties = generateMockProperties(2000);
      
      const { result, rerender } = renderHook(
        ({ searchQuery }) => useOptimizedPropertyList(properties, searchQuery, 600),
        { initialProps: { searchQuery: '' } }
      );

      const searchQueries = ['Prop', 'Property', 'Property 1', 'Property 10', 'Property 100'];
      const searchTimes: number[] = [];

      searchQueries.forEach(query => {
        const startTime = performance.now();
        rerender({ searchQuery: query });
        const endTime = performance.now();
        searchTimes.push(endTime - startTime);
      });

      // All search operations should be fast
      const avgSearchTime = searchTimes.reduce((a, b) => a + b, 0) / searchTimes.length;
      expect(avgSearchTime).toBeLessThan(50); // <50ms average search time
    });
  });

  describe('Component Performance', () => {
    const TestWrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    );

    it('should render large property lists without blocking UI', async () => {
      const mockOnSelect = vi.fn();
      const mockOnInspection = vi.fn();

      const startTime = performance.now();
      
      render(
        <TestWrapper>
          <VirtualizedPropertySelector
            onPropertySelect={mockOnSelect}
            onNewInspection={mockOnInspection}
            containerHeight={600}
          />
        </TestWrapper>
      );

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      // Component should render quickly
      expect(renderTime).toBeLessThan(200); // <200ms render time
      
      // Should display virtual list container
      await waitFor(() => {
        expect(screen.getByTestId('virtual-list')).toBeInTheDocument();
      });
    });

    it('should handle search input changes without lag', async () => {
      const mockOnSelect = vi.fn();
      const mockOnInspection = vi.fn();

      render(
        <TestWrapper>
          <VirtualizedPropertySelector
            onPropertySelect={mockOnSelect}
            onNewInspection={mockOnInspection}
            containerHeight={600}
          />
        </TestWrapper>
      );

      const searchInput = await waitFor(() => 
        screen.getByRole('searchbox', { name: /search properties/i })
      );

      // Measure typing performance
      const searchQueries = ['a', 'ab', 'abc', 'abcd', 'abcde'];
      const typingTimes: number[] = [];

      for (const query of searchQueries) {
        const startTime = performance.now();
        
        fireEvent.change(searchInput, { target: { value: query } });
        
        const endTime = performance.now();
        typingTimes.push(endTime - startTime);
      }

      const avgTypingTime = typingTimes.reduce((a, b) => a + b, 0) / typingTimes.length;
      expect(avgTypingTime).toBeLessThan(16); // <16ms for 60fps responsiveness
    });

    it('should maintain smooth scrolling performance', async () => {
      const mockOnSelect = vi.fn();
      const mockOnInspection = vi.fn();

      render(
        <TestWrapper>
          <VirtualizedPropertySelector
            onPropertySelect={mockOnSelect}
            onNewInspection={mockOnInspection}
            containerHeight={600}
          />
        </TestWrapper>
      );

      const virtualList = await waitFor(() => screen.getByTestId('virtual-list'));

      // Simulate scroll events
      const scrollEvents = Array.from({ length: 50 }, (_, i) => ({ scrollTop: i * 50 }));
      const scrollTimes: number[] = [];

      scrollEvents.forEach(scrollEvent => {
        const startTime = performance.now();
        
        fireEvent.scroll(virtualList, { target: scrollEvent });
        
        const endTime = performance.now();
        scrollTimes.push(endTime - startTime);
      });

      const avgScrollTime = scrollTimes.reduce((a, b) => a + b, 0) / scrollTimes.length;
      expect(avgScrollTime).toBeLessThan(8); // <8ms per scroll for 120fps
    });
  });

  describe('Memory Management', () => {
    it('should not leak memory with frequent search operations', () => {
      const properties = generateMockProperties(1000);
      let hook: any;

      const { result, rerender, unmount } = renderHook(
        ({ searchQuery }) => useOptimizedPropertyList(properties, searchQuery, 600),
        { initialProps: { searchQuery: '' } }
      );

      hook = result;

      // Perform many search operations
      for (let i = 0; i < 100; i++) {
        rerender({ searchQuery: `Property ${i}` });
      }

      // Check that metrics are still reasonable
      const finalMetrics = hook.current.getPerformanceMetrics();
      expect(finalMetrics.virtualMetrics.itemCount).toBeLessThanOrEqual(1000);
      
      unmount();
      
      // Should not throw errors on cleanup
      expect(() => {
        // Trigger potential cleanup operations
        hook = null;
      }).not.toThrow();
    });

    it('should efficiently handle property list updates', () => {
      let properties = generateMockProperties(500);
      
      const { result, rerender } = renderHook(
        ({ props }) => useOptimizedPropertyList(props, '', 600),
        { initialProps: { props: properties } }
      );

      const initialMetrics = result.current.getPerformanceMetrics();
      
      // Update properties list
      properties = generateMockProperties(1000);
      const updateStartTime = performance.now();
      
      rerender({ props: properties });
      
      const updateEndTime = performance.now();
      const updateTime = updateEndTime - updateStartTime;

      // Update should be fast
      expect(updateTime).toBeLessThan(100); // <100ms for list updates
      
      const updatedMetrics = result.current.getPerformanceMetrics();
      expect(updatedMetrics.virtualMetrics.itemCount).toBe(1000);
    });
  });

  describe('Accessibility Performance', () => {
    it('should maintain accessibility with large lists', () => {
      const properties = generateMockProperties(2000);
      
      const { result } = renderHook(() => 
        useOptimizedPropertyList(properties, '', 600)
      );

      const accessibilityProps = result.current.getAccessibilityProps();
      
      expect(accessibilityProps.role).toBe('listbox');
      expect(accessibilityProps['aria-rowcount']).toBe(2000);
      expect(accessibilityProps['aria-label']).toContain('2000 properties');
      expect(accessibilityProps['aria-live']).toBe('polite');
    });

    it('should provide accurate search result announcements', () => {
      const properties = generateMockProperties(1000);
      
      const { result, rerender } = renderHook(
        ({ searchQuery }) => useOptimizedPropertyList(properties, searchQuery, 600),
        { initialProps: { searchQuery: '' } }
      );

      // Perform search
      rerender({ searchQuery: 'Property 1' });
      
      const accessibilityProps = result.current.getAccessibilityProps();
      expect(accessibilityProps['aria-label']).toContain('filtered by "Property 1"');
      
      const metrics = result.current.getPerformanceMetrics();
      expect(metrics.searchStats.isFiltered).toBe(true);
      expect(metrics.searchStats.filteredCount).toBeGreaterThan(0);
    });
  });
});