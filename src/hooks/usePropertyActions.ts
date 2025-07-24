import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { deletePropertyData } from "@/utils/propertyDeletion";
import { useSmartCache } from "@/hooks/useSmartCache";
import {
  inspectionCreationService,
  InspectionCreationRequest,
  createFrontendPropertyId,
  createInspectorId,
} from "@/lib/database/inspection-creation-service";
import { safeNavigateToInspection } from "@/utils/inspectionNavigation";
import { logger } from "@/utils/logger";
// Enterprise-grade inspection creation service integrated

interface PropertyActionError {
  type: "network" | "validation" | "auth" | "system";
  message: string;
  action: string;
  retryable: boolean;
}

interface PropertyActionState {
  isLoading: boolean;
  error: PropertyActionError | null;
  retryCount: number;
}

export const usePropertyActions = () => {
  const [actionState, setActionState] = useState<PropertyActionState>({
    isLoading: false,
    error: null,
    retryCount: 0,
  });

  const { toast } = useToast();
  const navigate = useNavigate();
  const { invalidatePropertyData } = useSmartCache();

  const classifyError = (
    error: unknown,
    action: string,
  ): PropertyActionError => {
    const errorMessage =
      error instanceof Error
        ? error.message
        : String(error) || "Unknown error occurred";

    if (errorMessage.includes("network") || errorMessage.includes("fetch")) {
      return {
        type: "network",
        message: "Network connection failed. Please check your internet.",
        action,
        retryable: true,
      };
    }

    if (
      errorMessage.includes("unauthorized") ||
      errorMessage.includes("forbidden")
    ) {
      return {
        type: "auth",
        message: "You don't have permission to perform this action.",
        action,
        retryable: false,
      };
    }

    if (
      errorMessage.includes("validation") ||
      errorMessage.includes("invalid")
    ) {
      return {
        type: "validation",
        message: "The data provided is invalid. Please check and try again.",
        action,
        retryable: false,
      };
    }

    return {
      type: "system",
      message: errorMessage,
      action,
      retryable: true,
    };
  };

  const executeWithRetry = useCallback(
    async <T>(
      operation: () => Promise<T>,
      actionName: string,
      maxRetries = 3,
    ): Promise<T | null> => {
      setActionState((prev) => ({ ...prev, isLoading: true, error: null }));

      for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
          const result = await operation();

          setActionState({
            isLoading: false,
            error: null,
            retryCount: 0,
          });

          return result;
        } catch (error) {
          const classifiedError = classifyError(error, actionName);

          if (attempt === maxRetries || !classifiedError.retryable) {
            setActionState({
              isLoading: false,
              error: classifiedError,
              retryCount: attempt + 1,
            });

            toast({
              title: `${actionName} Failed`,
              description: classifiedError.message,
              variant: "destructive",
            });

            return null;
          }

          setActionState((prev) => ({ ...prev, retryCount: attempt + 1 }));

          // Wait before retry (exponential backoff)
          await new Promise((resolve) =>
            setTimeout(resolve, Math.pow(2, attempt) * 1000),
          );
        }
      }

      return null;
    },
    [toast],
  );

  const deleteProperty = useCallback(
    async (propertyId: string) => {
      return executeWithRetry(async () => {
        // Use the existing utility which has the full deletion logic
        await deletePropertyData(propertyId);

        toast({
          title: "Property Deleted",
          description:
            "The property and all associated data have been permanently removed.",
        });

        // Invalidate cache to refresh the UI
        invalidatePropertyData();

        return true;
      }, "Delete Property");
    },
    [executeWithRetry, toast, invalidatePropertyData],
  );

  const editProperty = useCallback(
    (propertyId: string) => {
      try {
        navigate(`/add-property?edit=${propertyId}`);
      } catch (error) {
        toast({
          title: "Navigation Failed",
          description: "Could not navigate to edit page. Please try again.",
          variant: "destructive",
        });
      }
    },
    [navigate, toast],
  );

  const startInspection = useCallback(
    async (propertyId: string) => {
      return executeWithRetry(async () => {
        // Use property ID directly as UUID string (post-migration database returns UUIDs)
        const propertyIdForQuery = propertyId;

        logger.info(
          "🚀 INSPECTION CREATION FLOW STARTED",
          {
            propertyId: propertyIdForQuery,
            userId: user?.id,
            timestamp: new Date().toISOString(),
          },
          "PROPERTY_ACTIONS_DEBUG",
        );

        // Check if there's already an active inspection (any status except cancelled/approved)
        logger.info(
          "Checking for existing inspections before creating new one",
          {
            propertyId: propertyIdForQuery,
            userId: user.id,
          },
          "PROPERTY_ACTIONS",
        );

        const { data: existingInspection, error: checkError } = await supabase
          .from("inspections")
          .select("id, status")
          .eq("property_id", propertyIdForQuery)
          .not("status", "in", ["cancelled", "approved"])
          .single();

        if (checkError && checkError.code !== "PGRST116") {
          logger.error(
            "🚨 DATABASE CHECK ERROR - NOT THROWING TO AVOID ERROR RECOVERY",
            { 
              error: checkError,
              code: checkError.code,
              message: checkError.message,
            },
            "PROPERTY_ACTIONS_DEBUG",
          );
          
          toast({
            title: "Database Error",
            description: "Unable to check existing inspections. Please try again.",
            variant: "destructive",
          });
          
          return null; // Don't throw - just return null
        }

        if (existingInspection) {
          logger.info(
            "Found existing inspection - navigating to resume",
            {
              inspectionId: existingInspection.id,
              status: existingInspection.status,
              propertyId: propertyIdForQuery,
            },
            "PROPERTY_ACTIONS",
          );
          safeNavigateToInspection(navigate, existingInspection.id);
          return existingInspection.id;
        }

        logger.info(
          "No existing inspection found - creating new one",
          {
            propertyId: propertyIdForQuery,
            userId: user.id,
          },
          "PROPERTY_ACTIONS",
        );

        // Create new inspection using the secure creation service
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
          logger.error(
            "🚨 USER NOT AUTHENTICATED - NOT THROWING TO AVOID ERROR RECOVERY",
            { timestamp: new Date().toISOString() },
            "PROPERTY_ACTIONS_DEBUG",
          );
          
          toast({
            title: "Authentication Required",
            description: "Please sign in to create inspections.",
            variant: "destructive",
          });
          
          return null; // Don't throw - just return null
        }

        // Use enterprise-grade inspection creation service
        const request: InspectionCreationRequest = {
          propertyId: createFrontendPropertyId(propertyIdForQuery),
          inspectorId: createInspectorId(user.id),
          status: "draft",
        };

        logger.info(
          "Starting inspection creation with enterprise service",
          {
            propertyId: propertyIdForQuery,
            userId: user.id,
            request: {
              ...request,
              inspectorId: "***",
            },
          },
          "PROPERTY_ACTIONS",
        );

        logger.info(
          "🔥 CALLING INSPECTION CREATION SERVICE",
          {
            request: {
              ...request,
              inspectorId: "***",
            },
            timestamp: new Date().toISOString(),
          },
          "PROPERTY_ACTIONS_DEBUG",
        );

        const result =
          await inspectionCreationService.createInspection(request);

        logger.info(
          "🎯 ENTERPRISE INSPECTION CREATION SERVICE RESPONSE",
          {
            success: result.success,
            hasData: !!result.data,
            dataKeys: result.data ? Object.keys(result.data) : [],
            inspectionId: result.data?.inspectionId,
            inspectionIdType: typeof result.data?.inspectionId,
            error: result.error?.code,
            errorMessage: result.error?.message,
            fullError: result.error,
            timestamp: new Date().toISOString(),
          },
          "PROPERTY_ACTIONS_DEBUG",
        );

        if (!result.success || !result.data || !result.data.inspectionId) {
          const errorMessage =
            result.error?.userMessage ||
            result.error?.message ||
            "Enterprise inspection creation failed";
          
          logger.error(
            "🔥 INSPECTION CREATION FAILED - DETAILED ANALYSIS",
            {
              success: result.success,
              hasData: !!result.data,
              dataStructure: result.data,
              inspectionId: result.data?.inspectionId,
              inspectionIdType: typeof result.data?.inspectionId,
              error: result.error,
              fullResult: result,
              errorMessage,
              timestamp: new Date().toISOString(),
            },
            "PROPERTY_ACTIONS_DEBUG",
          );
          
          // CRITICAL FIX: Don't throw generic Error that triggers ErrorRecoveryService
          // Instead, handle inspection creation errors gracefully in the UI
          console.error("🚨 INSPECTION CREATION ERROR - NOT THROWING TO AVOID ERROR RECOVERY", {
            errorMessage,
            error: result.error,
            timestamp: new Date().toISOString(),
          });
          
          // Return a user-friendly error instead of throwing
          toast({
            title: "Unable to Start Inspection",
            description: result.error?.userMessage || "Please try again or contact support if the issue persists.",
            variant: "destructive",
          });
          
          return null; // Don't throw - just return null to indicate failure
        }

        const inspectionId = result.data.inspectionId;

        logger.info(
          "Extracted inspection ID for navigation",
          {
            inspectionId,
            inspectionIdType: typeof inspectionId,
            isUndefined: inspectionId === undefined,
            isNull: inspectionId === null,
            isEmpty: inspectionId === "",
            stringValue: String(inspectionId),
          },
          "PROPERTY_ACTIONS",
        );

        // Validate inspection ID before navigation
        if (
          !inspectionId ||
          inspectionId === "undefined" ||
          inspectionId.trim() === ""
        ) {
          logger.error(
            "🚨 INVALID INSPECTION ID - NOT THROWING TO AVOID ERROR RECOVERY",
            { inspectionId },
            "PROPERTY_ACTIONS_DEBUG",
          );
          
          toast({
            title: "Inspection Creation Issue",
            description: "Inspection was created but navigation failed. Please refresh and try again.",
            variant: "destructive",
          });
          
          return null; // Don't throw - just return null
        }

        const navigated = safeNavigateToInspection(navigate, inspectionId);

        if (!navigated) {
          logger.error(
            "🚨 NAVIGATION FAILED - NOT THROWING TO AVOID ERROR RECOVERY",
            { inspectionId },
            "PROPERTY_ACTIONS_DEBUG",
          );
          
          toast({
            title: "Navigation Failed",
            description: "Inspection created but could not navigate. Please check the inspection list.",
            variant: "destructive",
          });
          
          return null; // Don't throw - just return null
        }

        toast({
          title: "Inspection Started",
          description:
            "A new inspection has been created successfully with enterprise-grade reliability.",
        });

        return inspectionId;
      }, "Start Inspection");
    },
    [executeWithRetry, navigate, toast],
  );

  const clearError = useCallback(() => {
    setActionState((prev) => ({ ...prev, error: null }));
  }, []);

  const retry = useCallback(() => {
    if (actionState.error?.retryable) {
      setActionState((prev) => ({ ...prev, error: null, retryCount: 0 }));
    }
  }, [actionState.error]);

  // Enhanced interface with backward compatibility
  return {
    // Enhanced interface
    deleteProperty,
    editProperty,
    startInspection,
    actionState,
    clearError,
    retry,

    // Backward compatibility aliases for legacy components
    handleDelete: deleteProperty,
    handleEdit: editProperty,
    handleStartInspection: startInspection,
  };
};
