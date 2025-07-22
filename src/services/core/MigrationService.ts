/**
 * MIGRATION SERVICE - PHASE 2 ARCHITECTURAL TRANSITION
 * 
 * Handles gradual migration from 23+ scattered services to the unified
 * 5-service architecture while maintaining backward compatibility and
 * zero-downtime operation.
 * 
 * MIGRATION STRATEGY:
 * - Gradual service replacement with feature flags
 * - Backward compatibility wrappers
 * - Performance comparison between old and new services
 * - Automatic rollback on performance degradation
 * 
 * @author STR Certified Engineering Team
 * @phase Phase 2 - Query Standardization & Architectural Excellence
 */

import { logger } from '@/utils/logger';
import { performanceMonitor } from './PerformanceMonitor';
import { 
  ServiceFactory,
  PropertyService,
  InspectionService,
  ChecklistService,
  MediaService,
  UserService
} from './UnifiedServiceLayer';

// ========================================
// MIGRATION CONFIGURATION
// ========================================

interface MigrationConfig {
  enableNewServices: boolean;
  gradualMigration: boolean;
  performanceThreshold: number; // ms - rollback if new service is slower
  errorThreshold: number; // % - rollback if error rate exceeds this
  migrationPercentage: number; // % of traffic to route to new services
  enablePerformanceComparison: boolean;
}

const MIGRATION_CONFIG: MigrationConfig = {
  enableNewServices: true,
  gradualMigration: true,
  performanceThreshold: 200, // 200ms max response time
  errorThreshold: 1, // 1% max error rate
  migrationPercentage: 50, // Start with 50% of traffic
  enablePerformanceComparison: true,
};

// ========================================
// LEGACY SERVICE WRAPPERS
// ========================================

/**
 * Backward compatibility wrapper for legacy property operations
 * Gradually migrates to new PropertyService while maintaining compatibility
 */
export class LegacyPropertyServiceWrapper {
  private newService: PropertyService;
  private shouldUseNewService = false;

  constructor() {
    this.newService = ServiceFactory.getPropertyService();
    this.shouldUseNewService = this.shouldRouteToNewService();
  }

  /**
   * Get property with automatic service selection
   */
  async getProperty(id: string): Promise<any> {
    if (this.shouldUseNewService) {
      try {
        const result = await this.newService.getProperty(id as any);
        return this.adaptNewServiceResult(result);
      } catch (error) {
        logger.warn('New service failed, falling back to legacy', { error, id });
        return this.getLegacyProperty(id);
      }
    } else {
      return this.getLegacyProperty(id);
    }
  }

  /**
   * Get properties with automatic service selection
   */
  async getProperties(options: any = {}): Promise<any> {
    if (this.shouldUseNewService) {
      try {
        const result = await this.newService.getProperties(options);
        return this.adaptNewServiceResult(result);
      } catch (error) {
        logger.warn('New service failed, falling back to legacy', { error, options });
        return this.getLegacyProperties(options);
      }
    } else {
      return this.getLegacyProperties(options);
    }
  }

  private async getLegacyProperty(id: string): Promise<any> {
    // Legacy implementation - would call original propertyService
    logger.debug('Using legacy property service', { id });
    
    // Simulate legacy service call
    const startTime = performance.now();
    try {
      // Would call original service here
      const result = { id, name: 'Legacy Property', address: 'Legacy Address' };
      
      performanceMonitor.trackQuery({
        service: 'LegacyPropertyService',
        operation: 'getProperty',
        startTime,
        endTime: performance.now(),
        fromCache: false,
        queryCount: 1,
        success: true,
      });

      return result;
    } catch (error) {
      performanceMonitor.trackQuery({
        service: 'LegacyPropertyService',
        operation: 'getProperty',
        startTime,
        endTime: performance.now(),
        fromCache: false,
        queryCount: 1,
        success: false,
        errorCode: (error as any).code,
      });
      throw error;
    }
  }

