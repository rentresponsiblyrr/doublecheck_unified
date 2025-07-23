import React, { createContext, useContext, useReducer, useEffect, useMemo } from 'react';
import type { PWAStatus, BackgroundSyncStatus, PushNotificationStatus } from '@/types/pwa';
import { logger } from '@/utils/logger';

interface UnifiedPWAState {
  pwa: PWAStatus;
  sync: BackgroundSyncStatus;
  notifications: PushNotificationStatus;
  installation: InstallationState;
  performance: PerformanceState;
  errors: PWAError[];
  isInitialized: boolean;
  isInitializing: boolean;
}

interface InstallationState {
  isInstallable: boolean;
  isInstalled: boolean;
  canShowPrompt: boolean;
  lastPromptShown: number;
  installationMethod: 'native' | 'manual' | 'unsupported';
  userEngagementScore: number;
}

interface PerformanceState {
  coreWebVitals: {
    lcp: number;
    fid: number;
    cls: number;
  };
  cacheHitRate: number;
  bundleSize: number;
  loadTime: number;
}

interface PWAError {
  id: string;
  timestamp: number;
  component: string;
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  resolved: boolean;
}

type PWAAction =
  | { type: 'PWA_INIT_START' }
  | { type: 'PWA_INIT_SUCCESS'; payload: { pwaStatus: PWAStatus; syncStatus: BackgroundSyncStatus; notificationStatus: PushNotificationStatus } }
  | { type: 'PWA_INIT_ERROR'; payload: Error }
  | { type: 'UPDATE_PERFORMANCE'; payload: Partial<PerformanceState> }
  | { type: 'ADD_ERROR'; payload: PWAError }
  | { type: 'RESOLVE_ERROR'; payload: string }
  | { type: 'CLEAR_ERRORS' }
  | { type: 'UPDATE_INSTALLATION_STATE'; payload: Partial<InstallationState> }
  | { type: 'UPDATE_SYNC_STATUS'; payload: Partial<BackgroundSyncStatus> }
  | { type: 'UPDATE_NOTIFICATION_STATUS'; payload: Partial<PushNotificationStatus> };

const initialPWAState: UnifiedPWAState = {
  pwa: {
    isSupported: false,
    isInstalled: false,
    isInstallable: false,
    isServiceWorkerSupported: 'serviceWorker' in navigator,
    isOfflineCapable: false,
    version: '4.0.0',
    lastUpdate: Date.now()
  },
  sync: {
    isSupported: false,
    isRegistered: false,
    registeredTags: [],
    pendingSyncs: 0,
    syncInProgress: false,
    failedSyncs: 0,
    circuitBreakerOpen: false
  },
  notifications: {
    isSupported: 'Notification' in window,
    permission: 'default' as NotificationPermission,
    isSubscribed: false,
    hasVapidKey: false,
    notificationCount: 0,
    clickRate: 0,
    dismissalRate: 0
  },
  installation: {
    isInstallable: false,
    isInstalled: false,
    canShowPrompt: false,
    lastPromptShown: 0,
    installationMethod: 'unsupported',
    userEngagementScore: 0
  },
  performance: {
    coreWebVitals: { lcp: 0, fid: 0, cls: 0 },
    cacheHitRate: 0,
    bundleSize: 0,
    loadTime: 0
  },
  errors: [],
  isInitialized: false,
  isInitializing: false
};

function pwaReducer(state: UnifiedPWAState, action: PWAAction): UnifiedPWAState {
  switch (action.type) {
    case 'PWA_INIT_START':
      return {
        ...state,
        isInitializing: true,
        errors: state.errors.filter(e => e.component !== 'initialization')
      };

    case 'PWA_INIT_SUCCESS': {
      return {
        ...state,
        isInitialized: true,
        isInitializing: false,
        pwa: action.payload.pwaStatus,
        sync: action.payload.syncStatus,
        notifications: action.payload.notificationStatus
      };
    }

    case 'PWA_INIT_ERROR': {
      const initError: PWAError = {
        id: `init_error_${Date.now()}`,
        timestamp: Date.now(),
        component: 'initialization',
        message: action.payload.message,
        severity: 'critical',
        resolved: false
      };

      return {
        ...state,
        isInitialized: false,
        isInitializing: false,
        errors: [...state.errors, initError]
      };
    }

    case 'UPDATE_PERFORMANCE':
      return {
        ...state,
        performance: { ...state.performance, ...action.payload }
      };

    case 'ADD_ERROR':
      return {
        ...state,
        errors: [...state.errors, action.payload]
      };

    case 'RESOLVE_ERROR':
      return {
        ...state,
        errors: state.errors.map(error =>
          error.id === action.payload ? { ...error, resolved: true } : error
        )
      };

    case 'CLEAR_ERRORS':
      return {
        ...state,
        errors: []
      };

    case 'UPDATE_INSTALLATION_STATE':
      return {
        ...state,
        installation: { ...state.installation, ...action.payload }
      };

    case 'UPDATE_SYNC_STATUS':
      return {
        ...state,
        sync: { ...state.sync, ...action.payload }
      };

    case 'UPDATE_NOTIFICATION_STATUS':
      return {
        ...state,
        notifications: { ...state.notifications, ...action.payload }
      };

    default:
      return state;
  }
}

interface PWAContextValue {
  state: UnifiedPWAState;
  dispatch: React.Dispatch<PWAAction>;
  actions: {
    initializePWA: () => Promise<void>;
    syncData: () => Promise<void>;
    showInstallPrompt: () => Promise<boolean>;
    enableNotifications: () => Promise<boolean>;
    clearErrors: () => void;
    updatePerformance: (metrics: Partial<PerformanceState>) => void;
  };
}

