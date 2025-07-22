/**
 * Professional Mobile Inspection Orchestrator
 * Single responsibility: Coordinate inspection workflow components
 * 
 * ARCHITECTURAL IMPROVEMENTS:
 * - Orchestrates modular services instead of god class
 * - Clean separation of concerns
 * - Type-safe interfaces with proper error handling
 * - Professional transaction management
 * - Optimized for mobile performance constraints
 */

import { PropertyLookupService, type PropertyInfo } from './PropertyLookupService';
import { InspectionQueryService, type InspectionSummary } from './InspectionQueryService';
import { InspectionCreationService, type InspectionCreationRequest } from './InspectionCreationService';
import { log } from "@/lib/logging/enterprise-logger";

export interface OptimizedInspectionResult {
  inspectionId: string;
  isNew: boolean;
  checklistItemsCount: number;
  propertyName: string;
  property: PropertyInfo;
  inspection: InspectionSummary;
}

export interface InspectionWorkflowError {
  message: string;
  code: string;
  component: string;
  retryable: boolean;
}

export interface InspectionWorkflowResult {
  success: boolean;
  result?: OptimizedInspectionResult;
  error?: InspectionWorkflowError;
}

/**
 * Mobile Inspection Orchestrator
 * Coordinates property lookup, inspection queries, and creation workflows
 */
export class MobileInspectionOrchestrator {
  private static readonly MAX_RETRIES = 2;
  private static readonly RETRY_DELAY_MS = 1000;

