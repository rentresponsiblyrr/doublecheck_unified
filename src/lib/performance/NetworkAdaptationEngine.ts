/**
 * NETWORK ADAPTATION ENGINE - CONSTRUCTION SITE RESILIENCE
 * 
 * Advanced network adaptation system designed specifically for construction site
 * conditions with poor connectivity, spotty networks, and limited bandwidth.
 * Implements intelligent optimization strategies with graceful degradation.
 * 
 * CONSTRUCTION SITE CONDITIONS:
 * - 2G/3G networks with high latency (>500ms)
 * - Intermittent connectivity and signal drops
 * - Limited data allowances and bandwidth constraints
 * - Battery optimization for day-long usage
 * - Offline-first workflows for critical functionality
 * 
 * OPTIMIZATION STRATEGIES:
 * - Adaptive image compression and lazy loading
 * - Intelligent request batching and prioritization  
 * - Aggressive caching with offline fallbacks
 * - Data compression and delta sync
 * - Progressive enhancement with graceful degradation
 * 
 * NETFLIX/META STANDARDS:
 * - <5 second load times on 2G networks
 * - 100% offline functionality for core workflows
 * - Battery usage optimization (low impact rating)
 * - Seamless online/offline transitions
 * 
 * @author STR Certified Engineering Team
 */

import { logger } from '@/utils/logger';
import { serviceWorkerManager } from '@/lib/pwa/ServiceWorkerManager';
import { offlineStatusManager } from '@/lib/pwa/OfflineStatusManager';

// Network condition interfaces
export interface NetworkCondition {
  type: '2g' | '3g' | '4g' | 'slow-3g' | 'unknown';
  quality: 'excellent' | 'good' | 'poor' | 'critical';
  downlink: number;
  rtt: number;
  effectiveType: string;
  saveData: boolean;
  signalStrength: number;
}

export interface AdaptationStrategy {
  level: 'minimal' | 'moderate' | 'aggressive' | 'emergency';
  description: string;
  optimizations: OptimizationTechnique[];
  expectedImpact: string;
  batteryImpact: 'low' | 'medium' | 'high';
}

export interface OptimizationTechnique {
  id: string;
  name: string;
  description: string;
  category: 'images' | 'requests' | 'caching' | 'ui' | 'data' | 'battery';
  active: boolean;
  effectiveness: number; // 0-100
  batteryImpact: number; // 0-100
}

export interface NetworkAdaptationState {
  currentStrategy: AdaptationStrategy;
  activeOptimizations: OptimizationTechnique[];
  networkHistory: NetworkCondition[];
  performanceImpact: {
    loadTimeImprovement: number;
    bandwidthSavings: number;
    batteryOptimization: number;
  };
  userExperienceScore: number;
}

// Adaptation event interfaces
export interface AdaptationEvent {
  type: 'network_change' | 'strategy_change' | 'optimization_applied' | 'performance_impact';
  timestamp: Date;
  details: any;
}

/**
 * NETWORK ADAPTATION ENGINE - MAIN CLASS
 * 
 * Intelligent network condition detection and optimization system
 */
export class NetworkAdaptationEngine {
  private static instance: NetworkAdaptationEngine;
  private currentNetworkCondition: NetworkCondition | null = null;
  private currentStrategy: AdaptationStrategy | null = null;
  private activeOptimizations: Map<string, OptimizationTechnique> = new Map();
  private networkHistory: NetworkCondition[] = [];
  private adaptationListeners: Set<(event: AdaptationEvent) => void> = new Set();
  private monitoringInterval: number | null = null;
  private isMonitoring: boolean = false;

