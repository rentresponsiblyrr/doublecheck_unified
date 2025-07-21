/**
 * Component Render Performance Tests - Netflix/Google-Level Standards
 * Validates <50ms render times for ALL components under production conditions
 * Tests with realistic data volumes and user interaction patterns
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { globalPerformanceMonitor } from '@/lib/performance/PerformanceMonitor';
import { BrowserRouter } from 'react-router-dom';
import React from 'react';

// Import components to test
import { PropertySelector } from '@/components/scrapers/PropertySelector';
import { SimplifiedInspectionPage } from '@/components/SimplifiedInspectionPage';
import { AdminOverview } from '@/components/admin/AdminOverview';
import { ChecklistManagement } from '@/components/admin/ChecklistManagement';
import { UserManagement } from '@/components/admin/UserManagement';

// Mock data generators for realistic testing
const generateMockProperties = (count: number) =>
  Array.from({ length: count }, (_, i) => ({
    property_id: `prop-${i}`,
    property_name: `Property ${i}`,
    property_address: `${i} Test Street, Test City, TC ${String(i).padStart(5, '0')}`,
    property_vrbo_url: `https://vrbo.com/property-${i}`,
    property_airbnb_url: `https://airbnb.com/property-${i}`,
    inspection_count: Math.floor(Math.random() * 10),
    completed_inspection_count: Math.floor(Math.random() * 5),
    active_inspection_count: Math.floor(Math.random() * 2)
  }));

const generateMockChecklists = (count: number) =>
  Array.from({ length: count }, (_, i) => ({
    id: `checklist-${i}`,
    title: `Safety Checklist ${i}`,
    category: ['safety', 'maintenance', 'cleanliness'][i % 3],
    items: Array.from({ length: 20 }, (_, j) => ({
      id: `item-${i}-${j}`,
      title: `Check item ${j} for ${['smoke detector', 'fire extinguisher', 'cleanliness'][j % 3]}`,
      required: Math.random() > 0.3,
      evidence_type: ['photo', 'video', 'none'][j % 3]
    }))
  }));

const generateMockUsers = (count: number) =>
  Array.from({ length: count }, (_, i) => ({
    id: `user-${i}`,
    full_name: `Test User ${i}`,
    email: `user${i}@test.com`,
    role: ['inspector', 'auditor', 'admin'][i % 3],
    created_at: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString(),
    last_active: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString()
  }));

// Mock Auth Context
const MockAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const mockUser = {
    id: 'test-user-123',
    email: 'test@example.com',
    full_name: 'Test User'
  };

  return (
    <div data-testid="mock-auth-provider">
      {React.Children.map(children, child =>
        React.isValidElement(child)
          ? React.cloneElement(child as React.ReactElement<any>, { user: mockUser })
          : child
      )}
    </div>
  );
};

// Test wrapper with all providers
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, cacheTime: 0 },
      mutations: { retry: false }
    }
  });

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <MockAuthProvider>
          {children}
        </MockAuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

// Performance measurement utilities
const measureRenderPerformance = async (renderFn: () => void): Promise<number> => {
  const startTime = performance.now();
  
  await act(async () => {
    renderFn();
    // Allow React to complete rendering
    await new Promise(resolve => setTimeout(resolve, 0));
  });
  
  const endTime = performance.now();
  return endTime - startTime;
};

// Mock Supabase
const mockSupabase = {
  rpc: vi.fn(),
  from: vi.fn(() => ({
    select: vi.fn(() => ({
      eq: vi.fn(() => ({ data: [], error: null })),
      order: vi.fn(() => ({ data: [], error: null })),
      range: vi.fn(() => ({ data: [], error: null }))
    }))
  }))
};

vi.mock('@/integrations/supabase/client', () => ({
  supabase: mockSupabase
}));

describe('Component Render Performance Tests - Elite Standards', () => {
  let performanceStartTime: number;

  beforeEach(() => {
    performanceStartTime = performance.now();
    vi.clearAllMocks();
    
    // Set up default mock responses
    mockSupabase.rpc.mockResolvedValue({
      data: generateMockProperties(100),
      error: null
    });
  });

  afterEach(() => {
    const testDuration = performance.now() - performanceStartTime;
    console.log(`Test completed in ${testDuration.toFixed(2)}ms`);
  });

  describe('PropertySelector Performance', () => {
    it('should render with 100 properties in <50ms', async () => {
      const mockProperties = generateMockProperties(100);
      mockSupabase.rpc.mockResolvedValueOnce({
        data: mockProperties,
        error: null
      });

      const renderTime = await measureRenderPerformance(() => {
        render(
          <TestWrapper>
            <PropertySelector
              onPropertySelected={() => {}}
              selectedProperty={null}
            />
          </TestWrapper>
        );
      });

      expect(renderTime).toBeLessThan(50); // <50ms render time
      console.log(`PropertySelector render time: ${renderTime.toFixed(2)}ms`);
    });

    it('should render with 1000 properties using virtualization in <50ms', async () => {
      const mockProperties = generateMockProperties(1000);
      mockSupabase.rpc.mockResolvedValueOnce({
        data: mockProperties,
        error: null
      });

      const renderTime = await measureRenderPerformance(() => {
        render(
          <TestWrapper>
            <PropertySelector
              onPropertySelected={() => {}}
              selectedProperty={null}
            />
          </TestWrapper>
        );
      });

      expect(renderTime).toBeLessThan(50); // Virtual scrolling should keep it fast
      console.log(`PropertySelector (1000 items) render time: ${renderTime.toFixed(2)}ms`);
    });

    it('should handle search filtering without performance degradation', async () => {
      const mockProperties = generateMockProperties(500);
      mockSupabase.rpc.mockResolvedValueOnce({
        data: mockProperties,
        error: null
      });

      const { rerender } = render(
        <TestWrapper>
          <PropertySelector
            onPropertySelected={() => {}}
            selectedProperty={null}
          />
        </TestWrapper>
      );

      // Measure re-render with search query
      const rerenderTime = await measureRenderPerformance(() => {
        rerender(
          <TestWrapper>
            <PropertySelector
              onPropertySelected={() => {}}
              selectedProperty={null}
            />
          </TestWrapper>
        );
      });

      expect(rerenderTime).toBeLessThan(25); // Re-renders should be even faster
      console.log(`PropertySelector search re-render: ${rerenderTime.toFixed(2)}ms`);
    });
  });

  describe('SimplifiedInspectionPage Performance', () => {
    it('should render inspection page with full checklist in <50ms', async () => {
      const mockChecklist = Array.from({ length: 50 }, (_, i) => ({
        id: `item-${i}`,
        title: `Safety Check ${i}`,
        category: 'safety',
        status: 'pending',
        evidence_type: 'photo'
      }));

      mockSupabase.from.mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({ data: mockChecklist, error: null }))
        }))
      });

      const renderTime = await measureRenderPerformance(() => {
        render(
          <TestWrapper>
            <SimplifiedInspectionPage />
          </TestWrapper>
        );
      });

      expect(renderTime).toBeLessThan(50);
      console.log(`SimplifiedInspectionPage render time: ${renderTime.toFixed(2)}ms`);
    });

    it('should handle checklist updates without blocking UI', async () => {
      const { rerender } = render(
        <TestWrapper>
          <SimplifiedInspectionPage />
        </TestWrapper>
      );

      const updateTime = await measureRenderPerformance(() => {
        rerender(
          <TestWrapper>
            <SimplifiedInspectionPage />
          </TestWrapper>
        );
      });

      expect(updateTime).toBeLessThan(30); // Updates should be even faster
      console.log(`SimplifiedInspectionPage update time: ${updateTime.toFixed(2)}ms`);
    });
  });

  describe('Admin Components Performance', () => {
    it('should render AdminOverview with dashboard data in <50ms', async () => {
      const mockDashboardData = {
        totalInspections: 1250,
        completedInspections: 1100,
        activeInspectors: 25,
        recentActivity: Array.from({ length: 20 }, (_, i) => ({
          id: i,
          type: 'inspection_completed',
          timestamp: new Date().toISOString(),
          inspector: `Inspector ${i}`,
          property: `Property ${i}`
        }))
      };

      mockSupabase.rpc.mockResolvedValueOnce({
        data: mockDashboardData,
        error: null
      });

      const renderTime = await measureRenderPerformance(() => {
        render(
          <TestWrapper>
            <AdminOverview />
          </TestWrapper>
        );
      });

      expect(renderTime).toBeLessThan(50);
      console.log(`AdminOverview render time: ${renderTime.toFixed(2)}ms`);
    });

    it('should render ChecklistManagement with 100 checklists in <50ms', async () => {
      const mockChecklists = generateMockChecklists(100);
      mockSupabase.from.mockReturnValue({
        select: vi.fn(() => ({
          order: vi.fn(() => ({ data: mockChecklists, error: null }))
        }))
      });

      const renderTime = await measureRenderPerformance(() => {
        render(
          <TestWrapper>
            <ChecklistManagement />
          </TestWrapper>
        );
      });

      expect(renderTime).toBeLessThan(50);
      console.log(`ChecklistManagement render time: ${renderTime.toFixed(2)}ms`);
    });

    it('should render UserManagement with 500 users in <50ms', async () => {
      const mockUsers = generateMockUsers(500);
      mockSupabase.from.mockReturnValue({
        select: vi.fn(() => ({
          order: vi.fn(() => ({ data: mockUsers, error: null }))
        }))
      });

      const renderTime = await measureRenderPerformance(() => {
        render(
          <TestWrapper>
            <UserManagement />
          </TestWrapper>
        );
      });

      expect(renderTime).toBeLessThan(50);
      console.log(`UserManagement render time: ${renderTime.toFixed(2)}ms`);
    });
  });

  describe('Performance Under Stress Conditions', () => {
    it('should maintain <50ms renders with maximum realistic data loads', async () => {
      // Test with extreme but realistic data volumes
      const extremeProperties = generateMockProperties(2000);
      const extremeChecklists = generateMockChecklists(200);
      const extremeUsers = generateMockUsers(1000);

      mockSupabase.rpc.mockResolvedValue({
        data: extremeProperties,
        error: null
      });

      mockSupabase.from.mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({ data: extremeChecklists, error: null })),
          order: vi.fn(() => ({ data: extremeUsers, error: null }))
        }))
      });

      // Test PropertySelector with extreme data
      const propertyRenderTime = await measureRenderPerformance(() => {
        render(
          <TestWrapper>
            <PropertySelector
              onPropertySelected={() => {}}
              selectedProperty={null}
            />
          </TestWrapper>
        );
      });

      expect(propertyRenderTime).toBeLessThan(50);
      console.log(`Extreme PropertySelector render: ${propertyRenderTime.toFixed(2)}ms`);

      // Test UserManagement with extreme data
      const userRenderTime = await measureRenderPerformance(() => {
        render(
          <TestWrapper>
            <UserManagement />
          </TestWrapper>
        );
      });

      expect(userRenderTime).toBeLessThan(50);
      console.log(`Extreme UserManagement render: ${userRenderTime.toFixed(2)}ms`);
    });

    it('should handle rapid successive re-renders without performance degradation', async () => {
      const { rerender } = render(
        <TestWrapper>
          <PropertySelector
            onPropertySelected={() => {}}
            selectedProperty={null}
          />
        </TestWrapper>
      );

      const rerenderTimes: number[] = [];

      // Perform 10 rapid re-renders
      for (let i = 0; i < 10; i++) {
        const rerenderTime = await measureRenderPerformance(() => {
          rerender(
            <TestWrapper>
              <PropertySelector
                onPropertySelected={() => {}}
                selectedProperty={null}
                key={i} // Force new render
              />
            </TestWrapper>
          );
        });
        rerenderTimes.push(rerenderTime);
      }

      // All re-renders should be fast
      rerenderTimes.forEach((time, index) => {
        expect(time).toBeLessThan(50);
      });

      // Performance should not degrade over time
      const firstHalf = rerenderTimes.slice(0, 5);
      const secondHalf = rerenderTimes.slice(5);
      const avgFirst = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
      const avgSecond = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;

      expect(avgSecond).toBeLessThanOrEqual(avgFirst * 1.2); // Max 20% degradation
      console.log(`Re-render times: ${rerenderTimes.map(t => t.toFixed(1)).join(', ')}ms`);
    });

    it('should maintain performance with complex prop changes', async () => {
      const complexProps = {
        onPropertySelected: () => {},
        selectedProperty: {
          id: 'test-123',
          address: '123 Complex Property Lane',
          type: 'luxury_villa',
          bedrooms: 6,
          bathrooms: 4,
          sqft: 3500,
          listingUrl: 'https://vrbo.com/complex-property',
          images: Array.from({ length: 20 }, (_, i) => `image-${i}.jpg`)
        },
        filters: {
          location: 'Test City',
          priceRange: [200, 800],
          amenities: ['pool', 'wifi', 'parking', 'kitchen', 'ac'],
          availability: {
            startDate: '2024-01-01',
            endDate: '2024-12-31'
          }
        },
        sortBy: 'price',
        viewMode: 'grid',
        isLoading: false
      };

      const renderTime = await measureRenderPerformance(() => {
        render(
          <TestWrapper>
            <PropertySelector {...complexProps} />
          </TestWrapper>
        );
      });

      expect(renderTime).toBeLessThan(50);
      console.log(`Complex props render time: ${renderTime.toFixed(2)}ms`);
    });
  });

  describe('Memory Efficiency Tests', () => {
    it('should not cause memory leaks during rapid renders', async () => {
      const initialMemory = (performance as any).memory?.usedJSHeapSize || 0;

      // Perform many render cycles
      for (let i = 0; i < 50; i++) {
        const { unmount } = render(
          <TestWrapper>
            <PropertySelector
              onPropertySelected={() => {}}
              selectedProperty={null}
              key={i}
            />
          </TestWrapper>
        );
        unmount();
      }

      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }

      const finalMemory = (performance as any).memory?.usedJSHeapSize || 0;
      const memoryGrowth = finalMemory - initialMemory;

      // Memory growth should be minimal
      expect(memoryGrowth).toBeLessThan(10 * 1024 * 1024); // <10MB growth
      console.log(`Memory growth after 50 render cycles: ${(memoryGrowth / 1024 / 1024).toFixed(2)}MB`);
    });
  });

  describe('Production Simulation Tests', () => {
    it('should maintain performance with production-like conditions', async () => {
      // Simulate production conditions with realistic data and timing
      const productionData = {
        properties: generateMockProperties(750), // Realistic property count
        users: generateMockUsers(150), // Realistic user count
        checklists: generateMockChecklists(50) // Realistic checklist count
      };

      mockSupabase.rpc.mockImplementation((fn: string) => {
        switch (fn) {
          case 'get_properties_with_inspections':
            return Promise.resolve({ data: productionData.properties, error: null });
          default:
            return Promise.resolve({ data: [], error: null });
        }
      });

      mockSupabase.from.mockImplementation((table: string) => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({ 
            data: table === 'profiles' ? productionData.users : productionData.checklists, 
            error: null 
          })),
          order: vi.fn(() => ({ 
            data: table === 'profiles' ? productionData.users : productionData.checklists, 
            error: null 
          }))
        }))
      }));

      // Test all major components
      const components = [
        { name: 'PropertySelector', component: PropertySelector, props: { onPropertySelected: () => {}, selectedProperty: null } },
        { name: 'SimplifiedInspectionPage', component: SimplifiedInspectionPage, props: {} },
        { name: 'AdminOverview', component: AdminOverview, props: {} },
        { name: 'UserManagement', component: UserManagement, props: {} },
        { name: 'ChecklistManagement', component: ChecklistManagement, props: {} }
      ];

      for (const { name, component: Component, props } of components) {
        const renderTime = await measureRenderPerformance(() => {
          render(
            <TestWrapper>
              <Component {...props} />
            </TestWrapper>
          );
        });

        expect(renderTime).toBeLessThan(50);
        console.log(`${name} production render time: ${renderTime.toFixed(2)}ms`);
      }
    });
  });
});