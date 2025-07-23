/**
 * Checklist State Manager - Enterprise Grade
 *
 * Handles checklist item state management, auto-save, and atomic operations
 * following enterprise render props pattern for clean component separation
 */

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";
import { atomicChecklistService } from "@/services/AtomicChecklistService";
import { checklistRecoverySystem } from "@/services/ChecklistRecoverySystem";
import { logger } from "@/utils/logger";

export type SaveState = "idle" | "saving" | "saved" | "error" | "conflict";
export type ErrorType =
  | "network_timeout"
  | "network_offline"
  | "authentication_expired"
  | "database_error"
  | "concurrent_edit"
  | "unknown";

interface ChecklistStateManagerProps {
  itemId: string;
  currentNotes: string;
  inspectionId: string;
  onComplete: () => void;
  children: (stateData: {
    saveState: SaveState;
    errorMessage: string;
    conflictData: Record<string, unknown>;
    lastSaveAttempt: Date | null;
    autoSaveEnabled: boolean;
    retryCount: number;
    isOnline: boolean;
    handleStatusChange: (
      status: "completed" | "failed" | "not_applicable",
    ) => Promise<void>;
    handleRetry: () => Promise<void>;
    handleConflictResolution: (
      resolution: "accept_local" | "accept_remote" | "merge",
    ) => Promise<void>;
    setAutoSaveEnabled: (enabled: boolean) => void;
  }) => React.ReactNode;
}

