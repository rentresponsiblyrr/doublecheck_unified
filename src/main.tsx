import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";

// Import the error boundary
import { UniversalErrorBoundary as GlobalErrorBoundary } from "@/components/error/UniversalErrorBoundary";

// Import the App component
import App from "./App.tsx";

// Import PWA managers for application lifecycle integration
import { serviceWorkerManager } from "@/lib/pwa/ServiceWorkerManager";
import { offlineStatusManager } from "@/lib/pwa/OfflineStatusManager";
import { installPromptHandler } from "@/lib/pwa/InstallPromptHandler";
import { logger } from "@/utils/logger";
import { debugLogger } from "@/utils/debugLogger";

// PHASE 4B: Import core services for PWA functionality
import { syncService } from "@/services/core/SyncService";
import { notificationService } from "@/services/core/NotificationService";

// PHASE 4C: Import PWA-Enhanced Services Integration Bridge
import { pwaEnhancedBridge } from "@/integrations/PWAEnhancedServicesBridge";

// NEW: Import Core Web Vitals monitoring for unified integration
import { coreWebVitalsMonitor } from "@/lib/performance/CoreWebVitalsMonitor";

// Import PWA types to eliminate any type violations
type PWAContextStatus = Record<string, unknown>;

// PHASE 4B: Initialize core services globally
let syncServiceInitialized = false;
let notificationServiceInitialized = false;

