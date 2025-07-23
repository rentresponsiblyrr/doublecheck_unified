import { supabase } from "@/integrations/supabase/client";
import { InspectionValidationService } from "./inspectionValidationService";
import { STATUS_GROUPS, INSPECTION_STATUS } from "@/types/inspection-status";
import { log } from "@/lib/logging/enterprise-logger";
import { extractErrorInfo, formatSupabaseError } from "@/types/supabase-errors";
import {
  inspectionCreationService,
  InspectionCreationRequest,
  createFrontendPropertyId,
  createInspectorId,
} from "@/lib/database/inspection-creation-service";
// Enterprise-grade inspection creation service integrated

export class InspectionCreationOptimizer {
  private static readonly MAX_RETRIES = 3;

  static async findActiveInspectionSecure(
    propertyId: string,
  ): Promise<string | null> {
    try {
      log.info(
        "Finding active inspection for property",
        {
          component: "InspectionCreationOptimizer",
          action: "findActiveInspectionSecure",
          propertyId,
        },
        "ACTIVE_INSPECTION_SEARCH_STARTED",
      );

      // Define which statuses should prevent creating a new inspection
      // ACTIVE: draft, in_progress
      // REVIEW_PIPELINE: completed, pending_review, in_review
      // NEEDS_REVISION: needs_revision (inspector must continue this one)
      const activeStatuses = [
        ...STATUS_GROUPS.ACTIVE,
        ...STATUS_GROUPS.REVIEW_PIPELINE,
        INSPECTION_STATUS.NEEDS_REVISION,
      ];

      log.debug(
        "Looking for inspections with active statuses",
        {
          component: "InspectionCreationOptimizer",
          action: "findActiveInspectionSecure",
          propertyId,
          activeStatuses,
          statusCount: activeStatuses.length,
        },
        "ACTIVE_STATUSES_QUERY",
      );

      // Use propertyId directly - it's already in the correct format from get_properties_with_inspections
      // The database function returns property_id as UUID strings, so no conversion needed
      const { data, error } = await supabase
        .from("inspections")
        .select("id, inspector_id, status, start_time")
        .eq("property_id", propertyId)
        .in("status", activeStatuses)
        .order("start_time", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        log.error(
          "Active inspection query error",
          error,
          {
            component: "InspectionCreationOptimizer",
            action: "findActiveInspectionSecure",
            propertyId,
          },
          "ACTIVE_INSPECTION_QUERY_ERROR",
        );
        return null;
      }

      if (data) {
        log.info(
          "Found active inspection that should be resumed",
          {
            component: "InspectionCreationOptimizer",
            action: "findActiveInspectionSecure",
            propertyId,
            inspectionId: data.id,
            status: data.status,
            startTime: data.start_time,
            inspectorId: data.inspector_id,
          },
          "ACTIVE_INSPECTION_FOUND",
        );
        return data.id;
      }

      log.info(
        "No active inspection found - safe to create new one",
        {
          component: "InspectionCreationOptimizer",
          action: "findActiveInspectionSecure",
          propertyId,
          checkedStatuses: activeStatuses.length,
        },
        "NO_ACTIVE_INSPECTION_FOUND",
      );
      return null;
    } catch (error) {
      log.error(
        "Failed to find active inspection",
        error as Error,
        {
          component: "InspectionCreationOptimizer",
          action: "findActiveInspectionSecure",
          propertyId,
        },
        "ACTIVE_INSPECTION_SEARCH_FAILED",
      );
      return null;
    }
  }

