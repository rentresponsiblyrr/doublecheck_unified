/**
 * INSPECTION TYPES - EXTRACTED FROM GOD COMPONENT
 *
 * Professional type definitions for offline inspection workflow.
 * Clean separation of concerns for maintainable architecture.
 *
 * @author STR Certified Engineering Team
 */

export interface InspectionItem {
  id: string;
  propertyId: string;
  title: string;
  description: string;
  category: string;
  required: boolean;
  evidenceType: "photo" | "video" | "text" | "checklist";
  status: "pending" | "in_progress" | "completed" | "failed" | "not_applicable";
  evidence?: {
    photos?: File[];
    videos?: File[];
    notes?: string;
    timestamp?: number;
  };
  priority: "critical" | "high" | "medium" | "low";
  offlineCapable: boolean;
}

export interface OfflineInspection {
  id: string;
  propertyId: string;
  propertyName: string;
  inspectorId: string;
  startTime: number;
  lastModified: number;
  status: "draft" | "in_progress" | "completed" | "syncing" | "error";
  items: InspectionItem[];
  progress: {
    total: number;
    completed: number;
    percentage: number;
  };
  metadata: {
    version: string;
    deviceInfo: Record<string, unknown>;
    networkCondition: string;
    batteryLevel?: number;
  };
  syncStatus: {
    lastSync: number;
    pendingChanges: boolean;
    conflictsDetected: boolean;
    retryCount: number;
  };
}

export interface OfflineWorkflowState {
  inspection: OfflineInspection | null;
  currentItem: InspectionItem | null;
  isLoading: boolean;
  error: string | null;
  syncInProgress: boolean;
  networkStatus: "online" | "offline" | "unstable";
}

export interface OfflineInspectionWorkflowProps {
  propertyId: string;
  propertyName: string;
  inspectorId: string;
  onComplete?: (inspection: OfflineInspection) => void;
  onError?: (error: Error) => void;
  autoSync?: boolean;
  enableOfflineMode?: boolean;
}
