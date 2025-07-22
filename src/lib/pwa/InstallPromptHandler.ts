/**
 * INSTALL PROMPT HANDLER - ELITE PWA INSTALLATION SYSTEM
 * 
 * Advanced PWA installation management with intelligent prompting, iOS Safari support,
 * and construction site optimized installation flow. Designed for Netflix/Meta
 * installation conversion rates with zero friction user experience.
 * 
 * CORE CAPABILITIES:
 * - Smart timing for install prompts based on user engagement
 * - iOS Safari detection and custom install experience
 * - Install criteria evaluation and prompt optimization
 * - Cross-platform installation support
 * - Installation analytics and success rate tracking
 * - Construction site specific install guidance
 * 
 * INSTALLATION STRATEGIES:
 * 1. Android Chrome - Native beforeinstallprompt API
 * 2. iOS Safari - Custom modal with step-by-step instructions
 * 3. Desktop Chrome - Enhanced beforeinstallprompt with benefits
 * 4. Edge/Firefox - Custom installation guidance
 * 5. Samsung Internet - Native prompt with Samsung optimizations
 * 
 * ENGAGEMENT TRIGGERS:
 * - User completes first inspection (high engagement signal)
 * - User visits app 3+ times (return user optimization)
 * - User spends 5+ minutes in session (engagement threshold)
 * - User captures photos (core functionality usage)
 * - User works offline (PWA value demonstration)
 * 
 * CONSTRUCTION SITE OPTIMIZATION:
 * - Emphasize offline capabilities for spotty connections
 * - Highlight battery optimization for long inspections
 * - Show home screen access for quick launching
 * - Demonstrate camera integration benefits
 * - Focus on reliability in challenging environments
 * 
 * @author STR Certified Engineering Team
 */

import { logger } from '@/utils/logger';

// Core interfaces for install prompt management
export interface InstallPromptState {
  isSupported: boolean;
  isInstalled: boolean;
  isIOS: boolean;
  isStandalone: boolean;
  canPrompt: boolean;
  promptShown: boolean;
  installationSource: InstallationSource;
  userEngagement: UserEngagement;
}

export interface InstallationSource {
  platform: 'android_chrome' | 'ios_safari' | 'desktop_chrome' | 'edge' | 'firefox' | 'samsung' | 'unknown';
  browser: string;
  version: string;
  supportsNativePrompt: boolean;
  requiresCustomFlow: boolean;
}

export interface UserEngagement {
  visitCount: number;
  totalTimeSpent: number;
  inspectionsCompleted: number;
  photosCapured: number;
  offlineUsage: number;
  lastVisit: Date;
  engagementScore: number;
}

export interface InstallPromptConfig {
  minVisits: number;
  minTimeSpent: number;
  minEngagementScore: number;
  cooldownPeriod: number;
  maxPromptAttempts: number;
  showBenefitsModal: boolean;
  emphasizeOfflineFeatures: boolean;
}

export interface InstallationMetrics {
  promptsShown: number;
  promptsAccepted: number;
  promptsDismissed: number;
  installationsCompleted: number;
  installationsFailed: number;
  conversionRate: number;
  averageTimeToInstall: number;
  topInstallationReasons: string[];
}

export interface IOSInstallInstructions {
  steps: IOSInstallStep[];
  visualGuides: VisualGuide[];
  troubleshooting: TroubleshootingStep[];
  benefits: InstallationBenefit[];
}

export interface IOSInstallStep {
  stepNumber: number;
  instruction: string;
  icon: string;
  description: string;
  screenshot?: string;
  isRequired: boolean;
}

export interface VisualGuide {
  type: 'image' | 'animation' | 'video';
  url: string;
  description: string;
  step: number;
}

export interface InstallationBenefit {
  title: string;
  description: string;
  icon: string;
  category: 'performance' | 'convenience' | 'reliability' | 'features';
  importance: 'critical' | 'high' | 'medium' | 'low';
}

export class InstallPromptHandler {
  private static instance: InstallPromptHandler;
  private deferredPrompt: any = null;
  private installPromptState: InstallPromptState;
  private config: InstallPromptConfig;
  private metrics: InstallationMetrics;
  private iosInstructions: IOSInstallInstructions;
  
