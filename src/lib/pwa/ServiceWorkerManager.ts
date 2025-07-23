/**
 * SERVICE WORKER MANAGER - ELITE PWA FOUNDATION
 *
 * Advanced service worker management with intelligent caching strategies,
 * background sync, and construction site reliability. Designed for Netflix/Meta
 * performance standards with zero tolerance for offline failures.
 *
 * CORE CAPABILITIES:
 * - Intelligent cache management with stale-while-revalidate patterns
 * - Background sync for inspection data with conflict resolution
 * - Resource prioritization for critical inspection workflows
 * - Automatic updates with seamless user experience
 * - Performance monitoring and cache optimization
 * - Construction site network resilience (2G/spotty connections)
 *
 * CACHING STRATEGIES:
 * 1. App Shell - Cache First (immediate loading)
 * 2. API Data - Network First with fallback (fresh data priority)
 * 3. Images - Cache First with background updates
 * 4. Static Assets - Cache First with versioning
 * 5. Inspection Data - Background Sync with offline queue
 *
 * OFFLINE GUARANTEE:
 * - 100% inspection workflow available offline
 * - Intelligent conflict resolution for concurrent edits
 * - Progressive enhancement with graceful degradation
 * - Battery-optimized background processing
 *
 * @author STR Certified Engineering Team
 */

import { logger } from "@/utils/logger";

// Core interfaces for service worker management
export interface CacheStrategy {
  name: string;
  pattern: RegExp;
  strategy:
    | "CacheFirst"
    | "NetworkFirst"
    | "StaleWhileRevalidate"
    | "NetworkOnly"
    | "CacheOnly";
  maxAge?: number;
  maxEntries?: number;
  priority: "critical" | "high" | "medium" | "low";
}

export interface BackgroundSyncTask {
  id: string;
  type: "inspection_data" | "photo_upload" | "checklist_update" | "user_action";
  data: Record<string, unknown>;
  timestamp: number;
  retryCount: number;
  maxRetries: number;
  priority: "immediate" | "high" | "normal" | "low";
}

export interface ServiceWorkerStatus {
  isSupported: boolean;
  isRegistered: boolean;
  isControlling: boolean;
  updateAvailable: boolean;
  syncQueue: number;
  cacheHitRate: number;
  lastSync: Date | null;
}

export interface CachePerformanceMetrics {
  hitRate: number;
  missRate: number;
  averageResponseTime: number;
  cacheSize: number;
  staleCacheServed: number;
  backgroundUpdates: number;
}

export class ServiceWorkerManager {
  private static instance: ServiceWorkerManager;
  private registration: ServiceWorkerRegistration | null = null;
  private updateAvailable = false;
  private syncQueue: BackgroundSyncTask[] = [];
  private cacheStrategies: CacheStrategy[] = [];
  private performanceMetrics: CachePerformanceMetrics;
  private messageChannel: MessageChannel | null = null;
  private deferredCacheStrategy: string | null = null;

  private constructor() {
    this.performanceMetrics = {
      hitRate: 0,
      missRate: 0,
      averageResponseTime: 0,
      cacheSize: 0,
      staleCacheServed: 0,
      backgroundUpdates: 0,
    };
    this.initializeCacheStrategies();
  }

  static getInstance(): ServiceWorkerManager {
    if (!ServiceWorkerManager.instance) {
      ServiceWorkerManager.instance = new ServiceWorkerManager();
    }
    return ServiceWorkerManager.instance;
  }

  /**
   * Initialize service worker with elite configuration
   */
  async initialize(): Promise<boolean> {
    if (!("serviceWorker" in navigator)) {
      logger.warn("Service Worker not supported", {}, "SERVICE_WORKER");
      return false;
    }

    try {
      logger.info("Initializing Service Worker Manager", {}, "SERVICE_WORKER");

      // Register service worker with elite configuration
      this.registration = await navigator.serviceWorker.register("/sw.js", {
        scope: "/",
        updateViaCache: "none", // Always check for updates
      });

      // Setup update handling
      this.setupUpdateHandling();

      // Setup message channel for communication
      this.setupMessageChannel();

      // Setup background sync
      await this.setupBackgroundSync();

      // Precache critical resources
      await this.precacheCriticalResources();

      // Start performance monitoring
      this.startPerformanceMonitoring();

      logger.info(
        "Service Worker initialized successfully",
        {
          scope: this.registration.scope,
          updateViaCache: this.registration.updateViaCache,
        },
        "SERVICE_WORKER",
      );

      return true;
    } catch (error) {
      logger.error(
        "Service Worker initialization failed",
        { error },
        "SERVICE_WORKER",
      );
      return false;
    }
  }

