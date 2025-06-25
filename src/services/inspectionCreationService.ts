
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
    // Use the correct method from InspectionCreationOptimizer
    return InspectionCreationOptimizer.findActiveInspectionSecure(propertyId);
  }

  async createNewInspection(propertyId: string): Promise<string> {
    const inspectionId = await this.retryService.executeWithRetry(async () => {
      // Create the inspection record using the optimizer
      const newInspectionId = await InspectionCreationOptimizer.createInspectionWithRetry(propertyId);
      
      // Populate checklist items (this is handled by the database trigger now)
      // But we still verify they were created
      await InspectionValidationService.verifyChecklistItemsCreated(newInspectionId);
      
      return newInspectionId;
    });

    return inspectionId;
  }
}