const PWAContext = createContext<PWAContextValue | null>(null);

export const PWAProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(pwaReducer, initialPWAState);

  const initializePWACore = async (): Promise<PWAStatus> => {
    // Get global PWA status
    const globalStatus = (window as any).__PWA_STATUS__;
    if (globalStatus?.allSystemsReady) {
      return globalStatus;
    }

    return {
      isSupported: true,
      isInstalled: window.matchMedia('(display-mode: standalone)').matches,
      isInstallable: !!(window as any).__DEFERRED_INSTALL_PROMPT__,
      isServiceWorkerSupported: 'serviceWorker' in navigator,
      isOfflineCapable: true,
      version: '4.0.0',
      lastUpdate: Date.now()
    };
  };

  const initializeBackgroundSync = async (): Promise<BackgroundSyncStatus> => {
    const syncManager = (window as any).__BACKGROUND_SYNC_MANAGER__;
    if (syncManager) {
      return syncManager.getStatus();
    }

    return {
      isSupported: typeof window !== 'undefined' && window.ServiceWorkerRegistration && 'sync' in window.ServiceWorkerRegistration.prototype,
      isRegistered: false,
      registeredTags: [],
      pendingSyncs: 0,
      syncInProgress: false,
      failedSyncs: 0,
      circuitBreakerOpen: false
    };
  };

  const initializePushNotifications = async (): Promise<PushNotificationStatus> => {
    const pushManager = (window as any).__PUSH_NOTIFICATION_MANAGER__;
    if (pushManager) {
      return pushManager.getStatus();
    }

    return {
      isSupported: 'Notification' in window,
      permission: Notification.permission,
      isSubscribed: false,
      hasVapidKey: false,
      notificationCount: 0,
      clickRate: 0,
      dismissalRate: 0
    };
  };

  const actions = useMemo(() => ({
    initializePWA: async () => {
      try {
        dispatch({ type: 'PWA_INIT_START' });

        logger.info('🚀 Initializing unified PWA state management', {}, 'PWA_CONTEXT');

        // Initialize all PWA managers in parallel
        const [pwaStatus, syncStatus, notificationStatus] = await Promise.all([
          initializePWACore(),
          initializeBackgroundSync(),
          initializePushNotifications()
        ]);

        dispatch({
          type: 'PWA_INIT_SUCCESS',
          payload: { pwaStatus, syncStatus, notificationStatus }
        });

        logger.info('✅ PWA state management initialized successfully', {
          pwaSupported: pwaStatus.isSupported,
          syncSupported: syncStatus.isSupported,
          notificationsSupported: notificationStatus.isSupported
        }, 'PWA_CONTEXT');

      } catch (error) {
        logger.error('❌ PWA state management initialization failed', { error }, 'PWA_CONTEXT');
        dispatch({ type: 'PWA_INIT_ERROR', payload: error as Error });
        throw error;
      }
    },

    syncData: async () => {
      const syncManager = (window as any).__BACKGROUND_SYNC_MANAGER__;
      if (syncManager) {
        try {
          await syncManager.triggerSync();
          dispatch({
            type: 'UPDATE_SYNC_STATUS',
            payload: { syncInProgress: true }
          });
        } catch (error) {
          const syncError: PWAError = {
            id: `sync_error_${Date.now()}`,
            timestamp: Date.now(),
            component: 'background-sync',
            message: (error as Error).message,
            severity: 'medium',
            resolved: false
          };
          dispatch({ type: 'ADD_ERROR', payload: syncError });
        }
      }
    },

    showInstallPrompt: async (): Promise<boolean> => {
      const installPrompt = (window as any).__DEFERRED_INSTALL_PROMPT__;
      if (installPrompt) {
        try {
          await installPrompt.prompt();
          const { outcome } = await installPrompt.userChoice;

          dispatch({
            type: 'UPDATE_INSTALLATION_STATE',
            payload: {
              lastPromptShown: Date.now(),
              isInstalled: outcome === 'accepted'
            }
          });

          return outcome === 'accepted';
        } catch (error) {
          logger.error('Install prompt failed', { error }, 'PWA_CONTEXT');
          return false;
        }
      }
      return false;
    },

    enableNotifications: async (): Promise<boolean> => {
      try {
        const permission = await Notification.requestPermission();

        dispatch({
          type: 'UPDATE_NOTIFICATION_STATUS',
          payload: { permission }
        });

        if (permission === 'granted') {
          const pushManager = (window as any).__PUSH_NOTIFICATION_MANAGER__;
          if (pushManager) {
            await pushManager.setupPushSubscription();
          }
          return true;
        }
        return false;
      } catch (error) {
        logger.error('Notification permission request failed', { error }, 'PWA_CONTEXT');
        return false;
      }
    },

    clearErrors: () => {
      dispatch({ type: 'CLEAR_ERRORS' });
    },

    updatePerformance: (metrics: Partial<PerformanceState>) => {
      dispatch({ type: 'UPDATE_PERFORMANCE', payload: metrics });
    }
  }), []);

  return (
    <PWAContext.Provider value={{ state, dispatch, actions }}>
      {children}
    </PWAContext.Provider>
  );
};

export const usePWAContext = (): PWAContextValue => {
  const context = useContext(PWAContext);
  if (!context) {
    throw new Error('usePWAContext must be used within PWAProvider');
  }
  return context;
};