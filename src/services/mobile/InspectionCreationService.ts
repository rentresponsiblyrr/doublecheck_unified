/**
 * Professional Inspection Creation Service
 * Single responsibility: Inspection creation and initialization
 *
 * ARCHITECTURAL IMPROVEMENTS:
 * - Focused on inspection creation only
 * - Atomic transactions with rollback capabilities
 * - Proper validation and error handling
 * - Type-safe creation interfaces
 * - Professional state management
 */

import { supabase } from "@/integrations/supabase/client";
import { log } from "@/lib/logging/enterprise-logger";
import {
  inspectionCreationService,
  InspectionCreationRequest as EnterpriseRequest,
  createFrontendPropertyId,
  createInspectorId,
} from "@/lib/database/inspection-creation-service";

export interface InspectionCreationRequest {
  property_id: string;
  inspector_id: string;
  status?: string;
  start_time?: string;
}

export interface InspectionCreationResult {
  inspectionId: string;
  success: boolean;
  error?: string;
  rollback?: () => Promise<void>;
}

export interface ChecklistPopulationResult {
  itemsCreated: number;
  success: boolean;
  error?: string;
}

export class InspectionCreationService {
  private static readonly TIMEOUT_MS = 10000; // 10 seconds for creation operations
  private static readonly DEFAULT_STATUS = "draft";

