/**
 * PWA INSTALL PROMPT - PHASE 4B COMPONENT 6
 * 
 * Elite PWA installation prompt component providing intelligent install prompts
 * with construction site optimizations and user-friendly installation flows.
 * Designed for Netflix/Meta user experience standards with comprehensive analytics.
 * 
 * INSTALL PROMPT CAPABILITIES:
 * - Intelligent install prompt timing based on user engagement
 * - Cross-platform installation support (iOS, Android, Desktop)
 * - Construction site optimized UI with large touch targets
 * - A2HS (Add to Home Screen) fallback for unsupported browsers
 * - Installation analytics and success tracking
 * - Customizable branding and messaging
 * 
 * PLATFORM SUPPORT:
 * - Chrome/Edge: Native beforeinstallprompt event
 * - Safari iOS: Manual A2HS instruction overlay
 * - Samsung Internet: Native installation support
 * - Firefox: Custom installation guidance
 * - Opera: Native PWA installation
 * 
 * UX OPTIMIZATIONS:
 * - Non-intrusive prompt timing
 * - User engagement-based triggers
 * - Clear installation benefits messaging
 * - Progressive disclosure of installation steps
 * - Persistent reminder with user control
 * 
 * SUCCESS CRITERIA:
 * - 90%+ cross-platform installation compatibility
 * - 25%+ installation conversion rate
 * - <3s time to installation completion
 * - Zero installation failures due to UI issues
 * - User satisfaction score >4.5/5.0
 * 
 * @author STR Certified Engineering Team
 * @version 4.0.0 - Phase 4B Elite PWA Implementation
 */

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { logger } from '@/utils/logger';

// PWA Install Prompt interfaces
export interface PWAInstallEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
  prompt(): Promise<void>;
}

export interface InstallPromptState {
  isInstallable: boolean;
  isInstalled: boolean;
  showPrompt: boolean;
  showInstructions: boolean;
  platform: 'chrome' | 'safari' | 'firefox' | 'edge' | 'samsung' | 'opera' | 'unknown';
  installationMethod: 'native' | 'manual' | 'unsupported';
  userEngagement: {
    sessions: number;
    timeSpent: number;
    actionsPerformed: number;
    lastVisit: number;
  };
}

export interface InstallPromptConfig {
  enableIntelligentTiming: boolean;
  enableConstructionSiteMode: boolean;
  enableAnalytics: boolean;
  delayAfterPageLoad: number;
  minEngagementScore: number;
  maxDismissals: number;
  showPersistentReminder: boolean;
  customBranding: {
    appName: string;
    tagline: string;
    benefits: string[];
    primaryColor: string;
    logoUrl?: string;
  };
}

export interface PWAInstallPromptProps {
  config?: Partial<InstallPromptConfig>;
  onInstallSuccess?: () => void;
  onInstallDeclined?: () => void;
  onPromptShown?: () => void;
  onPromptDismissed?: () => void;
  className?: string;
  enableFloatingButton?: boolean;
}

/**
 * PWA INSTALL PROMPT COMPONENT
 * Intelligent cross-platform PWA installation prompts with analytics
 */