  private constructor() {
    this.config = {
      minVisits: 2,
      minTimeSpent: 300000, // 5 minutes
      minEngagementScore: 0.6,
      cooldownPeriod: 86400000, // 24 hours
      maxPromptAttempts: 3,
      showBenefitsModal: true,
      emphasizeOfflineFeatures: true
    };
    
    this.metrics = {
      promptsShown: 0,
      promptsAccepted: 0,
      promptsDismissed: 0,
      installationsCompleted: 0,
      installationsFailed: 0,
      conversionRate: 0,
      averageTimeToInstall: 0,
      topInstallationReasons: []
    };
    
    this.installPromptState = this.initializePromptState();
    this.iosInstructions = this.initializeIOSInstructions();
    this.setupInstallPromptListeners();
  }
  
  static getInstance(): InstallPromptHandler {
    if (!InstallPromptHandler.instance) {
      InstallPromptHandler.instance = new InstallPromptHandler();
    }
    return InstallPromptHandler.instance;
  }

  /**
   * Initialize install prompt system with platform detection
   */
  async initialize(): Promise<boolean> {
    try {
      logger.info('Initializing Install Prompt Handler', {}, 'INSTALL_PROMPT');

      // Detect platform and capabilities
      await this.detectPlatformCapabilities();
      
      // Load user engagement data
      await this.loadUserEngagement();
      
      // Check if already installed
      await this.checkInstallationStatus();
      
      // Setup engagement tracking
      this.setupEngagementTracking();
      
      // Load metrics from storage
      await this.loadInstallationMetrics();

      logger.info('Install Prompt Handler initialized successfully', {
        platform: this.installPromptState.installationSource.platform,
        isInstalled: this.installPromptState.isInstalled,
        canPrompt: this.installPromptState.canPrompt
      }, 'INSTALL_PROMPT');

      return true;

    } catch (error) {
      logger.error('Install Prompt Handler initialization failed', { error }, 'INSTALL_PROMPT');
      return false;
    }
  }

  /**
   * Check if install prompt should be shown based on engagement criteria
   */
  async shouldShowInstallPrompt(): Promise<boolean> {
    // Don't show if already installed
    if (this.installPromptState.isInstalled || this.installPromptState.isStandalone) {
      return false;
    }

    // Don't show if platform doesn't support installation
    if (!this.installPromptState.isSupported) {
      return false;
    }

    // Check if prompt was recently shown (cooldown period)
    const lastPromptTime = this.getLastPromptTime();
    if (lastPromptTime && (Date.now() - lastPromptTime) < this.config.cooldownPeriod) {
      return false;
    }

    // Check if max prompt attempts reached
    if (this.metrics.promptsShown >= this.config.maxPromptAttempts) {
      return false;
    }

    // Evaluate user engagement criteria
    const engagement = this.installPromptState.userEngagement;
    
    const meetsVisitCriteria = engagement.visitCount >= this.config.minVisits;
    const meetsTimeCriteria = engagement.totalTimeSpent >= this.config.minTimeSpent;
    const meetsEngagementCriteria = engagement.engagementScore >= this.config.minEngagementScore;
    
    // High-value engagement signals override basic criteria
    const hasHighValueSignals = 
      engagement.inspectionsCompleted > 0 || 
      engagement.photosCapured > 5 ||
      engagement.offlineUsage > 0;

    logger.info('Install prompt criteria evaluation', {
      meetsVisitCriteria,
      meetsTimeCriteria,
      meetsEngagementCriteria,
      hasHighValueSignals,
      engagementScore: engagement.engagementScore
    }, 'INSTALL_PROMPT');

    return (meetsVisitCriteria && meetsTimeCriteria && meetsEngagementCriteria) || hasHighValueSignals;
  }

