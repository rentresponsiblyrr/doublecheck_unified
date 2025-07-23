/**
 * DEPRECATED: Legacy Mobile Inspection Optimizer
 *
 * This god class has been replaced with modular services for better maintainability:
 * - PropertyLookupService: Property information retrieval
 * - InspectionQueryService: Inspection data queries
 * - InspectionCreationService: Inspection creation and initialization
 * - MobileInspectionOrchestrator: Workflow coordination
 *
 * Use the new modular services from @/services/mobile for all new development.
 *
 * ARCHITECTURAL IMPROVEMENTS IMPLEMENTED:
 * ✅ Single Responsibility Principle - Each service handles one concern
 * ✅ Proper error handling with enterprise logging
 * ✅ Type safety with comprehensive interfaces
 * ✅ Transaction management with rollback capabilities
 * ✅ Mobile-optimized performance patterns
 * ✅ Professional retry and timeout handling
 * ✅ Comprehensive input validation
 * ✅ Structured logging for debugging
 */

// Legacy compatibility - redirect to new modular architecture
export {
  MobileInspectionOrchestrator as MobileInspectionOptimizer,
  type OptimizedInspectionResult,
} from "./mobile";

// Re-export the entire mobile services module for easy access
export * from "./mobile";