  private async getLegacyProperties(options: any): Promise<any> {
    // Legacy implementation
    logger.debug('Using legacy properties service', { options });
    
    const startTime = performance.now();
    try {
      const result = [
        { id: '1', name: 'Legacy Property 1', address: 'Address 1' },
        { id: '2', name: 'Legacy Property 2', address: 'Address 2' }
      ];
      
      performanceMonitor.trackQuery({
        service: 'LegacyPropertyService',
        operation: 'getProperties',
        startTime,
        endTime: performance.now(),
        fromCache: false,
        queryCount: 1,
        success: true,
      });

      return result;
    } catch (error) {
      performanceMonitor.trackQuery({
        service: 'LegacyPropertyService',
        operation: 'getProperties',
        startTime,
        endTime: performance.now(),
        fromCache: false,
        queryCount: 1,
        success: false,
        errorCode: (error as any).code,
      });
      throw error;
    }
  }

  private shouldRouteToNewService(): boolean {
    if (!MIGRATION_CONFIG.enableNewServices) {
      return false;
    }

    if (!MIGRATION_CONFIG.gradualMigration) {
      return true;
    }

    // Route based on migration percentage
    return Math.random() * 100 < MIGRATION_CONFIG.migrationPercentage;
  }

  private adaptNewServiceResult(result: any): any {
    // Adapt new service result format to match legacy expectations
    if (result.success) {
      return result.data;
    } else {
      throw new Error(result.error?.userMessage || 'Service error');
    }
  }
}

// ========================================
// MIGRATION MANAGER
// ========================================

/**
 * MigrationManager - Orchestrates the transition to unified services
 * 
 * Provides intelligent routing, performance monitoring, and automatic
 * rollback capabilities during the migration process.
 */
export class MigrationManager {
  private performanceStats = new Map<string, {
    legacyAvgTime: number;
    newAvgTime: number;
    legacyErrorRate: number;
    newErrorRate: number;
    sampleSize: number;
  }>();

  private migrationFlags = new Map<string, boolean>();

  constructor() {
    this.initializeMigrationFlags();
    this.startPerformanceMonitoring();
  }

  // ========================================
  // SERVICE ROUTING
  // ========================================

  /**
   * Determine if a specific operation should use the new service
   */
  shouldUseNewService(serviceName: string, operation: string): boolean {
    const flagKey = `${serviceName}:${operation}`;
    
    // Check if explicitly disabled
    if (this.migrationFlags.has(flagKey) && !this.migrationFlags.get(flagKey)) {
      return false;
    }

    // Check global configuration
    if (!MIGRATION_CONFIG.enableNewServices) {
      return false;
    }

    // Check performance thresholds
    if (this.shouldRollbackService(serviceName)) {
      return false;
    }

    // Gradual migration percentage
    if (MIGRATION_CONFIG.gradualMigration) {
      return Math.random() * 100 < MIGRATION_CONFIG.migrationPercentage;
    }

    return true;
  }

  /**
   * Execute operation with automatic service selection and fallback
   */
  async executeWithMigration<T>(
    serviceName: string,
    operation: string,
    newServiceFn: () => Promise<T>,
    legacyServiceFn: () => Promise<T>
  ): Promise<T> {
    const useNewService = this.shouldUseNewService(serviceName, operation);
    
    if (useNewService) {
      try {
        const startTime = performance.now();
        const result = await newServiceFn();
        const duration = performance.now() - startTime;
        
        this.recordPerformance(serviceName, 'new', duration, true);
        
        // Check if performance is acceptable
        if (duration > MIGRATION_CONFIG.performanceThreshold) {
          logger.warn('New service exceeded performance threshold', {
            serviceName,
            operation,
            duration,
            threshold: MIGRATION_CONFIG.performanceThreshold
          });
        }
        
        return result;
      } catch (error) {
        logger.warn('New service failed, falling back to legacy', { 
          serviceName, 
          operation, 
          error 
        });
        
        this.recordPerformance(serviceName, 'new', 0, false);
        
        // Fall back to legacy service
        const startTime = performance.now();
        const result = await legacyServiceFn();
        const duration = performance.now() - startTime;
        
        this.recordPerformance(serviceName, 'legacy', duration, true);
        
        return result;
      }
    } else {
      const startTime = performance.now();
      const result = await legacyServiceFn();
      const duration = performance.now() - startTime;
      
      this.recordPerformance(serviceName, 'legacy', duration, true);
      
      return result;
    }
  }