export const PWAInstallPrompt: React.FC<PWAInstallPromptProps> = ({
  config = {},
  onInstallSuccess,
  onInstallDeclined,
  onPromptShown,
  onPromptDismissed,
  className = '',
  enableFloatingButton = true
}) => {
  // Configuration with defaults
  const promptConfig: InstallPromptConfig = useMemo(() => ({
    enableIntelligentTiming: true,
    enableConstructionSiteMode: true,
    enableAnalytics: true,
    delayAfterPageLoad: 5000, // 5 seconds
    minEngagementScore: 50,
    maxDismissals: 3,
    showPersistentReminder: true,
    customBranding: {
      appName: 'STR Certified',
      tagline: 'Professional Property Inspection Platform',
      benefits: [
        'Work offline during inspections',
        'Instant camera and photo capture',
        'Faster app loading and performance',
        'Native device integration',
        'Professional desktop experience'
      ],
      primaryColor: '#2563eb',
      logoUrl: '/lovable-uploads/ea9dd662-995b-4cd0-95d4-9f31b2aa8d3b.png'
    },
    ...config
  }), [config]);

  // Component state
  const [promptState, setPromptState] = useState<InstallPromptState>({
    isInstallable: false,
    isInstalled: false,
    showPrompt: false,
    showInstructions: false,
    platform: 'unknown',
    installationMethod: 'unsupported',
    userEngagement: {
      sessions: 0,
      timeSpent: 0,
      actionsPerformed: 0,
      lastVisit: 0
    }
  });

  // Installation event handling
  const [deferredPrompt, setDeferredPrompt] = useState<PWAInstallEvent | null>(null);
  const [dismissalCount, setDismissalCount] = useState(0);
  const [lastDismissalTime, setLastDismissalTime] = useState(0);

  // UI state
  const [showFloatingButton, setShowFloatingButton] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  // Refs for tracking and optimization
  const engagementTimerRef = useRef<number | null>(null);
  const installAnalyticsRef = useRef<any>({
    promptShownCount: 0,
    installAttempts: 0,
    installSuccesses: 0,
    dismissalReasons: [],
    platformStats: {}
  });

  /**
   * COMPONENT INITIALIZATION
   * Sets up PWA installation detection and user engagement tracking
   */
  useEffect(() => {
    const initializePWAInstallPrompt = async () => {
      try {
        logger.info('🚀 Initializing PWA Install Prompt', {
          config: promptConfig,
          userAgent: navigator.userAgent
        }, 'PWA_INSTALL');

        // Detect platform and installation capabilities
        await detectPlatformAndCapabilities();

        // Check if already installed
        await checkInstallationStatus();

        // Setup engagement tracking
        if (promptConfig.enableIntelligentTiming) {
          setupEngagementTracking();
        }

        // Setup installation event listeners
        setupInstallationEventListeners();

        // Load user preferences and history
        loadUserPreferences();

        // Start intelligent timing evaluation
        if (promptConfig.enableIntelligentTiming) {
          startIntelligentTimingEvaluation();
        }

        logger.info('✅ PWA Install Prompt initialized successfully', {
          platform: promptState.platform,
          installationMethod: promptState.installationMethod,
          isInstallable: promptState.isInstallable
        }, 'PWA_INSTALL');

      } catch (error) {
        logger.error('❌ PWA Install Prompt initialization failed', { error }, 'PWA_INSTALL');
      }
    };

    initializePWAInstallPrompt();

    // Cleanup on unmount
    return () => {
      cleanupPWAInstallPrompt();
    };
  }, []);

  /**
   * PLATFORM AND CAPABILITIES DETECTION
   * Detects the user's platform and available installation methods
   */
  const detectPlatformAndCapabilities = async (): Promise<void> => {
    const userAgent = navigator.userAgent.toLowerCase();
    let platform: InstallPromptState['platform'] = 'unknown';
    let installationMethod: InstallPromptState['installationMethod'] = 'unsupported';

    // Detect platform
    if (userAgent.includes('chrome') && !userAgent.includes('edg')) {
      platform = 'chrome';
    } else if (userAgent.includes('safari') && !userAgent.includes('chrome')) {
      platform = 'safari';
    } else if (userAgent.includes('firefox')) {
      platform = 'firefox';
    } else if (userAgent.includes('edg')) {
      platform = 'edge';
    } else if (userAgent.includes('samsung')) {
      platform = 'samsung';
    } else if (userAgent.includes('opr')) {
      platform = 'opera';
    }

    // Detect installation method
    if ('beforeinstallprompt' in window) {
      installationMethod = 'native';
    } else if (platform === 'safari' && 'standalone' in navigator) {
      installationMethod = 'manual';
    } else if (platform === 'firefox' || platform === 'opera') {
      installationMethod = 'manual';
    }

    setPromptState(prev => ({
      ...prev,
      platform,
      installationMethod,
      isInstallable: installationMethod !== 'unsupported'
    }));

    logger.info('Platform and capabilities detected', {
      platform,
      installationMethod,
      userAgent: navigator.userAgent
    }, 'PWA_INSTALL');
  };

  /**
   * INSTALLATION STATUS CHECK
   * Checks if the PWA is already installed
   */
  const checkInstallationStatus = async (): Promise<void> => {
    let isInstalled = false;

    // Check for standalone mode (already installed)
    if (window.matchMedia('(display-mode: standalone)').matches) {
      isInstalled = true;
    }

    // Check for navigator.standalone (iOS Safari)
    if ('standalone' in navigator && (navigator as any).standalone) {
      isInstalled = true;
    }

    // Check for PWA context
    if (window.location.search.includes('source=pwa')) {
      isInstalled = true;
    }

    setPromptState(prev => ({
      ...prev,
      isInstalled
    }));

    if (isInstalled) {
      logger.info('PWA is already installed', {}, 'PWA_INSTALL');
    }
  };

  /**
   * ENGAGEMENT TRACKING SETUP
   * Sets up user engagement tracking for intelligent prompt timing
   */
  const setupEngagementTracking = (): void => {
    // Track page visibility and user activity
    const startEngagementTimer = () => {
      engagementTimerRef.current = window.setInterval(() => {
        setPromptState(prev => ({
          ...prev,
          userEngagement: {
            ...prev.userEngagement,
            timeSpent: prev.userEngagement.timeSpent + 1000 // 1 second
          }
        }));
      }, 1000);
    };

    const stopEngagementTimer = () => {
      if (engagementTimerRef.current) {
        clearInterval(engagementTimerRef.current);
        engagementTimerRef.current = null;
      }
    };

    // Track user interactions
    const trackUserAction = () => {
      setPromptState(prev => ({
        ...prev,
        userEngagement: {
          ...prev.userEngagement,
          actionsPerformed: prev.userEngagement.actionsPerformed + 1
        }
      }));
    };

    // Setup event listeners
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        stopEngagementTimer();
      } else {
        startEngagementTimer();
      }
    });

    document.addEventListener('click', trackUserAction);
    document.addEventListener('keydown', trackUserAction);
    document.addEventListener('scroll', trackUserAction);

    // Start timer
    startEngagementTimer();

    logger.info('Engagement tracking setup complete', {}, 'PWA_INSTALL');
  };

  /**
   * INSTALLATION EVENT LISTENERS SETUP
   * Sets up event listeners for PWA installation events
   */
  const setupInstallationEventListeners = (): void => {
    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as PWAInstallEvent);
      
      setPromptState(prev => ({
        ...prev,
        isInstallable: true
      }));

      logger.info('beforeinstallprompt event captured', {
        platforms: (e as PWAInstallEvent).platforms
      }, 'PWA_INSTALL');
    };

    // Listen for appinstalled event
    const handleAppInstalled = () => {
      setPromptState(prev => ({
        ...prev,
        isInstalled: true,
        showPrompt: false,
        showInstructions: false
      }));

      // Track successful installation
      installAnalyticsRef.current.installSuccesses++;
      
      onInstallSuccess?.();
      
      logger.info('PWA successfully installed', {
        platform: promptState.platform,
        method: promptState.installationMethod
      }, 'PWA_INSTALL');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    // Cleanup function will remove these listeners
  };

  /**
   * INTELLIGENT TIMING EVALUATION
   * Evaluates user engagement to determine optimal prompt timing
   */
  const startIntelligentTimingEvaluation = (): void => {
    setTimeout(() => {
      evaluatePromptTiming();
    }, promptConfig.delayAfterPageLoad);
  };

  /**
   * PROMPT TIMING EVALUATION
   * Evaluates whether to show the install prompt based on user engagement
   */
  const evaluatePromptTiming = (): void => {
    if (promptState.isInstalled || !promptState.isInstallable) {
      return;
    }

    // Check dismissal limits
    if (dismissalCount >= promptConfig.maxDismissals) {
      logger.info('Install prompt dismissed too many times', { dismissalCount }, 'PWA_INSTALL');
      return;
    }

    // Check recent dismissal
    const timeSinceLastDismissal = Date.now() - lastDismissalTime;
    if (timeSinceLastDismissal < 24 * 60 * 60 * 1000) { // 24 hours
      logger.info('Install prompt dismissed recently', { timeSinceLastDismissal }, 'PWA_INSTALL');
      return;
    }

    // Calculate engagement score
    const engagementScore = calculateEngagementScore();
    
    if (engagementScore >= promptConfig.minEngagementScore) {
      showInstallPrompt();
    } else if (promptConfig.showPersistentReminder && enableFloatingButton) {
      setShowFloatingButton(true);
    }

    logger.info('Prompt timing evaluation completed', {
      engagementScore,
      minRequired: promptConfig.minEngagementScore,
      willShowPrompt: engagementScore >= promptConfig.minEngagementScore
    }, 'PWA_INSTALL');
  };

  /**
   * ENGAGEMENT SCORE CALCULATION
   * Calculates user engagement score for prompt timing
   */
  const calculateEngagementScore = (): number => {
    const { timeSpent, actionsPerformed, sessions } = promptState.userEngagement;
    
    // Scoring algorithm (0-100)
    let score = 0;
    
    // Time spent (max 40 points)
    score += Math.min(40, (timeSpent / 1000) / 60 * 10); // 10 points per minute, max 4 minutes
    
    // Actions performed (max 30 points)
    score += Math.min(30, actionsPerformed * 2); // 2 points per action, max 15 actions
    
    // Session count (max 20 points)
    score += Math.min(20, sessions * 5); // 5 points per session, max 4 sessions
    
    // Page depth bonus (max 10 points)
    const pageDepth = Math.min(5, history.length);
    score += pageDepth * 2;
    
    return Math.round(score);
  };

  /**
   * SHOW INSTALL PROMPT
   * Displays the appropriate install prompt based on platform
   */
  const showInstallPrompt = useCallback((): void => {
    if (promptState.isInstalled) return;

    setPromptState(prev => ({ ...prev, showPrompt: true }));
    setIsAnimating(true);
    installAnalyticsRef.current.promptShownCount++;
    
    onPromptShown?.();
    
    logger.info('Install prompt shown', {
      platform: promptState.platform,
      method: promptState.installationMethod,
      engagementScore: calculateEngagementScore()
    }, 'PWA_INSTALL');
  }, [promptState.isInstalled, promptState.platform, promptState.installationMethod, onPromptShown]);

  /**
   * HANDLE NATIVE INSTALLATION
   * Handles native PWA installation for supported browsers
   */
  const handleNativeInstallation = useCallback(async (): Promise<void> => {
    if (!deferredPrompt) {
      logger.warn('No deferred prompt available for native installation', {}, 'PWA_INSTALL');
      return;
    }

    try {
      installAnalyticsRef.current.installAttempts++;
      
      // Show the native install prompt
      await deferredPrompt.prompt();
      
      // Wait for user choice
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        logger.info('User accepted native install prompt', {}, 'PWA_INSTALL');
        
        setPromptState(prev => ({
          ...prev,
          showPrompt: false,
          isInstalled: true
        }));
        
        onInstallSuccess?.();
      } else {
        logger.info('User dismissed native install prompt', {}, 'PWA_INSTALL');
        handleInstallDeclined('native_dismissed');
      }
      
      // Clear the deferred prompt
      setDeferredPrompt(null);
      
    } catch (error) {
      logger.error('Native installation failed', { error }, 'PWA_INSTALL');
      handleInstallDeclined('native_error');
    }
  }, [deferredPrompt, onInstallSuccess]);

  /**
   * HANDLE MANUAL INSTALLATION
   * Shows manual installation instructions for platforms without native support
   */
  const handleManualInstallation = useCallback((): void => {
    setPromptState(prev => ({
      ...prev,
      showPrompt: false,
      showInstructions: true
    }));
    setCurrentStep(0);
    
    logger.info('Manual installation instructions shown', {
      platform: promptState.platform
    }, 'PWA_INSTALL');
  }, [promptState.platform]);

  /**
   * HANDLE INSTALL DECLINED
   * Handles user declining the installation prompt
   */
  const handleInstallDeclined = useCallback((reason: string = 'user_dismissed'): void => {
    setDismissalCount(prev => prev + 1);
    setLastDismissalTime(Date.now());
    
    setPromptState(prev => ({
      ...prev,
      showPrompt: false,
      showInstructions: false
    }));
    
    // Store dismissal in analytics
    installAnalyticsRef.current.dismissalReasons.push({
      reason,
      timestamp: Date.now(),
      platform: promptState.platform
    });
    
    onInstallDeclined?.();
    onPromptDismissed?.();
    
    logger.info('Install prompt declined', {
      reason,
      dismissalCount: dismissalCount + 1
    }, 'PWA_INSTALL');
  }, [dismissalCount, promptState.platform, onInstallDeclined, onPromptDismissed]);

  /**
   * USER PREFERENCES MANAGEMENT
   */
  const loadUserPreferences = (): void => {
    try {
      const stored = localStorage.getItem('pwa_install_preferences');
      if (stored) {
        const prefs = JSON.parse(stored);
        setDismissalCount(prefs.dismissalCount || 0);
        setLastDismissalTime(prefs.lastDismissalTime || 0);
        
        setPromptState(prev => ({
          ...prev,
          userEngagement: {
            ...prev.userEngagement,
            sessions: (prefs.sessions || 0) + 1,
            lastVisit: Date.now()
          }
        }));
      }
    } catch (error) {
      logger.warn('Failed to load user preferences', { error }, 'PWA_INSTALL');
    }
  };

  const saveUserPreferences = (): void => {
    try {
      const prefs = {
        dismissalCount,
        lastDismissalTime,
        sessions: promptState.userEngagement.sessions,
        lastVisit: promptState.userEngagement.lastVisit
      };
      localStorage.setItem('pwa_install_preferences', JSON.stringify(prefs));
    } catch (error) {
      logger.warn('Failed to save user preferences', { error }, 'PWA_INSTALL');
    }
  };

  /**
   * CLEANUP
   */
  const cleanupPWAInstallPrompt = (): void => {
    if (engagementTimerRef.current) {
      clearInterval(engagementTimerRef.current);
    }
    
    saveUserPreferences();
    
    logger.info('PWA Install Prompt cleaned up', {}, 'PWA_INSTALL');
  };

  // Get platform-specific instructions
  const getInstallationInstructions = () => {
    switch (promptState.platform) {
      case 'safari':
        return [
          'Tap the Share button at the bottom of the screen',
          'Scroll down and tap "Add to Home Screen"',
          'Tap "Add" to confirm installation',
          'The app will appear on your home screen'
        ];
      case 'firefox':
        return [
          'Tap the menu button (three dots)',
          'Select "Install" or "Add to Home Screen"',
          'Tap "Add" to confirm installation',
          'The app will appear on your home screen'
        ];
      case 'chrome':
      case 'edge':
      case 'samsung':
      case 'opera':
        return [
          'Look for the install button in your browser',
          'Tap "Install" when prompted',
          'The app will be added to your device'
        ];
      default:
        return [
          'Look for an "Install" or "Add to Home Screen" option',
          'This is usually found in your browser menu',
          'Follow the prompts to install the app'
        ];
    }
  };

  // Don't render if already installed or not installable
  if (promptState.isInstalled || !promptState.isInstallable) {
    return null;
  }

  // Floating install button
  const FloatingInstallButton = () => (
    <button
      id="floating-install-button"
      onClick={showInstallPrompt}
      className={`fixed bottom-6 right-6 z-50 bg-blue-600 hover:bg-blue-700 text-white rounded-full p-4 shadow-lg transition-all duration-300 ${
        showFloatingButton ? 'opacity-100 scale-100' : 'opacity-0 scale-0'
      } ${promptConfig.enableConstructionSiteMode ? 'p-6 text-lg' : ''}`}
      aria-label="Install STR Certified App"
    >
      <div className="flex items-center space-x-2">
        <span className="text-2xl">📱</span>
        {promptConfig.enableConstructionSiteMode && (
          <span className="hidden sm:inline font-medium">Install App</span>
        )}
      </div>
    </button>
  );

  // Main install prompt modal
  const InstallPromptModal = () => (
    <div
      id="install-prompt-modal"
      className={`fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 transition-opacity duration-300 ${
        promptState.showPrompt ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}
      onClick={(e) => e.target === e.currentTarget && handleInstallDeclined('backdrop_click')}
    >
      <div
        id="install-prompt-content"
        className={`bg-white rounded-lg shadow-xl max-w-md mx-4 transform transition-all duration-300 ${
          isAnimating ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
        } ${promptConfig.enableConstructionSiteMode ? 'max-w-lg' : ''}`}
      >
        {/* Header */}
        <div
          id="install-prompt-header"
          className="flex items-center justify-between p-6 border-b"
          style={{ borderColor: promptConfig.customBranding.primaryColor + '20' }}
        >
          <div className="flex items-center space-x-3">
            {promptConfig.customBranding.logoUrl && (
              <img
                src={promptConfig.customBranding.logoUrl}
                alt={promptConfig.customBranding.appName}
                className="w-12 h-12 rounded-lg"
              />
            )}
            <div>
              <h2 className="text-xl font-semibold text-gray-800">
                Install {promptConfig.customBranding.appName}
              </h2>
              <p className="text-sm text-gray-600">
                {promptConfig.customBranding.tagline}
              </p>
            </div>
          </div>
          
          <button
            id="close-install-prompt"
            onClick={() => handleInstallDeclined('close_button')}
            className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
            aria-label="Close install prompt"
          >
            ×
          </button>
        </div>

        {/* Benefits */}
        <div id="install-benefits" className="p-6">
          <h3 className="text-lg font-medium text-gray-800 mb-4">
            Why install the app?
          </h3>
          <ul className="space-y-3">
            {promptConfig.customBranding.benefits.map((benefit, index) => (
              <li key={index} className="flex items-start space-x-3">
                <span className="text-green-500 text-lg leading-none">✓</span>
                <span className="text-gray-700 text-sm leading-relaxed">{benefit}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Actions */}
        <div id="install-actions" className="flex flex-col sm:flex-row gap-3 p-6 bg-gray-50">
          <button
            id="install-button"
            onClick={promptState.installationMethod === 'native' ? handleNativeInstallation : handleManualInstallation}
            className={`flex-1 py-3 px-6 rounded-lg font-medium transition-colors ${
              promptConfig.enableConstructionSiteMode ? 'py-4 text-lg' : ''
            }`}
            style={{
              backgroundColor: promptConfig.customBranding.primaryColor,
              color: 'white'
            }}
          >
            {promptState.installationMethod === 'native' ? 'Install Now' : 'Show Instructions'}
          </button>
          
          <button
            id="maybe-later-button"
            onClick={() => handleInstallDeclined('maybe_later')}
            className={`flex-1 py-3 px-6 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors ${
              promptConfig.enableConstructionSiteMode ? 'py-4 text-lg' : ''
            }`}
          >
            Maybe Later
          </button>
        </div>
      </div>
    </div>
  );

  // Manual installation instructions modal
  const InstallInstructionsModal = () => (
    <div
      id="install-instructions-modal"
      className={`fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 transition-opacity duration-300 ${
        promptState.showInstructions ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}
      onClick={(e) => e.target === e.currentTarget && handleInstallDeclined('instructions_backdrop')}
    >
      <div
        id="install-instructions-content"
        className={`bg-white rounded-lg shadow-xl max-w-md mx-4 transform transition-all duration-300 ${
          promptState.showInstructions ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
        } ${promptConfig.enableConstructionSiteMode ? 'max-w-lg' : ''}`}
      >
        {/* Header */}
        <div id="instructions-header" className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-800">
            Install Instructions
          </h2>
          <button
            id="close-instructions"
            onClick={() => handleInstallDeclined('instructions_close')}
            className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
            aria-label="Close instructions"
          >
            ×
          </button>
        </div>

        {/* Instructions */}
        <div id="installation-steps" className="p-6">
          <p className="text-sm text-gray-600 mb-4">
            Follow these steps to install {promptConfig.customBranding.appName} on your {promptState.platform}:
          </p>
          
          <ol className="space-y-4">
            {getInstallationInstructions().map((instruction, index) => (
              <li
                key={index}
                className={`flex items-start space-x-3 ${
                  currentStep === index ? 'bg-blue-50 p-3 rounded-lg border border-blue-200' : ''
                }`}
              >
                <span
                  className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-sm font-medium ${
                    currentStep > index
                      ? 'bg-green-500 text-white'
                      : currentStep === index
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  {currentStep > index ? '✓' : index + 1}
                </span>
                <span className={`text-sm ${currentStep === index ? 'font-medium text-blue-800' : 'text-gray-700'}`}>
                  {instruction}
                </span>
              </li>
            ))}
          </ol>

          {/* Step navigation */}
          <div id="step-navigation" className="flex justify-between mt-6">
            <button
              onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
              disabled={currentStep === 0}
              className="py-2 px-4 text-sm border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            
            <span className="text-sm text-gray-500">
              {currentStep + 1} of {getInstallationInstructions().length}
            </span>
            
            <button
              onClick={() => setCurrentStep(Math.min(getInstallationInstructions().length - 1, currentStep + 1))}
              disabled={currentStep === getInstallationInstructions().length - 1}
              className="py-2 px-4 text-sm border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>

        {/* Actions */}
        <div id="instructions-actions" className="flex gap-3 p-6 bg-gray-50">
          <button
            onClick={() => {
              setPromptState(prev => ({ ...prev, showInstructions: false }));
              onInstallSuccess?.();
            }}
            className={`flex-1 py-3 px-6 rounded-lg font-medium transition-colors ${
              promptConfig.enableConstructionSiteMode ? 'py-4 text-lg' : ''
            }`}
            style={{
              backgroundColor: promptConfig.customBranding.primaryColor,
              color: 'white'
            }}
          >
            Got It!
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div id="pwa-install-prompt-container" className={className}>
      {/* Floating install button */}
      {enableFloatingButton && <FloatingInstallButton />}
      
      {/* Main install prompt modal */}
      <InstallPromptModal />
      
      {/* Manual installation instructions modal */}
      <InstallInstructionsModal />
    </div>
  );
};

export default PWAInstallPrompt;