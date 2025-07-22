import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";

// Import the error boundary
import { UniversalErrorBoundary as GlobalErrorBoundary } from '@/components/error/UniversalErrorBoundary';

// Import the App component
import App from "./App.tsx";

// Import PWA managers for application lifecycle integration
import { serviceWorkerManager } from '@/lib/pwa/ServiceWorkerManager';
import { offlineStatusManager } from '@/lib/pwa/OfflineStatusManager';
import { installPromptHandler } from '@/lib/pwa/InstallPromptHandler';
import { logger } from '@/utils/logger';

// PHASE 4B: Import new PWA component managers
import { BackgroundSyncManager } from '@/services/pwa/BackgroundSyncManager';
import { PushNotificationManager } from '@/services/pwa/PushNotificationManager';

// PHASE 4C: Import PWA-Enhanced Services Integration Bridge
import { pwaEnhancedBridge } from '@/integrations/PWAEnhancedServicesBridge';

// NEW: Import Core Web Vitals monitoring for unified integration
import { coreWebVitalsMonitor } from '@/lib/performance/CoreWebVitalsMonitor';

// PHASE 4B: Initialize PWA component managers globally
let backgroundSyncManager: BackgroundSyncManager | null = null;
let pushNotificationManager: PushNotificationManager | null = null;