  /**
   * Main orchestration method: Get or create inspection with full workflow
   */
  static async getOrCreateInspectionOptimized(
    propertyId: string,
    inspectorId?: string
  ): Promise<InspectionWorkflowResult> {
    const startTime = Date.now();

    try {
      log.info('Mobile inspection workflow initiated', {
        component: 'MobileInspectionOrchestrator',
        action: 'getOrCreateInspectionOptimized',
        propertyId,
        inspectorId: inspectorId ? 'provided' : 'missing',
        timestamp: new Date().toISOString()
      }, 'INSPECTION_WORKFLOW_START');

      // Step 1: Property lookup with validation
      const propertyResult = await this.executeWithRetry(
        () => PropertyLookupService.getPropertyInfo(propertyId),
        'property_lookup'
      );

      if (!propertyResult.property) {
        return {
          success: false,
          error: {
            message: propertyResult.error || 'Property not found',
            code: 'PROPERTY_NOT_FOUND',
            component: 'PropertyLookupService',
            retryable: !propertyResult.notFound
          }
        };
      }

      // Step 2: Check for existing active inspection
      const inspectionResult = await this.executeWithRetry(
        () => InspectionQueryService.findActiveInspection(propertyId),
        'inspection_lookup'
      );

      let inspection: InspectionSummary;
      let isNew = false;
      let checklistItemsCount = 0;

      if (inspectionResult.inspection) {
        // Existing inspection found
        inspection = inspectionResult.inspection;
        isNew = false;

        log.info('Existing inspection found', {
          component: 'MobileInspectionOrchestrator',
          action: 'getOrCreateInspectionOptimized',
          propertyId,
          inspectionId: inspection.id,
          status: inspection.status
        }, 'EXISTING_INSPECTION_FOUND');

        // Get checklist count for existing inspection
        checklistItemsCount = await this.getChecklistItemCount(inspection.id);

      } else {
        // Need to create new inspection
        if (!inspectorId) {
          return {
            success: false,
            error: {
              message: 'Inspector ID is required to create new inspection',
              code: 'INSPECTOR_ID_REQUIRED',
              component: 'MobileInspectionOrchestrator',
              retryable: false
            }
          };
        }

        // Step 3: Create new inspection
        const creationRequest: InspectionCreationRequest = {
          property_id: propertyId,
          inspector_id: inspectorId,
          status: 'draft',
          start_time: new Date().toISOString()
        };

        const creationResult = await this.executeWithRetry(
          () => InspectionCreationService.createInspection(creationRequest),
          'inspection_creation'
        );

        if (!creationResult.success) {
          return {
            success: false,
            error: {
              message: creationResult.error || 'Failed to create inspection',
              code: 'INSPECTION_CREATION_FAILED',
              component: 'InspectionCreationService',
              retryable: true
            }
          };
        }

        // Step 4: Populate checklist for new inspection
        const checklistResult = await this.executeWithRetry(
          () => InspectionCreationService.populateChecklist(creationResult.inspectionId),
          'checklist_population'
        );

        if (!checklistResult.success) {
          // Rollback inspection if checklist population fails
          if (creationResult.rollback) {
            try {
              await creationResult.rollback();
              log.warn('Inspection rolled back due to checklist population failure', {
                component: 'MobileInspectionOrchestrator',
                action: 'getOrCreateInspectionOptimized',
                inspectionId: creationResult.inspectionId,
                error: checklistResult.error
              }, 'INSPECTION_ROLLBACK_COMPLETED');
            } catch (rollbackError) {
              log.error('Failed to rollback inspection after checklist failure', rollbackError as Error, {
                component: 'MobileInspectionOrchestrator',
                action: 'getOrCreateInspectionOptimized',
                inspectionId: creationResult.inspectionId
              }, 'INSPECTION_ROLLBACK_FAILED');
            }
          }

          return {
            success: false,
            error: {
              message: checklistResult.error || 'Failed to populate checklist',
              code: 'CHECKLIST_POPULATION_FAILED',
              component: 'InspectionCreationService',
              retryable: true
            }
          };
        }

        // Get the created inspection details
        const newInspectionResult = await InspectionQueryService.getInspectionById(creationResult.inspectionId);
        if (!newInspectionResult.inspection) {
          return {
            success: false,
            error: {
              message: 'Created inspection not found',
              code: 'CREATED_INSPECTION_NOT_FOUND',
              component: 'InspectionQueryService',
              retryable: true
            }
          };
        }

        inspection = newInspectionResult.inspection;
        isNew = true;
        checklistItemsCount = checklistResult.itemsCreated;

        log.info('New inspection created successfully', {
          component: 'MobileInspectionOrchestrator',
          action: 'getOrCreateInspectionOptimized',
          propertyId,
          inspectionId: inspection.id,
          checklistItemsCount
        }, 'NEW_INSPECTION_CREATED');
      }

      // Build comprehensive result
      const result: OptimizedInspectionResult = {
        inspectionId: inspection.id,
        isNew,
        checklistItemsCount,
        propertyName: propertyResult.property.name,
        property: propertyResult.property,
        inspection
      };

      const elapsedTime = Date.now() - startTime;

      log.info('Mobile inspection workflow completed successfully', {
        component: 'MobileInspectionOrchestrator',
        action: 'getOrCreateInspectionOptimized',
        propertyId,
        inspectionId: result.inspectionId,
        isNew,
        checklistItemsCount,
        elapsedTime,
        propertyName: result.propertyName
      }, 'INSPECTION_WORKFLOW_SUCCESS');

      return {
        success: true,
        result,
        error: undefined
      };

    } catch (error) {
      const elapsedTime = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      log.error('Mobile inspection workflow failed with exception', error as Error, {
        component: 'MobileInspectionOrchestrator',
        action: 'getOrCreateInspectionOptimized',
        propertyId,
        inspectorId,
        elapsedTime,
        errorType: error?.constructor?.name || 'UnknownError'
      }, 'INSPECTION_WORKFLOW_EXCEPTION');

      return {
        success: false,
        error: {
          message: `Workflow failed: ${errorMessage}`,
          code: 'WORKFLOW_EXCEPTION',
          component: 'MobileInspectionOrchestrator',
          retryable: true
        }
      };
    }
  }