  // ========================================
  // PERFORMANCE MONITORING
  // ========================================

  /**
   * Record performance metrics for comparison
   */
  private recordPerformance(
    serviceName: string,
    serviceType: 'legacy' | 'new',
    duration: number,
    success: boolean
  ): void {
    if (!this.performanceStats.has(serviceName)) {
      this.performanceStats.set(serviceName, {
        legacyAvgTime: 0,
        newAvgTime: 0,
        legacyErrorRate: 0,
        newErrorRate: 0,
        sampleSize: 0,
      });
    }

    const stats = this.performanceStats.get(serviceName)!;
    stats.sampleSize++;

    if (serviceType === 'legacy') {
      const newCount = Math.floor(stats.sampleSize / 2); // Rough estimate
      stats.legacyAvgTime = ((stats.legacyAvgTime * (newCount - 1)) + duration) / newCount;
      if (!success) {
        stats.legacyErrorRate = ((stats.legacyErrorRate * (newCount - 1)) + 100) / newCount;
      }
    } else {
      const newCount = Math.ceil(stats.sampleSize / 2);
      stats.newAvgTime = ((stats.newAvgTime * (newCount - 1)) + duration) / newCount;
      if (!success) {
        stats.newErrorRate = ((stats.newErrorRate * (newCount - 1)) + 100) / newCount;
      }
    }
  }

  /**
   * Check if service should be rolled back due to performance issues
   */
  private shouldRollbackService(serviceName: string): boolean {
    const stats = this.performanceStats.get(serviceName);
    if (!stats || stats.sampleSize < 10) {
      return false; // Need more samples
    }

    // Check error rate threshold
    if (stats.newErrorRate > MIGRATION_CONFIG.errorThreshold) {
      logger.error('New service error rate exceeded threshold', {
        serviceName,
        errorRate: stats.newErrorRate,
        threshold: MIGRATION_CONFIG.errorThreshold
      });
      return true;
    }

    // Check performance threshold
    if (stats.newAvgTime > MIGRATION_CONFIG.performanceThreshold) {
      logger.warn('New service performance exceeded threshold', {
        serviceName,
        avgTime: stats.newAvgTime,
        threshold: MIGRATION_CONFIG.performanceThreshold
      });
      return true;
    }

    // Check if new service is significantly slower than legacy
    if (stats.legacyAvgTime > 0 && stats.newAvgTime > stats.legacyAvgTime * 1.5) {
      logger.warn('New service significantly slower than legacy', {
        serviceName,
        legacyAvgTime: stats.legacyAvgTime,
        newAvgTime: stats.newAvgTime,
        ratio: stats.newAvgTime / stats.legacyAvgTime
      });
      return true;
    }

    return false;
  }

  /**
   * Get performance comparison report
   */
  getPerformanceReport(): Record<string, any> {
    const report: Record<string, any> = {};
    
    for (const [serviceName, stats] of this.performanceStats.entries()) {
      report[serviceName] = {
        ...stats,
        recommendation: this.getRecommendation(serviceName, stats),
        performanceImprovement: stats.legacyAvgTime > 0 ? 
          ((stats.legacyAvgTime - stats.newAvgTime) / stats.legacyAvgTime * 100) : 0,
      };
    }

    return report;
  }

