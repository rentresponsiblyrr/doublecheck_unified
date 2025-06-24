
import { InspectionValidationService } from "./inspectionValidationService";
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
    return this.validationService.checkForExistingInspection(propertyId);
  }

  async createNewInspection(propertyId: string): Promise<string> {
    const inspectionId = await this.retryService.executeWithRetry(async () => {
      // Create the inspection record
      const newInspectionId = await this.databaseService.createInspectionRecord(propertyId);
      
      // Populate checklist items
      await this.checklistService.populateChecklistItems(newInspectionId);
      
      // Verify checklist items were created
      await this.validationService.verifyChecklistItems(newInspectionId);
      
      return newInspectionId;
    });

    return inspectionId;
  }
}
