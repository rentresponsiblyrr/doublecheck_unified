import React, { useEffect, useState, useCallback } from 'react';
import { PWAProvider } from '@/contexts/PWAContext';
import { PWAErrorBoundary } from './PWAErrorBoundary';
import { PWAPerformanceMonitor } from './PWAPerformanceMonitor';
import { PWAInstallPrompt } from './PWAInstallPrompt';
import { OfflineInspectionWorkflow } from '@/components/inspection/OfflineInspectionWorkflow';
import { logger } from '@/utils/logger';

interface PWAOrchestrationState {
  isInitialized: boolean;
  isInitializing: boolean;
  initializationProgress: number;
  componentsReady: {
    serviceWorker: boolean;
    backgroundSync: boolean;
    notifications: boolean;
    installPrompt: boolean;
    offlineWorkflow: boolean;
    errorBoundary: boolean;
    performance: boolean;
  };
  errors: string[];
  performanceScore: number;
}

export const PWAIntegrationOrchestrator: React.FC<{
  children: React.ReactNode;
  enablePerformanceMonitoring?: boolean;
  enableInstallPrompt?: boolean;
  enableOfflineWorkflow?: boolean;
}> = ({
  children,
  enablePerformanceMonitoring = true,
  enableInstallPrompt = true,
  enableOfflineWorkflow = true
}) => {
  const [orchestrationState, setOrchestrationState] = useState<PWAOrchestrationState>({
    isInitialized: false,
    isInitializing: false,
    initializationProgress: 0,
    componentsReady: {
      serviceWorker: false,
      backgroundSync: false,
      notifications: false,
      installPrompt: false,
      offlineWorkflow: false,
      errorBoundary: false,
      performance: false
    },
    errors: [],
    performanceScore: 0
  });

  /**
   * PHASE 4C ORCHESTRATION INITIALIZATION
   * Coordinates initialization of all PWA components
   */
  useEffect(() => {
    initializePWAOrchestration();
  }, []);

  const initializePWAOrchestration = useCallback(async () => {
    try {
      logger.info('🚀 Starting PWA Integration Orchestration - Phase 4C', {
        timestamp: Date.now(),
        components: {
          performanceMonitoring: enablePerformanceMonitoring,
          installPrompt: enableInstallPrompt,
          offlineWorkflow: enableOfflineWorkflow
        }
      }, 'PWA_ORCHESTRATOR');

      setOrchestrationState(prev => ({
        ...prev,
        isInitializing: true,
        initializationProgress: 0
      }));

      // Phase 1: Initialize core PWA foundation (20%)
      await initializePWAFoundation();
      updateProgress(20);

      // Phase 2: Initialize service worker and background sync (40%)
      await initializeServiceWorkerSystems();
      updateProgress(40);

      // Phase 3: Initialize notification system (60%)
      await initializeNotificationSystem();
      updateProgress(60);

      // Phase 4: Initialize UI components (80%)
      await initializeUIComponents();
      updateProgress(80);

      // Phase 5: Final integration and health check (100%)
      await performFinalHealthCheck();
      updateProgress(100);

      setOrchestrationState(prev => ({
        ...prev,
        isInitialized: true,
        isInitializing: false
      }));

      logger.info('✅ PWA Integration Orchestration completed successfully', {
        duration: Date.now(),
        componentsReady: orchestrationState.componentsReady,
        performanceScore: orchestrationState.performanceScore
      }, 'PWA_ORCHESTRATOR');

    } catch (error) {
      logger.error('❌ PWA Integration Orchestration failed', {
        error: (error as Error).message,
        stack: (error as Error).stack
      }, 'PWA_ORCHESTRATOR');

      setOrchestrationState(prev => ({
        ...prev,
        isInitializing: false,
        errors: [...prev.errors, (error as Error).message]
      }));
    }
  }, [enablePerformanceMonitoring, enableInstallPrompt, enableOfflineWorkflow]);

  const updateProgress = (progress: number) => {
    setOrchestrationState(prev => ({
      ...prev,
      initializationProgress: progress
    }));
  };

  const initializePWAFoundation = async () => {
    logger.info('Initializing PWA foundation components', {}, 'PWA_ORCHESTRATOR');

    // Check for PWA support
    const pwaSupport = {
      serviceWorker: 'serviceWorker' in navigator,
      manifest: 'manifest' in document.querySelector('link[rel="manifest"]') || false,
      notifications: 'Notification' in window,
      pushManager: 'PushManager' in window,
      backgroundSync: !!(window.ServiceWorkerRegistration && 'sync' in window.ServiceWorkerRegistration.prototype)
    };

    logger.info('PWA support assessment', pwaSupport, 'PWA_ORCHESTRATOR');

    // Initialize error boundary
    setOrchestrationState(prev => ({
      ...prev,
      componentsReady: {
        ...prev.componentsReady,
        errorBoundary: true
      }
    }));

    if (!pwaSupport.serviceWorker) {
      throw new Error('Service Worker not supported - PWA features unavailable');
    }
  };

  const initializeServiceWorkerSystems = async () => {
    logger.info('Initializing Service Worker systems', {}, 'PWA_ORCHESTRATOR');

    try {
      // Get existing managers from global scope
      const backgroundSyncManager = (window as any).__BACKGROUND_SYNC_MANAGER__;
      const pushNotificationManager = (window as any).__PUSH_NOTIFICATION_MANAGER__;

      if (!backgroundSyncManager) {
        throw new Error('Background Sync Manager not initialized');
      }

      if (!pushNotificationManager) {
        throw new Error('Push Notification Manager not initialized');
      }

      // Verify service worker status
      const registration = await navigator.serviceWorker.ready;
      if (!registration.active) {
        throw new Error('Service Worker not active');
      }

      setOrchestrationState(prev => ({
        ...prev,
        componentsReady: {
          ...prev.componentsReady,
          serviceWorker: true,
          backgroundSync: true
        }
      }));

      logger.info('Service Worker systems initialized successfully', {
        registration: !!registration,
        backgroundSync: !!backgroundSyncManager,
        pushNotifications: !!pushNotificationManager
      }, 'PWA_ORCHESTRATOR');

    } catch (error) {
      logger.error('Service Worker systems initialization failed', { error }, 'PWA_ORCHESTRATOR');
      throw error;
    }
  };

  const initializeNotificationSystem = async () => {
    logger.info('Initializing notification system', {}, 'PWA_ORCHESTRATOR');

    try {
      const pushManager = (window as any).__PUSH_NOTIFICATION_MANAGER__;

      if (pushManager) {
        // Test notification system
        const permission = await pushManager.requestPermission?.() || Notification.permission;

        setOrchestrationState(prev => ({
          ...prev,
          componentsReady: {
            ...prev.componentsReady,
            notifications: permission === 'granted' || permission === 'default'
          }
        }));

        logger.info('Notification system initialized', { permission }, 'PWA_ORCHESTRATOR');
      }

    } catch (error) {
      logger.warn('Notification system initialization failed', { error }, 'PWA_ORCHESTRATOR');
      // Don't throw - notifications are not critical for basic PWA functionality
    }
  };

  const initializeUIComponents = async () => {
    logger.info('Initializing PWA UI components', {}, 'PWA_ORCHESTRATOR');

    // Install prompt component
    if (enableInstallPrompt) {
      setOrchestrationState(prev => ({
        ...prev,
        componentsReady: {
          ...prev.componentsReady,
          installPrompt: true
        }
      }));
    }

    // Offline workflow component
    if (enableOfflineWorkflow) {
      setOrchestrationState(prev => ({
        ...prev,
        componentsReady: {
          ...prev.componentsReady,
          offlineWorkflow: true
        }
      }));
    }

    // Performance monitoring
    if (enablePerformanceMonitoring) {
      setOrchestrationState(prev => ({
        ...prev,
        componentsReady: {
          ...prev.componentsReady,
          performance: true
        }
      }));
    }
  };

  const performFinalHealthCheck = async () => {
    logger.info('Performing final PWA health check', {}, 'PWA_ORCHESTRATOR');

    const healthScore = calculateHealthScore();

    setOrchestrationState(prev => ({
      ...prev,
      performanceScore: healthScore
    }));

    if (healthScore < 75) {
      logger.warn('PWA health score below threshold', {
        score: healthScore,
        components: orchestrationState.componentsReady
      }, 'PWA_ORCHESTRATOR');
    }

    // Send initialization metrics
    try {
      await fetch('/api/pwa/initialization', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          healthScore,
          componentsReady: orchestrationState.componentsReady,
          initializationTime: Date.now(),
          userAgent: navigator.userAgent,
          url: window.location.href
        })
      });
    } catch (error) {
      logger.warn('Failed to send initialization metrics', { error }, 'PWA_ORCHESTRATOR');
    }
  };

  const calculateHealthScore = (): number => {
    const components = orchestrationState.componentsReady;
    const totalComponents = Object.keys(components).length;
    const readyComponents = Object.values(components).filter(Boolean).length;

    const baseScore = (readyComponents / totalComponents) * 100;

    // Bonus points for critical components
    let bonusScore = 0;
    if (components.serviceWorker) bonusScore += 10;
    if (components.backgroundSync) bonusScore += 10;
    if (components.errorBoundary) bonusScore += 5;

    return Math.min(100, baseScore + bonusScore);
  };

  // Loading UI during initialization
  if (orchestrationState.isInitializing) {
    return (
      <div id="pwa-orchestrator-loading" className="fixed inset-0 bg-white bg-opacity-90 flex items-center justify-center z-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Initializing PWA Features
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            Setting up offline capabilities and advanced features...
          </p>
          <div className="w-64 bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${orchestrationState.initializationProgress}%` }}
            />
          </div>
          <p className="text-xs text-gray-500 mt-2">
            {orchestrationState.initializationProgress}% complete
          </p>
        </div>
      </div>
    );
  }

  // Error UI if initialization failed
  if (orchestrationState.errors.length > 0 && !orchestrationState.isInitialized) {
    return (
      <div id="pwa-orchestrator-error" className="fixed inset-0 bg-red-50 flex items-center justify-center z-50">
        <div className="max-w-md text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h3 className="text-lg font-medium text-red-900 mb-2">
            PWA Initialization Failed
          </h3>
          <p className="text-sm text-red-700 mb-4">
            Some advanced features may not be available
          </p>
          <div className="bg-white rounded-lg p-4 mb-4 text-left">
            {orchestrationState.errors.map((error, index) => (
              <p key={index} className="text-sm text-red-600 font-mono">
                {error}
              </p>
            ))}
          </div>
          <button
            onClick={() => window.location.reload()}
            className="bg-red-600 text-white py-2 px-4 rounded-md text-sm font-medium hover:bg-red-700 transition-colors"
          >
            Reload App
          </button>
        </div>
      </div>
    );
  }

  // Main app with PWA integration
  return (
    <PWAProvider>
      <PWAErrorBoundary>
        {enablePerformanceMonitoring && <PWAPerformanceMonitor />}

        {children}

        {enableInstallPrompt && (
          <PWAInstallPrompt
            enableFloatingButton={true}
            onInstallSuccess={() => {
              logger.info('PWA installed successfully via orchestrator', {}, 'PWA_ORCHESTRATOR');
            }}
          />
        )}
      </PWAErrorBoundary>
    </PWAProvider>
  );
};