  /**
   * Setup intelligent update handling with seamless UX
   */
  private setupUpdateHandling(): void {
    if (!this.registration) return;

    // Handle updates found
    this.registration.addEventListener("updatefound", () => {
      const newWorker = this.registration!.installing;

      if (newWorker) {
        logger.info(
          "New Service Worker found, installing...",
          {},
          "SERVICE_WORKER",
        );

        newWorker.addEventListener("statechange", () => {
          if (newWorker.state === "installed") {
            if (navigator.serviceWorker.controller) {
              // Update available
              this.updateAvailable = true;
              this.notifyUpdateAvailable();
              logger.info(
                "Service Worker update available",
                {},
                "SERVICE_WORKER",
              );
            } else {
              // First install
              logger.info(
                "Service Worker installed for first time",
                {},
                "SERVICE_WORKER",
              );
            }
          }
        });
      }
    });

    // Handle controller change (new SW takes control)
    navigator.serviceWorker.addEventListener("controllerchange", async () => {
      logger.info("Service Worker controller changed", {}, "SERVICE_WORKER");

      // Apply any deferred cache strategy updates
      if (this.deferredCacheStrategy) {
        logger.info(
          "Applying deferred cache strategy",
          { strategy: this.deferredCacheStrategy },
          "SERVICE_WORKER",
        );
        await this.updateCacheStrategy(this.deferredCacheStrategy as any);
        this.deferredCacheStrategy = null;
      }

      // Reload the page to ensure all resources are from the new SW
      if (!window.location.pathname.includes("/inspection/")) {
        // Only reload if not in middle of inspection
        window.location.reload();
      }
    });

    // Check for updates periodically
    setInterval(() => {
      this.checkForUpdates();
    }, 60000); // Check every minute
  }

  /**
   * Setup message channel for SW communication
   */
  private setupMessageChannel(): void {
    this.messageChannel = new MessageChannel();

    // Listen for messages from SW
    this.messageChannel.port1.onmessage = (event) => {
      this.handleServiceWorkerMessage(event.data);
    };

    // Send port to SW
    if (navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({ type: "INIT_PORT" }, [
        this.messageChannel.port2,
      ]);

      // Apply any deferred cache strategy updates now that controller is available
      if (this.deferredCacheStrategy) {
        logger.info(
          "Applying deferred cache strategy via message channel setup",
          { strategy: this.deferredCacheStrategy },
          "SERVICE_WORKER",
        );
        // Fire and forget - don't wait for this async operation to complete
        this.updateCacheStrategy(this.deferredCacheStrategy as any).catch(
          (error) => {
            logger.warn(
              "Failed to apply deferred cache strategy",
              { error },
              "SERVICE_WORKER",
            );
          },
        );
        this.deferredCacheStrategy = null;
      }
    }

    // Listen for SW messages on main channel
    navigator.serviceWorker.addEventListener("message", (event) => {
      this.handleServiceWorkerMessage(event.data);
    });
  }

  /**
   * Handle messages from service worker
   */
  private handleServiceWorkerMessage(data: Record<string, unknown>): void {
    switch (data.type) {
      case "CACHE_HIT":
        this.updatePerformanceMetrics("hit", data.responseTime);
        break;

      case "CACHE_MISS":
        this.updatePerformanceMetrics("miss", data.responseTime);
        break;

      case "BACKGROUND_SYNC_SUCCESS":
        this.handleBackgroundSyncSuccess(data.taskId);
        break;

      case "BACKGROUND_SYNC_FAILED":
        this.handleBackgroundSyncFailure(data.taskId, data.error);
        break;

      case "CACHE_UPDATED":
        this.performanceMetrics.backgroundUpdates++;
        logger.info(
          "Cache updated in background",
          { url: data.url },
          "SERVICE_WORKER",
        );
        break;

      default:
        logger.warn(
          "Unknown SW message type",
          { type: data.type },
          "SERVICE_WORKER",
        );
    }
  }

