/**
 * UNIFIED SERVICE EXPORTS - ENHANCED SERVICES SWITCHOVER
 * 
 * This file provides the complete switchover to Enhanced services with full
 * backward compatibility and comprehensive error handling.
 * 
 * SWITCHOVER STRATEGY:
 * 1. Import all Enhanced services
 * 2. Initialize migration layer 
 * 3. Provide unified exports that use Enhanced services by default
 * 4. Maintain fallback capabilities for safety
 * 
 * @author STR Certified Engineering Team
 * @version 3.0 - Full Enhanced Services
 */

import { logger } from '@/utils/logger';

// Enhanced Service Imports
import { enhancedQueryCache } from './core/EnhancedQueryCache';
import { enhancedRealTimeSync } from './core/EnhancedRealTimeSync';
import { enhancedPerformanceMonitor } from './core/EnhancedPerformanceMonitor';
import { 
  enhancedPropertyService, 
  enhancedChecklistService,
  EnhancedServiceFactory
} from './core/EnhancedUnifiedServiceLayer';

// Migration Layer Imports
import { 
  EnhancedServiceMigration,
  SchemaValidator,
  FeatureFlagManager,
  compatibleQueryCache,
  compatibleRealTimeSync,
  compatiblePerformanceMonitor
} from './core/EnhancedServiceMigration';

// ========================================
// INITIALIZATION & VALIDATION
// ========================================

let isInitialized = false;
let initializationPromise: Promise<void> | null = null;

/**
 * Initialize Enhanced services with full validation
 */
async function initializeEnhancedServices(): Promise<void> {
  if (isInitialized) return;
  
  if (initializationPromise) {
    return initializationPromise;
  }

  initializationPromise = (async () => {
    try {
      logger.info('🚀 Starting Enhanced Services Full Switchover...');

      // Step 1: Initialize migration layer
      await EnhancedServiceMigration.initialize();

      // Step 2: Validate database schema
      const validation = await SchemaValidator.validateSchema();
      if (validation.errors.length > 0) {
        logger.warn('Schema validation issues detected:', validation.errors);
        logger.warn('Some Enhanced features may use fallback mode');
      }

      // Step 3: Check if Enhanced services can be used
      const canUseEnhanced = await SchemaValidator.canUseEnhancedServices();
      
      if (canUseEnhanced) {
        // Step 4: Enable all Enhanced services
        FeatureFlagManager.setFlag('useEnhancedQueryCache', true);
        FeatureFlagManager.setFlag('useEnhancedRealTimeSync', true);
        FeatureFlagManager.setFlag('useEnhancedPerformanceMonitor', true);
        FeatureFlagManager.setFlag('useEnhancedServiceLayer', true);
        FeatureFlagManager.setFlag('fallbackOnError', true); // Always have safety net

        logger.info('✅ All Enhanced services enabled successfully');
      } else {
        logger.warn('⚠️  Enhanced services running in compatibility mode - database schema needs updates');
      }

      isInitialized = true;
      logger.info('🎉 Enhanced Services Full Switchover Complete!');

    } catch (error) {
      logger.error('💥 Enhanced Services initialization failed:', error);
      
      // Ensure fallback mode is enabled
      FeatureFlagManager.setFlag('fallbackOnError', true);
      isInitialized = true; // Mark as initialized to prevent retry loops
      
      throw error;
    }
  })();

  return initializationPromise;
}

// Auto-initialize when module loads
initializeEnhancedServices().catch(error => {
  logger.error('Service initialization error:', error);
});

// ========================================
// UNIFIED SERVICE EXPORTS
// ========================================

/**
 * Query Cache - Enhanced with fallback
 */
export const queryCache = {
  // Async methods (recommended for new code)
  get: async <T>(key: string): Promise<T | null> => {
    await initializeEnhancedServices();
    return compatibleQueryCache.getAsync<T>(key);
  },
  
  set: async <T>(key: string, value: T, ttl?: number, tags?: string[]): Promise<void> => {
    await initializeEnhancedServices();
    return new Promise(resolve => {
      compatibleQueryCache.set(key, value, ttl, tags);
      resolve();
    });
  },
  
  delete: async (key: string): Promise<boolean> => {
    await initializeEnhancedServices();
    return compatibleQueryCache.delete(key);
  },

  // Sync methods (for backward compatibility)
  getSync: <T>(key: string): T | null => {
    return compatibleQueryCache.get<T>(key);
  },

  setSync: <T>(key: string, value: T, ttl?: number, tags?: string[]): void => {
    compatibleQueryCache.set(key, value, ttl, tags);
  },

  // Advanced methods
  invalidatePattern: (pattern: string): number => {
    return compatibleQueryCache.invalidatePattern(pattern);
  }
};

/**
 * Real-Time Sync - Enhanced with conflict resolution
 */
