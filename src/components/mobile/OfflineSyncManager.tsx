// Refactored Offline Sync Manager Component for STR Certified
// Orchestrates offline data storage, sync, and conflict resolution using focused sub-components

import React, { useState, useEffect, useCallback, useRef } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useQuery, useMutation } from "@tanstack/react-query";
import { OfflineData } from "@/types/payload-types";

// Sub-components
import { SyncStatusCard } from "./sync/SyncStatusCard";
import { SyncItemsList } from "./sync/SyncItemsList";
import { ConflictResolver } from "./sync/ConflictResolver";
import { StorageInfo } from "./sync/StorageInfo";

// Types
interface OfflineSyncManagerProps {
  className?: string;
}

interface SyncItem {
  id: string;
  type: "inspection" | "photo" | "video" | "checklist" | "report";
  action: "create" | "update" | "delete";
  data: Record<string, unknown>;
  size: number;
  status: "pending" | "syncing" | "completed" | "failed" | "conflict";
  lastAttempt?: Date;
  errorMessage?: string;
  retryCount: number;
  priority: "low" | "medium" | "high" | "critical";
}

interface SyncConflict {
  id: string;
  type: "inspection" | "photo" | "video" | "checklist" | "report";
  localData: Record<string, unknown>;
  serverData: Record<string, unknown>;
  timestamp: Date;
  description: string;
}

interface SyncStatus {
  isOnline: boolean;
  isSyncing: boolean;
  lastSyncTime: Date | null;
  pendingItems: number;
  failedItems: number;
  conflicts: number;
  totalStorage: number;
}

interface StorageStats {
  used: number;
  available: number;
  total: number;
  breakdown: {
    inspections: number;
    photos: number;
    videos: number;
    checklists: number;
    cache: number;
  };
}

