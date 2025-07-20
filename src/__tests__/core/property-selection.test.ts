/**
 * @fileoverview Comprehensive Tests for Property Selection Hook
 * Enterprise-grade test coverage for usePropertySelection business logic
 * 
 * @author STR Certified Engineering Team
 * @version 1.0.0
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePropertySelection } from '@/hooks/usePropertySelection';
import { INSPECTION_STATUS, STATUS_GROUPS } from '@/types/inspection-status';
import { InspectionFactory, PropertyFactory } from '../factories';

// Mock the mobile inspection optimizer
vi.mock('@/hooks/useMobileInspectionOptimizer', () => ({
  useMobileInspectionOptimizer: () => ({
    startOrJoinInspection: vi.fn(),
    retryInspection: vi.fn(),
    isLoading: false,
    error: null,
    clearError: vi.fn()
  })
}));

describe('usePropertySelection Hook', () => {
  const mockStartOrJoinInspection = vi.fn();
  const mockRetryInspection = vi.fn();
  const mockClearError = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup the mock implementation
    vi.mocked(require('@/hooks/useMobileInspectionOptimizer').useMobileInspectionOptimizer).mockReturnValue({
      startOrJoinInspection: mockStartOrJoinInspection,
      retryInspection: mockRetryInspection,
      isLoading: false,
      error: null,
      clearError: mockClearError
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Property Status Classification', () => {
    it('should classify property as approved when inspection is approved', () => {
      const approvedInspection = InspectionFactory.build({
        status: INSPECTION_STATUS.APPROVED,
        property_id: '123'
      });

      const { result } = renderHook(() => 
        usePropertySelection([approvedInspection])
      );

      const status = result.current.getPropertyStatus('123');

      expect(status).toEqual({
        status: 'approved',
        color: 'bg-green-600',
        text: 'Approved',
        activeInspectionId: approvedInspection.id,
        shouldHide: true
      });
    });

    it('should classify property as in-progress for draft status', () => {
      const draftInspection = InspectionFactory.build({
        status: INSPECTION_STATUS.DRAFT,
        property_id: '123',
        completed: false
      });

      const { result } = renderHook(() => 
        usePropertySelection([draftInspection])
      );

      const status = result.current.getPropertyStatus('123');

      expect(status).toEqual({
        status: 'in-progress',
        color: 'bg-yellow-500',
        text: 'In Progress',
        activeInspectionId: draftInspection.id
      });
    });

    it('should classify property as in-progress for needs revision status', () => {
      const revisionInspection = InspectionFactory.build({
        status: INSPECTION_STATUS.NEEDS_REVISION,
        property_id: '123'
      });

      const { result } = renderHook(() => 
        usePropertySelection([revisionInspection])
      );

      const status = result.current.getPropertyStatus('123');

      expect(status).toEqual({
        status: 'in-progress',
        color: 'bg-yellow-500',
        text: 'Needs Revision',
        activeInspectionId: revisionInspection.id
      });
    });

    it('should classify property as completed when in review pipeline', () => {
      const completedInspection = InspectionFactory.build({
        status: INSPECTION_STATUS.COMPLETED,
        property_id: '123'
      });

      const { result } = renderHook(() => 
        usePropertySelection([completedInspection])
      );

      const status = result.current.getPropertyStatus('123');

      expect(status).toEqual({
        status: 'completed',
        color: 'bg-blue-500',
        text: 'Under Review',
        activeInspectionId: null,
        shouldHide: false
      });
    });

    it('should classify property as pending when no inspections exist', () => {
      const { result } = renderHook(() => 
        usePropertySelection([])
      );

      const status = result.current.getPropertyStatus('123');

      expect(status).toEqual({
        status: 'pending',
        color: 'bg-gray-500',
        text: 'Not Started',
        activeInspectionId: null
      });
    });

    it('should prioritize approved over other statuses', () => {
      const inspections = [
        InspectionFactory.build({
          status: INSPECTION_STATUS.IN_PROGRESS,
          property_id: '123'
        }),
        InspectionFactory.build({
          status: INSPECTION_STATUS.APPROVED,
          property_id: '123'
        }),
        InspectionFactory.build({
          status: INSPECTION_STATUS.COMPLETED,
          property_id: '123'
        })
      ];

      const { result } = renderHook(() => 
        usePropertySelection(inspections)
      );

      const status = result.current.getPropertyStatus('123');

      expect(status.status).toBe('approved');
      expect(status.shouldHide).toBe(true);
    });
  });

  describe('Button Text Generation', () => {
    it('should return correct button text for approved properties', () => {
      const approvedInspection = InspectionFactory.build({
        status: INSPECTION_STATUS.APPROVED,
        property_id: '123'
      });

      const { result } = renderHook(() => 
        usePropertySelection([approvedInspection])
      );

      const buttonText = result.current.getButtonText('123');
      expect(buttonText).toBe('Property Approved');
    });

    it('should return correct button text for completed properties', () => {
      const completedInspection = InspectionFactory.build({
        status: INSPECTION_STATUS.COMPLETED,
        property_id: '123'
      });

      const { result } = renderHook(() => 
        usePropertySelection([completedInspection])
      );

      const buttonText = result.current.getButtonText('123');
      expect(buttonText).toBe('Under Review');
    });

    it('should return "Continue Inspection" for needs revision', () => {
      const revisionInspection = InspectionFactory.build({
        status: INSPECTION_STATUS.NEEDS_REVISION,
        property_id: '123'
      });

      const { result } = renderHook(() => 
        usePropertySelection([revisionInspection])
      );

      const buttonText = result.current.getButtonText('123');
      expect(buttonText).toBe('Continue Inspection');
    });

    it('should return "Join Inspection" for in-progress inspections', () => {
      const inProgressInspection = InspectionFactory.build({
        status: INSPECTION_STATUS.IN_PROGRESS,
        property_id: '123'
      });

      const { result } = renderHook(() => 
        usePropertySelection([inProgressInspection])
      );

      const buttonText = result.current.getButtonText('123');
      expect(buttonText).toBe('Join Inspection');
    });

    it('should return "Start Inspection" for pending properties', () => {
      const { result } = renderHook(() => 
        usePropertySelection([])
      );

      const buttonText = result.current.getButtonText('123');
      expect(buttonText).toBe('Start Inspection');
    });
  });

  describe('Property Selection Management', () => {
    it('should allow setting and getting selected property', () => {
      const { result } = renderHook(() => 
        usePropertySelection([])
      );

      expect(result.current.selectedProperty).toBeNull();

      act(() => {
        result.current.setSelectedProperty('property-123');
      });

      expect(result.current.selectedProperty).toBe('property-123');
    });

    it('should clear selected property when set to null', () => {
      const { result } = renderHook(() => 
        usePropertySelection([])
      );

      act(() => {
        result.current.setSelectedProperty('property-123');
      });

      expect(result.current.selectedProperty).toBe('property-123');

      act(() => {
        result.current.setSelectedProperty(null);
      });

      expect(result.current.selectedProperty).toBeNull();
    });
  });

  describe('Inspection Actions', () => {
    beforeEach(() => {
      vi.spyOn(console, 'warn').mockImplementation(() => {});
      vi.spyOn(console, 'log').mockImplementation(() => {});
    });

    it('should handle start inspection when property is selected', async () => {
      const { result } = renderHook(() => 
        usePropertySelection([])
      );

      act(() => {
        result.current.setSelectedProperty('property-123');
      });

      await act(async () => {
        await result.current.handleStartInspection();
      });

      expect(mockStartOrJoinInspection).toHaveBeenCalledWith('property-123');
    });

    it('should warn when trying to start inspection without selected property', async () => {
      const consoleSpy = vi.spyOn(console, 'warn');
      
      const { result } = renderHook(() => 
        usePropertySelection([])
      );

      await act(async () => {
        await result.current.handleStartInspection();
      });

      expect(consoleSpy).toHaveBeenCalledWith('⚠️ No property selected for inspection');
      expect(mockStartOrJoinInspection).not.toHaveBeenCalled();
    });

    it('should handle retry inspection when property is selected', async () => {
      const { result } = renderHook(() => 
        usePropertySelection([])
      );

      act(() => {
        result.current.setSelectedProperty('property-123');
      });

      await act(async () => {
        await result.current.handleRetryInspection();
      });

      expect(mockRetryInspection).toHaveBeenCalledWith('property-123');
    });

    it('should warn when trying to retry inspection without selected property', async () => {
      const consoleSpy = vi.spyOn(console, 'warn');
      
      const { result } = renderHook(() => 
        usePropertySelection([])
      );

      await act(async () => {
        await result.current.handleRetryInspection();
      });

      expect(consoleSpy).toHaveBeenCalledWith('⚠️ No property selected for retry');
      expect(mockRetryInspection).not.toHaveBeenCalled();
    });
  });

  describe('Legacy Status Handling', () => {
    it('should handle legacy uncompleted inspections as in-progress', () => {
      const legacyInspection = {
        id: 'legacy-123',
        property_id: '123',
        completed: false,
        start_time: new Date().toISOString(),
        status: undefined // Legacy inspection without status
      };

      const { result } = renderHook(() => 
        usePropertySelection([legacyInspection as any])
      );

      const status = result.current.getPropertyStatus('123');

      expect(status.status).toBe('in-progress');
    });

    it('should handle legacy available status as in-progress', () => {
      const legacyInspection = {
        id: 'legacy-123',
        property_id: '123',
        completed: false,
        start_time: new Date().toISOString(),
        status: 'available' // Legacy status
      };

      const { result } = renderHook(() => 
        usePropertySelection([legacyInspection as any])
      );

      const status = result.current.getPropertyStatus('123');

      expect(status.status).toBe('in-progress');
    });
  });

  describe('Complex Scenarios', () => {
    it('should handle multiple inspections for same property correctly', () => {
      const inspections = [
        InspectionFactory.build({
          status: INSPECTION_STATUS.REJECTED,
          property_id: '123',
          created_at: '2024-01-01T00:00:00Z'
        }),
        InspectionFactory.build({
          status: INSPECTION_STATUS.DRAFT,
          property_id: '123',
          created_at: '2024-01-02T00:00:00Z'
        }),
        InspectionFactory.build({
          status: INSPECTION_STATUS.COMPLETED,
          property_id: '123',
          created_at: '2024-01-03T00:00:00Z'
        })
      ];

      const { result } = renderHook(() => 
        usePropertySelection(inspections)
      );

      const status = result.current.getPropertyStatus('123');

      // Should prioritize active status (draft) over completed
      expect(status.status).toBe('in-progress');
    });

    it('should filter inspections by property ID correctly', () => {
      const inspections = [
        InspectionFactory.build({
          status: INSPECTION_STATUS.APPROVED,
          property_id: '123'
        }),
        InspectionFactory.build({
          status: INSPECTION_STATUS.DRAFT,
          property_id: '456'
        })
      ];

      const { result } = renderHook(() => 
        usePropertySelection(inspections)
      );

      const status123 = result.current.getPropertyStatus('123');
      const status456 = result.current.getPropertyStatus('456');

      expect(status123.status).toBe('approved');
      expect(status456.status).toBe('in-progress');
    });

    it('should handle empty property ID gracefully', () => {
      const { result } = renderHook(() => 
        usePropertySelection([])
      );

      const status = result.current.getPropertyStatus('');

      expect(status.status).toBe('pending');
    });
  });

  describe('Error Handling Integration', () => {
    it('should expose error state from mobile inspection optimizer', () => {
      const error = new Error('Test error');
      
      vi.mocked(require('@/hooks/useMobileInspectionOptimizer').useMobileInspectionOptimizer).mockReturnValue({
        startOrJoinInspection: mockStartOrJoinInspection,
        retryInspection: mockRetryInspection,
        isLoading: false,
        error,
        clearError: mockClearError
      });

      const { result } = renderHook(() => 
        usePropertySelection([])
      );

      expect(result.current.inspectionError).toBe(error);
    });

    it('should expose loading state from mobile inspection optimizer', () => {
      vi.mocked(require('@/hooks/useMobileInspectionOptimizer').useMobileInspectionOptimizer).mockReturnValue({
        startOrJoinInspection: mockStartOrJoinInspection,
        retryInspection: mockRetryInspection,
        isLoading: true,
        error: null,
        clearError: mockClearError
      });

      const { result } = renderHook(() => 
        usePropertySelection([])
      );

      expect(result.current.isCreatingInspection).toBe(true);
    });

    it('should expose clearError function', () => {
      const { result } = renderHook(() => 
        usePropertySelection([])
      );

      expect(result.current.clearError).toBe(mockClearError);
    });
  });

  describe('Performance Considerations', () => {
    it('should handle large numbers of inspections efficiently', () => {
      // Create 1000 inspections for performance testing
      const manyInspections = Array.from({ length: 1000 }, (_, index) => 
        InspectionFactory.build({
          property_id: (index % 100).toString(), // 100 different properties
          status: INSPECTION_STATUS.COMPLETED
        })
      );

      const startTime = performance.now();
      
      const { result } = renderHook(() => 
        usePropertySelection(manyInspections)
      );

      // Test getting status for multiple properties
      for (let i = 0; i < 50; i++) {
        result.current.getPropertyStatus(i.toString());
      }

      const endTime = performance.now();
      const duration = endTime - startTime;

      // Should complete within reasonable time (100ms)
      expect(duration).toBeLessThan(100);
    });

    it('should not cause unnecessary re-renders', () => {
      const inspections = [
        InspectionFactory.build({
          status: INSPECTION_STATUS.DRAFT,
          property_id: '123'
        })
      ];

      let renderCount = 0;
      const { result, rerender } = renderHook(
        ({ inspections }) => {
          renderCount++;
          return usePropertySelection(inspections);
        },
        { initialProps: { inspections } }
      );

      expect(renderCount).toBe(1);

      // Re-render with same data should not increase render count significantly
      rerender({ inspections });
      
      // Allow for some re-renders due to React's reconciliation
      expect(renderCount).toBeLessThan(5);
    });
  });
});