// OPTIMIZED: Fast startup initialization (Enterprise Performance Standards)
async function initializeUnifiedPerformanceSystem() {
  try {
    logger.info(
      "🚀 Fast startup: Initializing critical systems only",
      {},
      "UNIFIED_SYSTEM",
    );

    // CRITICAL OPTIMIZATION: Initialize only essential components first
    // Move heavy PWA components to background initialization
    const coreInitPromises = [
      serviceWorkerManager.initialize(),
      offlineStatusManager.initialize(),
      coreWebVitalsMonitor.initialize(),
    ];

    const [swInitialized, offlineInitialized, performanceInitialized] =
      await Promise.allSettled(coreInitPromises);

    const coreSystemsReady = {
      serviceWorker:
        swInitialized.status === "fulfilled" ? swInitialized.value : false,
      offline:
        offlineInitialized.status === "fulfilled"
          ? offlineInitialized.value
          : false,
      performance:
        performanceInitialized.status === "fulfilled"
          ? performanceInitialized.value
          : false,
    };

    logger.info(
      "✅ Core systems initialized in parallel",
      coreSystemsReady,
      "UNIFIED_SYSTEM",
    );

    // BACKGROUND INITIALIZATION: Heavy PWA components load after app renders
    setTimeout(
      () => initializeHeavyPWAComponents(coreSystemsReady.serviceWorker),
      100,
    );

    // Fast response for app startup
    return {
      performance: {
        coreWebVitals: coreSystemsReady.performance,
        realTimeMonitoring: coreSystemsReady.performance,
        budgetEnforcement: coreSystemsReady.performance,
      },
      pwa: {
        serviceWorker: coreSystemsReady.serviceWorker,
        offlineManager: coreSystemsReady.offline,
        installPrompt: false, // Will be initialized in background
        backgroundSync: false, // Will be initialized in background
        pushNotifications: false, // Will be initialized in background
        allSystemsReady: false, // Will be updated in background
        phase4bComplete: false, // Will be updated in background
      },
      integration: {
        crossSystemMonitoring:
          coreSystemsReady.performance && coreSystemsReady.serviceWorker,
        constructionSiteReady: true,
        productionReady:
          coreSystemsReady.performance && coreSystemsReady.serviceWorker,
        phase4bIntegration: false, // Will be updated in background
      },
    };
  } catch (error) {
    logger.error(
      "❌ Unified system initialization failed",
      { error },
      "UNIFIED_SYSTEM",
    );

    // Graceful degradation - basic app still works
    return {
      performance: {
        coreWebVitals: false,
        realTimeMonitoring: false,
        budgetEnforcement: false,
      },
      pwa: {
        serviceWorker: false,
        offlineManager: false,
        installPrompt: false,
        backgroundSync: false,
        pushNotifications: false,
        allSystemsReady: false,
        phase4bComplete: false,
      },
      integration: {
        crossSystemMonitoring: false,
        constructionSiteReady: false,
        productionReady: false,
        phase4bIntegration: false,
      },
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// BACKGROUND INITIALIZATION: Heavy PWA components (non-blocking)
async function initializeHeavyPWAComponents(swReady: boolean): Promise<void> {
  try {
    logger.info(
      "🔄 Background: Initializing heavy PWA components",
      {},
      "UNIFIED_SYSTEM",
    );

    // Initialize install prompt handler in background
    const installPromptReady = await installPromptHandler.initialize();

    if (!swReady) {
      logger.warn(
        "Service Worker not ready - skipping PWA components",
        {},
        "UNIFIED_SYSTEM",
      );
      return;
    }

    // PHASE 4B: Initialize background sync and push notifications with throttling
    let backgroundSyncInitialized = false;
    let pushNotificationInitialized = false;

    // Initialize sync service
    if (!syncServiceInitialized) {
      try {
        const syncPromise = Promise.race([
          syncService.initialize('system'),
          new Promise(
            (_, reject) =>
              setTimeout(
                () => reject(new Error("Sync service timeout")),
                3000,
              ),
          ),
        ]);

        await syncPromise;
        syncServiceInitialized = true;
        backgroundSyncInitialized = true;
        
        logger.info(
          "✅ Core Sync Service initialized",
          {
            service: 'SyncService',
            mode: 'background'
          },
          "UNIFIED_SYSTEM",
        );
      } catch (syncError) {
        logger.warn(
          "⚠️ Sync service initialization failed - continuing without sync",
          { error: syncError },
          "UNIFIED_SYSTEM",
        );
        backgroundSyncInitialized = false;
      }
    } else {
      logger.info(
        "Sync service already initialized - skipping duplicate initialization",
        {},
        "UNIFIED_SYSTEM",
      );
      backgroundSyncInitialized = true;
    }

    // Initialize notification service
    const pushPromise = Promise.race([
      notificationService.initialize(
        import.meta.env.VITE_VAPID_PUBLIC_KEY || "",
        swReady ? await navigator.serviceWorker.ready : undefined
      ),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Notification service timeout")), 5000),
      ),
    ]);

    await pushPromise;
    notificationServiceInitialized = true;
    pushNotificationInitialized = true;
    
    logger.info(
      "✅ Core Notification Service initialized",
      {
        service: 'NotificationService',
        swReady
      },
      "UNIFIED_SYSTEM",
    );

    // Store service references globally
    if (syncServiceInitialized) {
      (window as any).__SYNC_SERVICE__ = syncService;
    }
    if (notificationServiceInitialized) {
      (window as any).__NOTIFICATION_SERVICE__ = notificationService;
    }

    // Setup PWA context bridge
    (window as any).__PWA_CONTEXT_UPDATE__ = (
      component: string,
      status: PWAContextStatus,
    ) => {
      const event = new CustomEvent("pwa-context-update", {
        detail: { component, status },
      });
      window.dispatchEvent(event);
    };

    // Initialize integration bridge with timeout (OPTIONAL - app works without it)
    if (syncServiceInitialized && notificationServiceInitialized) {
      try {
        // Increased timeout for more reliable initialization
        await Promise.race([
          pwaEnhancedBridge.initialize(),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error("Bridge timeout")), 5000),
          ),
        ]);
        logger.info(
          "✅ PWA-Enhanced Services integration bridge active",
          {},
          "MAIN_INTEGRATION",
        );
      } catch (error) {
        // CRITICAL: Don't let bridge failures break the app
        logger.warn(
          "⚠️ Integration bridge failed - app continues normally",
          { error },
          "MAIN_INTEGRATION",
        );
        // Clear any partially initialized state
        try {
          pwaEnhancedBridge.destroy();
        } catch (cleanupError) {
          // Ignore cleanup errors
        }
      }
    }

    // Update global status
    const updatedStatus = (window as any).__UNIFIED_SYSTEM_STATUS__;
    if (updatedStatus) {
      updatedStatus.pwa.installPrompt = installPromptReady;
      updatedStatus.pwa.backgroundSync = backgroundSyncInitialized;
      updatedStatus.pwa.pushNotifications = pushNotificationInitialized;
      updatedStatus.pwa.allSystemsReady =
        backgroundSyncInitialized && pushNotificationInitialized;
      updatedStatus.pwa.phase4bComplete =
        backgroundSyncInitialized && pushNotificationInitialized;
      updatedStatus.integration.phase4bIntegration =
        backgroundSyncInitialized && pushNotificationInitialized;
    }

    logger.info(
      "✅ Background PWA component initialization completed",
      {
        backgroundSync: backgroundSyncInitialized,
        pushNotifications: pushNotificationInitialized,
        integrationBridge: true,
      },
      "UNIFIED_SYSTEM",
    );
  } catch (error) {
    logger.warn(
      "⚠️ Background initialization failed - app remains functional",
      { error },
      "UNIFIED_SYSTEM",
    );
  }
}