  static async createInspectionWithRetry(
    propertyId: string,
    inspectorId: string,
  ): Promise<string> {
    for (let attempt = 1; attempt <= this.MAX_RETRIES; attempt++) {
      try {
        log.info(
          "Creating inspection attempt",
          {
            component: "InspectionCreationOptimizer",
            action: "createInspectionWithRetry",
            attempt,
            maxRetries: this.MAX_RETRIES,
            propertyId,
            inspectorId,
          },
          "INSPECTION_CREATION_ATTEMPT",
        );

        // Use enterprise-grade inspection creation service
        log.debug(
          "Using enterprise inspection creation service",
          {
            component: "InspectionCreationOptimizer",
            action: "createInspectionWithRetry",
            attempt,
            propertyId,
            inspectorId,
          },
          "ENTERPRISE_INSPECTION_CREATE_ATTEMPT",
        );

        const request: InspectionCreationRequest = {
          propertyId: createFrontendPropertyId(propertyId),
          inspectorId: createInspectorId(inspectorId),
          status: "draft",
        };

        const result =
          await inspectionCreationService.createInspection(request);

        if (!result.success || !result.data) {
          const errorMessage =
            result.error?.userMessage ||
            result.error?.message ||
            "Enterprise inspection creation failed";
          log.error(
            "Enterprise inspection creation failed",
            result.error,
            {
              component: "InspectionCreationOptimizer",
              action: "createInspectionWithRetry",
              attempt,
              propertyId,
              inspectorId,
              errorCode: result.error?.code,
            },
            "ENTERPRISE_INSPECTION_CREATE_FAILED",
          );
          throw new Error(errorMessage);
        }

        const data = result.data.inspectionId;
        log.debug(
          "Enterprise inspection creation successful",
          {
            component: "InspectionCreationOptimizer",
            action: "createInspectionWithRetry",
            attempt,
            inspectionId: data,
            processingTime: result.performance?.processingTime,
          },
          "ENTERPRISE_INSPECTION_CREATE_SUCCESS",
        );

        log.info(
          "Inspection created successfully",
          {
            component: "InspectionCreationOptimizer",
            action: "createInspectionWithRetry",
            attempt,
            propertyId,
            inspectorId,
            inspectionId: data,
          },
          "INSPECTION_CREATED_SUCCESS",
        );

        // Verify checklist items were created by trigger
        try {
          await InspectionValidationService.verifyChecklistItemsCreated(data);
        } catch (verificationError) {
          // If checklist verification fails, check if static_safety_items is empty
          const { count } = await supabase
            .from("static_safety_items")
            .select("*", { count: "exact", head: true })
            .eq("deleted", false)
            .eq("required", true);

          if (count === 0) {
            throw new Error(
              "No static safety items found in database. Contact admin to populate static_safety_items table.",
            );
          }
          throw verificationError;
        }

        return data;
      } catch (error) {
        log.error(
          "Inspection creation attempt failed",
          error as Error,
          {
            component: "InspectionCreationOptimizer",
            action: "createInspectionWithRetry",
            attempt,
            maxRetries: this.MAX_RETRIES,
            propertyId,
            inspectorId,
            ...extractErrorInfo(error),
          },
          "INSPECTION_CREATION_ATTEMPT_FAILED",
        );

        // Log detailed error information for debugging
        const errorDetails = {
          attempt,
          propertyId,
          errorMessage: error instanceof Error ? error.message : String(error),
          ...extractErrorInfo(error),
          timestamp: new Date().toISOString(),
        };
        log.error(
          "Detailed error information for inspection creation",
          undefined,
          {
            component: "InspectionCreationOptimizer",
            action: "createInspectionWithRetry",
            ...errorDetails,
          },
          "INSPECTION_CREATION_DETAILED_ERROR",
        );

        if (attempt === this.MAX_RETRIES) {
          // Provide more detailed error message
          const detailedMessage =
            error instanceof Error
              ? formatSupabaseError(error)
              : "Unknown error";
          throw new Error(
            `Failed to create inspection after ${this.MAX_RETRIES} attempts: ${detailedMessage}`,
          );
        }

        // Exponential backoff
        await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
      }
    }

    throw new Error("Max retries exceeded");
  }

  static async assignInspectorToInspection(
    inspectionId: string,
  ): Promise<void> {
    try {
      log.info(
        "Assigning current user to inspection",
        {
          component: "InspectionCreationOptimizer",
          action: "assignInspector",
          metadata: { inspectionId },
        },
        "ASSIGN_INSPECTOR_START",
      );

      // Try RPC function first, fallback to direct update
      try {
        const { data, error } = await supabase.rpc(
          "assign_inspector_to_inspection",
          {
            p_inspection_id: inspectionId,
          },
        );

        if (error) {
          throw new Error(`RPC assign failed: ${error.message}`);
        }

        return;
      } catch (rpcError) {
        // Fallback to direct update
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
          throw new Error("User not authenticated for inspector assignment");
        }

        const { error: updateError } = await supabase
          .from("inspections")
          .update({ inspector_id: user.id })
          .eq("id", inspectionId);

        if (updateError) {
          throw new Error(`Direct update failed: ${updateError.message}`);
        }
      }
    } catch (error) {
      // Don't throw - this is not critical for mobile flow
    }
  }
}
