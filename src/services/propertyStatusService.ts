/**
 * Property Status Calculation Service
 * 
 * Enterprise-grade service for calculating property status based on inspection data.
 * Implements sophisticated business logic with proper error handling, logging,
 * and future-proofing against schema changes.
 * 
 * @fileoverview Advanced property status calculation with business rules
 * @version 1.0.0
 * @since 2025-07-11
 * @author Senior Engineering Team
 */

import { 
  PROPERTY_STATUS, 
  PROPERTY_STATUS_CONFIG,
  INSPECTION_TO_PROPERTY_STATUS_MAP,
  STATUS_PRECEDENCE_ORDER,
  PROPERTY_STATUS_CALCULATION_CONFIG,
  type PropertyStatusType 
} from '@/constants/propertyStatus';
import { normalizeStatus, type InspectionStatus } from '@/types/inspection-status';
import { logger } from '@/utils/logger';

/**
 * Comprehensive interface for property data with inspection statistics
 * Designed to be future-proof and handle optional fields gracefully
 */
export interface PropertyWithInspections {
  property_id: string;
  property_name: string;
  property_address?: string;
  property_status?: string;
  
  // Inspection count fields - all optional for defensive programming
  inspection_count?: number;
  completed_inspection_count?: number;
  active_inspection_count?: number;
  draft_inspection_count?: number;
  pending_review_count?: number;
  approved_inspection_count?: number;
  rejected_inspection_count?: number;
  
  // Latest inspection data
  latest_inspection_id?: string;
  latest_inspection_status?: string;
  latest_inspection_completed?: boolean;
  
  // Timestamps for age-based calculations
  property_created_at?: string;
  latest_inspection_updated_at?: string;
}

/**
 * Result object for property status calculations
 * Includes detailed metadata for debugging and UI enhancement
 */
export interface PropertyStatusResult {
  status: PropertyStatusType;
  config: typeof PROPERTY_STATUS_CONFIG[PropertyStatusType];
  metadata: {
    totalInspections: number;
    activeInspections: number;
    completedInspections: number;
    lastUpdated: Date;
    calculationReason: string;
    hasMultipleInspections: boolean;
    isRecentActivity: boolean;
    inspectionBreakdown: Record<string, number>;
  };
}

/**
 * Enterprise-grade property status calculation service
 * Implements business rules with comprehensive error handling and logging
 */
class PropertyStatusService {
  
  /**
   * Calculate the overall status for a property based on its inspections
   * 
   * @param property - Property data with inspection counts
   * @returns Comprehensive status result with metadata
   * 
   * @example
   * ```typescript
   * const result = propertyStatusService.calculatePropertyStatus(property);
   * // REMOVED: console.log(result.status); // 'in-progress'
   * // REMOVED: console.log(result.config.textLabel); // 'In Progress'
   * // REMOVED: console.log(result.metadata.calculationReason); // 'Has active inspections'
   * ```
   */
  calculatePropertyStatus(property: PropertyWithInspections): PropertyStatusResult {
    const startTime = performance.now();
    
    try {
      logger.debug('Calculating property status', { 
        propertyId: property.property_id,
        propertyName: property.property_name 
      }, 'PROPERTY_STATUS_SERVICE');

      // Extract inspection counts with defensive defaults
      const counts = this.extractInspectionCounts(property);
      
      // Determine status using business rules
      const { status, reason } = this.determineStatusFromCounts(counts);
      
      // Get configuration for the determined status
      const config = PROPERTY_STATUS_CONFIG[status];
      
      // Calculate metadata for enhanced UI and debugging
      const metadata = this.calculateStatusMetadata(property, counts, reason);
      
      const result: PropertyStatusResult = {
        status,
        config,
        metadata
      };

      const calculationTime = performance.now() - startTime;
      logger.debug('Property status calculated', { 
        propertyId: property.property_id,
        status,
        reason,
        calculationTimeMs: calculationTime.toFixed(2)
      }, 'PROPERTY_STATUS_SERVICE');

      return result;

    } catch (error) {
      logger.error('Property status calculation failed', error, 'PROPERTY_STATUS_SERVICE', {
        propertyId: property.property_id,
        propertyData: property
      });

      // Return safe fallback status
      return this.createFallbackStatusResult(property, error);
    }
  }

  /**
   * Extract and validate inspection counts from property data
   * Implements defensive programming to handle missing or invalid data
   */
  private extractInspectionCounts(property: PropertyWithInspections) {
    return {
      total: this.safeParseCount(property.inspection_count),
      completed: this.safeParseCount(property.completed_inspection_count),
      active: this.safeParseCount(property.active_inspection_count),
      draft: this.safeParseCount(property.draft_inspection_count),
      pendingReview: this.safeParseCount(property.pending_review_count),
      approved: this.safeParseCount(property.approved_inspection_count),
      rejected: this.safeParseCount(property.rejected_inspection_count)
    };
  }

  /**
   * Safely parse inspection count with fallback to zero
   * Handles null, undefined, negative numbers, and NaN gracefully
   */
  private safeParseCount(value: number | string | null | undefined): number {
    if (value === null || value === undefined) return 0;
    
    const parsed = typeof value === 'string' ? parseInt(value, 10) : value;
    
    if (isNaN(parsed) || parsed < 0) {
      logger.warn('Invalid inspection count detected', { value }, 'PROPERTY_STATUS_SERVICE');
      return 0;
    }
    
    return parsed;
  }

