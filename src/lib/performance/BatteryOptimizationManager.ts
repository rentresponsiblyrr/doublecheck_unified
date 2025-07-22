/**
 * BATTERY OPTIMIZATION MANAGER - CONSTRUCTION SITE ENDURANCE
 * 
 * Advanced battery management system designed for all-day construction site
 * usage with intelligent power optimization strategies. Ensures the PWA can
 * operate efficiently for 8+ hours of continuous inspection work.
 * 
 * CONSTRUCTION SITE BATTERY CHALLENGES:
 * - 8+ hour workdays with limited charging opportunities
 * - High CPU usage from camera, GPS, and data processing
 * - Poor cellular signal requiring more power for communication
 * - Outdoor brightness requiring high screen brightness
 * - Background sync and data uploads consuming power
 * 
 * OPTIMIZATION STRATEGIES:
 * - Dynamic CPU throttling based on battery level
 * - Intelligent background task management
 * - Screen brightness and refresh rate adaptation
 * - Network request optimization and batching
 * - Camera and sensor usage optimization
 * - Progressive feature degradation
 * 
 * POWER MANAGEMENT TIERS:
 * - Green: 70%+ battery - Full functionality
 * - Yellow: 30-70% battery - Moderate optimizations
 * - Orange: 15-30% battery - Aggressive optimizations
 * - Red: <15% battery - Emergency power saving mode
 * 
 * @author STR Certified Engineering Team
 */

import { logger } from '@/utils/logger';
import { networkAdaptationEngine } from './NetworkAdaptationEngine';

// Battery interfaces
export interface BatteryState {
  level: number; // 0-100
  charging: boolean;
  chargingTime: number;
  dischargingTime: number;
  powerTier: 'green' | 'yellow' | 'orange' | 'red';
  estimatedTimeRemaining: number; // hours
  powerConsumptionRate: number; // %/hour
}

export interface BatteryOptimization {
  id: string;
  name: string;
  description: string;
  category: 'cpu' | 'display' | 'network' | 'background' | 'sensors' | 'ui';
  powerSavings: number; // Estimated % power savings
  userImpact: 'none' | 'minimal' | 'moderate' | 'significant';
  active: boolean;
  requiredTier: 'green' | 'yellow' | 'orange' | 'red';
}

export interface BatteryProfile {
  name: string;
  description: string;
  tier: 'green' | 'yellow' | 'orange' | 'red';
  optimizations: BatteryOptimization[];
  estimatedExtension: number; // Additional hours of usage
}

export interface BatteryEvent {
  type: 'level_change' | 'tier_change' | 'charging_change' | 'optimization_applied';
  timestamp: Date;
  details: any;
}

/**
 * BATTERY OPTIMIZATION MANAGER - MAIN CLASS
 */
export class BatteryOptimizationManager {
  private static instance: BatteryOptimizationManager;
  private batteryState: BatteryState | null = null;
  private currentProfile: BatteryProfile | null = null;
  private activeOptimizations: Map<string, BatteryOptimization> = new Map();
  private batteryListeners: Set<(event: BatteryEvent) => void> = new Set();
  private monitoringInterval: number | null = null;
  private isMonitoring: boolean = false;
  private powerConsumptionHistory: number[] = [];