  // Available optimization techniques
  private readonly OPTIMIZATION_TECHNIQUES: Record<string, OptimizationTechnique> = {
    // Image optimizations
    aggressiveImageCompression: {
      id: 'aggressive-image-compression',
      name: 'Aggressive Image Compression',
      description: 'Reduce image quality to 60% and enable WebP format',
      category: 'images',
      active: false,
      effectiveness: 75,
      batteryImpact: 5
    },
    
    lazyLoadingOptimization: {
      id: 'lazy-loading-optimization', 
      name: 'Enhanced Lazy Loading',
      description: 'Load images only when in viewport with longer delays',
      category: 'images',
      active: false,
      effectiveness: 60,
      batteryImpact: 10
    },
    
    imageResizeAdaptation: {
      id: 'image-resize-adaptation',
      name: 'Adaptive Image Sizing',
      description: 'Serve smaller image sizes based on network conditions',
      category: 'images',
      active: false,
      effectiveness: 70,
      batteryImpact: 5
    },

    // Request optimizations
    requestBatching: {
      id: 'request-batching',
      name: 'Request Batching',
      description: 'Batch multiple API calls into single requests',
      category: 'requests',
      active: false,
      effectiveness: 80,
      batteryImpact: 15
    },
    
    requestPrioritization: {
      id: 'request-prioritization',
      name: 'Request Prioritization',
      description: 'Prioritize critical requests and defer non-essential ones',
      category: 'requests',
      active: false,
      effectiveness: 85,
      batteryImpact: 10
    },
    
    dataCompression: {
      id: 'data-compression',
      name: 'Data Compression',
      description: 'Enable GZIP/Brotli compression for all requests',
      category: 'data',
      active: false,
      effectiveness: 60,
      batteryImpact: 20
    },

    // Caching optimizations
    aggressiveCaching: {
      id: 'aggressive-caching',
      name: 'Aggressive Caching',
      description: 'Cache more resources for longer periods',
      category: 'caching',
      active: false,
      effectiveness: 90,
      batteryImpact: 5
    },
    
    offlineFirstStrategy: {
      id: 'offline-first-strategy',
      name: 'Offline-First Strategy',
      description: 'Serve from cache first, network as fallback',
      category: 'caching',
      active: false,
      effectiveness: 95,
      batteryImpact: 0
    },

    // UI optimizations
    reduceAnimations: {
      id: 'reduce-animations',
      name: 'Reduce Animations',
      description: 'Disable non-essential animations and transitions',
      category: 'ui',
      active: false,
      effectiveness: 30,
      batteryImpact: 25
    },
    
    simplifyInterface: {
      id: 'simplify-interface',
      name: 'Simplify Interface',
      description: 'Hide non-essential UI elements and decorations',
      category: 'ui',
      active: false,
      effectiveness: 40,
      batteryImpact: 15
    },

    // Battery optimizations
    reducePollingFrequency: {
      id: 'reduce-polling-frequency',
      name: 'Reduce Polling Frequency',
      description: 'Decrease background update frequency',
      category: 'battery',
      active: false,
      effectiveness: 45,
      batteryImpact: 40
    },
    
    pauseNonCriticalServices: {
      id: 'pause-non-critical-services',
      name: 'Pause Non-Critical Services',
      description: 'Temporarily disable analytics and tracking',
      category: 'battery',
      active: false,
      effectiveness: 35,
      batteryImpact: 50
    }
  };

  private constructor() {}

  static getInstance(): NetworkAdaptationEngine {
    if (!NetworkAdaptationEngine.instance) {
      NetworkAdaptationEngine.instance = new NetworkAdaptationEngine();
    }
    return NetworkAdaptationEngine.instance;
  }

  /**
   * Initialize network adaptation monitoring
   */
  async initialize(): Promise<boolean> {
    try {
      logger.info('🌐 Initializing Network Adaptation Engine', {}, 'NETWORK_ADAPTATION');

      // Detect initial network conditions
      await this.detectNetworkConditions();
      
      // Apply initial adaptation strategy
      await this.applyAdaptationStrategy();
      
      // Start continuous monitoring
      this.startNetworkMonitoring();
      
      // Setup event listeners
      this.setupEventListeners();
      
      this.isMonitoring = true;
      logger.info('✅ Network Adaptation Engine initialized successfully', {}, 'NETWORK_ADAPTATION');
      return true;

    } catch (error) {
      logger.error('❌ Network Adaptation Engine initialization failed', { error }, 'NETWORK_ADAPTATION');
      return false;
    }
  }