  /**
   * Apply business rules to determine property status from inspection counts
   * Implements the status precedence hierarchy defined in constants
   */
  private determineStatusFromCounts(counts: ReturnType<typeof this.extractInspectionCounts>) {
    // Business Rule 1: Any rejected inspections = property is rejected
    if (counts.rejected > 0) {
      return { 
        status: PROPERTY_STATUS.REJECTED, 
        reason: `Has ${counts.rejected} rejected inspection${counts.rejected > 1 ? 's' : ''}` 
      };
    }

    // Business Rule 2: Active inspections = property is in progress
    if (counts.active > 0) {
      return { 
        status: PROPERTY_STATUS.IN_PROGRESS, 
        reason: `Has ${counts.active} active inspection${counts.active > 1 ? 's' : ''}` 
      };
    }

    // Business Rule 3: Pending review = under review status
    if (counts.pendingReview > 0) {
      return { 
        status: PROPERTY_STATUS.UNDER_REVIEW, 
        reason: `Has ${counts.pendingReview} inspection${counts.pendingReview > 1 ? 's' : ''} pending review` 
      };
    }

    // Business Rule 4: All completed and approved = approved
    if (counts.approved > 0 && counts.approved === counts.total) {
      return { 
        status: PROPERTY_STATUS.APPROVED, 
        reason: `All ${counts.approved} inspection${counts.approved > 1 ? 's' : ''} approved` 
      };
    }

    // Business Rule 5: Some completed = completed status
    if (counts.completed > 0) {
      return { 
        status: PROPERTY_STATUS.COMPLETED, 
        reason: `Has ${counts.completed} completed inspection${counts.completed > 1 ? 's' : ''}` 
      };
    }

    // Business Rule 6: Draft inspections = not started
    if (counts.draft > 0) {
      return { 
        status: PROPERTY_STATUS.DRAFT, 
        reason: `Has ${counts.draft} draft inspection${counts.draft > 1 ? 's' : ''} (not started)` 
      };
    }

    // Business Rule 7: No inspections = available
    return { 
      status: PROPERTY_STATUS.AVAILABLE, 
      reason: 'No inspections assigned' 
    };
  }

  /**
   * Calculate comprehensive metadata for status result
   * Provides rich context for UI enhancements and debugging
   */
  private calculateStatusMetadata(
    property: PropertyWithInspections, 
    counts: ReturnType<typeof this.extractInspectionCounts>,
    reason: string
  ) {
    const now = new Date();
    const lastUpdated = property.latest_inspection_updated_at 
      ? new Date(property.latest_inspection_updated_at)
      : now;

    const daysSinceUpdate = (now.getTime() - lastUpdated.getTime()) / (1000 * 60 * 60 * 24);
    const isRecentActivity = daysSinceUpdate <= PROPERTY_STATUS_CALCULATION_CONFIG.RECENT_INSPECTION_THRESHOLD_DAYS;

    return {
      totalInspections: counts.total,
      activeInspections: counts.active,
      completedInspections: counts.completed,
      lastUpdated,
      calculationReason: reason,
      hasMultipleInspections: counts.total >= PROPERTY_STATUS_CALCULATION_CONFIG.MULTIPLE_INSPECTIONS_THRESHOLD,
      isRecentActivity,
      inspectionBreakdown: {
        draft: counts.draft,
        active: counts.active,
        completed: counts.completed,
        pendingReview: counts.pendingReview,
        approved: counts.approved,
        rejected: counts.rejected
      }
    };
  }

  /**
   * Create a safe fallback status result when calculation fails
   * Ensures the application never crashes due to status calculation errors
   */
  private createFallbackStatusResult(property: PropertyWithInspections, error: Error): PropertyStatusResult {
    logger.error('Creating fallback status result', error, 'PROPERTY_STATUS_SERVICE');
    
    return {
      status: PROPERTY_STATUS.AVAILABLE,
      config: PROPERTY_STATUS_CONFIG[PROPERTY_STATUS.AVAILABLE],
      metadata: {
        totalInspections: 0,
        activeInspections: 0,
        completedInspections: 0,
        lastUpdated: new Date(),
        calculationReason: `Fallback due to calculation error: ${error?.message || 'Unknown error'}`,
        hasMultipleInspections: false,
        isRecentActivity: false,
        inspectionBreakdown: {
          draft: 0,
          active: 0,
          completed: 0,
          pendingReview: 0,
          approved: 0,
          rejected: 0
        }
      }
    };
  }

  /**
   * Batch calculate status for multiple properties
   * Optimized for dashboard scenarios with many properties
   * 
   * @param properties - Array of properties to calculate status for
   * @returns Array of status results in the same order
   */
  calculateBatchPropertyStatus(properties: PropertyWithInspections[]): PropertyStatusResult[] {
    const startTime = performance.now();
    
    logger.info('Starting batch property status calculation', { 
      propertyCount: properties.length 
    }, 'PROPERTY_STATUS_SERVICE');

    const results = properties.map(property => this.calculatePropertyStatus(property));
    
    const calculationTime = performance.now() - startTime;
    logger.info('Batch property status calculation completed', { 
      propertyCount: properties.length,
      totalTimeMs: calculationTime.toFixed(2),
      avgTimePerPropertyMs: (calculationTime / properties.length).toFixed(2)
    }, 'PROPERTY_STATUS_SERVICE');

    return results;
  }

  /**
   * Get status configuration by status type
   * Useful for UI components that need to display status information
   */
  getStatusConfig(status: PropertyStatusType) {
    return PROPERTY_STATUS_CONFIG[status];
  }

  /**
   * Get all available status configurations
   * Useful for building status filter UIs or documentation
   */
  getAllStatusConfigs() {
    return PROPERTY_STATUS_CONFIG;
  }

  /**
   * Validate if a status is valid
   * Useful for API validation and error checking
   */
  isValidStatus(status: string): status is PropertyStatusType {
    return Object.values(PROPERTY_STATUS).includes(status as PropertyStatusType);
  }
}

// Export singleton instance for consistent usage across the application
export const propertyStatusService = new PropertyStatusService();