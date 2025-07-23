/**
 * PWA TYPE DEFINITIONS - PHASE 4B
 *
 * Comprehensive TypeScript definitions for all PWA components
 * providing type safety and development experience enhancements.
 *
 * @author STR Certified Engineering Team
 * @version 4.0.0 - Phase 4B Elite PWA Implementation
 */

// ========================================
// CORE PWA STATUS TYPES
// ========================================

export interface PWAStatus {
  isSupported: boolean;
  isInstalled: boolean;
  isInstallable: boolean;
  isServiceWorkerSupported: boolean;
  isOfflineCapable: boolean;
  installPromptEvent?: BeforeInstallPromptEvent;
  version: string;
  lastUpdate: number;
}

export interface InstallPromptState {
  isAvailable: boolean;
  hasBeenDismissed: boolean;
  isInstalling: boolean;
  installationMethod: "native" | "manual" | "unsupported";
  lastShown?: number;
  dismissalCount: number;
  userEngagementScore: number;
}

export interface OfflineStatus {
  isOnline: boolean;
  connectionType: "wifi" | "cellular" | "ethernet" | "other" | "unknown";
  effectiveType: "slow-2g" | "2g" | "3g" | "4g" | "unknown";
  downlink: number;
  rtt: number;
  saveData: boolean;
  lastOnlineAt?: number;
  lastOfflineAt?: number;
}

export interface SyncStatus {
  isEnabled: boolean;
  activeQueues: string[];
  pendingTasks: number;
  lastSyncAt?: number;
  syncFailures: number;
  isProcessing: boolean;
  networkOptimized: boolean;
}

// ========================================
// BACKGROUND SYNC TYPES
// ========================================

export interface BackgroundSyncStatus {
  isSupported: boolean;
  isRegistered: boolean;
  registeredTags: string[];
  pendingSyncs: number;
  lastSyncTime?: number;
  syncInProgress: boolean;
  failedSyncs: number;
  circuitBreakerOpen: boolean;
}

export interface SyncQueueInfo {
  queueName: string;
  taskCount: number;
  priority: "immediate" | "high" | "normal" | "low";
  lastProcessed?: number;
  failureCount: number;
  isProcessing: boolean;
}

// ========================================
// PUSH NOTIFICATION TYPES
// ========================================

export interface PushNotificationStatus {
  isSupported: boolean;
  permission: NotificationPermission;
  isSubscribed: boolean;
  hasVapidKey: boolean;
  subscriptionEndpoint?: string;
  lastNotificationAt?: number;
  notificationCount: number;
  clickRate: number;
  dismissalRate: number;
}

export interface NotificationMetrics {
  totalSent: number;
  delivered: number;
  clicked: number;
  dismissed: number;
  failed: number;
  deliveryRate: number;
  clickRate: number;
  averageLatency: number;
}

// ========================================
// NETWORK & PERFORMANCE TYPES
// ========================================

export interface NetworkQuality {
  type: "excellent" | "good" | "fair" | "poor" | "offline";
  speed: "fast" | "moderate" | "slow" | "very-slow";
  latency: "low" | "medium" | "high" | "very-high";
  reliability: "stable" | "unstable" | "intermittent";
  measuredAt: number;
}

export interface BatteryStatus {
  level: number; // 0-100
  isCharging: boolean;
  chargingTime?: number;
  dischargingTime?: number;
  isLowBattery: boolean;
  batteryOptimizedMode: boolean;
}

// ========================================
// INSPECTION WORKFLOW TYPES
// ========================================

export interface InspectionItem {
  id: string;
  title: string;
  description?: string;
  category: "exterior" | "interior" | "safety" | "amenities" | "documentation";
  required: boolean;
  completed: boolean;
  mediaRequired: boolean;
  mediaIds: string[];
  notes: string;
  timestamp?: number;
  gpsLocation?: { lat: number; lng: number };
  offlineCreated: boolean;
  syncStatus: "pending" | "syncing" | "synced" | "failed";
}

export interface OfflineInspection {
  id: string;
  propertyId: string;
  propertyName: string;
  inspectorId: string;
  status: "draft" | "in_progress" | "completed" | "syncing" | "error";
  currentStep: number;
  items: InspectionItem[];
  startTime: number;
  lastModified: number;
  totalProgress: number;
  syncPriority: "immediate" | "high" | "normal";
  batteryOptimized: boolean;
  offlineMode: boolean;
  dataVersion: number;
}

// ========================================
// MEDIA CAPTURE TYPES
// ========================================

export interface MediaCaptureOptions {
  type: "photo" | "video" | "audio";
  quality: "high" | "medium" | "low";
  maxSize?: number;
  compression: boolean;
  watermark?: boolean;
  geotagging: boolean;
  timestamp: boolean;
}

export interface MediaFile {
  id: string;
  type: "image" | "video" | "audio";
  filename: string;
  size: number;
  mimeType: string;
  blob: Blob;
  url?: string;
  thumbnail?: string;
  metadata: {
    capturedAt: number;
    location?: { lat: number; lng: number };
    deviceInfo: string;
    compressed: boolean;
    originalSize?: number;
  };
  uploadStatus: "pending" | "uploading" | "uploaded" | "failed";
  uploadProgress?: number;
}

// ========================================
// DEVICE & CAPABILITY TYPES
// ========================================