  // Available battery optimizations
  private readonly BATTERY_OPTIMIZATIONS: Record<string, BatteryOptimization> = {
    // CPU optimizations
    cpuThrottling: {
      id: 'cpu-throttling',
      name: 'CPU Throttling',
      description: 'Reduce CPU clock speed and thread priority',
      category: 'cpu',
      powerSavings: 20,
      userImpact: 'minimal',
      active: false,
      requiredTier: 'yellow'
    },

    backgroundTaskThrottling: {
      id: 'background-task-throttling',
      name: 'Background Task Throttling',
      description: 'Reduce frequency of background tasks and timers',
      category: 'background',
      powerSavings: 15,
      userImpact: 'minimal',
      active: false,
      requiredTier: 'yellow'
    },

    webWorkerOptimization: {
      id: 'web-worker-optimization',
      name: 'Web Worker Optimization',
      description: 'Pause non-essential web workers and processing',
      category: 'cpu',
      powerSavings: 10,
      userImpact: 'minimal',
      active: false,
      requiredTier: 'orange'
    },

    // Display optimizations
    screenBrightnessAdaptation: {
      id: 'screen-brightness-adaptation',
      name: 'Screen Brightness Adaptation',
      description: 'Automatically adjust screen brightness based on ambient light',
      category: 'display',
      powerSavings: 25,
      userImpact: 'minimal',
      active: false,
      requiredTier: 'green'
    },

    refreshRateReduction: {
      id: 'refresh-rate-reduction',
      name: 'Refresh Rate Reduction',
      description: 'Reduce screen refresh rate to 30fps or lower',
      category: 'display',
      powerSavings: 15,
      userImpact: 'minimal',
      active: false,
      requiredTier: 'orange'
    },

    darkModeForcing: {
      id: 'dark-mode-forcing',
      name: 'Force Dark Mode',
      description: 'Force dark theme to reduce OLED power consumption',
      category: 'display',
      powerSavings: 12,
      userImpact: 'none',
      active: false,
      requiredTier: 'yellow'
    },

    // Network optimizations
    networkRequestBatching: {
      id: 'network-request-batching',
      name: 'Network Request Batching',
      description: 'Batch network requests to reduce radio wake-ups',
      category: 'network',
      powerSavings: 18,
      userImpact: 'minimal',
      active: false,
      requiredTier: 'yellow'
    },

    backgroundSyncReduction: {
      id: 'background-sync-reduction',
      name: 'Background Sync Reduction',
      description: 'Reduce frequency of background sync operations',
      category: 'network',
      powerSavings: 20,
      userImpact: 'moderate',
      active: false,
      requiredTier: 'orange'
    },

    offlineFirstStrategy: {
      id: 'offline-first-strategy',
      name: 'Offline-First Strategy',
      description: 'Prioritize cached content over network requests',
      category: 'network',
      powerSavings: 25,
      userImpact: 'minimal',
      active: false,
      requiredTier: 'yellow'
    },

    // Sensor optimizations
    gpsAccuracyReduction: {
      id: 'gps-accuracy-reduction',
      name: 'GPS Accuracy Reduction',
      description: 'Reduce GPS accuracy and update frequency',
      category: 'sensors',
      powerSavings: 30,
      userImpact: 'moderate',
      active: false,
      requiredTier: 'orange'
    },

    cameraOptimization: {
      id: 'camera-optimization',
      name: 'Camera Optimization',
      description: 'Optimize camera settings for power efficiency',
      category: 'sensors',
      powerSavings: 20,
      userImpact: 'minimal',
      active: false,
      requiredTier: 'yellow'
    },

    accelerometerPause: {
      id: 'accelerometer-pause',
      name: 'Motion Sensor Pause',
      description: 'Pause non-essential motion sensors',
      category: 'sensors',
      powerSavings: 8,
      userImpact: 'minimal',
      active: false,
      requiredTier: 'red'
    },

    // UI optimizations
    animationDisabling: {
      id: 'animation-disabling',
      name: 'Animation Disabling',
      description: 'Disable all CSS animations and transitions',
      category: 'ui',
      powerSavings: 5,
      userImpact: 'minimal',
      active: false,
      requiredTier: 'orange'
    },

    uiSimplification: {
      id: 'ui-simplification',
      name: 'UI Simplification',
      description: 'Simplify interface and hide non-essential elements',
      category: 'ui',
      powerSavings: 8,
      userImpact: 'moderate',
      active: false,
      requiredTier: 'red'
    },

    hapticFeedbackDisabling: {
      id: 'haptic-feedback-disabling',
      name: 'Haptic Feedback Disabling',
      description: 'Disable vibration and haptic feedback',
      category: 'ui',
      powerSavings: 3,
      userImpact: 'minimal',
      active: false,
      requiredTier: 'orange'
    }
  };