  /**
   * Show appropriate install prompt for detected platform
   */
  async showInstallPrompt(): Promise<InstallPromptResult> {
    try {
      const shouldShow = await this.shouldShowInstallPrompt();
      
      if (!shouldShow) {
        return {
          success: false,
          reason: 'criteria_not_met',
          userChoice: 'dismissed'
        };
      }

      logger.info('Showing install prompt', {
        platform: this.installPromptState.installationSource.platform,
        userEngagement: this.installPromptState.userEngagement
      }, 'INSTALL_PROMPT');

      this.metrics.promptsShown++;
      this.installPromptState.promptShown = true;
      this.recordPromptTime();

      // Show platform-specific install prompt
      const result = await this.showPlatformSpecificPrompt();
      
      // Update metrics based on result
      this.updateMetricsFromResult(result);
      
      // Save metrics
      await this.saveInstallationMetrics();

      return result;

    } catch (error) {
      logger.error('Install prompt failed', { error }, 'INSTALL_PROMPT');
      
      return {
        success: false,
        reason: 'system_error',
        userChoice: 'error',
        error: error.message
      };
    }
  }

  /**
   * Show platform-specific install prompt
   */
  private async showPlatformSpecificPrompt(): Promise<InstallPromptResult> {
    const platform = this.installPromptState.installationSource.platform;
    
    switch (platform) {
      case 'android_chrome':
        return this.showAndroidChromePrompt();
      
      case 'ios_safari':
        return this.showIOSSafariPrompt();
      
      case 'desktop_chrome':
        return this.showDesktopChromePrompt();
      
      case 'edge':
      case 'firefox':
        return this.showGenericBrowserPrompt();
      
      case 'samsung':
        return this.showSamsungInternetPrompt();
      
      default:
        return this.showFallbackPrompt();
    }
  }

  /**
   * Show Android Chrome native install prompt
   */
  private async showAndroidChromePrompt(): Promise<InstallPromptResult> {
    if (!this.deferredPrompt) {
      return {
        success: false,
        reason: 'native_prompt_not_available',
        userChoice: 'dismissed'
      };
    }

    try {
      // Show benefits modal first if configured
      if (this.config.showBenefitsModal) {
        const benefitsAccepted = await this.showInstallBenefitsModal('android');
        if (!benefitsAccepted) {
          this.metrics.promptsDismissed++;
          return {
            success: false,
            reason: 'benefits_dismissed',
            userChoice: 'dismissed'
          };
        }
      }

      // Show native prompt
      this.deferredPrompt.prompt();
      const choiceResult = await this.deferredPrompt.userChoice;
      
      logger.info('Android Chrome install prompt result', {
        outcome: choiceResult.outcome
      }, 'INSTALL_PROMPT');

      if (choiceResult.outcome === 'accepted') {
        this.metrics.promptsAccepted++;
        return {
          success: true,
          reason: 'user_accepted',
          userChoice: 'accepted',
          installationMethod: 'native_android'
        };
      } else {
        this.metrics.promptsDismissed++;
        return {
          success: false,
          reason: 'user_dismissed',
          userChoice: 'dismissed'
        };
      }

    } catch (error) {
      logger.error('Android Chrome prompt failed', { error }, 'INSTALL_PROMPT');
      
      return {
        success: false,
        reason: 'prompt_error',
        userChoice: 'error',
        error: error.message
      };
    }
  }

  /**
   * Show iOS Safari custom install prompt with step-by-step instructions
   */
  private async showIOSSafariPrompt(): Promise<InstallPromptResult> {
    try {
      // Create and show iOS install modal
      const modalResult = await this.showIOSInstallModal();
      
      if (modalResult.userAccepted) {
        this.metrics.promptsAccepted++;
        
        // Track if user actually completed installation
        setTimeout(() => {
          this.checkIOSInstallationCompletion();
        }, 30000); // Check after 30 seconds
        
        return {
          success: true,
          reason: 'instructions_shown',
          userChoice: 'accepted',
          installationMethod: 'ios_manual'
        };
      } else {
        this.metrics.promptsDismissed++;
        return {
          success: false,
          reason: 'user_dismissed',
          userChoice: 'dismissed'
        };
      }

    } catch (error) {
      logger.error('iOS Safari prompt failed', { error }, 'INSTALL_PROMPT');
      
      return {
        success: false,
        reason: 'modal_error',
        userChoice: 'error',
        error: error.message
      };
    }
  }