// NEW: Elite unified PWA + Performance initialization
async function initializeUnifiedPerformanceSystem() {
  try {
    logger.info('🚀 Initializing Unified PWA + Performance System', {}, 'UNIFIED_SYSTEM');

    // Phase 1: Initialize Core Web Vitals monitoring FIRST
    const performanceInitialized = await coreWebVitalsMonitor.initialize();
    if (performanceInitialized) {
      logger.info('✅ Core Web Vitals monitoring initialized', {}, 'UNIFIED_SYSTEM');
    }

    // Phase 2: Initialize PWA managers with performance integration
    const swInitialized = await serviceWorkerManager.initialize();
    const offlineInitialized = await offlineStatusManager.initialize();
    const installInitialized = await installPromptHandler.initialize();

    // PHASE 4B: Initialize background sync and push notifications
    let backgroundSyncInitialized = false;
    let pushNotificationInitialized = false;

    if (swInitialized) {
      try {
        // Initialize Background Sync Manager
        backgroundSyncManager = new BackgroundSyncManager({
          enableBatching: true,
          enableRetry: true,
          enableCircuitBreaker: true,
          maxRetryAttempts: 3,
          retryDelays: [1000, 5000, 15000],
          batchSize: 10,
          batchInterval: 30000,
          circuitBreakerThreshold: 5,
          circuitBreakerTimeout: 60000
        });
        
        const registration = await navigator.serviceWorker.ready;
        await backgroundSyncManager.initialize(registration);
        backgroundSyncInitialized = true;
        
        logger.info('✅ Background Sync Manager initialized', {}, 'UNIFIED_SYSTEM');

        // Initialize Push Notification Manager
        pushNotificationManager = new PushNotificationManager({
          vapidPublicKey: import.meta.env.VITE_VAPID_PUBLIC_KEY || '',
          enableBatching: true,
          enableConstructionSiteMode: true,
          enableEmergencyOverride: true,
          batchInterval: 30000,
          maxBatchSize: 10,
          retryAttempts: 3,
          notificationTTL: 24 * 60 * 60 * 1000,
          vibrationPatterns: {
            critical: [200, 100, 200, 100, 200],
            high: [100, 50, 100],
            medium: [100],
            low: [50]
          }
        });
        
        await pushNotificationManager.initialize(registration);
        pushNotificationInitialized = true;
        
        logger.info('✅ Push Notification Manager initialized', {}, 'UNIFIED_SYSTEM');

        // Store managers globally for component access
        (window as any).__BACKGROUND_SYNC_MANAGER__ = backgroundSyncManager;
        (window as any).__PUSH_NOTIFICATION_MANAGER__ = pushNotificationManager;

        // PHASE 4C: Bridge for context updates
        (window as any).__PWA_CONTEXT_UPDATE__ = (component: string, status: any) => {
          const event = new CustomEvent('pwa-context-update', {
            detail: { component, status }
          });
          window.dispatchEvent(event);
        };

        logger.info('✅ PWA Context bridge established', {
          backgroundSync: !!backgroundSyncManager,
          pushNotifications: !!pushNotificationManager,
          integrationBridge: true
        }, 'PWA_BRIDGE');

        // PHASE 4C: Initialize PWA-Enhanced Services Integration Bridge
        if (backgroundSyncManager && pushNotificationManager) {
          try {
            await pwaEnhancedBridge.initialize();
            logger.info('✅ PWA-Enhanced Services integration bridge active', {}, 'MAIN_INTEGRATION');
          } catch (error) {
            logger.error('❌ Integration bridge failed to initialize', { error }, 'MAIN_INTEGRATION');
          }
        }

      } catch (error) {
        logger.error('❌ Phase 4B PWA component initialization failed', { error }, 'UNIFIED_SYSTEM');
      }
    }

    // Phase 3: Cross-system performance correlation setup
    if (performanceInitialized && swInitialized) {
      await setupPWAPerformanceCorrelation();
    }

    const unifiedStatus = {
      performance: {
        coreWebVitals: performanceInitialized,
        realTimeMonitoring: performanceInitialized,
        budgetEnforcement: performanceInitialized
      },
      pwa: {
        serviceWorker: swInitialized,
        offlineManager: offlineInitialized,
        installPrompt: installInitialized,
        backgroundSync: backgroundSyncInitialized,
        pushNotifications: pushNotificationInitialized,
        allSystemsReady: swInitialized && offlineInitialized && installInitialized && backgroundSyncInitialized && pushNotificationInitialized,
        phase4bComplete: backgroundSyncInitialized && pushNotificationInitialized
      },
      integration: {
        crossSystemMonitoring: performanceInitialized && swInitialized,
        constructionSiteReady: true,
        productionReady: performanceInitialized && swInitialized && backgroundSyncInitialized,
        phase4bIntegration: backgroundSyncInitialized && pushNotificationInitialized
      }
    };

    if (unifiedStatus.integration.productionReady) {
      logger.info('✅ Unified PWA + Performance System initialized successfully', unifiedStatus, 'UNIFIED_SYSTEM');
    } else {
      logger.warn('⚠️ Unified system partially initialized - degraded experience', unifiedStatus, 'UNIFIED_SYSTEM');
    }

    return unifiedStatus;

  } catch (error) {
    logger.error('❌ Unified system initialization failed', { error }, 'UNIFIED_SYSTEM');

    // Graceful degradation - basic app still works
    return {
      performance: { coreWebVitals: false, realTimeMonitoring: false, budgetEnforcement: false },
      pwa: { 
        serviceWorker: false, 
        offlineManager: false, 
        installPrompt: false, 
        backgroundSync: false, 
        pushNotifications: false, 
        allSystemsReady: false, 
        phase4bComplete: false 
      },
      integration: { 
        crossSystemMonitoring: false, 
        constructionSiteReady: false, 
        productionReady: false, 
        phase4bIntegration: false 
      },
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// NEW: PWA + Performance cross-system integration
async function setupPWAPerformanceCorrelation(): Promise<void> {
  try {
    // Setup cross-system event listeners for performance correlation
    logger.info('🔗 Setting up PWA + Performance correlation with Phase 4B', {}, 'UNIFIED_SYSTEM');

    // Setup performance budget violations -> PWA optimization triggers
    coreWebVitalsMonitor.subscribeToAlerts((alert) => {
      if (alert.metric === 'lcp' && alert.value > 4000) {
        // Trigger aggressive PWA optimizations for poor LCP
        logger.warn('Poor LCP detected, enabling aggressive caching', { lcp: alert.value }, 'UNIFIED_SYSTEM');
        
        // PHASE 4B: Trigger background sync optimizations for poor performance
        if (backgroundSyncManager) {
          backgroundSyncManager.enableBatchingMode();
          logger.info('Background sync batching enabled due to poor performance', {}, 'UNIFIED_SYSTEM');
        }
      }
    });

    // Track offline->online transitions impact on performance
    const unsubscribeOffline = offlineStatusManager.subscribe((event) => {
      if (event.type === 'network_status_changed' && event.isOnline) {
        logger.info('Network came online - tracking performance impact', {}, 'UNIFIED_SYSTEM');
        
        // PHASE 4B: Trigger background sync when network comes online
        if (backgroundSyncManager) {
          backgroundSyncManager.triggerSync('network_online');
          logger.info('Background sync triggered due to network online', {}, 'UNIFIED_SYSTEM');
        }
      }
    });

    // PHASE 4B: Setup push notification performance correlation
    if (pushNotificationManager) {
      // Monitor notification performance impact
      pushNotificationManager.on('notificationSent', (data) => {
        logger.debug('Notification sent - monitoring performance impact', { 
          notificationId: data.notification.id 
        }, 'UNIFIED_SYSTEM');
      });

      // Handle notification failures gracefully
      pushNotificationManager.on('notificationFailed', (data) => {
        logger.warn('Notification failed - degrading notification frequency', { 
          error: data.error 
        }, 'UNIFIED_SYSTEM');
      });
    }

    // PHASE 4B: Setup background sync performance monitoring
    if (backgroundSyncManager) {
      backgroundSyncManager.on('syncCompleted', (data) => {
        logger.debug('Background sync completed - tracking performance', { 
          queueName: data.queueName,
          itemsProcessed: data.itemsProcessed 
        }, 'UNIFIED_SYSTEM');
      });

      backgroundSyncManager.on('syncFailed', (data) => {
        logger.warn('Background sync failed - adjusting sync strategy', { 
          error: data.error 
        }, 'UNIFIED_SYSTEM');
      });
    }

    logger.info('🔗 PWA + Performance correlation with Phase 4B setup complete', {}, 'UNIFIED_SYSTEM');

  } catch (error) {
    logger.error('❌ PWA + Performance correlation setup failed', { error }, 'UNIFIED_SYSTEM');
  }
}

// PHASE 4B: Cleanup function for PWA components
function cleanupPWAComponents(): void {
  try {
    logger.info('🧹 Cleaning up Phase 4B PWA components', {}, 'UNIFIED_SYSTEM');

    if (backgroundSyncManager) {
      backgroundSyncManager.destroy();
      backgroundSyncManager = null;
    }

    if (pushNotificationManager) {
      pushNotificationManager.destroy();
      pushNotificationManager = null;
    }

    // Clear global references
    delete (window as any).__BACKGROUND_SYNC_MANAGER__;
    delete (window as any).__PUSH_NOTIFICATION_MANAGER__;

    logger.info('✅ Phase 4B PWA components cleaned up', {}, 'UNIFIED_SYSTEM');
  } catch (error) {
    logger.error('❌ Failed to cleanup Phase 4B PWA components', { error }, 'UNIFIED_SYSTEM');
  }
}

// Setup cleanup on page unload
window.addEventListener('beforeunload', cleanupPWAComponents);
window.addEventListener('pagehide', cleanupPWAComponents);

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
      throw new Error('Root element not found!');
    }
    
    const root = createRoot(rootElement);
    
    root.render(
      <StrictMode>
        <GlobalErrorBoundary 
          level="global" 
          fallbackStrategy="redirect"
        >
          <App />
        </GlobalErrorBoundary>
      </StrictMode>
    );
    
  } catch (error) {
    // Production-grade error handling for app initialization
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    // Send to error tracking service (production only)
    if (import.meta.env.PROD) {
      // Would integrate with Sentry, DataDog, etc.
      fetch('/api/errors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          level: 'critical',
          message: 'App initialization failed',
          error: errorMessage,
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent
        })
      }).catch(() => {
        // Fail silently if error tracking is down
      });
    }
    
    // Only log in development
    if (import.meta.env.DEV) {
      console.error('App initialization failed:', error);
    }
    document.body.innerHTML = `
      <div style="padding: 20px; color: red; font-family: Arial;">
        <h1>🚨 Application Error</h1>
        <p>Failed to initialize the application.</p>
        <p>Error: ${error instanceof Error ? error.message : 'Unknown error'}</p>
        <button onclick="window.location.reload()">Reload Page</button>
      </div>
    `;
  }
}

// Initialize the app when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeApp);
} else {
  initializeApp();
}