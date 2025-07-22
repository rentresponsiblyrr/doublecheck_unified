/**
 * MOBILE INSTALL PROMPT - ELITE PWA INSTALLATION UX
 * 
 * Construction site optimized install prompt with iOS Safari support,
 * smart engagement triggers, and inspection workflow integration.
 * Designed for Netflix/Meta conversion rates with zero friction UX.
 * 
 * FEATURES:
 * - Smart timing based on user engagement
 * - iOS Safari custom install flow
 * - Construction site benefit messaging
 * - Touch-optimized mobile design
 * - Inspection workflow integration
 * 
 * @author STR Certified Engineering Team
 */

import React, { useState, useEffect, useCallback } from 'react';
import { usePWAStatus } from '@/hooks/usePWAStatus';
import { Smartphone, Download, Wifi, Battery, Camera, Clock, X, CheckCircle } from 'lucide-react';

interface MobileInstallPromptProps {
  id?: string;
  trigger?: 'manual' | 'engagement' | 'workflow' | 'always';
  engagementThreshold?: number; // minutes
  showBenefits?: boolean;
  variant?: 'modal' | 'banner' | 'card';
  onInstall?: () => void;
  onDismiss?: () => void;
  className?: string;
}

interface EngagementMetrics {
  sessionStartTime: number;
  inspectionsCompleted: number;
  photosCapturePage: number;
  offlineUsage: number;
  returnVisits: number;
}