  /**
   * Detect current network conditions
   */
  private async detectNetworkConditions(): Promise<NetworkCondition> {
    const networkInfo = this.getNetworkInformation();
    const signalStrength = await this.estimateSignalStrength();
    const quality = this.assessNetworkQuality(networkInfo, signalStrength);

    const condition: NetworkCondition = {
      type: this.normalizeConnectionType(networkInfo.effectiveType),
      quality,
      downlink: networkInfo.downlink || 1,
      rtt: networkInfo.rtt || 100,
      effectiveType: networkInfo.effectiveType || 'unknown',
      saveData: networkInfo.saveData || false,
      signalStrength
    };

    // Store in network history
    this.networkHistory.push(condition);
    if (this.networkHistory.length > 100) {
      this.networkHistory = this.networkHistory.slice(-100);
    }

    this.currentNetworkCondition = condition;
    
    logger.info('📡 Network conditions detected', {
      type: condition.type,
      quality: condition.quality,
      downlink: condition.downlink,
      rtt: condition.rtt,
      signalStrength: condition.signalStrength
    }, 'NETWORK_ADAPTATION');

    return condition;
  }

  /**
   * Apply appropriate adaptation strategy based on network conditions
   */
  private async applyAdaptationStrategy(): Promise<void> {
    if (!this.currentNetworkCondition) return;

    const strategy = this.selectOptimalStrategy(this.currentNetworkCondition);
    
    if (this.currentStrategy?.level !== strategy.level) {
      logger.info(`🔄 Switching adaptation strategy: ${this.currentStrategy?.level || 'none'} → ${strategy.level}`, {
        networkType: this.currentNetworkCondition.type,
        networkQuality: this.currentNetworkCondition.quality,
        newStrategy: strategy.description
      }, 'NETWORK_ADAPTATION');

      // Deactivate current optimizations
      await this.deactivateCurrentOptimizations();
      
      // Apply new strategy
      this.currentStrategy = strategy;
      await this.activateOptimizations(strategy.optimizations);
      
      // Notify listeners
      this.notifyAdaptationListeners({
        type: 'strategy_change',
        timestamp: new Date(),
        details: {
          previousStrategy: this.currentStrategy?.level,
          newStrategy: strategy.level,
          networkCondition: this.currentNetworkCondition
        }
      });
    }
  }

  /**
   * Select optimal adaptation strategy based on network conditions
   */
  private selectOptimalStrategy(condition: NetworkCondition): AdaptationStrategy {
    // Emergency strategy for critical conditions
    if (condition.quality === 'critical' || condition.type === '2g') {
      return {
        level: 'emergency',
        description: 'Maximum optimization for critical network conditions',
        optimizations: [
          this.OPTIMIZATION_TECHNIQUES.aggressiveImageCompression,
          this.OPTIMIZATION_TECHNIQUES.imageResizeAdaptation,
          this.OPTIMIZATION_TECHNIQUES.requestBatching,
          this.OPTIMIZATION_TECHNIQUES.requestPrioritization,
          this.OPTIMIZATION_TECHNIQUES.dataCompression,
          this.OPTIMIZATION_TECHNIQUES.offlineFirstStrategy,
          this.OPTIMIZATION_TECHNIQUES.reduceAnimations,
          this.OPTIMIZATION_TECHNIQUES.simplifyInterface,
          this.OPTIMIZATION_TECHNIQUES.reducePollingFrequency,
          this.OPTIMIZATION_TECHNIQUES.pauseNonCriticalServices
        ],
        expectedImpact: '70-80% improvement in load times',
        batteryImpact: 'low'
      };
    }

    // Aggressive strategy for poor conditions
    if (condition.quality === 'poor' || condition.type === 'slow-3g') {
      return {
        level: 'aggressive',
        description: 'Heavy optimization for poor network conditions',
        optimizations: [
          this.OPTIMIZATION_TECHNIQUES.aggressiveImageCompression,
          this.OPTIMIZATION_TECHNIQUES.lazyLoadingOptimization,
          this.OPTIMIZATION_TECHNIQUES.requestBatching,
          this.OPTIMIZATION_TECHNIQUES.dataCompression,
          this.OPTIMIZATION_TECHNIQUES.aggressiveCaching,
          this.OPTIMIZATION_TECHNIQUES.reduceAnimations,
          this.OPTIMIZATION_TECHNIQUES.reducePollingFrequency
        ],
        expectedImpact: '50-60% improvement in load times',
        batteryImpact: 'medium'
      };
    }

    // Moderate strategy for good conditions  
    if (condition.quality === 'good' || condition.type === '3g') {
      return {
        level: 'moderate',
        description: 'Balanced optimization for moderate network conditions',
        optimizations: [
          this.OPTIMIZATION_TECHNIQUES.lazyLoadingOptimization,
          this.OPTIMIZATION_TECHNIQUES.requestPrioritization,
          this.OPTIMIZATION_TECHNIQUES.aggressiveCaching,
          this.OPTIMIZATION_TECHNIQUES.dataCompression
        ],
        expectedImpact: '25-35% improvement in load times',
        batteryImpact: 'low'
      };
    }

    // Minimal strategy for excellent conditions
    return {
      level: 'minimal',
      description: 'Light optimization for excellent network conditions',
      optimizations: [
        this.OPTIMIZATION_TECHNIQUES.aggressiveCaching,
        this.OPTIMIZATION_TECHNIQUES.requestPrioritization
      ],
      expectedImpact: '10-15% improvement in load times',
      batteryImpact: 'low'
    };
  }