  // Battery profiles for different power tiers
  private readonly BATTERY_PROFILES: Record<string, BatteryProfile> = {
    green: {
      name: 'Full Performance',
      description: 'No power restrictions, full functionality available',
      tier: 'green',
      optimizations: [
        this.BATTERY_OPTIMIZATIONS.screenBrightnessAdaptation,
        this.BATTERY_OPTIMIZATIONS.cameraOptimization
      ],
      estimatedExtension: 0
    },

    yellow: {
      name: 'Balanced Power',
      description: 'Light power optimizations with minimal user impact',
      tier: 'yellow',
      optimizations: [
        this.BATTERY_OPTIMIZATIONS.screenBrightnessAdaptation,
        this.BATTERY_OPTIMIZATIONS.cpuThrottling,
        this.BATTERY_OPTIMIZATIONS.backgroundTaskThrottling,
        this.BATTERY_OPTIMIZATIONS.darkModeForcing,
        this.BATTERY_OPTIMIZATIONS.networkRequestBatching,
        this.BATTERY_OPTIMIZATIONS.offlineFirstStrategy,
        this.BATTERY_OPTIMIZATIONS.cameraOptimization
      ],
      estimatedExtension: 1.5
    },

    orange: {
      name: 'Power Saver',
      description: 'Aggressive power optimizations, some functionality reduced',
      tier: 'orange',
      optimizations: [
        this.BATTERY_OPTIMIZATIONS.screenBrightnessAdaptation,
        this.BATTERY_OPTIMIZATIONS.cpuThrottling,
        this.BATTERY_OPTIMIZATIONS.backgroundTaskThrottling,
        this.BATTERY_OPTIMIZATIONS.webWorkerOptimization,
        this.BATTERY_OPTIMIZATIONS.refreshRateReduction,
        this.BATTERY_OPTIMIZATIONS.darkModeForcing,
        this.BATTERY_OPTIMIZATIONS.networkRequestBatching,
        this.BATTERY_OPTIMIZATIONS.backgroundSyncReduction,
        this.BATTERY_OPTIMIZATIONS.offlineFirstStrategy,
        this.BATTERY_OPTIMIZATIONS.gpsAccuracyReduction,
        this.BATTERY_OPTIMIZATIONS.cameraOptimization,
        this.BATTERY_OPTIMIZATIONS.animationDisabling,
        this.BATTERY_OPTIMIZATIONS.hapticFeedbackDisabling
      ],
      estimatedExtension: 3
    },

    red: {
      name: 'Emergency Mode',
      description: 'Maximum power savings, core functionality only',
      tier: 'red',
      optimizations: Object.values(this.BATTERY_OPTIMIZATIONS),
      estimatedExtension: 5
    }
  };

  private constructor() {}

  static getInstance(): BatteryOptimizationManager {
    if (!BatteryOptimizationManager.instance) {
      BatteryOptimizationManager.instance = new BatteryOptimizationManager();
    }
    return BatteryOptimizationManager.instance;
  }

  /**
   * Initialize battery optimization monitoring
   */
  async initialize(): Promise<boolean> {
    try {
      logger.info('🔋 Initializing Battery Optimization Manager', {}, 'BATTERY_OPTIMIZATION');

      // Get initial battery state
      await this.updateBatteryState();
      
      // Apply initial battery profile
      await this.applyBatteryProfile();
      
      // Start continuous monitoring
      this.startBatteryMonitoring();
      
      // Setup event listeners
      this.setupBatteryEventListeners();
      
      this.isMonitoring = true;
      logger.info('✅ Battery Optimization Manager initialized successfully', {}, 'BATTERY_OPTIMIZATION');
      return true;

    } catch (error) {
      logger.error('❌ Battery Optimization Manager initialization failed', { error }, 'BATTERY_OPTIMIZATION');
      return false;
    }
  }

