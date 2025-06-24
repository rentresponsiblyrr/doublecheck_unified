
import { ChecklistDataService } from "./checklistDataService";
import { ChecklistValidationService } from "./checklistValidationService";
import { ChecklistAuditService } from "./checklistAuditService";

export class ChecklistPopulationService {
  private dataService: ChecklistDataService;
  private validationService: ChecklistValidationService;
  private auditService: ChecklistAuditService;

  constructor() {
    this.dataService = new ChecklistDataService();
    this.validationService = new ChecklistValidationService();
    this.auditService = new ChecklistAuditService();
  }

  async populateChecklistItems(inspectionId: string): Promise<void> {
    try {
      console.log('📋 Starting checklist population for inspection:', inspectionId);
      
      // Fetch static safety items
      const staticItems = await this.dataService.fetchStaticSafetyItems();
      
      // Validate items exist
      this.validationService.validateStaticItems(staticItems);

      // Transform to checklist items with mapped categories
      const checklistItems = this.validationService.transformToChecklistItems(staticItems, inspectionId);

      // Insert checklist items
      await this.dataService.insertChecklistItems(checklistItems);

      // Log audit trail
      await this.auditService.logPopulationAudit(inspectionId, checklistItems, staticItems);

      console.log('✅ Successfully populated checklist items');
      
    } catch (error) {
      console.error('💥 Error in checklist population:', error);
      throw error;
    }
  }
}
