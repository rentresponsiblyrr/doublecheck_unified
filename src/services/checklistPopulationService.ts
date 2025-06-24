
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
      console.log('📋 Starting enhanced checklist population for inspection:', inspectionId);
      
      // Initialize valid categories from database
      await this.validationService.initializeValidCategories();
      
      // Fetch static safety items
      const staticItems = await this.dataService.fetchStaticSafetyItems();
      
      // Validate items exist and have valid categories
      this.validationService.validateStaticItems(staticItems);

      // Transform to checklist items with enhanced category mapping
      const checklistItems = this.validationService.transformToChecklistItems(staticItems, inspectionId);

      // Perform final validation before database insertion
      await this.validationService.validateChecklistCreation(checklistItems);

      // Insert checklist items
      await this.dataService.insertChecklistItems(checklistItems);

      // Log audit trail
      await this.auditService.logPopulationAudit(inspectionId, checklistItems, staticItems);

      console.log('✅ Successfully populated checklist items with enhanced validation');
      
    } catch (error) {
      console.error('💥 Error in enhanced checklist population:', error);
      
      // Enhanced error reporting
      if (error instanceof Error) {
        if (error.message.includes('category')) {
          console.error('🔍 Category-related error detected. This may indicate:');
          console.error('   1. Invalid categories in static_safety_items');
          console.error('   2. Missing categories in categories table');
          console.error('   3. Database constraint issues');
        }
      }
      
      throw error;
    }
  }
}
