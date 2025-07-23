/**
 * Professional Mobile Services Index
 * Centralized exports for modular mobile inspection services
 *
 * ARCHITECTURAL IMPROVEMENTS:
 * - Clean barrel exports for service layer
 * - Proper separation of concerns
 * - Type-safe service interfaces
 * - Professional service organization
 */

// Core Services
export { PropertyLookupService } from "./PropertyLookupService";
export { InspectionQueryService } from "./InspectionQueryService";
export { InspectionCreationService } from "./InspectionCreationService";
export { MobileInspectionOrchestrator } from "./MobileInspectionOrchestrator";

// Type Exports
export type {
  PropertyInfo,
  PropertyLookupResult,
} from "./PropertyLookupService";
export type {
  InspectionSummary,
  InspectionQueryResult,
  InspectionStatusFilter,
} from "./InspectionQueryService";
export type {
  InspectionCreationRequest,
  InspectionCreationResult,
  ChecklistPopulationResult,
} from "./InspectionCreationService";
export type {
  OptimizedInspectionResult,
  InspectionWorkflowError,
  InspectionWorkflowResult,
} from "./MobileInspectionOrchestrator";

// Legacy compatibility export (for gradual migration)
export { MobileInspectionOrchestrator as MobileInspectionOptimizer };