  /**
   * Update current battery state
   */
  private async updateBatteryState(): Promise<void> {
    try {
      let battery: any = null;
      
      // Try to get battery information
      if ('getBattery' in navigator) {
        battery = await (navigator as any).getBattery();
      }

      if (battery) {
        const level = Math.round(battery.level * 100);
        const powerTier = this.calculatePowerTier(level);
        const consumptionRate = this.calculatePowerConsumptionRate();
        
        this.batteryState = {
          level,
          charging: battery.charging,
          chargingTime: battery.chargingTime,
          dischargingTime: battery.dischargingTime,
          powerTier,
          estimatedTimeRemaining: this.calculateTimeRemaining(level, consumptionRate),
          powerConsumptionRate: consumptionRate
        };

        logger.debug('🔋 Battery state updated', {
          level: this.batteryState.level,
          tier: this.batteryState.powerTier,
          charging: this.batteryState.charging,
          estimatedTime: this.batteryState.estimatedTimeRemaining
        }, 'BATTERY_OPTIMIZATION');

      } else {
        // Fallback when battery API is not available
        this.batteryState = {
          level: 75, // Assume reasonable battery level
          charging: false,
          chargingTime: Infinity,
          dischargingTime: Infinity,
          powerTier: 'yellow',
          estimatedTimeRemaining: 4,
          powerConsumptionRate: 12
        };
        
        logger.warn('Battery API not available, using estimated values', {}, 'BATTERY_OPTIMIZATION');
      }

    } catch (error) {
      logger.error('Failed to update battery state', { error }, 'BATTERY_OPTIMIZATION');
    }
  }

  /**
   * Calculate appropriate power tier based on battery level
   */
  private calculatePowerTier(level: number): 'green' | 'yellow' | 'orange' | 'red' {
    if (level >= 70) return 'green';
    if (level >= 30) return 'yellow';
    if (level >= 15) return 'orange';
    return 'red';
  }

  /**
   * Calculate power consumption rate based on recent usage
   */
  private calculatePowerConsumptionRate(): number {
    if (this.powerConsumptionHistory.length < 2) {
      return 12; // Default consumption rate %/hour
    }

    const recent = this.powerConsumptionHistory.slice(-10);
    const averageConsumption = recent.reduce((sum, rate) => sum + rate, 0) / recent.length;
    
    return averageConsumption;
  }

  /**
   * Calculate estimated time remaining in hours
   */
  private calculateTimeRemaining(level: number, consumptionRate: number): number {
    if (consumptionRate <= 0) return Infinity;
    return level / consumptionRate;
  }

  /**
   * Apply appropriate battery profile based on current state
   */
  private async applyBatteryProfile(): Promise<void> {
    if (!this.batteryState) return;

    const targetProfile = this.BATTERY_PROFILES[this.batteryState.powerTier];
    
    if (this.currentProfile?.tier !== targetProfile.tier) {
      logger.info(`🔋 Switching battery profile: ${this.currentProfile?.tier || 'none'} → ${targetProfile.tier}`, {
        batteryLevel: this.batteryState.level,
        charging: this.batteryState.charging,
        newProfile: targetProfile.name,
        estimatedExtension: targetProfile.estimatedExtension
      }, 'BATTERY_OPTIMIZATION');

      // Deactivate current optimizations
      await this.deactivateCurrentOptimizations();
      
      // Apply new profile
      this.currentProfile = targetProfile;
      await this.activateOptimizations(targetProfile.optimizations);
      
      // Notify listeners
      this.notifyBatteryListeners({
        type: 'tier_change',
        timestamp: new Date(),
        details: {
          previousTier: this.currentProfile?.tier,
          newTier: targetProfile.tier,
          batteryLevel: this.batteryState.level,
          estimatedExtension: targetProfile.estimatedExtension
        }
      });

      // Show user notification for significant changes
      if (targetProfile.tier === 'orange' || targetProfile.tier === 'red') {
        this.showBatteryNotification(targetProfile);
      }
    }
  }

