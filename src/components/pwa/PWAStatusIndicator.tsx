/**
 * PWA STATUS INDICATOR - ELITE MOBILE UX COMPONENT
 * 
 * Visual PWA status indicator providing real-time network, installation,
 * and offline capabilities feedback. Designed for Netflix/Meta mobile UX standards
 * with construction site visibility optimization.
 * 
 * FEATURES:
 * - Real-time network quality indicator
 * - Installation status and prompt trigger  
 * - Offline queue status display
 * - Service worker health indicator
 * - Touch-friendly mobile design
 * 
 * @author STR Certified Engineering Team
 */

import React from 'react';
import { usePWA } from '@/hooks/usePWA';
import { Wifi, WifiOff, Download, Smartphone, AlertCircle, CheckCircle, Clock, Signal } from 'lucide-react';

interface PWAStatusIndicatorProps {
  id?: string;
  variant?: 'compact' | 'detailed' | 'mobile';
  showInstallPrompt?: boolean;
  className?: string;
}

export const PWAStatusIndicator: React.FC<PWAStatusIndicatorProps> = ({
  id = "pwa-status-indicator",
  variant = 'compact',
  showInstallPrompt = true,
  className = ''
}) => {
  const [status, actions] = usePWA();

  // Network quality color mapping
  const getNetworkQualityColor = (quality: string): string => {
    switch (quality) {
      case 'excellent': return 'text-green-600 bg-green-50';
      case 'good': return 'text-blue-600 bg-blue-50';
      case 'fair': return 'text-yellow-600 bg-yellow-50';
      case 'poor': return 'text-orange-600 bg-orange-50';
      case 'unusable': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  // Network quality icon
  const getNetworkIcon = () => {
    if (!status.isOnline) return <WifiOff className="h-4 w-4" />;
    
    switch (status.networkQuality) {
      case 'excellent': return <Signal className="h-4 w-4" />;
      case 'good': return <Wifi className="h-4 w-4" />;
      case 'fair': return <Wifi className="h-4 w-4 opacity-75" />;
      case 'poor': return <Wifi className="h-4 w-4 opacity-50" />;
      case 'unusable': return <WifiOff className="h-4 w-4" />;
      default: return <Wifi className="h-4 w-4" />;
    }
  };

  // Handle install prompt
  const handleInstallClick = async () => {
    try {
      const result = await actions.showInstallPrompt();
      if (!result.success) {
        // Fallback for manual installation guidance
        alert('To install this app, use your browser\'s "Add to Home Screen" option in the menu.');
      }
    } catch (error) {
      alert('Installation not available on this device.');
    }
  };

  if (variant === 'compact') {
    return (
      <div id={id} className={`flex items-center gap-2 ${className}`}>
        {/* Network Status */}
        <div 
          id="network-status-indicator"
          className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium ${getNetworkQualityColor(status.networkQuality)}`}
          title={`Network: ${status.networkQuality} (${status.connectionType})`}
        >
          {getNetworkIcon()}
          {!status.isOnline && <span>Offline</span>}
        </div>

        {/* Install Prompt */}
        {showInstallPrompt && status.isInstallable && !status.isInstalled && (
          <button
            id="install-prompt-button"
            onClick={handleInstallClick}
            className="flex items-center gap-1 px-2 py-1 bg-blue-600 text-white rounded-md text-xs font-medium hover:bg-blue-700 transition-colors"
            title="Install app for better offline experience"
          >
            <Download className="h-3 w-3" />
            <span className="hidden sm:inline">Install</span>
          </button>
        )}

        {/* Service Worker Update */}
        {status.serviceWorkerUpdateAvailable && (
          <button
            id="sw-update-button"
            onClick={actions.applyUpdate}
            className="flex items-center gap-1 px-2 py-1 bg-green-600 text-white rounded-md text-xs font-medium hover:bg-green-700 transition-colors"
            title="App update available - click to apply"
          >
            <AlertCircle className="h-3 w-3" />
            <span className="hidden sm:inline">Update</span>
          </button>
        )}
      </div>
    );
  }

  if (variant === 'detailed') {
    return (
      <div id={id} className={`bg-white border border-gray-200 rounded-lg p-4 shadow-sm ${className}`}>
        <div id="pwa-status-header" className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-900">App Status</h3>
          <div className="flex items-center gap-2">
            {status.isServiceWorkerReady ? (
              <CheckCircle className="h-4 w-4 text-green-600" />
            ) : (
              <AlertCircle className="h-4 w-4 text-orange-600" />
            )}
          </div>
        </div>

        <div id="pwa-status-details" className="space-y-3">
          {/* Network Status */}
          <div id="network-status-details" className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {getNetworkIcon()}
              <span className="text-sm text-gray-700">
                Network: {status.networkQuality} {!status.isOnline && '(Offline)'}
              </span>
            </div>
            <span className="text-xs text-gray-500">{status.connectionType}</span>
          </div>

          {/* Installation Status */}
          <div id="installation-status" className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Smartphone className="h-4 w-4 text-gray-600" />
              <span className="text-sm text-gray-700">
                {status.isInstalled ? 'Installed' : 'Web App'}
              </span>
            </div>
            {status.isInstallable && !status.isInstalled && (
              <button
                id="detailed-install-button"
                onClick={handleInstallClick}
                className="text-xs text-blue-600 hover:text-blue-700 font-medium"
              >
                Install App
              </button>
            )}
          </div>

          {/* Sync Queue */}
          {status.retryQueueSize > 0 && (
            <div id="sync-queue-status" className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-orange-600" />
                <span className="text-sm text-gray-700">
                  {status.retryQueueSize} items syncing
                </span>
              </div>
              <button
                id="clear-queue-button"
                onClick={actions.clearRetryQueue}
                className="text-xs text-red-600 hover:text-red-700 font-medium"
              >
                Clear Queue
              </button>
            </div>
          )}

          {/* Performance Metrics */}
          {status.cacheHitRate > 0 && (
            <div id="performance-metrics" className="text-xs text-gray-500">
              Cache Hit Rate: {Math.round(status.cacheHitRate)}%
              {status.avgResponseTime > 0 && (
                <span className="ml-2">
                  Avg Response: {Math.round(status.avgResponseTime)}ms
                </span>
              )}
            </div>
          )}
        </div>

        {/* Update Available */}
        {status.serviceWorkerUpdateAvailable && (
          <div id="update-banner" className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Download className="h-4 w-4 text-blue-600" />
                <span className="text-sm text-blue-800">App update available</span>
              </div>
              <button
                id="detailed-update-button"
                onClick={actions.applyUpdate}
                className="px-3 py-1 bg-blue-600 text-white text-xs rounded-md hover:bg-blue-700 transition-colors"
              >
                Update Now
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Mobile variant - optimized for touch and construction sites
  return (
    <div id={id} className={`fixed bottom-4 right-4 z-50 ${className}`}>
      <div id="mobile-pwa-status" className="bg-white border border-gray-200 rounded-lg shadow-lg p-3 min-w-[200px]">
        {/* Network Indicator */}
        <div id="mobile-network-status" className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            {getNetworkIcon()}
            <span className="text-sm font-medium">
              {status.isOnline ? status.networkQuality : 'Offline'}
            </span>
          </div>
          <div className={`w-2 h-2 rounded-full ${status.isOnline ? 'bg-green-500' : 'bg-red-500'}`} />
        </div>

        {/* Sync Status */}
        {status.retryQueueSize > 0 && (
          <div id="mobile-sync-status" className="flex items-center gap-2 mb-2 text-orange-600">
            <Clock className="h-4 w-4" />
            <span className="text-sm">{status.retryQueueSize} syncing</span>
          </div>
        )}

        {/* Install Prompt */}
        {showInstallPrompt && status.isInstallable && !status.isInstalled && (
          <button
            id="mobile-install-button"
            onClick={handleInstallClick}
            className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-2 px-3 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            <Download className="h-4 w-4" />
            Install App
          </button>
        )}

        {/* Update Available */}
        {status.serviceWorkerUpdateAvailable && (
          <button
            id="mobile-update-button"
            onClick={actions.applyUpdate}
            className="w-full flex items-center justify-center gap-2 bg-green-600 text-white py-2 px-3 rounded-md text-sm font-medium hover:bg-green-700 transition-colors mt-2"
          >
            <AlertCircle className="h-4 w-4" />
            Update Available
          </button>
        )}
      </div>
    </div>
  );
};

export default PWAStatusIndicator;