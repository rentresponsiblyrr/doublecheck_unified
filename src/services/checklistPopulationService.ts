
import { ChecklistDataService } from "./checklistDataService";
import { ChecklistValidationService } from "./checklistValidationService";
import { ChecklistAuditService } from "./checklistAuditService";
import { log } from '@/lib/logging/enterprise-logger';

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
      log.info('Starting enhanced checklist population for inspection', {
        component: 'ChecklistPopulationService',
        action: 'populateChecklistItems',
        inspectionId
      }, 'CHECKLIST_POPULATION_STARTED');
      
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

      log.info('Successfully populated checklist items with enhanced validation', {
        component: 'ChecklistPopulationService',
        action: 'populateChecklistItems',
        inspectionId,
        itemsCount: checklistItems.length
      }, 'CHECKLIST_POPULATION_SUCCESS');
      
    } catch (error) {
      log.error('Error in enhanced checklist population', error as Error, {
        component: 'ChecklistPopulationService',
        action: 'populateChecklistItems',
        inspectionId
      }, 'CHECKLIST_POPULATION_ERROR');
      
      // Enhanced error reporting
      if (error instanceof Error) {
        if (error.message.includes('category')) {
          log.error('Category-related error detected. Check database constraints and category validation.', error, {
            component: 'ChecklistPopulationService',
            action: 'populateChecklistItems',
            inspectionId,
            errorType: 'CATEGORY_VALIDATION_ERROR'
          }, 'CATEGORY_ERROR_DETECTED');
        }
      }
      
      throw error;
    }
  }
}