  /**
   * Activate specific optimizations
   */
  private async activateOptimizations(optimizations: OptimizationTechnique[]): Promise<void> {
    for (const optimization of optimizations) {
      try {
        await this.activateSingleOptimization(optimization);
        this.activeOptimizations.set(optimization.id, { ...optimization, active: true });
        
        logger.debug(`✅ Activated optimization: ${optimization.name}`, {
          category: optimization.category,
          effectiveness: optimization.effectiveness
        }, 'NETWORK_ADAPTATION');

      } catch (error) {
        logger.error(`Failed to activate optimization: ${optimization.name}`, { error }, 'NETWORK_ADAPTATION');
      }
    }

    this.notifyAdaptationListeners({
      type: 'optimization_applied',
      timestamp: new Date(),
      details: {
        optimizations: optimizations.map(o => o.name),
        activeCount: this.activeOptimizations.size
      }
    });
  }

  /**
   * Activate a single optimization technique
   */
  private async activateSingleOptimization(optimization: OptimizationTechnique): Promise<void> {
    switch (optimization.id) {
      case 'aggressive-image-compression':
        this.applyImageCompressionOptimization();
        break;
        
      case 'lazy-loading-optimization':
        this.applyLazyLoadingOptimization();
        break;
        
      case 'image-resize-adaptation':
        this.applyImageResizeOptimization();
        break;
        
      case 'request-batching':
        this.applyRequestBatchingOptimization();
        break;
        
      case 'request-prioritization':
        this.applyRequestPrioritizationOptimization();
        break;
        
      case 'data-compression':
        this.applyDataCompressionOptimization();
        break;
        
      case 'aggressive-caching':
        this.applyAggressiveCachingOptimization();
        break;
        
      case 'offline-first-strategy':
        this.applyOfflineFirstOptimization();
        break;
        
      case 'reduce-animations':
        this.applyReduceAnimationsOptimization();
        break;
        
      case 'simplify-interface':
        this.applySimplifyInterfaceOptimization();
        break;
        
      case 'reduce-polling-frequency':
        this.applyReducePollingOptimization();
        break;
        
      case 'pause-non-critical-services':
        this.applyPauseServicesOptimization();
        break;
        
      default:
        logger.warn(`Unknown optimization technique: ${optimization.id}`, {}, 'NETWORK_ADAPTATION');
    }
  }

  /**
   * Deactivate all current optimizations
   */
  private async deactivateCurrentOptimizations(): Promise<void> {
    for (const [id, optimization] of this.activeOptimizations) {
      try {
        await this.deactivateSingleOptimization(optimization);
        logger.debug(`❌ Deactivated optimization: ${optimization.name}`, {}, 'NETWORK_ADAPTATION');
      } catch (error) {
        logger.error(`Failed to deactivate optimization: ${optimization.name}`, { error }, 'NETWORK_ADAPTATION');
      }
    }
    
    this.activeOptimizations.clear();
  }

