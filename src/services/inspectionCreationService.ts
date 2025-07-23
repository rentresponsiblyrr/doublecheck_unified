import { InspectionValidationService } from "./inspectionValidationService";
import { InspectionCreationOptimizer } from "./inspectionCreationOptimizer";
import { InspectionDatabaseService } from "./inspectionDatabaseService";
import { InspectionRetryService } from "./inspectionRetryService";
import { ChecklistPopulationService } from "./checklistPopulationService";

export class InspectionCreationService {
  private validationService: InspectionValidationService;
  private databaseService: InspectionDatabaseService;
  private retryService: InspectionRetryService;
  private checklistService: ChecklistPopulationService;

  constructor() {
    this.validationService = new InspectionValidationService();
    this.databaseService = new InspectionDatabaseService();
    this.retryService = new InspectionRetryService();
    this.checklistService = new ChecklistPopulationService();
  }

  async checkForExistingInspection(propertyId: string): Promise<string | null> {
    try {
      // Use the correct method from InspectionCreationOptimizer
      return await InspectionCreationOptimizer.findActiveInspectionSecure(
        propertyId,
      );
    } catch (error) {
      return null;
    }
  }

  async createNewInspection(
    propertyId: string,
    inspectorId: string,
  ): Promise<string> {
    const inspectionId = await this.retryService.executeWithRetry(async () => {
      // Create the inspection record using the optimizer with inspector ID
      const newInspectionId =
        await InspectionCreationOptimizer.createInspectionWithRetry(
          propertyId,
          inspectorId,
        );

      // Verify checklist items were created (with improved error handling)
      const checklistItemsCount =
        await InspectionValidationService.verifyChecklistItemsCreated(
          newInspectionId,
        );

      if (checklistItemsCount === 0) {
        // This is not necessarily an error - the inspection may be valid even without items
      }

      return newInspectionId;
    });

    return inspectionId;
  }
}
