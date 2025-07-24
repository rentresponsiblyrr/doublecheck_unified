import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { deletePropertyData } from "@/utils/propertyDeletion";
import { useSmartCache } from "@/hooks/useSmartCache";
import { useSimpleInspectionFlow } from "@/hooks/useSimpleInspectionFlow";

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

  const { startOrResumeInspection, isLoading: simpleFlowLoading } = useSimpleInspectionFlow();

  const startInspection = useCallback(
    async (propertyId: string) => {
      console.log("🚀 USING SIMPLE BULLETPROOF INSPECTION FLOW", {
        propertyId,
        timestamp: new Date().toISOString(),
      });

      // Use the simple flow that bypasses all complex error handling
      const result = await startOrResumeInspection(propertyId);
      
      if (result) {
        console.log("✅ Simple flow succeeded", { inspectionId: result });
        return result;
      } else {
        console.log("❌ Simple flow failed gracefully (no refresh loops)");
        return null;
      }
    },
    [startOrResumeInspection],
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
    actionState: {
      ...actionState,
      isLoading: actionState.isLoading || simpleFlowLoading, // Combine loading states
    },
    clearError,
    retry,

    // Backward compatibility aliases for legacy components
    handleDelete: deleteProperty,
    handleEdit: editProperty,
    handleStartInspection: startInspection,
  };
};