export const realTimeSync = {
  subscribe: <T>(
    entityType: string,
    entityId: string,
    callback: (data: T) => void
  ): (() => void) => {
    return compatibleRealTimeSync.subscribe(entityType, entityId, callback);
  },

  publishEvent: async <T>(event: Record<string, unknown>): Promise<void> => {
    await initializeEnhancedServices();
    return compatibleRealTimeSync.publishEvent(event);
  },

  getSyncStatus: () => {
    return enhancedRealTimeSync.getSyncStatus();
  }
};

/**
 * Performance Monitor - Enhanced with resource tracking
 */
export const performanceMonitor = {
  trackQuery: (metrics: Record<string, unknown>): void => {
    compatiblePerformanceMonitor.trackQuery(metrics);
  },

  getRealTimeMetrics: (): Record<string, unknown> => {
    return compatiblePerformanceMonitor.getRealTimeMetrics();
  },

  getHealthStatus: (): Record<string, unknown> => {
    return enhancedPerformanceMonitor.getHealthStatus();
  }
};

/**
 * Property Service - Enhanced with complete type safety
 */
export const propertyService = {
  getProperty: async (id: string) => {
    await initializeEnhancedServices();
    const propertyId = id as string | number;
    return await enhancedPropertyService.getProperty(propertyId);
  },

  getProperties: async (options: Record<string, unknown> = {}) => {
    await initializeEnhancedServices();
    return await enhancedPropertyService.getProperties(options);
  },

  createProperty: async (propertyData: Record<string, unknown>) => {
    await initializeEnhancedServices();
    return await enhancedPropertyService.createProperty(propertyData);
  }
};

/**
 * Checklist Service - Enhanced with database alignment
 */
export const checklistService = {
  getChecklistItem: async (id: string) => {
    await initializeEnhancedServices();
    const itemId = id as string | number;
    return await enhancedChecklistService.getChecklistItem(itemId);
  },

  updateChecklistItem: async (id: string, updates: Record<string, unknown>) => {
    await initializeEnhancedServices();
    const itemId = id as string | number;
    return await enhancedChecklistService.updateChecklistItem(itemId, updates);
  }
};

// ========================================
// LEGACY COMPATIBILITY EXPORTS
// ========================================

// Cache keys utility (maintained for compatibility)
export const CacheKeys = {
  property: (id: string) => `property:${id}`,
  properties: (filters?: Record<string, any>) => 
    `properties:${filters ? btoa(JSON.stringify(filters)) : 'all'}`,
  inspection: (id: string) => `inspection:${id}`,
  inspections: (propertyId: string) => `inspections:property:${propertyId}`,
  checklist: (inspectionId: string) => `checklist:${inspectionId}`,
  user: (id: string) => `user:${id}`,
  media: (itemId: string) => `media:${itemId}`,
} as const;

// Service factory (Enhanced version)
export const ServiceFactory = {
  getPropertyService: () => enhancedPropertyService,
  getChecklistService: () => enhancedChecklistService,
  clearInstances: () => {
    EnhancedServiceFactory.clearInstances();
  }
};

// ========================================
// SERVICE STATUS & HEALTH
// ========================================

export const getServiceStatus = async () => {
  try {
    await initializeEnhancedServices();
    
    const migrationStatus = await EnhancedServiceMigration.getStatus();
    const cacheHealth = enhancedQueryCache.getHealthStatus();
    const syncHealth = enhancedRealTimeSync.getHealthStatus();
    const performanceHealth = enhancedPerformanceMonitor.getHealthStatus();

    return {
      initialized: isInitialized,
      healthy: migrationStatus.schemaCompatible && 
               cacheHealth.healthy && 
               syncHealth.healthy && 
               performanceHealth.healthy,
      services: {
        migration: migrationStatus,
        queryCache: cacheHealth,
        realTimeSync: syncHealth,
        performanceMonitor: performanceHealth,
      },
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    return {
      initialized: false,
      healthy: false,
      error: error.message,
      timestamp: new Date().toISOString(),
    };
  }
};

export const emergencyRollback = () => {
  try {
    EnhancedServiceMigration.rollbackToOriginal();
    logger.warn('🔄 EMERGENCY ROLLBACK: Switched to original services');
    return true;
  } catch (error) {
    logger.error('💥 Emergency rollback failed:', error);
    return false;
  }
};

// ========================================
// LEGACY SERVICE EXPORTS (for compatibility)
// ========================================

// Re-export essential legacy services that don't have Enhanced versions yet
export * from './checklistAuditService';
export * from './checklistDataService';
export * from './checklistValidationService';
export * from './inspectionCreationService';
export * from './inspectionDatabaseService';
export * from './mediaRecordService';
export * from './mobileInspectionService';
export * from './mobileInspectionOptimizer';
export * from './robustMobileInspectionService';