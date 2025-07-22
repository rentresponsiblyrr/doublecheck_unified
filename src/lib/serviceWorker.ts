/**
 * STR CERTIFIED SERVICE WORKER MANAGER - PHASE 4A CORE IMPLEMENTATION
 * 
 * TypeScript service layer for Service Worker registration, lifecycle management,
 * and communication with the main application thread. Provides type-safe
 * interfaces for PWA functionality including background sync and push notifications.
 * 
 * PERFORMANCE TARGETS:
 * - <500ms Service Worker registration time
 * - 100% reliable message passing
 * - Intelligent update detection and management
 * - Comprehensive error handling and recovery
 * 
 * @version 1.0.0
 * @author STR Certified Engineering Team
 * @phase Phase 4A - PWA Core Implementation
 */

// ========================================
// TYPE DEFINITIONS
// ========================================

/**
 * Service Worker registration state
 */
export type ServiceWorkerState = 
  | 'unsupported'
  | 'registering'
  | 'registered'
  | 'installing'
  | 'waiting'
  | 'active'
  | 'error';

/**
 * Background sync tags for different data types
 */
export interface SyncTags {
  INSPECTION_DATA: 'inspection-sync';
  MEDIA_UPLOAD: 'media-sync';
  USER_PREFERENCES: 'preferences-sync';
  ANALYTICS: 'analytics-sync';
}

/**
 * Service Worker message types
 */
export type ServiceWorkerMessageType = 
  | 'SKIP_WAITING'
  | 'GET_VERSION'
  | 'CLEAR_CACHE'
  | 'REGISTER_SYNC'
  | 'SYNC_REQUEST'
  | 'NOTIFICATION_ACTION'
  | 'NAVIGATE';

/**
 * Message structure for SW communication
 */
export interface ServiceWorkerMessage {
  type: ServiceWorkerMessageType;
  data?: any;
  timestamp: number;
}

/**
 * Service Worker update information
 */
export interface ServiceWorkerUpdate {
  type: 'update_available' | 'update_ready';
  version: string;
  changes?: string[];
  critical?: boolean;
}

/**
 * Background sync registration options
 */
export interface SyncRegistrationOptions {
  tag: string;
  minInterval?: number;
  requiredNetworkType?: 'any' | 'unmetered';
}

/**
 * Push notification subscription options
 */
export interface PushSubscriptionOptions {
  userVisibleOnly: boolean;
  applicationServerKey: string;
}

/**
 * Service Worker configuration
 */
export interface ServiceWorkerConfig {
  scope?: string;
  updateViaCache?: 'imports' | 'all' | 'none';
  enableAutoUpdate?: boolean;
  updateCheckInterval?: number;
  enableNotifications?: boolean;
  enableBackgroundSync?: boolean;
}

/**
 * Service Worker manager events
 */
export interface ServiceWorkerEvents {
  stateChange: (state: ServiceWorkerState) => void;
  updateAvailable: (update: ServiceWorkerUpdate) => void;
  updateReady: () => void;
  syncComplete: (tag: string, success: boolean) => void;
  notificationReceived: (notification: any) => void;
  error: (error: Error) => void;
}

/**
 * Cache management statistics
 */
export interface CacheStats {
  totalCaches: number;
  totalSize: number;
  staticCacheSize: number;
  runtimeCacheSize: number;
  mediaCacheSize: number;
  lastCleanup: Date;
}

// ========================================
// SERVICE WORKER MANAGER CLASS
// ========================================

/**
 * ServiceWorkerManager - Comprehensive PWA Service Worker management
 * 
 * Handles all Service Worker lifecycle operations including registration,
 * updates, background sync, push notifications, and message passing.
 * Provides TypeScript interfaces and error handling for enterprise use.
 * 
 * Key Features:
 * - Automatic Service Worker registration and updates
 * - Type-safe message passing between SW and main thread  
 * - Background sync registration and management
 * - Push notification subscription management
 * - Cache management and statistics
 * - Comprehensive error handling and recovery
 */