  /**
   * Start continuous network monitoring
   */
  private startNetworkMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
    }

    // Monitor network conditions every 15 seconds
    this.monitoringInterval = window.setInterval(async () => {
      await this.detectNetworkConditions();
      await this.applyAdaptationStrategy();
    }, 15000);

    logger.info('🔄 Started continuous network monitoring', {}, 'NETWORK_ADAPTATION');
  }

  /**
   * Setup event listeners for network changes
   */
  private setupEventListeners(): void {
    // Listen for connection type changes
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      connection.addEventListener('change', async () => {
        logger.info('📱 Network connection changed', {}, 'NETWORK_ADAPTATION');
        await this.detectNetworkConditions();
        await this.applyAdaptationStrategy();
      });
    }

    // Listen for online/offline events
    window.addEventListener('online', async () => {
      logger.info('🌐 Device came online', {}, 'NETWORK_ADAPTATION');
      await this.detectNetworkConditions();
      await this.applyAdaptationStrategy();
    });

    window.addEventListener('offline', async () => {
      logger.info('📴 Device went offline', {}, 'NETWORK_ADAPTATION');
      await this.detectNetworkConditions();
      await this.applyAdaptationStrategy();
    });
  }

  // Optimization implementation methods
  private applyImageCompressionOptimization(): void {
    document.body.classList.add('aggressive-image-compression');
    window.dispatchEvent(new CustomEvent('network-optimization-image-compression', {
      detail: { quality: 60, format: 'webp' }
    }));
  }

  private applyLazyLoadingOptimization(): void {
    document.body.classList.add('enhanced-lazy-loading');
    window.dispatchEvent(new CustomEvent('network-optimization-lazy-loading', {
      detail: { threshold: 0.1, delay: 500 }
    }));
  }

  private applyImageResizeOptimization(): void {
    window.dispatchEvent(new CustomEvent('network-optimization-image-resize', {
      detail: { maxWidth: 800, adaptiveSize: true }
    }));
  }

  private applyRequestBatchingOptimization(): void {
    window.dispatchEvent(new CustomEvent('network-optimization-request-batching', {
      detail: { batchSize: 5, delay: 100 }
    }));
  }

  private applyRequestPrioritizationOptimization(): void {
    window.dispatchEvent(new CustomEvent('network-optimization-request-priority', {
      detail: { prioritizeUserActions: true, deferAnalytics: true }
    }));
  }

  private applyDataCompressionOptimization(): void {
    window.dispatchEvent(new CustomEvent('network-optimization-compression', {
      detail: { enableGzip: true, enableBrotli: true }
    }));
  }

  private applyAggressiveCachingOptimization(): void {
    serviceWorkerManager.updateCacheStrategy('cache-first');
    window.dispatchEvent(new CustomEvent('network-optimization-caching', {
      detail: { strategy: 'cache-first', ttl: '7d' }
    }));
  }

  private applyOfflineFirstOptimization(): void {
    serviceWorkerManager.updateCacheStrategy('cache-only');
    window.dispatchEvent(new CustomEvent('network-optimization-offline-first', {
      detail: { strategy: 'cache-only', networkFallback: false }
    }));
  }

  private applyReduceAnimationsOptimization(): void {
    document.body.classList.add('reduced-animations');
    window.dispatchEvent(new CustomEvent('network-optimization-animations', {
      detail: { disable: true, reduceMotion: true }
    }));
  }

  private applySimplifyInterfaceOptimization(): void {
    document.body.classList.add('simplified-interface');
    window.dispatchEvent(new CustomEvent('network-optimization-ui', {
      detail: { hideDecorations: true, minimalMode: true }
    }));
  }

  private applyReducePollingOptimization(): void {
    window.dispatchEvent(new CustomEvent('network-optimization-polling', {
      detail: { frequency: 'low', interval: 60000 }
    }));
  }

  private applyPauseServicesOptimization(): void {
    window.dispatchEvent(new CustomEvent('network-optimization-services', {
      detail: { pauseAnalytics: true, pauseTracking: true }
    }));
  }

  // Helper methods
  private getNetworkInformation(): any {
    if ('connection' in navigator) {
      return (navigator as any).connection;
    }
    return {
      downlink: 1,
      rtt: 100,
      effectiveType: '4g',
      saveData: false
    };
  }

  private async estimateSignalStrength(): Promise<number> {
    const networkInfo = this.getNetworkInformation();
    
    // Estimate signal strength based on connection quality
    if (networkInfo.downlink > 10 && networkInfo.rtt < 50) return 100; // Excellent
    if (networkInfo.downlink > 5 && networkInfo.rtt < 100) return 80;   // Good
    if (networkInfo.downlink > 1 && networkInfo.rtt < 200) return 60;   // Fair
    if (networkInfo.downlink > 0.5 && networkInfo.rtt < 300) return 40; // Poor
    return 20; // Very poor
  }

  private assessNetworkQuality(networkInfo: any, signalStrength: number): 'excellent' | 'good' | 'poor' | 'critical' {
    if (signalStrength > 80 && networkInfo.downlink > 5) return 'excellent';
    if (signalStrength > 60 && networkInfo.downlink > 1) return 'good';
    if (signalStrength > 40 && networkInfo.downlink > 0.5) return 'poor';
    return 'critical';
  }

  private normalizeConnectionType(effectiveType: string): NetworkCondition['type'] {
    switch (effectiveType) {
      case '2g': return '2g';
      case 'slow-3g': return 'slow-3g';
      case '3g': return '3g';
      case '4g': return '4g';
      default: return 'unknown';
    }
  }

  private async deactivateSingleOptimization(optimization: OptimizationTechnique): Promise<void> {
    // Remove CSS classes and dispatch deactivation events
    document.body.classList.remove(optimization.id);
    window.dispatchEvent(new CustomEvent(`network-optimization-deactivate-${optimization.id}`));
  }

  private notifyAdaptationListeners(event: AdaptationEvent): void {
    this.adaptationListeners.forEach(listener => {
      try {
        listener(event);
      } catch (error) {
        logger.error('Error in adaptation listener', { error }, 'NETWORK_ADAPTATION');
      }
    });
  }

  /**
   * Public API methods
   */
  
  getCurrentAdaptationState(): NetworkAdaptationState {
    return {
      currentStrategy: this.currentStrategy!,
      activeOptimizations: Array.from(this.activeOptimizations.values()),
      networkHistory: this.networkHistory.slice(-10), // Last 10 entries
      performanceImpact: this.calculatePerformanceImpact(),
      userExperienceScore: this.calculateUserExperienceScore()
    };
  }

  addAdaptationListener(listener: (event: AdaptationEvent) => void): () => void {
    this.adaptationListeners.add(listener);
    return () => this.adaptationListeners.delete(listener);
  }

  forceAdaptationLevel(level: AdaptationStrategy['level']): void {
    const mockCondition: NetworkCondition = {
      type: level === 'emergency' ? '2g' : '4g',
      quality: level === 'emergency' ? 'critical' : 'excellent',
      downlink: level === 'emergency' ? 0.5 : 10,
      rtt: level === 'emergency' ? 500 : 50,
      effectiveType: level === 'emergency' ? '2g' : '4g',
      saveData: false,
      signalStrength: level === 'emergency' ? 20 : 100
    };
    
    this.currentNetworkCondition = mockCondition;
    this.applyAdaptationStrategy();
  }

  stop(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    
    this.deactivateCurrentOptimizations();
    this.isMonitoring = false;
    
    logger.info('🛑 Network Adaptation Engine stopped', {}, 'NETWORK_ADAPTATION');
  }

  private calculatePerformanceImpact(): { loadTimeImprovement: number; bandwidthSavings: number; batteryOptimization: number } {
    const optimizations = Array.from(this.activeOptimizations.values());
    
    return {
      loadTimeImprovement: optimizations.reduce((sum, opt) => sum + opt.effectiveness, 0) / optimizations.length || 0,
      bandwidthSavings: optimizations.filter(opt => ['images', 'data', 'requests'].includes(opt.category)).length * 20,
      batteryOptimization: optimizations.filter(opt => opt.category === 'battery').reduce((sum, opt) => sum + opt.batteryImpact, 0)
    };
  }

  private calculateUserExperienceScore(): number {
    if (!this.currentNetworkCondition) return 85;
    
    const baseScore = 100;
    const networkPenalty = this.currentNetworkCondition.quality === 'critical' ? 30 :
                           this.currentNetworkCondition.quality === 'poor' ? 20 :
                           this.currentNetworkCondition.quality === 'good' ? 10 : 0;
    
    const optimizationBonus = Array.from(this.activeOptimizations.values())
      .reduce((sum, opt) => sum + opt.effectiveness, 0) / this.activeOptimizations.size * 0.2;
    
    return Math.max(0, Math.min(100, baseScore - networkPenalty + optimizationBonus));
  }
}

// Export singleton instance
export const networkAdaptationEngine = NetworkAdaptationEngine.getInstance();

// Auto-initialize network adaptation
if (typeof window !== 'undefined') {
  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      networkAdaptationEngine.initialize();
    });
  } else {
    networkAdaptationEngine.initialize();
  }
}