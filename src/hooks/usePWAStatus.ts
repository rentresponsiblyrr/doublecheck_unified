/**
 * PWA STATUS HOOK - ELITE REACT INTEGRATION
 * 
 * Unified PWA status management hook providing real-time network status,
 * installation state, and service worker health for React components.
 * Designed for Netflix/Meta component integration standards.
 * 
 * FEATURES:
 * - Real-time network status updates
 * - Installation prompt state management  
 * - Service worker health monitoring
 * - Offline queue status tracking
 * - Performance metrics access
 * 
 * @author STR Certified Engineering Team
 */

import { useState, useEffect, useCallback } from 'react';
import { serviceWorkerManager } from '@/lib/pwa/ServiceWorkerManager';
import { offlineStatusManager, NetworkStatus } from '@/lib/pwa/OfflineStatusManager';
import { installPromptHandler } from '@/lib/pwa/InstallPromptHandler';
import { logger } from '@/utils/logger';

export interface PWAStatus {
  // Network status
  isOnline: boolean;
  networkQuality: 'excellent' | 'good' | 'fair' | 'poor' | 'unusable';
  connectionType: string;
  
  // Installation status  
  isInstallable: boolean;
  isInstalled: boolean;
  canShowInstallPrompt: boolean;
  
  // Service Worker status
  isServiceWorkerActive: boolean;
  updateAvailable: boolean;
  
  // Offline capabilities
  syncQueueSize: number;
  lastSyncTime: Date | null;
  
  // Performance metrics
  cacheHitRate: number;
  averageResponseTime: number;
}

export interface PWAActions {
  // Installation actions
  showInstallPrompt: () => Promise<boolean>;
  dismissInstallPrompt: () => void;
  
  // Service Worker actions
  updateServiceWorker: () => Promise<void>;
  
  // Network actions
  forceNetworkCheck: () => Promise<void>;
  clearOfflineQueue: () => Promise<void>;
}

export const usePWAStatus = () => {
  const [pwaStatus, setPwaStatus] = useState<PWAStatus>({
    isOnline: navigator.onLine,
    networkQuality: 'fair',
    connectionType: 'unknown',
    isInstallable: false,
    isInstalled: false,
    canShowInstallPrompt: false,
    isServiceWorkerActive: false,
    updateAvailable: false,
    syncQueueSize: 0,
    lastSyncTime: null,
    cacheHitRate: 0,
    averageResponseTime: 0
  });

  // Update PWA status from managers
  const updatePWAStatus = useCallback(async () => {
    try {
      // Get network status
      const networkStatus = offlineStatusManager.getNetworkStatus();
      const queueStatus = offlineStatusManager.getRetryQueueStatus();
      
      // Get service worker status
      const swStatus = serviceWorkerManager.getStatus();
      const swMetrics = serviceWorkerManager.getPerformanceMetrics();
      
      // Get install prompt status  
      const installState = await installPromptHandler.getInstallState();
      
      const newStatus: PWAStatus = {
        // Network status
        isOnline: networkStatus.isOnline,
        networkQuality: networkStatus.quality.category,
        connectionType: networkStatus.connectionType,
        
        // Installation status
        isInstallable: installState.canPrompt,
        isInstalled: installState.isInstalled,
        canShowInstallPrompt: installState.canPrompt && !installState.promptShown,
        
        // Service Worker status  
        isServiceWorkerActive: swStatus.isControlling,
        updateAvailable: swStatus.updateAvailable,
        
        // Offline capabilities
        syncQueueSize: queueStatus.totalItems,
        lastSyncTime: swStatus.lastSync,
        
        // Performance metrics
        cacheHitRate: swStatus.cacheHitRate,
        averageResponseTime: swMetrics.averageResponseTime
      };

      setPwaStatus(newStatus);

    } catch (error) {
      logger.error('PWA status update failed', { error }, 'PWA_HOOK');
    }
  }, []);

  // PWA action handlers
  const showInstallPrompt = useCallback(async (): Promise<boolean> => {
    try {
      const result = await installPromptHandler.showInstallPrompt();
      await updatePWAStatus(); // Refresh status after prompt
      return result;
    } catch (error) {
      logger.error('Install prompt failed', { error }, 'PWA_HOOK');
      return false;
    }
  }, [updatePWAStatus]);

  const dismissInstallPrompt = useCallback(() => {
    installPromptHandler.dismissPrompt();
    updatePWAStatus();
  }, [updatePWAStatus]);

  const updateServiceWorker = useCallback(async () => {
    try {
      await serviceWorkerManager.applyUpdate();
      await updatePWAStatus();
    } catch (error) {
      logger.error('Service worker update failed', { error }, 'PWA_HOOK');
    }
  }, [updatePWAStatus]);

  const forceNetworkCheck = useCallback(async () => {
    try {
      await offlineStatusManager.assessNetworkQuality();
      await updatePWAStatus();
    } catch (error) {
      logger.error('Network check failed', { error }, 'PWA_HOOK');
    }
  }, [updatePWAStatus]);

  const clearOfflineQueue = useCallback(async () => {
    try {
      await offlineStatusManager.clearRetryQueue(true);
      await updatePWAStatus();
    } catch (error) {
      logger.error('Queue clear failed', { error }, 'PWA_HOOK');
    }
  }, [updatePWAStatus]);

  // Setup event listeners for real-time updates
  useEffect(() => {
    // Initial status update
    updatePWAStatus();

    // Network status changes
    const networkUnsubscribe = offlineStatusManager.subscribe((event) => {
      if (event.type === 'network_status_changed' || event.type === 'queue_processed') {
        updatePWAStatus();
      }
    });

    // Service worker events
    const handleSWUpdate = () => updatePWAStatus();
    const handleSWSync = () => updatePWAStatus();
    
    window.addEventListener('sw-update-available', handleSWUpdate);
    window.addEventListener('background-sync-success', handleSWSync);
    window.addEventListener('background-sync-failed', handleSWSync);

    // Install prompt events
    const handleInstallPrompt = () => updatePWAStatus();
    window.addEventListener('beforeinstallprompt', handleInstallPrompt);
    window.addEventListener('appinstalled', handleInstallPrompt);

    // Cleanup event listeners
    return () => {
      networkUnsubscribe();
      window.removeEventListener('sw-update-available', handleSWUpdate);
      window.removeEventListener('background-sync-success', handleSWSync);
      window.removeEventListener('background-sync-failed', handleSWSync);
      window.removeEventListener('beforeinstallprompt', handleInstallPrompt);
      window.removeEventListener('appinstalled', handleInstallPrompt);
    };
  }, [updatePWAStatus]);

  const actions: PWAActions = {
    showInstallPrompt,
    dismissInstallPrompt,
    updateServiceWorker,
    forceNetworkCheck,
    clearOfflineQueue
  };

  return {
    status: pwaStatus,
    actions,
    refresh: updatePWAStatus
  };
};

export default usePWAStatus;