export class ServiceWorkerManager {
  private registration: ServiceWorkerRegistration | null = null;
  private state: ServiceWorkerState = 'unsupported';
  private eventListeners: Partial<ServiceWorkerEvents> = {};
  private config: ServiceWorkerConfig;
  private updateCheckTimer: NodeJS.Timeout | null = null;
  private messageChannel: MessageChannel | null = null;

  // Service Worker script path
  private readonly SW_PATH = '/sw.js';

  // Default configuration
  private readonly DEFAULT_CONFIG: ServiceWorkerConfig = {
    scope: '/',
    updateViaCache: 'none',
    enableAutoUpdate: true,
    updateCheckInterval: 60000, // 1 minute
    enableNotifications: true,
    enableBackgroundSync: true,
  };

  constructor(config: Partial<ServiceWorkerConfig> = {}) {
    this.config = { ...this.DEFAULT_CONFIG, ...config };
    
    // Check for Service Worker support
    if (!this.isSupported()) {
      this.setState('unsupported');
      console.warn('Service Workers are not supported in this browser');
      return;
    }

    this.setupServiceWorker();
  }

  // ========================================
  // PUBLIC API
  // ========================================

  /**
   * Check if Service Workers are supported
   */
  isSupported(): boolean {
    return 'serviceWorker' in navigator && 'PushManager' in window;
  }

  /**
   * Get current Service Worker state
   */
  getState(): ServiceWorkerState {
    return this.state;
  }