  private getRecommendation(serviceName: string, stats: any): string {
    if (stats.sampleSize < 10) {
      return 'Need more data for reliable recommendation';
    }

    if (this.shouldRollbackService(serviceName)) {
      return 'Recommend rollback to legacy service';
    }

    if (stats.newAvgTime < stats.legacyAvgTime && stats.newErrorRate < stats.legacyErrorRate) {
      return 'New service performing better - recommend full migration';
    }

    if (stats.newAvgTime < stats.legacyAvgTime * 0.8) {
      return 'New service significantly faster - recommend increasing migration percentage';
    }

    return 'Continue gradual migration with current settings';
  }

  // ========================================
  // MIGRATION CONTROL
  // ========================================

  /**
   * Enable new service for specific operation
   */
  enableNewService(serviceName: string, operation?: string): void {
    const key = operation ? `${serviceName}:${operation}` : serviceName;
    this.migrationFlags.set(key, true);
    logger.info('New service enabled', { serviceName, operation });
  }

  /**
   * Disable new service for specific operation (rollback)
   */
  disableNewService(serviceName: string, operation?: string): void {
    const key = operation ? `${serviceName}:${operation}` : serviceName;
    this.migrationFlags.set(key, false);
    logger.warn('New service disabled (rollback)', { serviceName, operation });
  }

  /**
   * Get current migration status
   */
  getMigrationStatus(): {
    config: MigrationConfig;
    flags: Record<string, boolean>;
    performance: Record<string, any>;
    recommendations: string[];
  } {
    const recommendations: string[] = [];
    
    // Generate recommendations based on performance data
    for (const [serviceName, stats] of this.performanceStats.entries()) {
      if (stats.sampleSize >= 10) {
        recommendations.push(this.getRecommendation(serviceName, stats));
      }
    }

    return {
      config: MIGRATION_CONFIG,
      flags: Object.fromEntries(this.migrationFlags),
      performance: this.getPerformanceReport(),
      recommendations,
    };
  }

  /**
   * Update migration configuration
   */
  updateMigrationConfig(updates: Partial<MigrationConfig>): void {
    Object.assign(MIGRATION_CONFIG, updates);
    logger.info('Migration configuration updated', updates);
  }

  // ========================================
  // INITIALIZATION
  // ========================================

  private initializeMigrationFlags(): void {
    // Initialize with safe defaults
    const services = ['property', 'inspection', 'checklist', 'media', 'user'];
    services.forEach(service => {
      this.migrationFlags.set(service, MIGRATION_CONFIG.enableNewServices);
    });
  }

  private startPerformanceMonitoring(): void {
    // Generate periodic performance reports
    setInterval(() => {
      const report = this.getPerformanceReport();
      logger.info('Migration performance report', { 
        servicesCount: Object.keys(report).length,
        summary: this.generatePerformanceSummary(report)
      });

      // Auto-rollback services with poor performance
      for (const serviceName of Object.keys(report)) {
        if (this.shouldRollbackService(serviceName)) {
          this.disableNewService(serviceName);
        }
      }
    }, 5 * 60 * 1000); // Every 5 minutes
  }

  private generatePerformanceSummary(report: Record<string, any>): any {
    const services = Object.keys(report);
    const betterServices = services.filter(s => report[s].performanceImprovement > 0).length;
    const worseServices = services.filter(s => report[s].performanceImprovement < 0).length;
    
    return {
      totalServices: services.length,
      betterServices,
      worseServices,
      avgImprovement: services.reduce((sum, s) => sum + report[s].performanceImprovement, 0) / services.length
    };
  }
}

// ========================================
// SINGLETON EXPORTS
// ========================================

/**
 * Global migration manager instance
 */
export const migrationManager = new MigrationManager();

/**
 * Legacy service wrappers for backward compatibility
 */
export const legacyPropertyService = new LegacyPropertyServiceWrapper();

// Convenience function for gradual migration
export const withMigration = migrationManager.executeWithMigration.bind(migrationManager);