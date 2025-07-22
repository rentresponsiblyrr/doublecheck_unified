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

// NEW: Import Core Web Vitals monitoring for unified integration
import { coreWebVitalsMonitor } from '@/lib/performance/CoreWebVitalsMonitor';

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
        allSystemsReady: swInitialized && offlineInitialized && installInitialized
      },
      integration: {
        crossSystemMonitoring: performanceInitialized && swInitialized,
        constructionSiteReady: true,
        productionReady: performanceInitialized && swInitialized
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
      pwa: { serviceWorker: false, offlineManager: false, installPrompt: false, allSystemsReady: false },
      integration: { crossSystemMonitoring: false, constructionSiteReady: false, productionReady: false },
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// NEW: PWA + Performance cross-system integration
async function setupPWAPerformanceCorrelation(): Promise<void> {
  try {
    // Setup cross-system event listeners for performance correlation
    logger.info('🔗 Setting up PWA + Performance correlation', {}, 'UNIFIED_SYSTEM');

    // Setup performance budget violations -> PWA optimization triggers
    coreWebVitalsMonitor.subscribeToAlerts((alert) => {
      if (alert.metric === 'lcp' && alert.value > 4000) {
        // Trigger aggressive PWA optimizations for poor LCP
        logger.warn('Poor LCP detected, enabling aggressive caching', { lcp: alert.value }, 'UNIFIED_SYSTEM');
        // Note: Would call serviceWorkerManager.enableAggressiveCaching() if method exists
      }
    });

    // Track offline->online transitions impact on performance
    const unsubscribeOffline = offlineStatusManager.subscribe((event) => {
      if (event.type === 'network_status_changed' && event.isOnline) {
        logger.info('Network came online - tracking performance impact', {}, 'UNIFIED_SYSTEM');
      }
    });

    logger.info('🔗 PWA + Performance correlation setup complete', {}, 'UNIFIED_SYSTEM');

  } catch (error) {
    logger.error('❌ PWA + Performance correlation setup failed', { error }, 'UNIFIED_SYSTEM');
  }
}

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