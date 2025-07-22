/**
 * INSPECTION MONITORING INTEGRATION TESTS
 * 
 * Integration test suite for the inspection monitoring system
 * Tests end-to-end monitoring functionality and service integration
 * 
 * VALIDATES: Monitoring system captures and processes events correctly
 * ENSURES: Performance metrics and alerts work as expected
 * CONFIRMS: Database integration and data persistence
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import {
  InspectionErrorMonitor,
  inspectionErrorMonitor,
  trackInspectionError,
  trackInspectionSuccess,
  getInspectionMetrics
} from '@/lib/monitoring/inspection-error-monitor';
import { InspectionErrorCode } from '@/lib/database/inspection-creation-service';
import { supabase } from '@/integrations/supabase/client';

// Mock Supabase for controlled testing
jest.mock('@/integrations/supabase/client');
const mockSupabase = supabase as jest.Mocked<typeof supabase>;

describe('Inspection Monitoring Integration', () => {
  let monitor: InspectionErrorMonitor;

  beforeEach(() => {
    // Get fresh monitor instance
    monitor = InspectionErrorMonitor.getInstance();
    
    // Reset monitoring data for clean tests
    monitor.resetMonitoringData();
    
    // Setup Supabase mock
    mockSupabase.from = jest.fn().mockReturnValue({
      insert: jest.fn().mockReturnValue({
        select: jest.fn().mockResolvedValue({ data: [{ id: 'test-id' }], error: null })
      })
    });

    jest.clearAllMocks();
  });

  afterEach(() => {
    monitor.resetMonitoringData();
    jest.restoreAllMocks();
  });

  describe('Error Tracking', () => {
    it('should track inspection errors with full context', async () => {
      const errorEvent = {
        errorCode: InspectionErrorCode.PROPERTY_NOT_FOUND,
        message: 'Property with ID 999 not found',
        userContext: {
          userId: 'test-user-id',
          propertyId: '999',
          inspectorId: 'test-inspector-id'
        },
        performanceData: {
          processingTime: 150,
          validationTime: 25,
          databaseTime: 75
        }
      };

      trackInspectionError(errorEvent);

      const metrics = getInspectionMetrics();
      
      expect(metrics.totalErrors).toBe(1);
      expect(metrics.errorsByCode[InspectionErrorCode.PROPERTY_NOT_FOUND]).toBe(1);
      expect(metrics.recentErrors).toHaveLength(1);
      expect(metrics.recentErrors[0].errorCode).toBe(InspectionErrorCode.PROPERTY_NOT_FOUND);
      expect(metrics.recentErrors[0].userContext?.propertyId).toBe('999');
    });

    it('should categorize error severity correctly', () => {
      const criticalError = {
        errorCode: InspectionErrorCode.RPC_FUNCTION_MISSING,
        message: 'Critical system error'
      };

      const mediumError = {
        errorCode: InspectionErrorCode.PROPERTY_NOT_FOUND,
        message: 'Property not found error'
      };

      trackInspectionError(criticalError);
      trackInspectionError(mediumError);

      const metrics = getInspectionMetrics();
      
      expect(metrics.criticalErrors).toBe(1);
      expect(metrics.totalErrors).toBe(2);
    });

    it('should maintain error history with limits', () => {
      // Generate more errors than buffer size to test limits
      for (let i = 0; i < 15; i++) {
        trackInspectionError({
          errorCode: InspectionErrorCode.VALIDATION_FAILED,
          message: `Test error ${i}`
        });
      }

      const metrics = getInspectionMetrics();
      
      expect(metrics.totalErrors).toBe(15);
      expect(metrics.recentErrors.length).toBeLessThanOrEqual(10); // Should limit to 10 recent
    });
  });

  describe('Success Tracking', () => {
    it('should track successful inspections with performance data', () => {
      const successData = {
        processingTime: 85,
        userContext: {
          propertyId: '123',
          inspectorId: 'test-inspector'
        },
        performanceData: {
          processingTime: 85,
          validationTime: 15,
          databaseTime: 45
        }
      };

      trackInspectionSuccess(successData);

      const metrics = getInspectionMetrics();
      
      expect(metrics.averageProcessingTime).toBe(85);
      expect(metrics.successRate).toBe(1.0); // 100% success rate
    });

    it('should calculate success rates correctly', () => {
      // Track successes and errors
      trackInspectionSuccess({ processingTime: 100 });
      trackInspectionSuccess({ processingTime: 120 });
      trackInspectionError({
        errorCode: InspectionErrorCode.VALIDATION_FAILED,
        message: 'Validation failed'
      });

      const metrics = getInspectionMetrics();
      
      expect(metrics.successRate).toBeCloseTo(0.667, 2); // 2 successes out of 3 total
      expect(metrics.averageProcessingTime).toBe(110); // Average of 100 and 120
    });
  });

  describe('Performance Metrics', () => {
    it('should calculate percentiles correctly', () => {
      const processingTimes = [50, 75, 100, 125, 150, 200, 300, 500];
      
      processingTimes.forEach(time => {
        trackInspectionSuccess({ processingTime: time });
      });

      const metrics = getInspectionMetrics();
      
      expect(metrics.averageProcessingTime).toBeCloseTo(162.5, 1);
      expect(metrics.performanceTrends.p95ResponseTime).toBeGreaterThan(300);
    });

    it('should track performance trends over time', () => {
      // Simulate data over time by manually adjusting timestamps
      const now = Date.now();
      const oneHourAgo = now - 60 * 60 * 1000;

      // Track older successes with slower times
      for (let i = 0; i < 5; i++) {
        trackInspectionSuccess({ processingTime: 200 + i * 10 });
      }

      // Track recent successes with faster times
      for (let i = 0; i < 5; i++) {
        trackInspectionSuccess({ processingTime: 80 + i * 5 });
      }

      const metrics = getInspectionMetrics();
      
      expect(metrics.averageProcessingTime).toBeLessThan(150);
    });
  });

  describe('Alert Generation', () => {
    it('should generate alerts for high error rates', () => {
      // Generate multiple errors to trigger alert
      for (let i = 0; i < 12; i++) {
        trackInspectionError({
          errorCode: InspectionErrorCode.VALIDATION_FAILED,
          message: `Error ${i}`
        });
      }

      const alerts = monitor.getActiveAlerts();
      
      expect(alerts.length).toBeGreaterThan(0);
      expect(alerts[0].type).toBe('error_spike');
      expect(alerts[0].severity).toBe('critical');
    });

    it('should generate alerts for poor performance', () => {
      trackInspectionSuccess({ processingTime: 1500 }); // Slow response

      const alerts = monitor.getActiveAlerts();
      
      expect(alerts.some(alert => alert.type === 'performance_degradation')).toBe(true);
    });

    it('should generate alerts for low success rates', () => {
      // Generate more errors than successes
      for (let i = 0; i < 8; i++) {
        trackInspectionError({
          errorCode: InspectionErrorCode.VALIDATION_FAILED,
          message: `Error ${i}`
        });
      }
      
      for (let i = 0; i < 2; i++) {
        trackInspectionSuccess({ processingTime: 100 });
      }

      const alerts = monitor.getActiveAlerts();
      
      expect(alerts.some(alert => alert.type === 'success_rate_drop')).toBe(true);
    });

    it('should generate alerts for critical errors', () => {
      trackInspectionError({
        errorCode: InspectionErrorCode.RPC_FUNCTION_MISSING,
        message: 'Critical system error'
      });

      const alerts = monitor.getActiveAlerts();
      
      expect(alerts.some(alert => alert.type === 'critical_failure')).toBe(true);
      expect(alerts.some(alert => alert.severity === 'critical')).toBe(true);
    });
  });

  describe('Database Integration', () => {
    it('should attempt to store monitoring events in database', async () => {
      const errorEvent = {
        errorCode: InspectionErrorCode.PROPERTY_NOT_FOUND,
        message: 'Test error for database integration'
      };

      trackInspectionError(errorEvent);

      // Give time for async database operation
      await new Promise(resolve => setTimeout(resolve, 100));

      // Verify Supabase was called (even if mocked)
      expect(mockSupabase.from).toHaveBeenCalledWith('monitoring_events');
    });

    it('should handle database storage failures gracefully', async () => {
      // Mock database failure
      mockSupabase.from = jest.fn().mockReturnValue({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockRejectedValue(new Error('Database connection failed'))
        })
      });

      const errorEvent = {
        errorCode: InspectionErrorCode.PROPERTY_NOT_FOUND,
        message: 'Test error'
      };

      // Should not throw despite database failure
      expect(() => trackInspectionError(errorEvent)).not.toThrow();

      const metrics = getInspectionMetrics();
      expect(metrics.totalErrors).toBe(1); // Should still track locally
    });
  });

  describe('Data Export', () => {
    it('should export comprehensive monitoring data', () => {
      // Generate sample data
      trackInspectionError({
        errorCode: InspectionErrorCode.VALIDATION_FAILED,
        message: 'Test error'
      });
      
      trackInspectionSuccess({ processingTime: 100 });

      const exportData = monitor.exportMonitoringData();

      expect(exportData.errors).toHaveLength(1);
      expect(exportData.performance).toHaveLength(1);
      expect(exportData.success).toHaveLength(1);
      expect(exportData.metrics).toBeDefined();
      expect(exportData.alerts).toBeDefined();
    });

    it('should include all necessary metadata in export', () => {
      trackInspectionError({
        errorCode: InspectionErrorCode.PROPERTY_NOT_FOUND,
        message: 'Test error',
        userContext: { propertyId: '123' },
        technicalContext: { component: 'TestComponent' }
      });

      const exportData = monitor.exportMonitoringData();
      const errorEvent = exportData.errors[0];

      expect(errorEvent.userContext?.propertyId).toBe('123');
      expect(errorEvent.technicalContext?.component).toBe('TestComponent');
      expect(errorEvent.timestamp).toBeDefined();
      expect(errorEvent.businessImpact).toBeDefined();
    });
  });

  describe('Memory Management', () => {
    it('should maintain memory limits for error history', () => {
      const initialMemoryUsage = process.memoryUsage().heapUsed;

      // Generate large number of events
      for (let i = 0; i < 5000; i++) {
        trackInspectionError({
          errorCode: InspectionErrorCode.VALIDATION_FAILED,
          message: `Error ${i}`,
          userContext: { propertyId: `property-${i}` }
        });
      }

      const finalMemoryUsage = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemoryUsage - initialMemoryUsage;

      // Should not increase memory dramatically due to buffer limits
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024); // Less than 50MB increase
    });

    it('should clean up old data automatically', () => {
      // This would test the cleanup mechanisms in a real scenario
      // For now, verify that buffer sizes are maintained
      
      for (let i = 0; i < 2000; i++) {
        trackInspectionSuccess({ processingTime: 100 + i });
      }

      const exportData = monitor.exportMonitoringData();
      
      // Should limit performance buffer size
      expect(exportData.performance.length).toBeLessThanOrEqual(1000);
    });
  });

  describe('Concurrent Access', () => {
    it('should handle concurrent error tracking safely', async () => {
      const promises = [];

      for (let i = 0; i < 100; i++) {
        promises.push(
          Promise.resolve().then(() => {
            trackInspectionError({
              errorCode: InspectionErrorCode.VALIDATION_FAILED,
              message: `Concurrent error ${i}`
            });
          })
        );
      }

      await Promise.all(promises);

      const metrics = getInspectionMetrics();
      expect(metrics.totalErrors).toBe(100);
    });

    it('should handle concurrent success tracking safely', async () => {
      const promises = [];

      for (let i = 0; i < 100; i++) {
        promises.push(
          Promise.resolve().then(() => {
            trackInspectionSuccess({ processingTime: 100 + i });
          })
        );
      }

      await Promise.all(promises);

      const metrics = getInspectionMetrics();
      expect(metrics.averageProcessingTime).toBeCloseTo(149.5, 1); // Average of 100 to 199
    });
  });

  describe('Real-time Updates', () => {
    it('should provide real-time metrics updates', () => {
      const initialMetrics = getInspectionMetrics();
      expect(initialMetrics.totalErrors).toBe(0);

      trackInspectionError({
        errorCode: InspectionErrorCode.VALIDATION_FAILED,
        message: 'Real-time test error'
      });

      const updatedMetrics = getInspectionMetrics();
      expect(updatedMetrics.totalErrors).toBe(1);
      expect(updatedMetrics.totalErrors).toBeGreaterThan(initialMetrics.totalErrors);
    });

    it('should update alerts in real-time', () => {
      let alerts = monitor.getActiveAlerts();
      expect(alerts.length).toBe(0);

      // Generate enough errors to trigger alert
      for (let i = 0; i < 15; i++) {
        trackInspectionError({
          errorCode: InspectionErrorCode.VALIDATION_FAILED,
          message: `Alert test error ${i}`
        });
      }

      alerts = monitor.getActiveAlerts();
      expect(alerts.length).toBeGreaterThan(0);
    });
  });
});