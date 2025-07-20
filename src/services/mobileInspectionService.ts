
import { InspectionValidationService } from "./inspectionValidationService";
import { InspectionCreationOptimizer } from "./inspectionCreationOptimizer";
import { log } from '@/lib/logging/enterprise-logger';

export interface MobileInspectionResult {
  inspectionId: string;
  isNew: boolean;
  checklistItemsCount: number;
}

export class MobileInspectionService {
  static async getOrCreateInspection(propertyId: string): Promise<MobileInspectionResult> {
    log.info('Starting mobile inspection flow for property', {
      component: 'MobileInspectionService',
      action: 'getOrCreateInspection',
      propertyId
    }, 'MOBILE_INSPECTION_FLOW_STARTED');

    // Step 1: Validate property access with RLS
    const hasAccess = await InspectionValidationService.validatePropertyAccess(propertyId);
    if (!hasAccess) {
      throw new Error('Property not found or access denied. Please check if the property exists and you have permission to inspect it.');
    }

    // Step 2: Check for existing active inspection
    const activeInspectionId = await InspectionCreationOptimizer.findActiveInspectionSecure(propertyId);
    if (activeInspectionId) {
      log.info('Joining existing inspection', {
        component: 'MobileInspectionService',
        action: 'getOrCreateInspection',
        propertyId,
        activeInspectionId,
        isNew: false
      }, 'JOINING_EXISTING_INSPECTION');
      
      // Verify checklist items exist
      const itemCount = await InspectionValidationService.verifyChecklistItemsCreated(activeInspectionId);
      
      return {
        inspectionId: activeInspectionId,
        isNew: false,
        checklistItemsCount: itemCount
      };
    }

    // Step 3: Create new inspection with retry logic
    log.info('Creating new inspection for property', {
      component: 'MobileInspectionService',
      action: 'getOrCreateInspection',
      propertyId,
      isNew: true
    }, 'CREATING_NEW_INSPECTION');
    const newInspectionId = await InspectionCreationOptimizer.createInspectionWithRetry(propertyId);
    
    // Step 4: Verify checklist items were created
    const itemCount = await InspectionValidationService.verifyChecklistItemsCreated(newInspectionId);
    
    return {
      inspectionId: newInspectionId,
      isNew: true,
      checklistItemsCount: itemCount
    };
  }

  static async assignInspector(inspectionId: string): Promise<void> {
    return InspectionCreationOptimizer.assignInspectorToInspection(inspectionId);
  }
}