export const MobileInstallPrompt: React.FC<MobileInstallPromptProps> = ({
  id = "mobile-install-prompt",
  trigger = 'engagement',
  engagementThreshold = 5,
  showBenefits = true,
  variant = 'modal',
  onInstall,
  onDismiss,
  className = ''
}) => {
  const { status, actions } = usePWAStatus();
  const [showPrompt, setShowPrompt] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);
  const [engagement, setEngagement] = useState<EngagementMetrics>({
    sessionStartTime: Date.now(),
    inspectionsCompleted: 0,
    photosCapturePage: 0,
    offlineUsage: 0,
    returnVisits: parseInt(localStorage.getItem('str_return_visits') || '0')
  });

  // Check if user meets engagement threshold
  const meetsEngagementThreshold = useCallback((): boolean => {
    const sessionMinutes = (Date.now() - engagement.sessionStartTime) / (1000 * 60);
    
    return (
      sessionMinutes >= engagementThreshold ||
      engagement.inspectionsCompleted >= 1 ||
      engagement.photosCapturePage >= 3 ||
      engagement.returnVisits >= 2 ||
      engagement.offlineUsage > 0
    );
  }, [engagement, engagementThreshold]);

  // Detect if user is on iOS Safari
  const isIOSSafari = (): boolean => {
    const userAgent = window.navigator.userAgent;
    const isIOS = /iPad|iPhone|iPod/.test(userAgent);
    const isSafari = /Safari/.test(userAgent) && !/CriOS|FxiOS|EdgiOS/.test(userAgent);
    return isIOS && isSafari;
  };

  // Check if should show prompt
  useEffect(() => {
    if (isDismissed || !status.canShowInstallPrompt) {
      setShowPrompt(false);
      return;
    }

    switch (trigger) {
      case 'always':
        setShowPrompt(true);
        break;
      case 'manual':
        // Controlled externally
        break;
      case 'workflow': {
        // Show during specific workflow steps
        const currentPath = window.location.pathname;
        if (currentPath.includes('/inspection/') && meetsEngagementThreshold()) {
          setShowPrompt(true);
        }
        break;
      }
      case 'engagement':
      default:
        if (meetsEngagementThreshold()) {
          setShowPrompt(true);
        }
        break;
    }
  }, [trigger, status.canShowInstallPrompt, isDismissed, engagement, meetsEngagementThreshold]);

  // Track engagement metrics
  useEffect(() => {
    const handleRouteChange = () => {
      const path = window.location.pathname;
      
      if (path.includes('/inspection/complete')) {
        setEngagement(prev => ({
          ...prev,
          inspectionsCompleted: prev.inspectionsCompleted + 1
        }));
      }
      
      if (path.includes('/photo')) {
        setEngagement(prev => ({
          ...prev,
          photosCapturePage: prev.photosCapturePage + 1
        }));
      }
    };

    const handleOfflineUsage = () => {
      if (!navigator.onLine) {
        setEngagement(prev => ({
          ...prev,
          offlineUsage: prev.offlineUsage + 1
        }));
      }
    };

    // Track return visits
    const visitCount = parseInt(localStorage.getItem('str_return_visits') || '0') + 1;
    localStorage.setItem('str_return_visits', visitCount.toString());
    
    window.addEventListener('popstate', handleRouteChange);
    window.addEventListener('offline', handleOfflineUsage);

    return () => {
      window.removeEventListener('popstate', handleRouteChange);
      window.removeEventListener('offline', handleOfflineUsage);
    };
  }, []);

  // Handle install action
  const handleInstall = async () => {
    setIsInstalling(true);
    
    try {
      const success = await actions.showInstallPrompt();
      
      if (success) {
        setShowPrompt(false);
        onInstall?.();
      } else if (isIOSSafari()) {
        // Show iOS Safari install instructions
        setShowPrompt(true); // Keep prompt open to show instructions
      }
    } catch (error) {
      console.error('Install failed:', error);
    } finally {
      setIsInstalling(false);
    }
  };

  // Handle dismiss
  const handleDismiss = () => {
    setShowPrompt(false);
    setIsDismissed(true);
    onDismiss?.();
    
    // Don't show again for 24 hours
    localStorage.setItem('str_install_prompt_dismissed', Date.now().toString());
  };

  // Check if was recently dismissed
  useEffect(() => {
    const dismissedTime = localStorage.getItem('str_install_prompt_dismissed');
    if (dismissedTime) {
      const hoursSinceDismissal = (Date.now() - parseInt(dismissedTime)) / (1000 * 60 * 60);
      if (hoursSinceDismissal < 24) {
        setIsDismissed(true);
      }
    }
  }, []);

  if (!showPrompt) return null;

  // Install benefits for construction sites
  const benefits = [
    {
      icon: <Wifi className="h-5 w-5 text-blue-600" />,
      title: 'Work Offline',
      description: 'Complete inspections without internet connection'
    },
    {
      icon: <Battery className="h-5 w-5 text-green-600" />,
      title: 'Save Battery',
      description: 'Optimized for all-day use on construction sites'
    },
    {
      icon: <Camera className="h-5 w-5 text-purple-600" />,
      title: 'Better Camera',
      description: 'Enhanced photo capture for better quality images'
    },
    {
      icon: <Clock className="h-5 w-5 text-orange-600" />,
      title: 'Faster Access',
      description: 'Launch instantly from your home screen'
    }
  ];

  // iOS Safari instructions
  const iosInstructions = [
    'Tap the Share button at the bottom of the screen',
    'Scroll and tap "Add to Home Screen"',
    'Tap "Add" to install the app',
    'Find the app on your home screen'
  ];

  // Modal variant
  if (variant === 'modal') {
    return (
      <div id="install-prompt-overlay" className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
        <div 
          className="fixed inset-0 bg-black bg-opacity-50" 
          onClick={handleDismiss}
        />
        
        <div 
          id={id}
          className={`relative bg-white rounded-t-lg sm:rounded-lg p-6 w-full max-w-md mx-4 mb-0 sm:mb-4 ${className}`}
        >
          {/* Close button */}
          <button
            id="install-prompt-close"
            onClick={handleDismiss}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>

          {/* Header */}
          <div id="install-prompt-header" className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
              <Smartphone className="h-8 w-8 text-blue-600" />
            </div>
            
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              Install STR Certified
            </h2>
            
            <p className="text-gray-600 text-sm">
              Get the full app experience with offline capabilities perfect for construction sites
            </p>
          </div>

          {/* Benefits */}
          {showBenefits && (
            <div id="install-benefits" className="space-y-3 mb-6">
              {benefits.map((benefit, index) => (
                <div key={index} id={`benefit-${index}`} className="flex items-start gap-3">
                  <div className="mt-0.5">
                    {benefit.icon}
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900">{benefit.title}</h3>
                    <p className="text-xs text-gray-600">{benefit.description}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* iOS Safari Instructions */}
          {isIOSSafari() && (
            <div id="ios-install-instructions" className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <h3 className="text-sm font-semibold text-blue-900 mb-2">
                How to Install on iOS:
              </h3>
              <ol className="text-xs text-blue-800 space-y-1">
                {iosInstructions.map((step, index) => (
                  <li key={index} className="flex gap-2">
                    <span className="font-medium">{index + 1}.</span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
            </div>
          )}

          {/* Action buttons */}
          <div id="install-prompt-actions" className="flex gap-3">
            <button
              id="install-dismiss-button"
              onClick={handleDismiss}
              className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
            >
              Maybe Later
            </button>
            
            <button
              id="install-action-button"
              onClick={handleInstall}
              disabled={isInstalling}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {isInstalling ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Installing...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4" />
                  {isIOSSafari() ? 'Follow Steps Above' : 'Install App'}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Banner variant
  if (variant === 'banner') {
    return (
      <div 
        id={id}
        className={`bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 ${className}`}
      >
        <div id="install-banner-content" className="flex items-center gap-4">
          <Smartphone className="h-6 w-6 flex-shrink-0" />
          
          <div id="install-banner-text" className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm">Install STR Certified</h3>
            <p className="text-xs text-blue-100">Work offline, save battery, faster access</p>
          </div>

          <div id="install-banner-actions" className="flex gap-2">
            <button
              id="banner-dismiss-button"
              onClick={handleDismiss}
              className="text-blue-200 hover:text-white text-xs px-2 py-1"
            >
              Later
            </button>
            
            <button
              id="banner-install-button"
              onClick={handleInstall}
              disabled={isInstalling}
              className="bg-white text-blue-700 text-xs font-medium px-3 py-1 rounded-md hover:bg-blue-50 disabled:opacity-50 transition-colors"
            >
              {isInstalling ? 'Installing...' : 'Install'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Card variant - embedded within content
  return (
    <div 
      id={id}
      className={`bg-white border border-gray-200 rounded-lg p-4 shadow-sm ${className}`}
    >
      <div id="install-card-content" className="flex items-start gap-4">
        <div className="inline-flex items-center justify-center w-10 h-10 bg-blue-100 rounded-lg flex-shrink-0">
          <Smartphone className="h-5 w-5 text-blue-600" />
        </div>
        
        <div id="install-card-text" className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 text-sm mb-1">
            Install STR Certified App
          </h3>
          <p className="text-xs text-gray-600 mb-3">
            Get offline access, better performance, and instant launching for your inspections.
          </p>
          
          <div id="install-card-actions" className="flex gap-2">
            <button
              id="card-install-button"
              onClick={handleInstall}
              disabled={isInstalling}
              className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {isInstalling ? (
                <>
                  <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" />
                  Installing...
                </>
              ) : (
                <>
                  <Download className="h-3 w-3" />
                  Install
                </>
              )}
            </button>
            
            <button
              id="card-dismiss-button"
              onClick={handleDismiss}
              className="text-gray-600 text-xs px-2 py-1.5 hover:text-gray-800"
            >
              Not now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MobileInstallPrompt;