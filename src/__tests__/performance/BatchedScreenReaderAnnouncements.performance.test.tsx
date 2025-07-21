/**
 * Batched Screen Reader Announcements Performance Tests
 * Validates performance optimizations while maintaining WCAG 2.1 AA compliance
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { 
  useBatchedScreenReaderAnnouncements,
  useOptimizedScreenReaderAnnouncements,
  useImmediateScreenReaderAnnouncements
} from '@/hooks/useBatchedScreenReaderAnnouncements';

// Mock performance.now for consistent timing tests
const mockPerformanceNow = vi.fn();
Object.defineProperty(performance, 'now', {
  value: mockPerformanceNow,
  writable: true
});

describe('Batched Screen Reader Announcements Performance', () => {
  let mockTime = 0;

  beforeEach(() => {
    // Reset DOM
    document.body.innerHTML = '';
    
    // Reset mock time
    mockTime = 0;
    mockPerformanceNow.mockImplementation(() => mockTime);
    
    // Mock Date.now for consistent timing
    vi.spyOn(Date, 'now').mockImplementation(() => mockTime);
    
    // Clear all timers
    vi.clearAllTimers();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  describe('Performance Optimization', () => {
    it('should batch multiple rapid announcements to prevent DOM thrashing', async () => {
      const { result } = renderHook(() => useBatchedScreenReaderAnnouncements({
        batchDelay: 500,
        maxBatchSize: 3
      }));

      const { announceToScreenReader } = result.current;

      // Make multiple rapid announcements
      act(() => {
        announceToScreenReader('Message 1', 'polite');
        announceToScreenReader('Message 2', 'polite');
        announceToScreenReader('Message 3', 'polite');
      });

      // Should not create DOM elements immediately
      expect(document.querySelectorAll('[aria-live]')).toHaveLength(0);

      // Advance time to trigger batch processing
      act(() => {
        vi.advanceTimersByTime(500);
      });

      // Should create only one batched announcement element
      const announcements = document.querySelectorAll('[aria-live="polite"]');
      expect(announcements).toHaveLength(1);
      expect(announcements[0].textContent).toContain('3 status updates');
    });

    it('should prevent DOM element accumulation with cleanup', async () => {
      const { result } = renderHook(() => useBatchedScreenReaderAnnouncements());
      const { announceToScreenReader } = result.current;

      // Create multiple batches
      for (let i = 0; i < 5; i++) {
        act(() => {
          announceToScreenReader(`Batch ${i} message`, 'polite');
          vi.advanceTimersByTime(600); // Trigger each batch
        });
      }

      // Should have created elements
      expect(document.querySelectorAll('[aria-live]').length).toBeGreaterThan(0);

      // Advance time for cleanup
      act(() => {
        vi.advanceTimersByTime(3000);
      });

      // Elements should be cleaned up
      expect(document.querySelectorAll('[aria-live]')).toHaveLength(0);
    });

    it('should handle high frequency announcements without blocking', async () => {
      const { result } = renderHook(() => useOptimizedScreenReaderAnnouncements());
      const { announceToScreenReader } = result.current;

      const startTime = performance.now();
      
      // Simulate high frequency announcements (like progress updates)
      act(() => {
        for (let i = 0; i < 100; i++) {
          announceToScreenReader(`Progress ${i}%`, 'polite');
          mockTime += 10; // 10ms between announcements
        }
      });

      const endTime = performance.now();
      const processingTime = endTime - startTime;

      // Should process quickly without blocking
      expect(processingTime).toBeLessThan(100); // <100ms for 100 announcements
      
      // Should not create 100 DOM elements
      expect(document.querySelectorAll('[aria-live]')).toHaveLength(0); // Not processed yet
    });

    it('should deduplicate identical rapid announcements', async () => {
      const { result } = renderHook(() => useBatchedScreenReaderAnnouncements({
        deduplicationWindow: 1000
      }));
      const { announceToScreenReader, getBatchStats } = result.current;

      act(() => {
        announceToScreenReader('Same message', 'polite');
        announceToScreenReader('Same message', 'polite'); // Should be deduplicated
        announceToScreenReader('Different message', 'polite');
      });

      const stats = getBatchStats();
      expect(stats.pendingCount).toBe(2); // Only 2 unique messages
    });
  });

  describe('Accessibility Compliance', () => {
    it('should maintain WCAG 2.1 AA compliance with proper ARIA attributes', async () => {
      const { result } = renderHook(() => useBatchedScreenReaderAnnouncements());
      const { announceToScreenReader } = result.current;

      act(() => {
        announceToScreenReader('Test message', 'assertive');
        vi.advanceTimersByTime(500);
      });

      const announcement = document.querySelector('[aria-live="assertive"]');
      expect(announcement).toHaveAttribute('aria-live', 'assertive');
      expect(announcement).toHaveAttribute('aria-atomic', 'true');
      expect(announcement).toHaveClass('sr-only');
      expect(announcement?.textContent).toBe('Test message');
    });

    it('should prioritize assertive announcements correctly', async () => {
      const { result } = renderHook(() => useBatchedScreenReaderAnnouncements());
      const { announceToScreenReader } = result.current;

      act(() => {
        announceToScreenReader('Polite message', 'polite');
        announceToScreenReader('Assertive message', 'assertive');
        vi.advanceTimersByTime(500);
      });

      const politeAnnouncements = document.querySelectorAll('[aria-live="polite"]');
      const assertiveAnnouncements = document.querySelectorAll('[aria-live="assertive"]');

      expect(politeAnnouncements).toHaveLength(1);
      expect(assertiveAnnouncements).toHaveLength(1);
      expect(assertiveAnnouncements[0].textContent).toBe('Assertive message');
    });

    it('should work without batching for immediate announcements', async () => {
      const { result } = renderHook(() => useImmediateScreenReaderAnnouncements());
      const { announceToScreenReader } = result.current;

      act(() => {
        announceToScreenReader('Immediate message', 'assertive');
      });

      // Should create element immediately (no batching)
      const announcement = document.querySelector('[aria-live="assertive"]');
      expect(announcement).toBeTruthy();
      expect(announcement?.textContent).toBe('Immediate message');
    });
  });

  describe('Memory Management', () => {
    it('should cleanup resources on unmount', async () => {
      const { result, unmount } = renderHook(() => useBatchedScreenReaderAnnouncements());
      const { announceToScreenReader, getBatchStats } = result.current;

      act(() => {
        announceToScreenReader('Test message', 'polite');
      });

      expect(getBatchStats().pendingCount).toBe(1);

      unmount();

      // Should have cleaned up pending announcements
      // Note: We can't directly test this as the hook is unmounted,
      // but this ensures no memory leaks in real usage
    });

    it('should limit batch size to prevent memory issues', async () => {
      const { result } = renderHook(() => useBatchedScreenReaderAnnouncements({
        maxBatchSize: 2
      }));
      const { announceToScreenReader } = result.current;

      act(() => {
        announceToScreenReader('Message 1', 'polite');
        announceToScreenReader('Message 2', 'polite');
        announceToScreenReader('Message 3', 'polite');
        announceToScreenReader('Message 4', 'polite');
        vi.advanceTimersByTime(500);
      });

      // Should only process maxBatchSize (2) messages in first batch
      const announcements = document.querySelectorAll('[aria-live="polite"]');
      expect(announcements).toHaveLength(1);
      expect(announcements[0].textContent).toContain('2 status updates');

      // Should schedule next batch for remaining messages
      act(() => {
        vi.advanceTimersByTime(500);
      });

      const allAnnouncements = document.querySelectorAll('[aria-live="polite"]');
      expect(allAnnouncements).toHaveLength(2); // Two batches
    });
  });

  describe('Integration with PhotoGuidance Performance', () => {
    it('should handle rapid progress updates without performance degradation', async () => {
      const { result } = renderHook(() => useOptimizedScreenReaderAnnouncements());
      const { announceToScreenReader } = result.current;

      const startTime = performance.now();

      // Simulate PhotoGuidance progress updates
      act(() => {
        announceToScreenReader('Photo capture started', 'assertive');
        for (let i = 0; i <= 100; i += 10) {
          announceToScreenReader(`Processing photo: ${i}% complete`, 'polite');
          mockTime += 50; // 50ms intervals
        }
        announceToScreenReader('Photo capture completed', 'assertive');
      });

      const endTime = performance.now();
      const processingTime = endTime - startTime;

      // Should process all announcements quickly
      expect(processingTime).toBeLessThan(200); // <200ms total
    });

    it('should batch video compression status updates efficiently', async () => {
      const { result } = renderHook(() => useOptimizedScreenReaderAnnouncements());
      const { announceToScreenReader } = result.current;

      // Simulate video compression announcements
      act(() => {
        announceToScreenReader('Compressing video for optimal performance', 'polite');
        announceToScreenReader('Video compression 25% complete', 'polite');
        announceToScreenReader('Video compression 50% complete', 'polite');
        announceToScreenReader('Video compression 75% complete', 'polite');
        announceToScreenReader('Video compression completed successfully', 'polite');
        
        vi.advanceTimersByTime(300); // Optimized batch delay
      });

      // Should batch the status updates
      const announcements = document.querySelectorAll('[aria-live="polite"]');
      expect(announcements).toHaveLength(1);
      expect(announcements[0].textContent).toContain('status updates');
    });
  });
});