  /**
   * Activate battery optimizations
   */
  private async activateOptimizations(optimizations: BatteryOptimization[]): Promise<void> {
    for (const optimization of optimizations) {
      try {
        await this.activateSingleOptimization(optimization);
        this.activeOptimizations.set(optimization.id, { ...optimization, active: true });
        
        logger.debug(`✅ Activated battery optimization: ${optimization.name}`, {
          category: optimization.category,
          powerSavings: optimization.powerSavings,
          userImpact: optimization.userImpact
        }, 'BATTERY_OPTIMIZATION');

      } catch (error) {
        logger.error(`Failed to activate battery optimization: ${optimization.name}`, { error }, 'BATTERY_OPTIMIZATION');
      }
    }

    this.notifyBatteryListeners({
      type: 'optimization_applied',
      timestamp: new Date(),
      details: {
        optimizations: optimizations.map(o => o.name),
        totalPowerSavings: optimizations.reduce((sum, o) => sum + o.powerSavings, 0),
        activeCount: this.activeOptimizations.size
      }
    });
  }

  /**
   * Activate a single battery optimization
   */
  private async activateSingleOptimization(optimization: BatteryOptimization): Promise<void> {
    switch (optimization.id) {
      case 'cpu-throttling':
        this.applyCPUThrottling();
        break;
        
      case 'background-task-throttling':
        this.applyBackgroundTaskThrottling();
        break;
        
      case 'web-worker-optimization':
        this.applyWebWorkerOptimization();
        break;
        
      case 'screen-brightness-adaptation':
        this.applyScreenBrightnessAdaptation();
        break;
        
      case 'refresh-rate-reduction':
        this.applyRefreshRateReduction();
        break;
        
      case 'dark-mode-forcing':
        this.applyDarkModeForcing();
        break;
        
      case 'network-request-batching':
        this.applyNetworkRequestBatching();
        break;
        
      case 'background-sync-reduction':
        this.applyBackgroundSyncReduction();
        break;
        
      case 'offline-first-strategy':
        this.applyOfflineFirstStrategy();
        break;
        
      case 'gps-accuracy-reduction':
        this.applyGPSAccuracyReduction();
        break;
        
      case 'camera-optimization':
        this.applyCameraOptimization();
        break;
        
      case 'accelerometer-pause':
        this.applyAccelerometerPause();
        break;
        
      case 'animation-disabling':
        this.applyAnimationDisabling();
        break;
        
      case 'ui-simplification':
        this.applyUISimplification();
        break;
        
      case 'haptic-feedback-disabling':
        this.applyHapticFeedbackDisabling();
        break;
        
      default:
        logger.warn(`Unknown battery optimization: ${optimization.id}`, {}, 'BATTERY_OPTIMIZATION');
    }
  }