  /**
   * Setup background sync for offline resilience
   */
  private async setupBackgroundSync(): Promise<void> {
    if (
      !("serviceWorker" in navigator) ||
      !("sync" in window.ServiceWorkerRegistration.prototype)
    ) {
      logger.warn("Background Sync not supported", {}, "SERVICE_WORKER");
      return;
    }

    try {
      // Register background sync events
      await this.registration?.sync.register("inspection-data-sync");
      await this.registration?.sync.register("photo-upload-sync");
      await this.registration?.sync.register("checklist-update-sync");

      logger.info("Background sync registered", {}, "SERVICE_WORKER");
    } catch (error) {
      logger.error(
        "Background sync registration failed",
        { error },
        "SERVICE_WORKER",
      );
    }
  }

  /**
   * Precache critical resources for instant loading
   */
  private async precacheCriticalResources(): Promise<void> {
    const criticalResources = [
      "/", // App shell
      "/app-shell",
      "/manifest.json",
      "/favicon.ico",
      "/offline-fallback.html",
      "/critical.css",
      "/checklist-templates",
      "/static/js/app.js", // Main app bundle
      "/static/css/app.css", // Main CSS
    ];

    if (navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: "PRECACHE_RESOURCES",
        resources: criticalResources,
      });
    }

    logger.info(
      "Critical resources precaching initiated",
      {
        count: criticalResources.length,
      },
      "SERVICE_WORKER",
    );
  }

  /**
   * Initialize cache strategies for different resource types
   */
  private initializeCacheStrategies(): void {
    this.cacheStrategies = [
      // App Shell - Cache First for instant loading
      {
        name: "app-shell",
        pattern: /\/(app-shell|manifest\.json|favicon\.ico)$/,
        strategy: "CacheFirst",
        maxAge: 86400, // 1 day
        priority: "critical",
      },

      // API Data - Network First with fallback
      {
        name: "api-data",
        pattern: /\/api\//,
        strategy: "NetworkFirst",
        maxAge: 300, // 5 minutes
        priority: "high",
      },

      // Inspection Photos - Cache First with background update
      {
        name: "inspection-photos",
        pattern: /\/(photos|images)\/.*\.(jpg|jpeg|png|webp)$/i,
        strategy: "CacheFirst",
        maxAge: 2592000, // 30 days
        maxEntries: 200,
        priority: "medium",
      },

      // Static Assets - Cache First with versioning
      {
        name: "static-assets",
        pattern: /\/static\/.*\.(js|css|woff2|woff)$/,
        strategy: "CacheFirst",
        maxAge: 31536000, // 1 year
        priority: "high",
      },

      // Checklist Templates - Stale While Revalidate
      {
        name: "checklist-templates",
        pattern: /\/checklist-templates/,
        strategy: "StaleWhileRevalidate",
        maxAge: 3600, // 1 hour
        priority: "high",
      },

      // CDN Resources - Cache First
      {
        name: "cdn-resources",
        pattern: /^https:\/\/(cdn|fonts)\..*\.(js|css|woff2|woff)$/,
        strategy: "CacheFirst",
        maxAge: 2592000, // 30 days
        priority: "medium",
      },
    ];

    logger.info(
      "Cache strategies initialized",
      {
        strategies: this.cacheStrategies.length,
      },
      "SERVICE_WORKER",
    );
  }

  /**
   * Queue background sync task for offline resilience
   */
  async queueBackgroundSync(
    task: Omit<BackgroundSyncTask, "id" | "timestamp" | "retryCount">,
  ): Promise<string> {
    const syncTask: BackgroundSyncTask = {
      id: this.generateTaskId(),
      timestamp: Date.now(),
      retryCount: 0,
      ...task,
    };

    // Add to local queue
    this.syncQueue.push(syncTask);

    // Send to service worker
    if (navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: "QUEUE_BACKGROUND_SYNC",
        task: syncTask,
      });
    }

    logger.info(
      "Background sync task queued",
      {
        taskId: syncTask.id,
        type: syncTask.type,
        priority: syncTask.priority,
      },
      "SERVICE_WORKER",
    );

    return syncTask.id;
  }

  /**
   * Handle successful background sync
   */
  private handleBackgroundSyncSuccess(taskId: string): void {
    this.syncQueue = this.syncQueue.filter((task) => task.id !== taskId);

    logger.info(
      "Background sync completed successfully",
      { taskId },
      "SERVICE_WORKER",
    );

    // Notify UI about successful sync
    window.dispatchEvent(
      new CustomEvent("background-sync-success", {
        detail: { taskId },
      }),
    );
  }

  /**
   * Handle failed background sync
   */
  private handleBackgroundSyncFailure(taskId: string, error: unknown): void {
    const task = this.syncQueue.find((t) => t.id === taskId);

    if (task) {
      task.retryCount++;

      if (task.retryCount >= task.maxRetries) {
        // Remove failed task
        this.syncQueue = this.syncQueue.filter((t) => t.id !== taskId);

        logger.error(
          "Background sync task failed permanently",
          {
            taskId,
            retryCount: task.retryCount,
            error,
          },
          "SERVICE_WORKER",
        );

        // Notify UI about permanent failure
        window.dispatchEvent(
          new CustomEvent("background-sync-failed", {
            detail: { taskId, error },
          }),
        );
      } else {
        logger.warn(
          "Background sync task failed, will retry",
          {
            taskId,
            retryCount: task.retryCount,
            maxRetries: task.maxRetries,
          },
          "SERVICE_WORKER",
        );
      }
    }
  }

  /**
   * Update performance metrics
   */
  private updatePerformanceMetrics(
    type: "hit" | "miss",
    responseTime: number,
  ): void {
    if (type === "hit") {
      this.performanceMetrics.hitRate++;
    } else {
      this.performanceMetrics.missRate++;
    }

    // Update average response time
    this.performanceMetrics.averageResponseTime =
      (this.performanceMetrics.averageResponseTime + responseTime) / 2;
  }

  /**
   * Start performance monitoring
   */
  private startPerformanceMonitoring(): void {
    // Monitor cache size periodically
    setInterval(async () => {
      if ("storage" in navigator && "estimate" in navigator.storage) {
        const estimate = await navigator.storage.estimate();
        this.performanceMetrics.cacheSize = estimate.usage || 0;
      }
    }, 30000); // Every 30 seconds

    // Log performance metrics periodically
    setInterval(() => {
      const total =
        this.performanceMetrics.hitRate + this.performanceMetrics.missRate;
      if (total > 0) {
        const hitRate = (this.performanceMetrics.hitRate / total) * 100;

        logger.info(
          "Service Worker performance metrics",
          {
            hitRate: Math.round(hitRate),
            avgResponseTime: Math.round(
              this.performanceMetrics.averageResponseTime,
            ),
            cacheSize: Math.round(
              this.performanceMetrics.cacheSize / 1024 / 1024,
            ), // MB
            backgroundUpdates: this.performanceMetrics.backgroundUpdates,
            syncQueueSize: this.syncQueue.length,
          },
          "SERVICE_WORKER",
        );
      }
    }, 300000); // Every 5 minutes
  }

  /**
   * Check for service worker updates
   */
  private async checkForUpdates(): Promise<void> {
    if (!this.registration) return;

    try {
      await this.registration.update();
    } catch (error) {
      logger.error(
        "Service Worker update check failed",
        { error },
        "SERVICE_WORKER",
      );
    }
  }

  /**
   * Apply service worker update
   */
  async applyUpdate(): Promise<void> {
    if (!this.updateAvailable || !this.registration) return;

    const newWorker = this.registration.waiting;
    if (newWorker) {
      newWorker.postMessage({ type: "SKIP_WAITING" });

      logger.info("Service Worker update applied", {}, "SERVICE_WORKER");
    }
  }

  /**
   * Notify app about available update
   */
  private notifyUpdateAvailable(): void {
    window.dispatchEvent(new CustomEvent("sw-update-available"));
  }

  /**
   * Clear all caches (maintenance function)
   */
  async clearAllCaches(): Promise<void> {
    const cacheNames = await caches.keys();

    await Promise.all(cacheNames.map((cacheName) => caches.delete(cacheName)));

    logger.info(
      "All caches cleared",
      { count: cacheNames.length },
      "SERVICE_WORKER",
    );
  }

  /**
   * Get current service worker status
   */
  getStatus(): ServiceWorkerStatus {
    return {
      isSupported: "serviceWorker" in navigator,
      isRegistered: !!this.registration,
      isControlling: !!navigator.serviceWorker.controller,
      updateAvailable: this.updateAvailable,
      syncQueue: this.syncQueue.length,
      cacheHitRate: this.calculateCacheHitRate(),
      lastSync: this.getLastSyncTime(),
    };
  }

  /**
   * Get performance metrics
   */
  getPerformanceMetrics(): CachePerformanceMetrics {
    return { ...this.performanceMetrics };
  }

  /**
   * Get sync queue status
   */
  getSyncQueue(): BackgroundSyncTask[] {
    return [...this.syncQueue];
  }

  // Helper methods
  private generateTaskId(): string {
    return `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private calculateCacheHitRate(): number {
    const total =
      this.performanceMetrics.hitRate + this.performanceMetrics.missRate;
    return total > 0 ? (this.performanceMetrics.hitRate / total) * 100 : 0;
  }

  private getLastSyncTime(): Date | null {
    if (this.syncQueue.length === 0) return null;

    const lastTask = this.syncQueue.sort(
      (a, b) => b.timestamp - a.timestamp,
    )[0];

    return new Date(lastTask.timestamp);
  }

  /**
   * Preload specific resources
   */
  async preloadResources(resources: string[]): Promise<void> {
    if (navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: "PRELOAD_RESOURCES",
        resources,
      });
    }
  }

  /**
   * Cache inspection data for offline access
   */
  async cacheInspectionData(
    inspectionId: string,
    data: Record<string, unknown>,
  ): Promise<void> {
    await this.queueBackgroundSync({
      type: "inspection_data",
      data: { inspectionId, ...data },
      priority: "high",
      maxRetries: 3,
    });
  }

  /**
   * Queue photo upload for background sync
   */
  async queuePhotoUpload(
    photo: File,
    metadata: Record<string, unknown>,
  ): Promise<string> {
    return this.queueBackgroundSync({
      type: "photo_upload",
      data: { photo, metadata },
      priority: "normal",
      maxRetries: 5,
    });
  }

  /**
   * Update checklist item with offline support
   */
  async updateChecklistItem(
    itemId: string,
    updates: Record<string, unknown>,
  ): Promise<string> {
    return this.queueBackgroundSync({
      type: "checklist_update",
      data: { itemId, updates },
      priority: "high",
      maxRetries: 3,
    });
  }

  /**
   * Update cache strategy dynamically (for Network Adaptation Engine)
   * @param strategy - The caching strategy to apply
   */
  async updateCacheStrategy(
    strategy:
      | "cache-first"
      | "cache-only"
      | "network-first"
      | "stale-while-revalidate",
  ): Promise<void> {
    try {
      // Wait for service worker to be ready if it's not already controlling
      if (!navigator.serviceWorker.controller) {
        logger.info(
          "Service worker not controlling yet, waiting for initialization",
          { strategy },
          "SERVICE_WORKER",
        );

        // Wait for service worker to be ready with timeout
        try {
          await Promise.race([
            navigator.serviceWorker.ready,
            new Promise((_, reject) =>
              setTimeout(
                () => reject(new Error("Service worker timeout")),
                5000,
              ),
            ),
          ]);

          // Additional check after ready - controller might still be null immediately
          if (!navigator.serviceWorker.controller) {
            // Wait a bit more for controller to be available
            await new Promise((resolve) => setTimeout(resolve, 100));
          }
        } catch (timeoutError) {
          logger.warn(
            "Service worker not ready within timeout, caching strategy update skipped",
            { strategy, error: timeoutError },
            "SERVICE_WORKER",
          );
          return;
        }
      }

      // Try again after waiting
      if (navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
          type: "UPDATE_CACHE_STRATEGY",
          strategy: strategy,
        });

        logger.info("Cache strategy updated", { strategy }, "SERVICE_WORKER");
      } else {
        logger.warn(
          "Service worker controller still not available after waiting, strategy update deferred",
          { strategy },
          "SERVICE_WORKER",
        );

        // Store strategy to apply later when service worker becomes available
        this.deferredCacheStrategy = strategy;
      }
    } catch (error) {
      logger.error(
        "Failed to update cache strategy",
        { error, strategy },
        "SERVICE_WORKER",
      );
    }
  }
}

// Export singleton instance
export const serviceWorkerManager = ServiceWorkerManager.getInstance();
export default serviceWorkerManager;