  /**
   * Get inspection dashboard data for mobile UI
   */
  static async getInspectionDashboard(inspectorId: string): Promise<{
    activeInspections: InspectionSummary[];
    completedCount: number;
    statusCounts: Record<string, number>;
    recentProperties: PropertyInfo[];
  }> {
    try {
      log.debug('Loading inspection dashboard data', {
        component: 'MobileInspectionOrchestrator',
        action: 'getInspectionDashboard',
        inspectorId
      }, 'DASHBOARD_LOAD_START');

      // Parallel data loading for better performance
      const [activeInspections, statusCounts] = await Promise.all([
        InspectionQueryService.queryInspections({
          inspector_id: inspectorId,
          completed: false,
          limit: 10
        }),
        InspectionQueryService.getInspectionCounts(inspectorId)
      ]);

      const completedCount = statusCounts['completed'] || 0;

      // Get recent properties from active inspections
      const propertyIds = [...new Set(activeInspections.map(i => i.property_id))];
      const recentProperties = await PropertyLookupService.getMultipleProperties(propertyIds);

      log.info('Dashboard data loaded successfully', {
        component: 'MobileInspectionOrchestrator',
        action: 'getInspectionDashboard',
        inspectorId,
        activeCount: activeInspections.length,
        completedCount,
        propertiesCount: recentProperties.length
      }, 'DASHBOARD_LOAD_SUCCESS');

      return {
        activeInspections,
        completedCount,
        statusCounts,
        recentProperties
      };

    } catch (error) {
      log.error('Dashboard data loading failed', error as Error, {
        component: 'MobileInspectionOrchestrator',
        action: 'getInspectionDashboard',
        inspectorId
      }, 'DASHBOARD_LOAD_FAILED');

      return {
        activeInspections: [],
        completedCount: 0,
        statusCounts: {},
        recentProperties: []
      };
    }
  }

  /**
   * Execute operation with retry logic for mobile reliability
   */
  private static async executeWithRetry<T>(
    operation: () => Promise<T>,
    operationName: string
  ): Promise<T> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.MAX_RETRIES; attempt++) {
      try {
        const result = await operation();
        
        if (attempt > 1) {
          log.info('Operation succeeded after retry', {
            component: 'MobileInspectionOrchestrator',
            action: 'executeWithRetry',
            operationName,
            attempt,
            totalAttempts: this.MAX_RETRIES
          }, 'OPERATION_RETRY_SUCCESS');
        }

        return result;

      } catch (error) {
        lastError = error as Error;

        if (attempt < this.MAX_RETRIES) {
          log.warn('Operation failed, retrying', {
            component: 'MobileInspectionOrchestrator',
            action: 'executeWithRetry',
            operationName,
            attempt,
            totalAttempts: this.MAX_RETRIES,
            error: lastError.message
          }, 'OPERATION_RETRY_ATTEMPT');

          // Wait before retry
          await new Promise(resolve => setTimeout(resolve, this.RETRY_DELAY_MS * attempt));
        } else {
          log.error('Operation failed after all retries', lastError, {
            component: 'MobileInspectionOrchestrator',
            action: 'executeWithRetry',
            operationName,
            totalAttempts: this.MAX_RETRIES
          }, 'OPERATION_RETRY_EXHAUSTED');
        }
      }
    }

    throw lastError || new Error(`Operation ${operationName} failed after ${this.MAX_RETRIES} attempts`);
  }

  /**
   * Get checklist item count for an inspection
   */
  private static async getChecklistItemCount(inspectionId: string): Promise<number> {
    try {
      // First get the property_id from the inspection (logs table uses property_id, not inspection_id)
      const { data: inspectionData, error: inspectionError } = await supabase
        .from('inspections')
        .select('property_id')
        .eq('id', inspectionId)
        .single();

      if (inspectionError) {
        log.warn('Failed to get inspection for checklist count', {
          component: 'MobileInspectionOrchestrator',
          action: 'getChecklistItemCount',
          inspectionId,
          error: inspectionError.message
        }, 'INSPECTION_LOOKUP_FAILED');
        return 0;
      }

      if (!inspectionData) {
        log.warn('Inspection not found for checklist count', {
          component: 'MobileInspectionOrchestrator',
          action: 'getChecklistItemCount',
          inspectionId
        }, 'INSPECTION_NOT_FOUND');
        return 0;
      }

      // Now get checklist items using property_id (verified schema approach)
      const { count, error } = await supabase
        .from('logs')
        .select('*', { count: 'exact', head: true })
        .eq('property_id', inspectionData.property_id);

      if (error) {
        log.warn('Failed to get checklist item count', {
          component: 'MobileInspectionOrchestrator',
          action: 'getChecklistItemCount',
          inspectionId,
          propertyId: inspectionData.property_id,
          error: error.message
        }, 'CHECKLIST_COUNT_FAILED');
        return 0;
      }

      return count || 0;

    } catch (error) {
      log.error('Exception getting checklist item count', error as Error, {
        component: 'MobileInspectionOrchestrator',
        action: 'getChecklistItemCount',
        inspectionId
      }, 'CHECKLIST_COUNT_EXCEPTION');
      return 0;
    }
  }
}