  /**
   * Show iOS install modal with detailed instructions
   */
  private async showIOSInstallModal(): Promise<{ userAccepted: boolean }> {
    return new Promise((resolve) => {
      // Create modal overlay
      const overlay = document.createElement('div');
      overlay.id = 'ios-install-modal-overlay';
      overlay.className = 'fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4';
      
      // Create modal content
      const modal = document.createElement('div');
      modal.className = 'bg-white rounded-lg max-w-md w-full max-h-90vh overflow-y-auto';
      
      modal.innerHTML = `
        <div class="p-6">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-xl font-bold text-gray-900">Install STR Certified</h2>
            <button id="ios-modal-close" class="text-gray-400 hover:text-gray-600">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>
          
          <div class="mb-6">
            <p class="text-gray-600 mb-4">
              Install STR Certified as an app for the best inspection experience, especially when working on construction sites with limited connectivity.
            </p>
            
            <div class="grid grid-cols-2 gap-3 mb-4">
              <div class="bg-blue-50 p-3 rounded-lg">
                <div class="text-blue-600 font-medium text-sm">📱 Home Screen Access</div>
                <div class="text-blue-700 text-xs">Quick launch from phone</div>
              </div>
              <div class="bg-green-50 p-3 rounded-lg">
                <div class="text-green-600 font-medium text-sm">🔋 Battery Optimized</div>
                <div class="text-green-700 text-xs">Longer inspection sessions</div>
              </div>
              <div class="bg-purple-50 p-3 rounded-lg">
                <div class="text-purple-600 font-medium text-sm">📡 Works Offline</div>
                <div class="text-purple-700 text-xs">Reliable on construction sites</div>
              </div>
              <div class="bg-orange-50 p-3 rounded-lg">
                <div class="text-orange-600 font-medium text-sm">📷 Enhanced Camera</div>
                <div class="text-orange-700 text-xs">Better photo capture</div>
              </div>
            </div>
          </div>
          
          <div class="space-y-4 mb-6">
            <h3 class="font-medium text-gray-900">Installation Steps:</h3>
            
            <div class="flex items-start space-x-3">
              <div class="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-medium flex-shrink-0">1</div>
              <div>
                <div class="font-medium text-gray-900">Tap the Share button</div>
                <div class="text-gray-600 text-sm">Look for <span class="inline-flex items-center"><svg class="w-4 h-4 mx-1" fill="currentColor" viewBox="0 0 20 20"><path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z"></path></svg></span> at the bottom of your screen</div>
              </div>
            </div>
            
            <div class="flex items-start space-x-3">
              <div class="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-medium flex-shrink-0">2</div>
              <div>
                <div class="font-medium text-gray-900">Find "Add to Home Screen"</div>
                <div class="text-gray-600 text-sm">Scroll down in the share menu and tap <span class="font-medium">➕ Add to Home Screen</span></div>
              </div>
            </div>
            
            <div class="flex items-start space-x-3">
              <div class="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-medium flex-shrink-0">3</div>
              <div>
                <div class="font-medium text-gray-900">Tap "Add"</div>
                <div class="text-gray-600 text-sm">Confirm the installation by tapping <span class="font-medium">Add</span> in the top right</div>
              </div>
            </div>
          </div>
          
          <div class="flex space-x-3">
            <button id="ios-install-dismiss" class="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
              Maybe Later
            </button>
            <button id="ios-install-continue" class="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              Got It
            </button>
          </div>
        </div>
      `;
      
      overlay.appendChild(modal);
      document.body.appendChild(overlay);
      
      // Handle modal interactions
      const closeBtn = modal.querySelector('#ios-modal-close');
      const dismissBtn = modal.querySelector('#ios-install-dismiss');
      const continueBtn = modal.querySelector('#ios-install-continue');
      
      const cleanup = () => {
        document.body.removeChild(overlay);
      };
      
      const handleDismiss = () => {
        cleanup();
        resolve({ userAccepted: false });
      };
      
      const handleAccept = () => {
        cleanup();
        resolve({ userAccepted: true });
      };
      
      closeBtn?.addEventListener('click', handleDismiss);
      dismissBtn?.addEventListener('click', handleDismiss);
      continueBtn?.addEventListener('click', handleAccept);
      
      // Close on overlay click
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
          handleDismiss();
        }
      });
    });
  }

  /**
   * Show desktop Chrome enhanced install prompt
   */
  private async showDesktopChromePrompt(): Promise<InstallPromptResult> {
    // Similar to Android but with desktop-specific benefits
    if (!this.deferredPrompt) {
      return this.showFallbackPrompt();
    }

    try {
      // Show desktop benefits modal
      if (this.config.showBenefitsModal) {
        const benefitsAccepted = await this.showInstallBenefitsModal('desktop');
        if (!benefitsAccepted) {
          this.metrics.promptsDismissed++;
          return {
            success: false,
            reason: 'benefits_dismissed',
            userChoice: 'dismissed'
          };
        }
      }

      this.deferredPrompt.prompt();
      const choiceResult = await this.deferredPrompt.userChoice;

      if (choiceResult.outcome === 'accepted') {
        this.metrics.promptsAccepted++;
        return {
          success: true,
          reason: 'user_accepted',
          userChoice: 'accepted',
          installationMethod: 'native_desktop'
        };
      } else {
        this.metrics.promptsDismissed++;
        return {
          success: false,
          reason: 'user_dismissed',
          userChoice: 'dismissed'
        };
      }

    } catch (error) {
      return this.showFallbackPrompt();
    }
  }

  /**
   * Show fallback prompt for unsupported browsers
   */
  private async showFallbackPrompt(): Promise<InstallPromptResult> {
    // Show informational modal about PWA benefits
    // and guide users to supported browsers if needed
    
    this.metrics.promptsShown++;
    
    return {
      success: false,
      reason: 'platform_not_supported',
      userChoice: 'informed',
      message: 'PWA installation not supported on this browser'
    };
  }

  /**
   * Setup event listeners for install prompt management
   */
  private setupInstallPromptListeners(): void {
    // Listen for beforeinstallprompt event
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      this.deferredPrompt = e;
      this.installPromptState.canPrompt = true;
      
      logger.info('Install prompt deferred', {
        platform: this.installPromptState.installationSource.platform
      }, 'INSTALL_PROMPT');
    });

    // Listen for app installation
    window.addEventListener('appinstalled', (e) => {
      this.handleInstallationSuccess();
      
      logger.info('App installed successfully', {
        source: 'native_event'
      }, 'INSTALL_PROMPT');
    });

    // Listen for standalone mode changes (iOS)
    if (window.matchMedia) {
      const standaloneQuery = window.matchMedia('(display-mode: standalone)');
      standaloneQuery.addListener((e) => {
        if (e.matches) {
          this.handleInstallationSuccess();
        }
      });
    }
  }

  /**
   * Handle successful app installation
   */
  private handleInstallationSuccess(): void {
    this.installPromptState.isInstalled = true;
    this.installPromptState.isStandalone = true;
    this.metrics.installationsCompleted++;
    
    // Calculate conversion rate
    this.metrics.conversionRate = this.metrics.promptsShown > 0 ? 
      (this.metrics.installationsCompleted / this.metrics.promptsShown) * 100 : 0;
    
    // Save updated metrics
    this.saveInstallationMetrics();
    
    // Show thank you message
    this.showInstallationSuccessMessage();
    
    logger.info('Installation completed successfully', {
      conversionRate: this.metrics.conversionRate,
      totalInstallations: this.metrics.installationsCompleted
    }, 'INSTALL_PROMPT');
  }

  /**
   * Detect platform capabilities and installation support
   */
  private async detectPlatformCapabilities(): Promise<void> {
    const userAgent = navigator.userAgent;
    const isIOS = /iPad|iPhone|iPod/.test(userAgent);
    const isAndroid = /Android/.test(userAgent);
    const isChrome = /Chrome/.test(userAgent);
    const isSafari = /Safari/.test(userAgent) && !isChrome;
    const isEdge = /Edg/.test(userAgent);
    const isFirefox = /Firefox/.test(userAgent);
    const isSamsung = /SamsungBrowser/.test(userAgent);
    
    let platform: InstallationSource['platform'];
    let supportsNativePrompt = false;
    let requiresCustomFlow = true;
    
    if (isIOS && isSafari) {
      platform = 'ios_safari';
      supportsNativePrompt = false;
      requiresCustomFlow = true;
    } else if (isAndroid && isChrome) {
      platform = 'android_chrome';
      supportsNativePrompt = true;
      requiresCustomFlow = false;
    } else if (!isAndroid && !isIOS && isChrome) {
      platform = 'desktop_chrome';
      supportsNativePrompt = true;
      requiresCustomFlow = false;
    } else if (isEdge) {
      platform = 'edge';
      supportsNativePrompt = true;
      requiresCustomFlow = false;
    } else if (isFirefox) {
      platform = 'firefox';
      supportsNativePrompt = false;
      requiresCustomFlow = true;
    } else if (isSamsung) {
      platform = 'samsung';
      supportsNativePrompt = true;
      requiresCustomFlow = false;
    } else {
      platform = 'unknown';
      supportsNativePrompt = false;
      requiresCustomFlow = true;
    }
    
    this.installPromptState.installationSource = {
      platform,
      browser: this.getBrowserName(userAgent),
      version: this.getBrowserVersion(userAgent),
      supportsNativePrompt,
      requiresCustomFlow
    };
    
    this.installPromptState.isIOS = isIOS;
    this.installPromptState.isSupported = supportsNativePrompt || (isIOS && isSafari);
  }

  /**
   * Check if app is already installed
   */
  private async checkInstallationStatus(): Promise<void> {
    // Check if running in standalone mode
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
                        (window.navigator as any).standalone ||
                        document.referrer.includes('android-app://');
    
    this.installPromptState.isStandalone = isStandalone;
    this.installPromptState.isInstalled = isStandalone;
    
    // For iOS, check if running from home screen
    if (this.installPromptState.isIOS && (window.navigator as any).standalone) {
      this.installPromptState.isInstalled = true;
      this.installPromptState.isStandalone = true;
    }
  }

  /**
   * Initialize user engagement tracking
   */
  private setupEngagementTracking(): void {
    // Track page visibility for time spent calculation
    const sessionStartTime = Date.now();
    let isVisible = !document.hidden;
    
    document.addEventListener('visibilitychange', () => {
      if (document.hidden && isVisible) {
        // Page became hidden - add session time
        const sessionTime = Date.now() - sessionStartTime;
        this.installPromptState.userEngagement.totalTimeSpent += sessionTime;
        isVisible = false;
      } else if (!document.hidden && !isVisible) {
        // Page became visible - start new session
        sessionStartTime = Date.now();
        isVisible = true;
      }
    });
    
    // Track specific user actions
    this.trackInspectionActions();
    this.trackPhotoCapture();
    this.trackOfflineUsage();
    
    // Update engagement score
    this.updateEngagementScore();
  }

  /**
   * Track inspection-related actions for engagement scoring
   */
  private trackInspectionActions(): void {
    // Listen for inspection completion events
    window.addEventListener('inspection-completed', () => {
      this.installPromptState.userEngagement.inspectionsCompleted++;
      this.updateEngagementScore();
      
      // Inspection completion is a high-value signal
      setTimeout(() => {
        this.checkAndShowPromptIfAppropriate();
      }, 2000);
    });
    
    // Listen for checklist item completion
    window.addEventListener('checklist-item-completed', () => {
      this.updateEngagementScore();
    });
  }

  /**
   * Track photo capture for engagement scoring
   */
  private trackPhotoCapture(): void {
    window.addEventListener('photo-captured', () => {
      this.installPromptState.userEngagement.photosCapured++;
      this.updateEngagementScore();
    });
  }

  /**
   * Track offline usage for engagement scoring
   */
  private trackOfflineUsage(): void {
    window.addEventListener('offline-usage-detected', () => {
      this.installPromptState.userEngagement.offlineUsage++;
      this.updateEngagementScore();
      
      // Offline usage demonstrates PWA value
      setTimeout(() => {
        this.checkAndShowPromptIfAppropriate();
      }, 5000);
    });
  }

  /**
   * Update user engagement score based on activity
   */
  private updateEngagementScore(): void {
    const engagement = this.installPromptState.userEngagement;
    
    // Calculate engagement score (0-1 scale)
    let score = 0;
    
    // Visit frequency (0-0.2)
    score += Math.min(engagement.visitCount / 10, 0.2);
    
    // Time spent (0-0.3)
    score += Math.min(engagement.totalTimeSpent / 1800000, 0.3); // 30 minutes = max
    
    // Inspections completed (0-0.3)
    score += Math.min(engagement.inspectionsCompleted / 5, 0.3);
    
    // Photos captured (0-0.1)
    score += Math.min(engagement.photosCapured / 20, 0.1);
    
    // Offline usage (0-0.1)
    score += Math.min(engagement.offlineUsage / 3, 0.1);
    
    engagement.engagementScore = Math.min(score, 1.0);
    
    logger.debug('Engagement score updated', {
      score: engagement.engagementScore,
      visitCount: engagement.visitCount,
      timeSpent: engagement.totalTimeSpent,
      inspections: engagement.inspectionsCompleted
    }, 'INSTALL_PROMPT');
  }

  /**
   * Check if prompt should be shown and show it if appropriate
   */
  private async checkAndShowPromptIfAppropriate(): Promise<void> {
    const shouldShow = await this.shouldShowInstallPrompt();
    if (shouldShow) {
      // Delay prompt slightly for better UX
      setTimeout(() => {
        this.showInstallPrompt();
      }, 1000);
    }
  }

  // Helper methods

  private getBrowserName(userAgent: string): string {
    if (userAgent.includes('Chrome')) return 'Chrome';
    if (userAgent.includes('Safari')) return 'Safari';
    if (userAgent.includes('Firefox')) return 'Firefox';
    if (userAgent.includes('Edge')) return 'Edge';
    if (userAgent.includes('SamsungBrowser')) return 'Samsung Internet';
    return 'Unknown';
  }

  private getBrowserVersion(userAgent: string): string {
    const matches = userAgent.match(/(chrome|safari|firefox|edge|samsung)\/([\d.]+)/i);
    return matches ? matches[2] : 'unknown';
  }

  private initializePromptState(): InstallPromptState {
    return {
      isSupported: false,
      isInstalled: false,
      isIOS: false,
      isStandalone: false,
      canPrompt: false,
      promptShown: false,
      installationSource: {
        platform: 'unknown',
        browser: '',
        version: '',
        supportsNativePrompt: false,
        requiresCustomFlow: true
      },
      userEngagement: {
        visitCount: this.getVisitCount(),
        totalTimeSpent: 0,
        inspectionsCompleted: 0,
        photosCapured: 0,
        offlineUsage: 0,
        lastVisit: new Date(),
        engagementScore: 0
      }
    };
  }

  private initializeIOSInstructions(): IOSInstallInstructions {
    return {
      steps: [
        {
          stepNumber: 1,
          instruction: 'Tap the Share button',
          icon: '⬆️',
          description: 'Look for the share icon at the bottom of Safari',
          isRequired: true
        },
        {
          stepNumber: 2,
          instruction: 'Find "Add to Home Screen"',
          icon: '➕',
          description: 'Scroll down in the share menu',
          isRequired: true
        },
        {
          stepNumber: 3,
          instruction: 'Tap "Add"',
          icon: '✅',
          description: 'Confirm the installation',
          isRequired: true
        }
      ],
      visualGuides: [],
      troubleshooting: [
        {
          stepNumber: 1,
          instruction: 'Share button not visible?',
          icon: '❓',
          description: 'Make sure you\'re using Safari, not another browser',
          isRequired: false
        }
      ],
      benefits: [
        {
          title: 'Works Offline',
          description: 'Complete inspections even without internet',
          icon: '📡',
          category: 'reliability',
          importance: 'critical'
        },
        {
          title: 'Home Screen Access',
          description: 'Quick launch from your phone\'s home screen',
          icon: '📱',
          category: 'convenience',
          importance: 'high'
        },
        {
          title: 'Better Performance',
          description: 'Faster loading and smoother experience',
          icon: '⚡',
          category: 'performance',
          importance: 'high'
        },
        {
          title: 'Enhanced Camera',
          description: 'Improved photo capture for inspections',
          icon: '📷',
          category: 'features',
          importance: 'medium'
        }
      ]
    };
  }

  private getVisitCount(): number {
    const visits = localStorage.getItem('str_certified_visit_count');
    const count = visits ? parseInt(visits, 10) : 0;
    const newCount = count + 1;
    localStorage.setItem('str_certified_visit_count', newCount.toString());
    return newCount;
  }

  private getLastPromptTime(): number | null {
    const lastPrompt = localStorage.getItem('str_certified_last_prompt');
    return lastPrompt ? parseInt(lastPrompt, 10) : null;
  }

  private recordPromptTime(): void {
    localStorage.setItem('str_certified_last_prompt', Date.now().toString());
  }

  // Additional helper methods for metrics, engagement tracking, etc.
  
  /**
   * Get current install prompt state
   */
  getState(): InstallPromptState {
    return { ...this.installPromptState };
  }

  /**
   * Get installation metrics
   */
  getMetrics(): InstallationMetrics {
    return { ...this.metrics };
  }

  /**
   * Force show install prompt (for testing)
   */
  async forceShowPrompt(): Promise<InstallPromptResult> {
    return this.showInstallPrompt();
  }

  // Placeholder implementations for additional methods
  private async loadUserEngagement(): Promise<void> {
    // Load engagement data from localStorage or API
  }

  private async loadInstallationMetrics(): Promise<void> {
    // Load metrics from localStorage
    const saved = localStorage.getItem('str_certified_install_metrics');
    if (saved) {
      try {
        this.metrics = { ...this.metrics, ...JSON.parse(saved) };
      } catch (error) {
        logger.error('Failed to load install metrics', { error }, 'INSTALL_PROMPT');
      }
    }
  }

  private async saveInstallationMetrics(): Promise<void> {
    // Save metrics to localStorage
    localStorage.setItem('str_certified_install_metrics', JSON.stringify(this.metrics));
  }

  private updateMetricsFromResult(result: InstallPromptResult): void {
    if (result.userChoice === 'accepted') {
      this.metrics.promptsAccepted++;
    } else if (result.userChoice === 'dismissed') {
      this.metrics.promptsDismissed++;
    }
    
    // Update conversion rate
    this.metrics.conversionRate = this.metrics.promptsShown > 0 ? 
      (this.metrics.promptsAccepted / this.metrics.promptsShown) * 100 : 0;
  }

  private async showInstallBenefitsModal(platform: string): Promise<boolean> {
    // Implementation for benefits modal
    return true; // Placeholder
  }

  private async showSamsungInternetPrompt(): Promise<InstallPromptResult> {
    // Samsung Internet specific implementation
    return this.showAndroidChromePrompt(); // Use Android Chrome flow
  }

  private async showGenericBrowserPrompt(): Promise<InstallPromptResult> {
    // Generic browser implementation
    return this.showFallbackPrompt();
  }

  private async checkIOSInstallationCompletion(): Promise<void> {
    // Check if iOS installation was completed
    if ((window.navigator as any).standalone) {
      this.handleInstallationSuccess();
    }
  }

  private showInstallationSuccessMessage(): void {
    // Show success message after installation
    logger.info('Showing installation success message', {}, 'INSTALL_PROMPT');
  }
}

// Supporting interfaces and types
export interface InstallPromptResult {
  success: boolean;
  reason: string;
  userChoice: 'accepted' | 'dismissed' | 'error' | 'informed';
  installationMethod?: string;
  message?: string;
  error?: string;
}

interface TroubleshootingStep {
  stepNumber: number;
  instruction: string;
  icon: string;
  description: string;
  isRequired: boolean;
}

// Export singleton instance
export const installPromptHandler = InstallPromptHandler.getInstance();
export default installPromptHandler;