  /**
   * Register Service Worker
   */
  async register(): Promise<ServiceWorkerRegistration | null> {
    if (!this.isSupported()) {
      throw new Error('Service Workers not supported');
    }

    try {
      this.setState('registering');

      const registration = await navigator.serviceWorker.register(this.SW_PATH, {
        scope: this.config.scope,
        updateViaCache: this.config.updateViaCache,
      });

      this.registration = registration;
      this.setupRegistrationListeners(registration);
      
      // Check for updates immediately and set up periodic checks
      if (this.config.enableAutoUpdate) {
        await this.checkForUpdates();
        this.startUpdateChecker();
      }

      this.setState('registered');
      console.log('Service Worker registered successfully', { scope: registration.scope });

      return registration;

    } catch (error) {
      this.setState('error');
      const swError = new Error(`Service Worker registration failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      this.emitEvent('error', swError);
      throw swError;
    }
  }

  /**
   * Unregister Service Worker
   */
  async unregister(): Promise<boolean> {
    if (!this.registration) {
      return false;
    }

    try {
      const result = await this.registration.unregister();
      
      if (result) {
        this.registration = null;
        this.setState('unsupported');
        this.stopUpdateChecker();
        console.log('Service Worker unregistered successfully');
      }

      return result;

    } catch (error) {
      const swError = new Error(`Service Worker unregistration failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      this.emitEvent('error', swError);
      throw swError;
    }
  }

  /**
   * Check for Service Worker updates manually
   */
  async checkForUpdates(): Promise<void> {
    if (!this.registration) {
      return;
    }

    try {
      await this.registration.update();
      console.log('Checked for Service Worker updates');
    } catch (error) {
      console.warn('Failed to check for updates:', error);
    }
  }

  /**
   * Skip waiting and activate new Service Worker
   */
  async skipWaiting(): Promise<void> {
    if (!this.registration?.waiting) {
      return;
    }

    try {
      await this.postMessage({ type: 'SKIP_WAITING', timestamp: Date.now() });
      console.log('Requested Service Worker to skip waiting');
    } catch (error) {
      const swError = new Error(`Failed to skip waiting: ${error instanceof Error ? error.message : 'Unknown error'}`);
      this.emitEvent('error', swError);
      throw swError;
    }
  }

  /**
   * Get Service Worker version
   */
  async getVersion(): Promise<string | null> {
    try {
      const response = await this.postMessageWithResponse({ 
        type: 'GET_VERSION', 
        timestamp: Date.now() 
      });
      return response?.version || null;
    } catch (error) {
      console.warn('Failed to get Service Worker version:', error);
      return null;
    }
  }

  /**
   * Clear all Service Worker caches
   */
  async clearCaches(): Promise<boolean> {
    try {
      const response = await this.postMessageWithResponse({ 
        type: 'CLEAR_CACHE', 
        timestamp: Date.now() 
      });
      return response?.success || false;
    } catch (error) {
      console.warn('Failed to clear caches:', error);
      return false;
    }
  }

  /**
   * Register background sync
   */
  async registerBackgroundSync(
    tag: string, 
    options: Partial<SyncRegistrationOptions> = {}
  ): Promise<boolean> {
    if (!this.config.enableBackgroundSync || !this.registration) {
      return false;
    }

    try {
      const response = await this.postMessageWithResponse({
        type: 'REGISTER_SYNC',
        data: { tag, ...options },
        timestamp: Date.now()
      });

      const success = response?.success || false;
      
      if (success) {
        console.log(`Background sync registered: ${tag}`);
      }

      return success;

    } catch (error) {
      console.warn(`Failed to register background sync for ${tag}:`, error);
      return false;
    }
  }

  /**
   * Subscribe to push notifications
   */
  async subscribeToPush(options: PushSubscriptionOptions): Promise<PushSubscription | null> {
    if (!this.config.enableNotifications || !this.registration) {
      return null;
    }

    try {
      // Request notification permission
      const permission = await Notification.requestPermission();
      
      if (permission !== 'granted') {
        throw new Error('Notification permission denied');
      }

      // Subscribe to push notifications
      const subscription = await this.registration.pushManager.subscribe({
        userVisibleOnly: options.userVisibleOnly,
        applicationServerKey: this.urlBase64ToUint8Array(options.applicationServerKey)
      });

      console.log('Push notification subscription created');
      return subscription;

    } catch (error) {
      const pushError = new Error(`Push subscription failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      this.emitEvent('error', pushError);
      throw pushError;
    }
  }

  /**
   * Get existing push subscription
   */
  async getPushSubscription(): Promise<PushSubscription | null> {
    if (!this.registration) {
      return null;
    }

    try {
      return await this.registration.pushManager.getSubscription();
    } catch (error) {
      console.warn('Failed to get push subscription:', error);
      return null;
    }
  }

  /**
   * Unsubscribe from push notifications
   */
  async unsubscribeFromPush(): Promise<boolean> {
    try {
      const subscription = await this.getPushSubscription();
      
      if (!subscription) {
        return false;
      }

      const result = await subscription.unsubscribe();
      
      if (result) {
        console.log('Unsubscribed from push notifications');
      }

      return result;

    } catch (error) {
      console.warn('Failed to unsubscribe from push:', error);
      return false;
    }
  }

  /**
   * Get cache statistics
   */
  async getCacheStats(): Promise<CacheStats | null> {
    try {
      const cacheNames = await caches.keys();
      const strCaches = cacheNames.filter(name => name.startsWith('str-certified-'));

      let totalSize = 0;
      let staticCacheSize = 0;
      let runtimeCacheSize = 0;
      let mediaCacheSize = 0;

      for (const cacheName of strCaches) {
        const cache = await caches.open(cacheName);
        const requests = await cache.keys();
        
        let cacheSize = 0;
        for (const request of requests) {
          try {
            const response = await cache.match(request);
            if (response) {
              const responseClone = await response.clone();
              const buffer = await responseClone.arrayBuffer();
              cacheSize += buffer.byteLength;
            }
          } catch (error) {
            // Continue calculating other sizes
          }
        }

        totalSize += cacheSize;

        if (cacheName.includes('static')) {
          staticCacheSize = cacheSize;
        } else if (cacheName.includes('runtime')) {
          runtimeCacheSize = cacheSize;
        } else if (cacheName.includes('media')) {
          mediaCacheSize = cacheSize;
        }
      }

      return {
        totalCaches: strCaches.length,
        totalSize,
        staticCacheSize,
        runtimeCacheSize,
        mediaCacheSize,
        lastCleanup: new Date(), // Would be tracked separately in production
      };

    } catch (error) {
      console.warn('Failed to get cache stats:', error);
      return null;
    }
  }

  // ========================================
  // EVENT MANAGEMENT
  // ========================================

  /**
   * Add event listener
   */
  addEventListener<K extends keyof ServiceWorkerEvents>(
    event: K,
    listener: ServiceWorkerEvents[K]
  ): void {
    this.eventListeners[event] = listener;
  }

  /**
   * Remove event listener
   */
  removeEventListener<K extends keyof ServiceWorkerEvents>(event: K): void {
    delete this.eventListeners[event];
  }

  /**
   * Remove all event listeners
   */
  removeAllEventListeners(): void {
    this.eventListeners = {};
  }

  // ========================================
  // PRIVATE METHODS
  // ========================================

  private async setupServiceWorker(): Promise<void> {
    try {
      // Check if there's already a registered Service Worker
      const existingRegistration = await navigator.serviceWorker.getRegistration();
      
      if (existingRegistration) {
        this.registration = existingRegistration;
        this.setupRegistrationListeners(existingRegistration);
        this.setState('registered');
      }

      // Set up message handling from Service Worker
      navigator.serviceWorker.addEventListener('message', this.handleServiceWorkerMessage.bind(this));

      // Auto-register if no existing registration
      if (!existingRegistration) {
        await this.register();
      }

    } catch (error) {
      console.warn('Service Worker setup failed:', error);
      this.setState('error');
    }
  }

  private setupRegistrationListeners(registration: ServiceWorkerRegistration): void {
    // Handle installation
    if (registration.installing) {
      this.setState('installing');
      registration.installing.addEventListener('statechange', () => {
        this.handleStateChange(registration.installing);
      });
    }

    // Handle waiting for activation
    if (registration.waiting) {
      this.setState('waiting');
      this.emitEvent('updateReady');
    }

    // Handle active Service Worker
    if (registration.active) {
      this.setState('active');
    }

    // Listen for updates
    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing;
      
      if (newWorker) {
        this.setState('installing');
        
        newWorker.addEventListener('statechange', () => {
          this.handleStateChange(newWorker);
        });
      }
    });
  }

  private handleStateChange(worker: ServiceWorker | null): void {
    if (!worker) return;

    switch (worker.state) {
      case 'installed':
        if (navigator.serviceWorker.controller) {
          // New update available
          this.emitEvent('updateAvailable', {
            type: 'update_available',
            version: 'unknown', // Would be retrieved from SW
          });
        } else {
          // First install
          this.setState('active');
        }
        break;

      case 'activated':
        this.setState('active');
        break;

      case 'redundant':
        this.setState('error');
        this.emitEvent('error', new Error('Service Worker became redundant'));
        break;
    }
  }

  private handleServiceWorkerMessage(event: MessageEvent): void {
    const message: ServiceWorkerMessage = event.data;
    
    console.log('Message from Service Worker:', message);

    switch (message.type) {
      case 'SYNC_REQUEST':
        this.emitEvent('syncComplete', message.data?.tag, true);
        break;

      case 'NOTIFICATION_ACTION':
        this.emitEvent('notificationReceived', message.data);
        break;

      case 'NAVIGATE':
        // Handle navigation requests from Service Worker
        if (message.data?.url) {
          window.location.href = message.data.url;
        }
        break;

      default:
        console.log('Unknown message from Service Worker:', message);
    }
  }

  private async postMessage(message: ServiceWorkerMessage): Promise<void> {
    if (!this.registration?.active) {
      throw new Error('No active Service Worker available');
    }

    this.registration.active.postMessage(message);
  }

  private async postMessageWithResponse(message: ServiceWorkerMessage): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!this.registration?.active) {
        reject(new Error('No active Service Worker available'));
        return;
      }

      // Create message channel for response
      const messageChannel = new MessageChannel();
      
      messageChannel.port1.onmessage = (event) => {
        resolve(event.data);
      };

      // Send message with response port
      this.registration.active.postMessage(message, [messageChannel.port2]);

      // Timeout after 10 seconds
      setTimeout(() => {
        reject(new Error('Service Worker response timeout'));
      }, 10000);
    });
  }

  private startUpdateChecker(): void {
    if (this.updateCheckTimer || !this.config.enableAutoUpdate) {
      return;
    }

    this.updateCheckTimer = setInterval(() => {
      this.checkForUpdates().catch(error => {
        console.warn('Automatic update check failed:', error);
      });
    }, this.config.updateCheckInterval);
  }

  private stopUpdateChecker(): void {
    if (this.updateCheckTimer) {
      clearInterval(this.updateCheckTimer);
      this.updateCheckTimer = null;
    }
  }

  private setState(newState: ServiceWorkerState): void {
    if (this.state !== newState) {
      const oldState = this.state;
      this.state = newState;
      
      console.log(`Service Worker state changed: ${oldState} -> ${newState}`);
      this.emitEvent('stateChange', newState);
    }
  }

  private emitEvent<K extends keyof ServiceWorkerEvents>(
    event: K,
    ...args: Parameters<ServiceWorkerEvents[K]>
  ): void {
    const listener = this.eventListeners[event];
    if (listener) {
      try {
        (listener as any)(...args);
      } catch (error) {
        console.error(`Error in Service Worker event listener for ${event}:`, error);
      }
    }
  }

  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/\-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    
    return outputArray;
  }

  // ========================================
  // CLEANUP
  // ========================================

  /**
   * Clean up resources and stop all timers
   */
  destroy(): void {
    this.stopUpdateChecker();
    this.removeAllEventListeners();
    
    if (this.messageChannel) {
      this.messageChannel.port1.close();
      this.messageChannel.port2.close();
      this.messageChannel = null;
    }

    console.log('Service Worker Manager destroyed');
  }
}

// ========================================
// UTILITY FUNCTIONS
// ========================================

/**
 * Check if Service Workers are supported in this environment
 */
export function isServiceWorkerSupported(): boolean {
  return 'serviceWorker' in navigator && 'PushManager' in window;
}

/**
 * Get the current Service Worker registration
 */
export async function getCurrentRegistration(): Promise<ServiceWorkerRegistration | null> {
  if (!isServiceWorkerSupported()) {
    return null;
  }

  try {
    return await navigator.serviceWorker.getRegistration();
  } catch (error) {
    console.warn('Failed to get Service Worker registration:', error);
    return null;
  }
}

/**
 * Check if the app is currently running offline
 */
export function isOffline(): boolean {
  return !navigator.onLine;
}

/**
 * Get network information (if available)
 */
export function getNetworkInfo(): any {
  if ('connection' in navigator) {
    return (navigator as any).connection;
  }
  return null;
}

// ========================================
// CONSTANTS EXPORT
// ========================================

/**
 * Background sync tags matching Service Worker implementation
 */
export const SYNC_TAGS: SyncTags = {
  INSPECTION_DATA: 'inspection-sync',
  MEDIA_UPLOAD: 'media-sync',  
  USER_PREFERENCES: 'preferences-sync',
  ANALYTICS: 'analytics-sync',
};

/**
 * Default Service Worker configuration
 */
export const DEFAULT_SW_CONFIG: ServiceWorkerConfig = {
  scope: '/',
  updateViaCache: 'none',
  enableAutoUpdate: true,
  updateCheckInterval: 60000,
  enableNotifications: true,
  enableBackgroundSync: true,
};

// ========================================
// SINGLETON EXPORT
// ========================================

/**
 * Global Service Worker manager instance
 * Singleton pattern ensures consistent PWA functionality across the app
 */
export const serviceWorkerManager = new ServiceWorkerManager();

/**
 * Initialize Service Worker manager
 * Call this early in your app initialization
 */
export async function initializeServiceWorker(config?: Partial<ServiceWorkerConfig>): Promise<void> {
  try {
    if (config) {
      // Create new instance with custom config
      const manager = new ServiceWorkerManager(config);
      await manager.register();
    } else {
      // Use singleton instance
      await serviceWorkerManager.register();
    }
    
    console.log('Service Worker Manager initialized successfully');
  } catch (error) {
    console.error('Service Worker Manager initialization failed:', error);
  }
}