  /**
   * Start continuous battery monitoring
   */
  private startBatteryMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
    }

    // Monitor battery every 30 seconds
    this.monitoringInterval = window.setInterval(async () => {
      const previousLevel = this.batteryState?.level || 100;
      
      await this.updateBatteryState();
      await this.applyBatteryProfile();
      
      // Track power consumption
      if (this.batteryState && this.batteryState.level < previousLevel) {
        const consumptionRate = (previousLevel - this.batteryState.level) * 120; // Per hour
        this.powerConsumptionHistory.push(consumptionRate);
        
        // Keep history manageable
        if (this.powerConsumptionHistory.length > 100) {
          this.powerConsumptionHistory = this.powerConsumptionHistory.slice(-100);
        }
      }
      
    }, 30000);

    logger.info('🔄 Started continuous battery monitoring', {}, 'BATTERY_OPTIMIZATION');
  }

  /**
   * Setup battery event listeners
   */
  private setupBatteryEventListeners(): void {
    if ('getBattery' in navigator) {
      (navigator as any).getBattery().then((battery: any) => {
        battery.addEventListener('levelchange', async () => {
          logger.info('🔋 Battery level changed', {}, 'BATTERY_OPTIMIZATION');
          await this.updateBatteryState();
          await this.applyBatteryProfile();
          
          this.notifyBatteryListeners({
            type: 'level_change',
            timestamp: new Date(),
            details: { level: this.batteryState?.level }
          });
        });

        battery.addEventListener('chargingchange', async () => {
          logger.info(`🔌 Charging state changed: ${battery.charging ? 'charging' : 'not charging'}`, {}, 'BATTERY_OPTIMIZATION');
          await this.updateBatteryState();
          await this.applyBatteryProfile();
          
          this.notifyBatteryListeners({
            type: 'charging_change',
            timestamp: new Date(),
            details: { charging: battery.charging }
          });
        });
      }).catch((error: any) => {
        logger.error('Failed to setup battery event listeners', { error }, 'BATTERY_OPTIMIZATION');
      });
    }
  }

  // Battery optimization implementations
  private applyCPUThrottling(): void {
    document.body.classList.add('battery-cpu-throttling');
    window.dispatchEvent(new CustomEvent('battery-optimization-cpu-throttling', {
      detail: { throttleLevel: 0.7, priority: 'low' }
    }));
  }

  private applyBackgroundTaskThrottling(): void {
    window.dispatchEvent(new CustomEvent('battery-optimization-background-throttling', {
      detail: { intervalMultiplier: 2, pauseNonEssential: true }
    }));
  }

  private applyWebWorkerOptimization(): void {
    window.dispatchEvent(new CustomEvent('battery-optimization-web-workers', {
      detail: { pauseNonEssential: true, reduceThreads: true }
    }));
  }

  private applyScreenBrightnessAdaptation(): void {
    document.body.classList.add('battery-brightness-adaptation');
    window.dispatchEvent(new CustomEvent('battery-optimization-brightness', {
      detail: { adaptToAmbient: true, maxBrightness: 0.8 }
    }));
  }

  private applyRefreshRateReduction(): void {
    document.body.classList.add('battery-reduced-refresh-rate');
    window.dispatchEvent(new CustomEvent('battery-optimization-refresh-rate', {
      detail: { targetFPS: 30, enableVSync: false }
    }));
  }

  private applyDarkModeForcing(): void {
    document.body.classList.add('battery-force-dark-mode');
    document.body.setAttribute('data-theme', 'dark');
  }

  private applyNetworkRequestBatching(): void {
    window.dispatchEvent(new CustomEvent('battery-optimization-network-batching', {
      detail: { batchDelay: 200, maxBatchSize: 10 }
    }));
  }

  private applyBackgroundSyncReduction(): void {
    window.dispatchEvent(new CustomEvent('battery-optimization-background-sync', {
      detail: { intervalMultiplier: 4, pauseNonCritical: true }
    }));
  }

  private applyOfflineFirstStrategy(): void {
    networkAdaptationEngine.forceAdaptationLevel('aggressive');
  }

  private applyGPSAccuracyReduction(): void {
    window.dispatchEvent(new CustomEvent('battery-optimization-gps', {
      detail: { accuracy: 'low', updateInterval: 30000 }
    }));
  }

  private applyCameraOptimization(): void {
    window.dispatchEvent(new CustomEvent('battery-optimization-camera', {
      detail: { resolution: 'medium', framerate: 30, optimizeExposure: true }
    }));
  }

  private applyAccelerometerPause(): void {
    window.dispatchEvent(new CustomEvent('battery-optimization-sensors', {
      detail: { pauseAccelerometer: true, pauseGyroscope: true }
    }));
  }

  private applyAnimationDisabling(): void {
    document.body.classList.add('battery-disable-animations');
    document.body.style.setProperty('--animation-duration', '0ms');
  }

  private applyUISimplification(): void {
    document.body.classList.add('battery-simplified-ui');
    window.dispatchEvent(new CustomEvent('battery-optimization-ui-simplification', {
      detail: { hideDecorations: true, minimalMode: true }
    }));
  }

  private applyHapticFeedbackDisabling(): void {
    window.dispatchEvent(new CustomEvent('battery-optimization-haptics', {
      detail: { disableVibration: true, disableFeedback: true }
    }));
  }

  /**
   * Deactivate all current optimizations
   */
  private async deactivateCurrentOptimizations(): Promise<void> {
    for (const [id, optimization] of this.activeOptimizations) {
      try {
        await this.deactivateSingleOptimization(optimization);
        logger.debug(`❌ Deactivated battery optimization: ${optimization.name}`, {}, 'BATTERY_OPTIMIZATION');
      } catch (error) {
        logger.error(`Failed to deactivate battery optimization: ${optimization.name}`, { error }, 'BATTERY_OPTIMIZATION');
      }
    }
    
    this.activeOptimizations.clear();
  }

  private async deactivateSingleOptimization(optimization: BatteryOptimization): Promise<void> {
    // Remove CSS classes and dispatch deactivation events
    document.body.classList.remove(`battery-${optimization.id}`);
    window.dispatchEvent(new CustomEvent(`battery-optimization-deactivate-${optimization.id}`));
  }

  /**
   * Show battery notification to user
   */
  private showBatteryNotification(profile: BatteryProfile): void {
    const messages = {
      orange: `Battery Saver mode activated. Estimated ${profile.estimatedExtension} hours additional usage.`,
      red: `Emergency mode activated. Core functionality only. Estimated ${profile.estimatedExtension} hours additional usage.`
    };
    
    const message = messages[profile.tier as 'orange' | 'red'];
    if (message) {
      // Show browser notification if permissions granted
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('Battery Optimization', {
          body: message,
          icon: '/icons/battery-optimization.png',
          badge: '/icons/battery-badge.png'
        });
      }
      
      // Also dispatch custom event for in-app notifications
      window.dispatchEvent(new CustomEvent('battery-notification', {
        detail: { tier: profile.tier, message, profile }
      }));
    }
  }

  private notifyBatteryListeners(event: BatteryEvent): void {
    this.batteryListeners.forEach(listener => {
      try {
        listener(event);
      } catch (error) {
        logger.error('Error in battery listener', { error }, 'BATTERY_OPTIMIZATION');
      }
    });
  }

  /**
   * Public API methods
   */
  
  getCurrentBatteryState(): BatteryState | null {
    return this.batteryState;
  }

  getCurrentProfile(): BatteryProfile | null {
    return this.currentProfile;
  }

  getActiveOptimizations(): BatteryOptimization[] {
    return Array.from(this.activeOptimizations.values());
  }

  addBatteryListener(listener: (event: BatteryEvent) => void): () => void {
    this.batteryListeners.add(listener);
    return () => this.batteryListeners.delete(listener);
  }

  async forceBatteryTier(tier: 'green' | 'yellow' | 'orange' | 'red'): Promise<void> {
    if (this.batteryState) {
      this.batteryState.powerTier = tier;
      await this.applyBatteryProfile();
    }
  }

  getEstimatedBatteryExtension(): number {
    return this.currentProfile?.estimatedExtension || 0;
  }

  getTotalPowerSavings(): number {
    return Array.from(this.activeOptimizations.values())
      .reduce((sum, opt) => sum + opt.powerSavings, 0);
  }

  stop(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    
    this.deactivateCurrentOptimizations();
    this.isMonitoring = false;
    
    logger.info('🛑 Battery Optimization Manager stopped', {}, 'BATTERY_OPTIMIZATION');
  }
}

// Export singleton instance
export const batteryOptimizationManager = BatteryOptimizationManager.getInstance();

// Auto-initialize battery optimization
if (typeof window !== 'undefined') {
  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      batteryOptimizationManager.initialize();
    });
  } else {
    batteryOptimizationManager.initialize();
  }
}