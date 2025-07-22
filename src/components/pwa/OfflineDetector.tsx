/**
 * OFFLINE DETECTOR - ELITE NETWORK RESILIENCE COMPONENT
 * 
 * Comprehensive offline detection and user feedback system with intelligent
 * network quality assessment and graceful degradation. Designed for Netflix/Meta
 * reliability standards with construction site resilience.
 * 
 * FEATURES:
 * - Real-time offline/online detection
 * - Network quality assessment and feedback
 * - Intelligent retry mechanisms
 * - Construction site optimized messaging
 * - Seamless online/offline transitions
 * 
 * @author STR Certified Engineering Team
 */

import React, { useState, useEffect } from 'react';
import { usePWAStatus } from '@/hooks/usePWAStatus';
import { WifiOff, Wifi, AlertTriangle, CheckCircle, Clock, RefreshCw, Signal, Battery } from 'lucide-react';

interface OfflineDetectorProps {
  id?: string;
  variant?: 'banner' | 'toast' | 'modal' | 'inline';
  showNetworkQuality?: boolean;
  autoHide?: boolean;
  position?: 'top' | 'bottom';
  className?: string;
  children?: React.ReactNode;
}

export const OfflineDetector: React.FC<OfflineDetectorProps> = ({
  id = "offline-detector",
  variant = 'banner',
  showNetworkQuality = true,
  autoHide = true,
  position = 'top',
  className = '',
  children
}) => {
  const { status, actions } = usePWAStatus();
  const [showOfflineMessage, setShowOfflineMessage] = useState(false);
  const [wasOffline, setWasOffline] = useState(false);
  const [reconnectionTime, setReconnectionTime] = useState<Date | null>(null);

  // Track offline/online transitions
  useEffect(() => {
    if (!status.isOnline && !wasOffline) {
      // Just went offline
      setWasOffline(true);
      setShowOfflineMessage(true);
      setReconnectionTime(null);
    } else if (status.isOnline && wasOffline) {
      // Just came back online
      setWasOffline(false);
      setReconnectionTime(new Date());
      
      // Auto-hide after reconnection if enabled
      if (autoHide) {
        setTimeout(() => {
          setShowOfflineMessage(false);
        }, 3000);
      }
    }
  }, [status.isOnline, wasOffline, autoHide]);

  // Get appropriate messaging based on network state
  const getNetworkMessage = () => {
    if (!status.isOnline) {
      return {
        title: 'Working Offline',
        message: 'No internet connection. Your work is being saved locally and will sync when connection returns.',
        color: 'orange',
        icon: <WifiOff className="h-5 w-5" />,
        actions: [
          {
            label: 'Check Connection',
            action: actions.forceNetworkCheck,
            icon: <RefreshCw className="h-4 w-4" />
          }
        ]
      };
    }

    if (reconnectionTime) {
      return {
        title: 'Back Online',
        message: `Connection restored! Syncing your offline work...`,
        color: 'green',
        icon: <CheckCircle className="h-5 w-5" />,
        actions: []
      };
    }

    if (showNetworkQuality) {
      switch (status.networkQuality) {
        case 'poor':
        case 'unusable':
          return {
            title: 'Poor Connection',
            message: 'Slow network detected. Operations may take longer than usual.',
            color: 'red',
            icon: <Signal className="h-5 w-5" />,
            actions: [
              {
                label: 'Optimize for Slow Connection',
                action: () => {
                  // Enable data saving mode
                  localStorage.setItem('str_data_saver_mode', 'true');
                },
                icon: <Battery className="h-4 w-4" />
              }
            ]
          };
        case 'fair':
          return {
            title: 'Moderate Connection',
            message: 'Connection quality is fair. Some features may load slowly.',
            color: 'yellow',
            icon: <Wifi className="h-5 w-5 opacity-75" />,
            actions: []
          };
        default:
          return null;
      }
    }

    return null;
  };

  const networkInfo = getNetworkMessage();

  // Don't render if no message to show
  if (!networkInfo && !showOfflineMessage) {
    return <>{children}</>;
  }

  // Color classes mapping
  const getColorClasses = (color: string) => {
    switch (color) {
      case 'green':
        return {
          bg: 'bg-green-50 border-green-200',
          text: 'text-green-800',
          button: 'bg-green-600 hover:bg-green-700 text-white'
        };
      case 'orange':
        return {
          bg: 'bg-orange-50 border-orange-200', 
          text: 'text-orange-800',
          button: 'bg-orange-600 hover:bg-orange-700 text-white'
        };
      case 'red':
        return {
          bg: 'bg-red-50 border-red-200',
          text: 'text-red-800', 
          button: 'bg-red-600 hover:bg-red-700 text-white'
        };
      case 'yellow':
        return {
          bg: 'bg-yellow-50 border-yellow-200',
          text: 'text-yellow-800',
          button: 'bg-yellow-600 hover:bg-yellow-700 text-white'
        };
      default:
        return {
          bg: 'bg-gray-50 border-gray-200',
          text: 'text-gray-800',
          button: 'bg-gray-600 hover:bg-gray-700 text-white'
        };
    }
  };

  if (!networkInfo) return <>{children}</>;

  const colors = getColorClasses(networkInfo.color);

  // Banner variant
  if (variant === 'banner') {
    return (
      <div id="offline-detector-container" className={className}>
        {/* Network Status Banner */}
        <div
          id={id}
          className={`border-l-4 p-4 ${colors.bg} ${position === 'top' ? 'border-t' : 'border-b'}`}
        >
          <div id="offline-banner-content" className="flex items-start gap-3">
            <div className={`mt-0.5 ${colors.text}`}>
              {networkInfo.icon}
            </div>
            
            <div id="offline-banner-text" className="flex-1 min-w-0">
              <h3 className={`text-sm font-semibold ${colors.text}`}>
                {networkInfo.title}
              </h3>
              <p className={`text-sm ${colors.text} opacity-90 mt-1`}>
                {networkInfo.message}
              </p>
              
              {/* Sync Queue Status */}
              {status.syncQueueSize > 0 && (
                <div id="sync-queue-info" className={`flex items-center gap-2 mt-2 text-xs ${colors.text} opacity-75`}>
                  <Clock className="h-3 w-3" />
                  <span>{status.syncQueueSize} items waiting to sync</span>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            {networkInfo.actions.length > 0 && (
              <div id="offline-banner-actions" className="flex gap-2">
                {networkInfo.actions.map((action, index) => (
                  <button
                    key={index}
                    id={`offline-action-${index}`}
                    onClick={action.action}
                    className={`flex items-center gap-1 px-3 py-1 rounded-md text-xs font-medium transition-colors ${colors.button}`}
                  >
                    {action.icon}
                    <span className="hidden sm:inline">{action.label}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Dismiss Button */}
            {autoHide && (
              <button
                id="dismiss-offline-banner"
                onClick={() => setShowOfflineMessage(false)}
                className={`ml-2 ${colors.text} opacity-50 hover:opacity-75`}
              >
                ✕
              </button>
            )}
          </div>
        </div>
        
        {children}
      </div>
    );
  }

  // Toast variant - fixed position notification
  if (variant === 'toast') {
    return (
      <>
        {children}
        <div
          id={id}
          className={`fixed ${position === 'top' ? 'top-4' : 'bottom-4'} right-4 z-50 max-w-md ${className}`}
        >
          <div id="offline-toast-container" className={`border border-gray-200 rounded-lg shadow-lg p-4 ${colors.bg}`}>
            <div id="offline-toast-content" className="flex items-start gap-3">
              <div className={colors.text}>
                {networkInfo.icon}
              </div>
              
              <div id="offline-toast-text" className="flex-1">
                <h4 className={`font-semibold text-sm ${colors.text}`}>
                  {networkInfo.title}
                </h4>
                <p className={`text-sm ${colors.text} opacity-90 mt-1`}>
                  {networkInfo.message}
                </p>
              </div>

              <button
                id="dismiss-offline-toast"
                onClick={() => setShowOfflineMessage(false)}
                className={`${colors.text} opacity-50 hover:opacity-75`}
              >
                ✕
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }

  // Inline variant - embedded within content
  if (variant === 'inline') {
    return (
      <div id="offline-detector-container" className={className}>
        <div
          id={id}
          className={`rounded-md border p-3 ${colors.bg}`}
        >
          <div id="offline-inline-content" className="flex items-center gap-3">
            <div className={colors.text}>
              {networkInfo.icon}
            </div>
            
            <div id="offline-inline-text" className="flex-1">
              <span className={`text-sm font-medium ${colors.text}`}>
                {networkInfo.title}
              </span>
              {networkInfo.message && (
                <p className={`text-xs ${colors.text} opacity-75 mt-1`}>
                  {networkInfo.message}
                </p>
              )}
            </div>

            {/* Network Quality Indicator */}
            {showNetworkQuality && (
              <div id="network-quality-indicator" className={`text-xs ${colors.text} opacity-75`}>
                {status.networkQuality}
              </div>
            )}
          </div>
        </div>
        
        {children}
      </div>
    );
  }

  // Default: render children without wrapper
  return <>{children}</>;
};

export default OfflineDetector;