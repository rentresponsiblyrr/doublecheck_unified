
import { InspectionValidationService } from "./inspectionValidationService";
import { InspectionCreationOptimizer } from "./inspectionCreationOptimizer";

export interface MobileInspectionResult {
  inspectionId: string;
  isNew: boolean;
  checklistItemsCount: number;
}

export class MobileInspectionService {
  static async getOrCreateInspection(propertyId: string): Promise<MobileInspectionResult> {
    console.log('🚀 Starting mobile inspection flow for property:', propertyId);

    // Step 1: Validate property access with RLS
    const hasAccess = await InspectionValidationService.validatePropertyAccess(propertyId);
    if (!hasAccess) {
      throw new Error('Property not found or access denied. Please check if the property exists and you have permission to inspect it.');
    }

    // Step 2: Check for existing active inspection
    const activeInspectionId = await InspectionCreationOptimizer.findActiveInspectionSecure(propertyId);
    if (activeInspectionId) {
      console.log('📋 Joining existing inspection:', activeInspectionId);
      
      // Verify checklist items exist
      const itemCount = await InspectionValidationService.verifyChecklistItemsCreated(activeInspectionId);
      
      return {
        inspectionId: activeInspectionId,
        isNew: false,
        checklistItemsCount: itemCount
      };
    }

    // Step 3: Create new inspection with retry logic
    console.log('🆕 Creating new inspection for property:', propertyId);
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