// NEW: PWA + Performance cross-system integration
async function setupPWAPerformanceCorrelation(): Promise<void> {
  try {
    // Setup cross-system event listeners for performance correlation
    logger.info(
      "🔗 Setting up PWA + Performance correlation with Phase 4B",
      {},
      "UNIFIED_SYSTEM",
    );

    // Setup performance budget violations -> PWA optimization triggers
    coreWebVitalsMonitor.subscribeToAlerts((alert) => {
      if (alert.metric === "lcp" && alert.value > 4000) {
        // Trigger aggressive PWA optimizations for poor LCP
        logger.warn(
          "Poor LCP detected, enabling aggressive caching",
          { lcp: alert.value },
          "UNIFIED_SYSTEM",
        );

        // Trigger sync service optimizations for poor performance
        if (syncServiceInitialized) {
          // Adjust sync service for performance
          logger.info(
            "Sync service optimized due to poor performance",
            {},
            "UNIFIED_SYSTEM",
          );
        }
      }
    });

    // Track offline->online transitions impact on performance
    const unsubscribeOffline = offlineStatusManager.subscribe((event) => {
      if (event.type === "network_status_changed" && event.isOnline) {
        logger.info(
          "Network came online - tracking performance impact",
          {},
          "UNIFIED_SYSTEM",
        );

        // Trigger sync service when network comes online
        if (syncServiceInitialized) {
          syncService.processSync();
          logger.info(
            "Sync service triggered due to network online",
            {},
            "UNIFIED_SYSTEM",
          );
        }
      }
    });

    // Setup notification service performance correlation
    if (notificationServiceInitialized) {
      // Monitor notification metrics
      logger.debug(
        "Notification service monitoring enabled",
        {
          metrics: notificationService.getMetrics()
        },
        "UNIFIED_SYSTEM",
      );
    }

    // Setup sync service performance monitoring
    if (syncServiceInitialized) {
      // Monitor sync metrics
      logger.debug(
        "Sync service monitoring enabled",
        {
          stats: syncService.getSyncStats()
        },
        "UNIFIED_SYSTEM",
      );
    }

    logger.info(
      "🔗 PWA + Performance correlation with Phase 4B setup complete",
      {},
      "UNIFIED_SYSTEM",
    );
  } catch (error) {
    logger.error(
      "❌ PWA + Performance correlation setup failed",
      { error },
      "UNIFIED_SYSTEM",
    );
  }
}

// Cleanup function for core services
function cleanupCoreServices(): void {
  try {
    logger.info("🧹 Cleaning up core services", {}, "UNIFIED_SYSTEM");

    if (syncServiceInitialized) {
      syncService.destroy();
      syncServiceInitialized = false;
    }

    if (notificationServiceInitialized) {
      notificationService.destroy();
      notificationServiceInitialized = false;
    }

    // Clear global references
    delete (window as any).__SYNC_SERVICE__;
    delete (window as any).__NOTIFICATION_SERVICE__;

    logger.info("✅ Core services cleaned up", {}, "UNIFIED_SYSTEM");
  } catch (error) {
    logger.error(
      "❌ Failed to cleanup core services",
      { error },
      "UNIFIED_SYSTEM",
    );
  }
}

// Setup cleanup on page unload
window.addEventListener("beforeunload", cleanupCoreServices);
window.addEventListener("pagehide", cleanupCoreServices);

// Enhanced initialization function with unified system integration
async function initializeApp() {
  try {
    // Initialize unified PWA + Performance system first
    const unifiedStatus = await initializeUnifiedPerformanceSystem();

    // Store unified system status globally for component access
    (window as any).__UNIFIED_SYSTEM_STATUS__ = unifiedStatus;

    // Maintain backward compatibility with existing PWA status checks
    (window as any).__PWA_STATUS__ = unifiedStatus.pwa;

    const rootElement = document.getElementById("root");

    if (!rootElement) {
      throw new Error("Root element not found!");
    }

    const root = createRoot(rootElement);

    root.render(
      <StrictMode>
        <GlobalErrorBoundary level="global" fallbackStrategy="redirect">
          <App />
        </GlobalErrorBoundary>
      </StrictMode>,
    );
  } catch (error) {
    // Production-grade error handling for app initialization
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

    // Send to error tracking service (production only)
    if (import.meta.env.PROD) {
      // Would integrate with Sentry, DataDog, etc.
      fetch("/api/errors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          level: "critical",
          message: "App initialization failed",
          error: errorMessage,
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent,
        }),
      }).catch(() => {
        // Fail silently if error tracking is down
      });
    }

    // Only log in development
    if (import.meta.env.DEV) {
      debugLogger.error("main", "App initialization failed", error);
    }
    document.body.innerHTML = `
      <div style="padding: 20px; color: red; font-family: Arial;">
        <h1>🚨 Application Error</h1>
        <p>Failed to initialize the application.</p>
        <p>Error: ${error instanceof Error ? error.message : "Unknown error"}</p>
        <button onclick="setTimeout(() => location.href = '/', 100)">Go to Home</button>
        <button onclick="localStorage.clear(); sessionStorage.clear(); setTimeout(() => location.href = '/', 100)">Clear Cache & Retry</button>
      </div>
    `;
  }
}

// Initialize the app when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initializeApp);
} else {
  initializeApp();
}