  /**
   * Create new inspection with validation and error handling
   */
  static async createInspection(
    request: InspectionCreationRequest,
  ): Promise<InspectionCreationResult> {
    let createdInspectionId: string | null = null;

    try {
      // Input validation
      const validationResult = this.validateCreationRequest(request);
      if (!validationResult.valid) {
        return {
          inspectionId: "",
          success: false,
          error: validationResult.error,
        };
      }

      const {
        property_id,
        inspector_id,
        status = this.DEFAULT_STATUS,
        start_time = new Date().toISOString(),
      } = request;

      log.info(
        "Inspection creation initiated",
        {
          component: "InspectionCreationService",
          action: "createInspection",
          property_id,
          inspector_id,
          status,
          start_time,
        },
        "INSPECTION_CREATION_START",
      );

      // Check for existing active inspection
      const existingCheck =
        await this.checkForExistingActiveInspection(property_id);
      if (!existingCheck.canCreate) {
        return {
          inspectionId: "",
          success: false,
          error: existingCheck.reason,
        };
      }

      // Use enterprise-grade inspection creation service
      const enterpriseRequest: EnterpriseRequest = {
        propertyId: createFrontendPropertyId(property_id),
        inspectorId: createInspectorId(inspector_id),
        status: status as "draft" | "in_progress" | "completed" | "auditing",
      };

      const result = await Promise.race([
        inspectionCreationService.createInspection(enterpriseRequest),
        new Promise<never>((_, reject) =>
          setTimeout(
            () => reject(new Error("Inspection creation timeout")),
            this.TIMEOUT_MS,
          ),
        ),
      ]);

      if (!result.success || !result.data) {
        const errorMessage =
          result.error?.userMessage ||
          result.error?.message ||
          "Enterprise inspection creation failed";

        log.error(
          "Enterprise inspection creation failed",
          result.error,
          {
            component: "InspectionCreationService",
            action: "createInspection",
            property_id,
            inspector_id,
            status,
            errorCode: result.error?.code,
            errorMessage,
          },
          "INSPECTION_CREATION_ERROR",
        );

        return {
          inspectionId: "",
          success: false,
          error: errorMessage,
        };
      }

      createdInspectionId = result.data.inspectionId;

      log.info(
        "Inspection created successfully",
        {
          component: "InspectionCreationService",
          action: "createInspection",
          property_id,
          inspector_id,
          inspectionId: createdInspectionId,
          status,
        },
        "INSPECTION_CREATION_SUCCESS",
      );

      // Return with rollback capability
      const rollback = async () => {
        if (createdInspectionId) {
          await this.rollbackInspection(createdInspectionId);
        }
      };

      return {
        inspectionId: createdInspectionId,
        success: true,
        error: undefined,
        rollback,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";

      log.error(
        "Inspection creation failed with exception",
        error as Error,
        {
          component: "InspectionCreationService",
          action: "createInspection",
          request,
          createdInspectionId,
          errorType: error?.constructor?.name || "UnknownError",
        },
        "INSPECTION_CREATION_EXCEPTION",
      );

      // Attempt cleanup if inspection was partially created
      if (createdInspectionId) {
        try {
          await this.rollbackInspection(createdInspectionId);
        } catch (rollbackError) {
          log.error(
            "Failed to rollback partially created inspection",
            rollbackError as Error,
            {
              component: "InspectionCreationService",
              action: "createInspection",
              inspectionId: createdInspectionId,
            },
            "INSPECTION_ROLLBACK_FAILED",
          );
        }
      }

      return {
        inspectionId: "",
        success: false,
        error: `Creation failed: ${errorMessage}`,
      };
    }
  }

  /**
   * Populate inspection checklist with template items
   */
  static async populateChecklist(
    inspectionId: string,
  ): Promise<ChecklistPopulationResult> {
    try {
      if (!inspectionId || inspectionId.trim().length === 0) {
        return {
          itemsCreated: 0,
          success: false,
          error: "Inspection ID is required",
        };
      }

      const cleanInspectionId = inspectionId.trim();

      log.info(
        "Checklist population initiated",
        {
          component: "InspectionCreationService",
          action: "populateChecklist",
          inspectionId: cleanInspectionId,
        },
        "CHECKLIST_POPULATION_START",
      );

      // Use RPC function for safe checklist population
      const { data: populationResult, error: populationError } =
        await Promise.race([
          supabase.rpc("populate_inspection_checklist_safe", {
            inspection_id: cleanInspectionId,
          }),
          new Promise<never>((_, reject) =>
            setTimeout(
              () => reject(new Error("Checklist population timeout")),
              this.TIMEOUT_MS,
            ),
          ),
        ]);

      if (populationError) {
        log.error(
          "Checklist population failed",
          populationError,
          {
            component: "InspectionCreationService",
            action: "populateChecklist",
            inspectionId: cleanInspectionId,
            errorCode: populationError.code,
            errorMessage: populationError.message,
          },
          "CHECKLIST_POPULATION_ERROR",
        );

        return {
          itemsCreated: 0,
          success: false,
          error: `Population failed: ${populationError.message}`,
        };
      }

      const itemsCreated = populationResult?.items_created || 0;

      log.info(
        "Checklist population completed",
        {
          component: "InspectionCreationService",
          action: "populateChecklist",
          inspectionId: cleanInspectionId,
          itemsCreated,
        },
        "CHECKLIST_POPULATION_SUCCESS",
      );

      return {
        itemsCreated,
        success: true,
        error: undefined,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";

      log.error(
        "Checklist population failed with exception",
        error as Error,
        {
          component: "InspectionCreationService",
          action: "populateChecklist",
          inspectionId,
          errorType: error?.constructor?.name || "UnknownError",
        },
        "CHECKLIST_POPULATION_EXCEPTION",
      );

      return {
        itemsCreated: 0,
        success: false,
        error: `Population failed: ${errorMessage}`,
      };
    }
  }

  /**
   * Validate inspection creation request
   */
  private static validateCreationRequest(request: InspectionCreationRequest): {
    valid: boolean;
    error?: string;
  } {
    if (!request) {
      return { valid: false, error: "Creation request is required" };
    }

    if (!request.property_id || request.property_id.trim().length === 0) {
      return { valid: false, error: "Property ID is required" };
    }

    if (!request.inspector_id || request.inspector_id.trim().length === 0) {
      return { valid: false, error: "Inspector ID is required" };
    }

    // Validate UUID format for inspector_id
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(request.inspector_id)) {
      return { valid: false, error: "Inspector ID must be a valid UUID" };
    }

    // Validate status if provided
    if (request.status) {
      const validStatuses = ["draft", "in_progress", "completed", "cancelled"];
      if (!validStatuses.includes(request.status)) {
        return {
          valid: false,
          error: `Status must be one of: ${validStatuses.join(", ")}`,
        };
      }
    }

    // Validate start_time if provided
    if (request.start_time) {
      const parsedDate = new Date(request.start_time);
      if (isNaN(parsedDate.getTime())) {
        return {
          valid: false,
          error: "Start time must be a valid ISO date string",
        };
      }
    }

    return { valid: true };
  }

  /**
   * Check for existing active inspection
   */
  private static async checkForExistingActiveInspection(
    property_id: string,
  ): Promise<{ canCreate: boolean; reason?: string }> {
    try {
      const { data: existingInspections, error } = await supabase
        .from("inspections")
        .select("id, status, completed")
        .eq("property_id", property_id)
        .eq("completed", false)
        .limit(1);

      if (error) {
        log.warn(
          "Could not check for existing inspections",
          {
            component: "InspectionCreationService",
            action: "checkForExistingActiveInspection",
            property_id,
            error: error.message,
          },
          "EXISTING_INSPECTION_CHECK_FAILED",
        );

        // Allow creation if we can't check (fail open for better UX)
        return { canCreate: true };
      }

      if (existingInspections && existingInspections.length > 0) {
        const existing = existingInspections[0];
        log.warn(
          "Active inspection already exists",
          {
            component: "InspectionCreationService",
            action: "checkForExistingActiveInspection",
            property_id,
            existingInspectionId: existing.id,
            existingStatus: existing.status,
          },
          "ACTIVE_INSPECTION_EXISTS",
        );

        return {
          canCreate: false,
          reason: `Active inspection already exists (ID: ${existing.id}, Status: ${existing.status})`,
        };
      }

      return { canCreate: true };
    } catch (error) {
      log.error(
        "Exception while checking for existing inspections",
        error as Error,
        {
          component: "InspectionCreationService",
          action: "checkForExistingActiveInspection",
          property_id,
        },
        "EXISTING_INSPECTION_CHECK_EXCEPTION",
      );

      // Allow creation if we can't check (fail open for better UX)
      return { canCreate: true };
    }
  }

  /**
   * Rollback inspection creation
   */
  private static async rollbackInspection(inspectionId: string): Promise<void> {
    try {
      log.warn(
        "Rolling back inspection creation",
        {
          component: "InspectionCreationService",
          action: "rollbackInspection",
          inspectionId,
        },
        "INSPECTION_ROLLBACK_START",
      );

      // Delete associated checklist items first (logs table uses property_id, not inspection_id)
      // First get the property_id from the inspection
      const { data: inspectionData } = await supabase
        .from("inspections")
        .select("property_id")
        .eq("id", inspectionId)
        .single();

      let checklistError = null;
      if (inspectionData) {
        const { error: deleteError } = await supabase
          .from("checklist_items")
          .delete()
          .eq("property_id", inspectionData.property_id);
        checklistError = deleteError;
      }

      if (checklistError) {
        log.warn(
          "Failed to delete checklist items during rollback",
          {
            component: "InspectionCreationService",
            action: "rollbackInspection",
            inspectionId,
            error: checklistError.message,
          },
          "CHECKLIST_ROLLBACK_FAILED",
        );
      }

      // Delete the inspection
      const { error: inspectionError } = await supabase
        .from("inspections")
        .delete()
        .eq("id", inspectionId);

      if (inspectionError) {
        log.error(
          "Failed to delete inspection during rollback",
          inspectionError,
          {
            component: "InspectionCreationService",
            action: "rollbackInspection",
            inspectionId,
          },
          "INSPECTION_ROLLBACK_DELETE_FAILED",
        );
        throw new Error(`Rollback failed: ${inspectionError.message}`);
      }

      log.info(
        "Inspection rollback completed",
        {
          component: "InspectionCreationService",
          action: "rollbackInspection",
          inspectionId,
        },
        "INSPECTION_ROLLBACK_SUCCESS",
      );
    } catch (error) {
      log.error(
        "Inspection rollback failed",
        error as Error,
        {
          component: "InspectionCreationService",
          action: "rollbackInspection",
          inspectionId,
        },
        "INSPECTION_ROLLBACK_EXCEPTION",
      );
      throw error;
    }
  }
}