export const ChecklistStateManager: React.FC<ChecklistStateManagerProps> = ({
  itemId,
  currentNotes,
  inspectionId,
  onComplete,
  children,
}) => {
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [conflictData, setConflictData] = useState<any>(null);
  const [lastSaveAttempt, setLastSaveAttempt] = useState<Date | null>(null);
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);
  const [retryCount, setRetryCount] = useState(0);
  const mountedRef = useRef(true);

  const { toast } = useToast();
  const { user } = useAuth();
  const { isOnline, retryConnection } = useNetworkStatus();

  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Auto-save dirty state every 30 seconds
  useEffect(() => {
    if (!autoSaveEnabled || !user || !mountedRef.current) return;

    const autoSaveTimer = setInterval(async () => {
      if (!mountedRef.current) return;

      const pendingState = atomicChecklistService.getPendingState(itemId);

      if (pendingState && pendingState.isDirty && saveState === "idle") {
        logger.info(
          "Auto-saving checklist item",
          { itemId },
          "CHECKLIST_STATE_MANAGER",
        );

        try {
          await atomicChecklistService.updateChecklistItem({
            itemId,
            status: pendingState.status,
            notes: pendingState.notes,
            inspectorId: user.id,
            force: false,
          });

          if (mountedRef.current) {
            logger.info(
              "Auto-save successful",
              { itemId },
              "CHECKLIST_STATE_MANAGER",
            );
          }
        } catch (error) {
          if (mountedRef.current) {
            logger.warn(
              "Auto-save failed",
              { itemId, error },
              "CHECKLIST_STATE_MANAGER",
            );
          }
        }
      }
    }, 30000);

    return () => clearInterval(autoSaveTimer);
  }, [itemId, user, saveState, autoSaveEnabled]);

  // Monitor online status changes
  useEffect(() => {
    if (isOnline && saveState === "error" && mountedRef.current) {
      toast({
        title: "Connection restored",
        description: "You can now retry saving your changes.",
      });
    }
  }, [isOnline, saveState, toast]);

  /**
   * Handle status change with bulletproof atomic operations
   */
  const handleStatusChange = useCallback(
    async (newStatus: "completed" | "failed" | "not_applicable") => {
      if (!user) {
        toast({
          title: "Authentication required",
          description: "Please sign in to save your progress.",
          variant: "destructive",
        });
        return;
      }

      if (!mountedRef.current) return;

      setSaveState("saving");
      setErrorMessage("");
      setConflictData(null);
      setLastSaveAttempt(new Date());

      const statusMessage = {
        completed: "passed",
        failed: "failed",
        not_applicable: "not applicable",
      }[newStatus];

      try {
        logger.info(
          "Attempting atomic checklist update",
          {
            itemId,
            status: newStatus,
            hasNotes: !!currentNotes,
            isOnline,
            retryCount,
          },
          "CHECKLIST_STATE_MANAGER",
        );

        const result = await atomicChecklistService.updateChecklistItem({
          itemId,
          status: newStatus,
          notes: currentNotes || "",
          inspectorId: user.id,
          force: false,
        });

        if (!mountedRef.current) return;

        if (result.success) {
          setSaveState("saved");
          setRetryCount(0);

          toast({
            title: "Status updated",
            description: `Item marked as ${statusMessage}${currentNotes ? " with notes saved." : "."}`,
          });

          setTimeout(() => {
            if (mountedRef.current) {
              setSaveState("idle");
            }
          }, 2000);

          if (newStatus === "completed") {
            onComplete();
          }
        } else if (result.conflict) {
          setSaveState("conflict");
          setConflictData(result.conflictData);
          toast({
            title: "Conflict detected",
            description:
              "Another inspector has modified this item. Please resolve the conflict.",
            variant: "destructive",
          });
        }
      } catch (error: unknown) {
        if (!mountedRef.current) return;

        setSaveState("error");
        setRetryCount((prev) => prev + 1);

        const errorType = determineErrorType(error);
        const errorMsg = getErrorMessage(errorType, retryCount);
        setErrorMessage(errorMsg);

        toast({
          title: "Save failed",
          description: errorMsg,
          variant: "destructive",
        });

        logger.error(
          "Checklist update failed",
          {
            itemId,
            error: error.message,
            errorType,
            retryCount,
          },
          "CHECKLIST_STATE_MANAGER",
        );
      }
    },
    [user, currentNotes, itemId, isOnline, retryCount, onComplete, toast],
  );

  /**
   * Handle retry operations
   */
  const handleRetry = useCallback(async () => {
    if (!mountedRef.current) return;

    const pendingState = atomicChecklistService.getPendingState(itemId);
    if (pendingState && pendingState.status) {
      await handleStatusChange(pendingState.status);
    }
  }, [itemId, handleStatusChange]);

  /**
   * Handle conflict resolution
   */
  const handleConflictResolution = useCallback(
    async (resolution: "accept_local" | "accept_remote" | "merge") => {
      if (!conflictData || !mountedRef.current) return;

      setSaveState("saving");

      try {
        const result = await checklistRecoverySystem.resolveConflict(
          itemId,
          conflictData,
          resolution,
        );

        if (!mountedRef.current) return;

        if (result.success) {
          setSaveState("saved");
          setConflictData(null);
          setRetryCount(0);

          toast({
            title: "Conflict resolved",
            description: "Your changes have been saved successfully.",
          });

          setTimeout(() => {
            if (mountedRef.current) {
              setSaveState("idle");
            }
          }, 2000);
        }
      } catch (error) {
        if (!mountedRef.current) return;

        setSaveState("error");
        toast({
          title: "Resolution failed",
          description:
            "Unable to resolve conflicts. Please refresh and try again.",
          variant: "destructive",
        });
      }
    },
    [conflictData, itemId, toast],
  );

  const determineErrorType = (error: Error | unknown): ErrorType => {
    if (!isOnline) return "network_offline";
    const errorMessage = error instanceof Error ? error.message : String(error);
    if (errorMessage.includes("timeout")) return "network_timeout";
    if (errorMessage.includes("auth")) return "authentication_expired";
    if (errorMessage.includes("concurrent")) return "concurrent_edit";
    if (errorMessage.includes("database")) return "database_error";
    return "unknown";
  };

  const getErrorMessage = (
    errorType: ErrorType,
    retryCount: number,
  ): string => {
    const messages = {
      network_offline:
        "You appear to be offline. Changes will be saved when connection is restored.",
      network_timeout: `Network request timed out. ${retryCount < 3 ? "Retrying..." : "Please check your connection."}`,
      authentication_expired:
        "Your session has expired. Please sign in again to continue.",
      database_error:
        "Database temporarily unavailable. Your changes are saved locally and will sync when possible.",
      concurrent_edit:
        "Another inspector modified this item. Please resolve the conflict to continue.",
      unknown: `An unexpected error occurred. ${retryCount < 3 ? "Retrying..." : "Please try again later."}`,
    };
    return messages[errorType];
  };

  return (
    <>
      {children({
        saveState,
        errorMessage,
        conflictData,
        lastSaveAttempt,
        autoSaveEnabled,
        retryCount,
        isOnline,
        handleStatusChange,
        handleRetry,
        handleConflictResolution,
        setAutoSaveEnabled,
      })}
    </>
  );
};