export interface DeviceCapabilities {
  hasCamera: boolean;
  hasMicrophone: boolean;
  hasGeolocation: boolean;
  hasVibration: boolean;
  hasNotifications: boolean;
  hasBackgroundSync: boolean;
  hasPushMessaging: boolean;
  hasServiceWorkers: boolean;
  hasIndexedDB: boolean;
  hasWebGL: boolean;
  isTouchDevice: boolean;
  isStandalone: boolean;
  platform: "ios" | "android" | "desktop" | "unknown";
  browserEngine: "webkit" | "blink" | "gecko" | "unknown";
}

export interface PerformanceMetrics {
  memoryUsage?: number;
  storageUsage: number;
  storageQuota: number;
  loadTime: number;
  renderTime: number;
  cacheHitRate: number;
  networkRequests: number;
  errorRate: number;
}

// ========================================
// EVENT & HOOK TYPES
// ========================================

export interface PWAEvent {
  type: "install" | "update" | "offline" | "online" | "sync" | "notification";
  timestamp: number;
  data?: any;
}

export interface PWAHookResult<T> {
  data: T;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export interface SyncHookActions {
  queueSync: (
    data: any,
    priority?: "immediate" | "high" | "normal" | "low",
  ) => Promise<string>;
  triggerSync: (queueName?: string) => Promise<void>;
  clearQueue: (queueName: string) => Promise<void>;
  getQueueStatus: (queueName?: string) => SyncQueueInfo | SyncQueueInfo[];
}

export interface NotificationHookActions {
  requestPermission: () => Promise<NotificationPermission>;
  sendNotification: (notification: Partial<Notification>) => Promise<void>;
  subscribeToUpdates: () => Promise<boolean>;
  unsubscribe: () => Promise<void>;
  getMetrics: () => NotificationMetrics;
}

// ========================================
// CONFIGURATION TYPES
// ========================================

export interface PWAConfig {
  enableOfflineMode: boolean;
  enableBackgroundSync: boolean;
  enablePushNotifications: boolean;
  enableInstallPrompt: boolean;
  cacheStrategy:
    | "cache-first"
    | "network-first"
    | "cache-only"
    | "network-only";
  syncBatchSize: number;
  syncInterval: number;
  maxRetries: number;
  notificationBadging: boolean;
  constructionSiteMode: boolean;
  batteryOptimization: boolean;
}

export interface ServiceWorkerConfig {
  scope: string;
  updateViaCache: "imports" | "all" | "none";
  skipWaiting: boolean;
  clientsClaim: boolean;
  cacheNames: {
    static: string;
    dynamic: string;
    media: string;
  };
  cacheExpiration: {
    maxEntries: number;
    maxAgeSeconds: number;
  };
}

// ========================================
// ERROR & RECOVERY TYPES
// ========================================

export interface PWAError {
  code: string;
  message: string;
  component:
    | "service-worker"
    | "sync"
    | "notifications"
    | "install"
    | "offline";
  severity: "low" | "medium" | "high" | "critical";
  timestamp: number;
  recoverable: boolean;
  context?: any;
}

export interface RecoveryStrategy {
  type: "retry" | "fallback" | "cache" | "offline" | "user-action";
  description: string;
  execute: () => Promise<boolean>;
}

// ========================================
// BROWSER COMPATIBILITY TYPES
// ========================================

export interface BrowserSupport {
  serviceWorkers: boolean;
  pushNotifications: boolean;
  backgroundSync: boolean;
  installPrompt: boolean;
  manifestV3: boolean;
  webShare: boolean;
  fileSystemAccess: boolean;
  badgingAPI: boolean;
  webLocks: boolean;
  broadcastChannel: boolean;
}

// ========================================
// ANALYTICS & MONITORING TYPES
// ========================================

export interface PWAAnalytics {
  installEvents: number;
  uninstallEvents: number;
  offlineUsage: number;
  syncOperations: number;
  notificationsSent: number;
  errors: PWAError[];
  performanceMetrics: PerformanceMetrics;
  userEngagement: {
    sessionsStarted: number;
    timeSpentOffline: number;
    featuresUsed: string[];
  };
}

// ========================================
// UTILITY TYPES
// ========================================

export type PWAState =
  | "installing"
  | "installed"
  | "updating"
  | "ready"
  | "error";
export type SyncState = "idle" | "syncing" | "error" | "paused";
export type ConnectionState = "online" | "offline" | "slow" | "unstable";
export type InstallState =
  | "not-available"
  | "available"
  | "installing"
  | "installed"
  | "failed";

// ========================================
// LEGACY BROWSER DEFINITIONS
// ========================================

declare global {
  interface Window {
    __PWA_STATUS__?: PWAStatus;
    __BACKGROUND_SYNC_MANAGER__?: any;
    __PUSH_NOTIFICATION_MANAGER__?: any;
    __UNIFIED_SYSTEM_STATUS__?: any;
  }

  interface BeforeInstallPromptEvent extends Event {
    platforms: string[];
    userChoice: Promise<{
      outcome: "accepted" | "dismissed";
      platform: string;
    }>;
    prompt(): Promise<void>;
  }

  interface Navigator {
    standalone?: boolean;
    getBattery?: () => Promise<any>;
    connection?: any;
    serviceWorker: ServiceWorkerContainer;
  }
}

export default PWAStatus;