export const OfflineSyncManager: React.FC<OfflineSyncManagerProps> = ({
  className,
}) => {
  // State management
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    isOnline: navigator.onLine,
    isSyncing: false,
    lastSyncTime: null,
    pendingItems: 0,
    failedItems: 0,
    conflicts: 0,
    totalStorage: 0,
  });

  const [syncItems, setSyncItems] = useState<SyncItem[]>([]);
  const [syncProgress, setSyncProgress] = useState(0);
  const [showDetails, setShowDetails] = useState(false);
  const [currentConflict, setCurrentConflict] = useState<SyncConflict | null>(
    null,
  );
  const [showConflictDialog, setShowConflictDialog] = useState(false);
  const [storageStats, setStorageStats] = useState<StorageStats>({
    used: 0,
    available: 0,
    total: 0,
    breakdown: {
      inspections: 0,
      photos: 0,
      videos: 0,
      checklists: 0,
      cache: 0,
    },
  });

  // Network status monitoring
  useEffect(() => {
    const handleOnline = () =>
      setSyncStatus((prev) => ({ ...prev, isOnline: true }));
    const handleOffline = () =>
      setSyncStatus((prev) => ({ ...prev, isOnline: false }));

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Initialize storage stats
  useEffect(() => {
    const initializeStorage = async () => {
      try {
        // Get storage estimate
        if ("storage" in navigator && "estimate" in navigator.storage) {
          const estimate = await navigator.storage.estimate();
          const used = estimate.usage || 0;
          const quota = estimate.quota || 0;

          setStorageStats({
            used,
            available: quota - used,
            total: quota,
            breakdown: {
              inspections: used * 0.4,
              photos: used * 0.3,
              videos: used * 0.2,
              checklists: used * 0.05,
              cache: used * 0.05,
            },
          });
        }
      } catch (error) {
        console.error("Failed to get storage estimate:", error);
      }
    };

    initializeStorage();
  }, []);

  // Mock sync items for demonstration
  useEffect(() => {
    const mockItems: SyncItem[] = [
      {
        id: "1",
        type: "inspection",
        action: "create",
        data: { id: "1", name: "Property A Inspection" },
        size: 1024 * 50, // 50KB
        status: "pending",
        retryCount: 0,
        priority: "high",
      },
      {
        id: "2",
        type: "photo",
        action: "update",
        data: { id: "2", url: "photo.jpg" },
        size: 1024 * 500, // 500KB
        status: "failed",
        errorMessage: "Network timeout",
        retryCount: 2,
        priority: "medium",
        lastAttempt: new Date(Date.now() - 60000),
      },
      {
        id: "3",
        type: "checklist",
        action: "update",
        data: { id: "3", items: [] },
        size: 1024 * 10, // 10KB
        status: "conflict",
        retryCount: 1,
        priority: "high",
        lastAttempt: new Date(Date.now() - 120000),
      },
    ];

    setSyncItems(mockItems);
    setSyncStatus((prev) => ({
      ...prev,
      pendingItems: mockItems.filter((item) => item.status === "pending")
        .length,
      failedItems: mockItems.filter((item) => item.status === "failed").length,
      conflicts: mockItems.filter((item) => item.status === "conflict").length,
      totalStorage: mockItems.reduce((acc, item) => acc + item.size, 0),
    }));
  }, []);

  // Sync operations
  const startSync = useCallback(async () => {
    if (!syncStatus.isOnline || syncStatus.isSyncing) return;

    setSyncStatus((prev) => ({ ...prev, isSyncing: true }));
    setSyncProgress(0);

    try {
      const pendingItems = syncItems.filter(
        (item) => item.status === "pending" || item.status === "failed",
      );

      for (let i = 0; i < pendingItems.length; i++) {
        const item = pendingItems[i];

        // Update item status to syncing
        setSyncItems((prev) =>
          prev.map((syncItem) =>
            syncItem.id === item.id
              ? { ...syncItem, status: "syncing" as const }
              : syncItem,
          ),
        );

        // Simulate sync operation
        await new Promise((resolve) => setTimeout(resolve, 2000));

        // Mock sync result (90% success rate)
        const success = Math.random() > 0.1;

        setSyncItems((prev) =>
          prev.map((syncItem) =>
            syncItem.id === item.id
              ? {
                  ...syncItem,
                  status: success
                    ? ("completed" as const)
                    : ("failed" as const),
                  lastAttempt: new Date(),
                  retryCount: success ? 0 : syncItem.retryCount + 1,
                  errorMessage: success ? undefined : "Sync failed",
                }
              : syncItem,
          ),
        );

        setSyncProgress(((i + 1) / pendingItems.length) * 100);
      }

      setSyncStatus((prev) => ({
        ...prev,
        isSyncing: false,
        lastSyncTime: new Date(),
        pendingItems: syncItems.filter((item) => item.status === "pending")
          .length,
        failedItems: syncItems.filter((item) => item.status === "failed")
          .length,
      }));
    } catch (error) {
      console.error("Sync failed:", error);
      setSyncStatus((prev) => ({ ...prev, isSyncing: false }));
    }
  }, [syncStatus.isOnline, syncStatus.isSyncing, syncItems]);

  const retryItem = useCallback((itemId: string) => {
    setSyncItems((prev) =>
      prev.map((item) =>
        item.id === itemId
          ? { ...item, status: "pending" as const, errorMessage: undefined }
          : item,
      ),
    );
  }, []);

  const removeItem = useCallback((itemId: string) => {
    setSyncItems((prev) => prev.filter((item) => item.id !== itemId));
  }, []);

  const resolveConflict = useCallback(
    (conflictId: string, resolution: "local" | "server" | "merge") => {
      // TODO: Implement proper conflict resolution logic
      // This should handle merging data based on resolution strategy,
      // update the appropriate data store, and notify user of outcome

      setSyncItems((prev) =>
        prev.map((item) =>
          item.id === conflictId
            ? { ...item, status: "completed" as const }
            : item,
        ),
      );

      setCurrentConflict(null);
    },
    [],
  );

  // Handle conflict detection
  useEffect(() => {
    const conflictItem = syncItems.find((item) => item.status === "conflict");
    if (conflictItem && !currentConflict) {
      setCurrentConflict({
        id: conflictItem.id,
        type: conflictItem.type,
        localData: conflictItem.data,
        serverData: { ...conflictItem.data, serverModified: true },
        timestamp: new Date(),
        description: `Conflict detected in ${conflictItem.type} data`,
      });
      setShowConflictDialog(true);
    }
  }, [syncItems, currentConflict]);

  return (
    <div className={cn("space-y-4", className)}>
      {/* Main Status Card */}
      <SyncStatusCard
        syncStatus={syncStatus}
        syncProgress={syncProgress}
        showDetails={showDetails}
        onToggleDetails={() => setShowDetails(!showDetails)}
        onStartSync={startSync}
      />

      {/* Detailed View */}
      {showDetails && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Sync Items List */}
          <SyncItemsList
            syncItems={syncItems}
            onRetryItem={retryItem}
            onRemoveItem={removeItem}
          />

          {/* Storage Information */}
          <StorageInfo storageStats={storageStats} />
        </div>
      )}

      {/* Conflict Resolution Dialog */}
      <ConflictResolver
        conflict={currentConflict}
        isOpen={showConflictDialog}
        onClose={() => setShowConflictDialog(false)}
        onResolve={resolveConflict}
      />

      {/* Error States */}
      {!syncStatus.isOnline && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Offline Mode</AlertTitle>
          <AlertDescription>
            You're currently offline. Data will be synced when connection is
            restored.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};
