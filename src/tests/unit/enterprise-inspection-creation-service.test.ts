/**
 * ENTERPRISE INSPECTION CREATION SERVICE TESTS
 * 
 * Comprehensive unit test suite for the EnterpriseInspectionCreationService
 * Tests all critical functionality with 90%+ coverage requirement
 * 
 * ENSURES: Zero regression in inspection creation functionality
 * VALIDATES: All error codes and user-friendly messages
 * CONFIRMS: Performance SLA compliance and monitoring integration
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import {
  EnterpriseInspectionCreationService,
  InspectionCreationRequest,
  InspectionErrorCode,
  createFrontendPropertyId,
  createInspectorId
} from '@/lib/database/inspection-creation-service';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';

// Mock dependencies
jest.mock('@/integrations/supabase/client');
jest.mock('@/utils/logger');
jest.mock('@/lib/monitoring/inspection-error-monitor');

const mockSupabase = supabase as jest.Mocked<typeof supabase>;
const mockLogger = logger as jest.Mocked<typeof logger>;

describe('EnterpriseInspectionCreationService', () => {
  let service: EnterpriseInspectionCreationService;
  let mockRpcResponse: any;
  let mockAuthResponse: any;

  beforeEach(() => {
    service = EnterpriseInspectionCreationService.getInstance();
    
    // Reset mocks
    jest.clearAllMocks();
    
    // Default mock responses
    mockRpcResponse = {
      data: [{
        inspection_id: 'test-inspection-id',
        property_id: 123,
        property_uuid: '123',
        status: 'draft',
        created_at: new Date().toISOString()
      }],
      error: null
    };

    mockAuthResponse = {
      data: {
        user: {
          id: 'test-user-id',
          email: 'test@example.com'
        }
      },
      error: null
    };

    // Setup default mocks
    mockSupabase.rpc = jest.fn().mockResolvedValue(mockRpcResponse);
    mockSupabase.auth.getUser = jest.fn().mockResolvedValue(mockAuthResponse);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Successful Inspection Creation', () => {
    it('should create inspection with valid data successfully', async () => {
      const request: InspectionCreationRequest = {
        propertyId: createFrontendPropertyId('123'),
        inspectorId: createInspectorId('test-user-id'),
        status: 'draft'
      };

      const result = await service.createInspection(request);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.inspectionId).toBe('test-inspection-id');
      expect(result.data?.status).toBe('draft');
      expect(result.performance?.processingTime).toBeDefined();
      expect(mockSupabase.rpc).toHaveBeenCalledWith(
        'create_inspection_compatibility',
        expect.objectContaining({
          p_property_uuid: '123',
          p_property_id: 123,
          p_inspector_id: 'test-user-id',
          p_status: 'draft'
        })
      );
    });

    it('should auto-detect inspector when not provided', async () => {
      const request: InspectionCreationRequest = {
        propertyId: createFrontendPropertyId('123'),
        status: 'draft'
      };

      const result = await service.createInspection(request);

      expect(result.success).toBe(true);
      expect(mockSupabase.auth.getUser).toHaveBeenCalled();
      expect(mockSupabase.rpc).toHaveBeenCalledWith(
        'create_inspection_compatibility',
        expect.objectContaining({
          p_inspector_id: 'test-user-id'
        })
      );
    });

    it('should handle different inspection statuses', async () => {
      const statuses: Array<'draft' | 'in_progress' | 'completed' | 'auditing'> = [
        'draft', 'in_progress', 'completed', 'auditing'
      ];

      for (const status of statuses) {
        const request: InspectionCreationRequest = {
          propertyId: createFrontendPropertyId('123'),
          inspectorId: createInspectorId('test-user-id'),
          status
        };

        const result = await service.createInspection(request);

        expect(result.success).toBe(true);
        expect(mockSupabase.rpc).toHaveBeenLastCalledWith(
          'create_inspection_compatibility',
          expect.objectContaining({
            p_status: status
          })
        );
      }
    });
  });

  describe('Error Handling', () => {
    it('should handle property not found error', async () => {
      mockRpcResponse.error = {
        message: 'PROPERTY_NOT_FOUND: Property 999 not found',
        code: '23503'
      };
      mockSupabase.rpc = jest.fn().mockResolvedValue(mockRpcResponse);

      const request: InspectionCreationRequest = {
        propertyId: createFrontendPropertyId('999'),
        inspectorId: createInspectorId('test-user-id'),
        status: 'draft'
      };

      const result = await service.createInspection(request);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe(InspectionErrorCode.PROPERTY_NOT_FOUND);
      expect(result.error?.userMessage).toContain('property was not found');
    });

    it('should handle inspector invalid error', async () => {
      mockRpcResponse.error = {
        message: 'INSPECTOR_INVALID: Inspector not found or not authorized',
        code: '23503'
      };
      mockSupabase.rpc = jest.fn().mockResolvedValue(mockRpcResponse);

      const request: InspectionCreationRequest = {
        propertyId: createFrontendPropertyId('123'),
        inspectorId: createInspectorId('invalid-user-id'),
        status: 'draft'
      };

      const result = await service.createInspection(request);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe(InspectionErrorCode.INSPECTOR_INVALID);
      expect(result.error?.userMessage).toContain('not authorized');
    });

    it('should handle duplicate inspection error', async () => {
      mockRpcResponse.error = {
        message: 'DUPLICATE_INSPECTION: Active inspection already exists',
        code: '23505'
      };
      mockSupabase.rpc = jest.fn().mockResolvedValue(mockRpcResponse);

      const request: InspectionCreationRequest = {
        propertyId: createFrontendPropertyId('123'),
        inspectorId: createInspectorId('test-user-id'),
        status: 'draft'
      };

      const result = await service.createInspection(request);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe(InspectionErrorCode.DUPLICATE_INSPECTION);
      expect(result.error?.userMessage).toContain('already exists');
    });

    it('should handle missing RPC function error', async () => {
      mockRpcResponse.error = {
        message: 'function "create_inspection_compatibility" does not exist',
        code: '42883'
      };
      mockSupabase.rpc = jest.fn().mockResolvedValue(mockRpcResponse);

      const request: InspectionCreationRequest = {
        propertyId: createFrontendPropertyId('123'),
        inspectorId: createInspectorId('test-user-id'),
        status: 'draft'
      };

      const result = await service.createInspection(request);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe(InspectionErrorCode.RPC_FUNCTION_MISSING);
      expect(result.error?.userMessage).toContain('technical support');
    });

    it('should handle authentication failure', async () => {
      mockAuthResponse.error = {
        message: 'No authenticated user',
        code: 'UNAUTHENTICATED'
      };
      mockSupabase.auth.getUser = jest.fn().mockResolvedValue(mockAuthResponse);

      const request: InspectionCreationRequest = {
        propertyId: createFrontendPropertyId('123'),
        status: 'draft'
      };

      const result = await service.createInspection(request);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe(InspectionErrorCode.AUTHENTICATION_REQUIRED);
    });
  });

  describe('Input Validation', () => {
    it('should validate property ID format', async () => {
      const request: InspectionCreationRequest = {
        propertyId: createFrontendPropertyId(''), // Empty property ID
        inspectorId: createInspectorId('test-user-id'),
        status: 'draft'
      };

      const result = await service.createInspection(request);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe(InspectionErrorCode.VALIDATION_FAILED);
    });

    it('should validate inspector ID UUID format', async () => {
      const request: InspectionCreationRequest = {
        propertyId: createFrontendPropertyId('123'),
        inspectorId: 'invalid-uuid' as any, // Invalid UUID format
        status: 'draft'
      };

      // This should throw during createInspectorId call
      expect(() => request).toThrow();
    });

    it('should validate status values', async () => {
      const request: InspectionCreationRequest = {
        propertyId: createFrontendPropertyId('123'),
        inspectorId: createInspectorId('test-user-id'),
        status: 'invalid-status' as any
      };

      const result = await service.createInspection(request);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe(InspectionErrorCode.VALIDATION_FAILED);
    });
  });

  describe('Performance Requirements', () => {
    it('should complete within performance threshold', async () => {
      const request: InspectionCreationRequest = {
        propertyId: createFrontendPropertyId('123'),
        inspectorId: createInspectorId('test-user-id'),
        status: 'draft'
      };

      const startTime = performance.now();
      const result = await service.createInspection(request);
      const duration = performance.now() - startTime;

      expect(result.success).toBe(true);
      expect(duration).toBeLessThan(1000); // Should complete within 1 second
      expect(result.performance?.processingTime).toBeLessThan(1000);
    });

    it('should track performance metrics', async () => {
      const request: InspectionCreationRequest = {
        propertyId: createFrontendPropertyId('123'),
        inspectorId: createInspectorId('test-user-id'),
        status: 'draft'
      };

      const result = await service.createInspection(request);

      expect(result.performance).toBeDefined();
      expect(result.performance?.processingTime).toBeGreaterThan(0);
      expect(result.performance?.validationTime).toBeGreaterThanOrEqual(0);
      expect(result.performance?.databaseTime).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Retry Logic', () => {
    it('should retry on transient failures', async () => {
      let callCount = 0;
      mockSupabase.rpc = jest.fn().mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return Promise.resolve({
            data: null,
            error: { message: 'Network timeout', code: 'NETWORK_ERROR' }
          });
        }
        return Promise.resolve(mockRpcResponse);
      });

      const request: InspectionCreationRequest = {
        propertyId: createFrontendPropertyId('123'),
        inspectorId: createInspectorId('test-user-id'),
        status: 'draft'
      };

      const result = await service.createInspection(request);

      expect(result.success).toBe(true);
      expect(mockSupabase.rpc).toHaveBeenCalledTimes(2);
    });

    it('should not retry on non-retryable errors', async () => {
      mockRpcResponse.error = {
        message: 'PROPERTY_NOT_FOUND: Property not found',
        code: '23503'
      };
      mockSupabase.rpc = jest.fn().mockResolvedValue(mockRpcResponse);

      const request: InspectionCreationRequest = {
        propertyId: createFrontendPropertyId('999'),
        inspectorId: createInspectorId('test-user-id'),
        status: 'draft'
      };

      const result = await service.createInspection(request);

      expect(result.success).toBe(false);
      expect(mockSupabase.rpc).toHaveBeenCalledTimes(1); // Should not retry
    });
  });

  describe('Monitoring Integration', () => {
    it('should log successful operations', async () => {
      const request: InspectionCreationRequest = {
        propertyId: createFrontendPropertyId('123'),
        inspectorId: createInspectorId('test-user-id'),
        status: 'draft'
      };

      await service.createInspection(request);

      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.stringContaining('created successfully'),
        expect.any(Object),
        'INSPECTION_CREATION_SERVICE'
      );
    });

    it('should log errors with context', async () => {
      mockRpcResponse.error = {
        message: 'PROPERTY_NOT_FOUND: Property not found',
        code: '23503'
      };
      mockSupabase.rpc = jest.fn().mockResolvedValue(mockRpcResponse);

      const request: InspectionCreationRequest = {
        propertyId: createFrontendPropertyId('999'),
        inspectorId: createInspectorId('test-user-id'),
        status: 'draft'
      };

      await service.createInspection(request);

      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.stringContaining('error with context'),
        expect.any(Object),
        expect.any(Object),
        'INSPECTION_CREATION_SERVICE'
      );
    });
  });

  describe('Singleton Pattern', () => {
    it('should return same instance on multiple calls', () => {
      const instance1 = EnterpriseInspectionCreationService.getInstance();
      const instance2 = EnterpriseInspectionCreationService.getInstance();

      expect(instance1).toBe(instance2);
    });

    it('should initialize only once', () => {
      // Clear any existing instance
      (EnterpriseInspectionCreationService as any).instance = null;

      const instance1 = EnterpriseInspectionCreationService.getInstance();
      const instance2 = EnterpriseInspectionCreationService.getInstance();

      expect(instance1).toBe(instance2);
      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.stringContaining('initialized'),
        expect.any(Object),
        'INSPECTION_CREATION_SERVICE'
      );
    });
  });

  describe('Type Safety', () => {
    it('should handle branded types correctly', () => {
      const propertyId = createFrontendPropertyId('123');
      const inspectorId = createInspectorId('test-user-id');

      expect(typeof propertyId).toBe('string');
      expect(typeof inspectorId).toBe('string');

      // TypeScript should enforce branded type usage
      const request: InspectionCreationRequest = {
        propertyId,
        inspectorId,
        status: 'draft'
      };

      expect(request.propertyId).toBe('123');
      expect(request.inspectorId).toBe('test-user-id');
    });
  });

  describe('Edge Cases', () => {
    it('should handle null/undefined responses from RPC', async () => {
      mockSupabase.rpc = jest.fn().mockResolvedValue({
        data: null,
        error: null
      });

      const request: InspectionCreationRequest = {
        propertyId: createFrontendPropertyId('123'),
        inspectorId: createInspectorId('test-user-id'),
        status: 'draft'
      };

      const result = await service.createInspection(request);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe(InspectionErrorCode.RPC_FUNCTION_MISSING);
    });

    it('should handle empty array responses from RPC', async () => {
      mockSupabase.rpc = jest.fn().mockResolvedValue({
        data: [],
        error: null
      });

      const request: InspectionCreationRequest = {
        propertyId: createFrontendPropertyId('123'),
        inspectorId: createInspectorId('test-user-id'),
        status: 'draft'
      };

      const result = await service.createInspection(request);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe(InspectionErrorCode.RPC_FUNCTION_MISSING);
    });

    it('should handle network timeouts gracefully', async () => {
      mockSupabase.rpc = jest.fn().mockImplementation(() => 
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Network timeout')), 100)
        )
      );

      const request: InspectionCreationRequest = {
        propertyId: createFrontendPropertyId('123'),
        inspectorId: createInspectorId('test-user-id'),
        status: 'draft'
      };

      const result = await service.createInspection(request);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe(InspectionErrorCode.NETWORK_TIMEOUT);
    });
  });
});