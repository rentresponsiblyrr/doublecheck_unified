/**
 * MEMORY LEAK DETECTOR - NETFLIX/META PRODUCTION STANDARDS
 * 
 * Advanced memory leak detection and prevention system for production
 * applications. Monitors memory usage, detects leaks, and provides
 * automated cleanup for common leak patterns.
 * 
 * @author STR Certified Engineering Team
 * @version 1.0 - Production Ready
 */

import { logger } from '@/utils/logger';

export interface MemorySnapshot {
  timestamp: number;
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
  nodeCount: number;
  listenerCount: number;
  timerCount: number;
  observerCount: number;
}

export interface MemoryLeak {
  id: string;
  type: 'timer' | 'listener' | 'observer' | 'memory-growth' | 'dom-nodes' | 'circular-reference';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  detectedAt: number;
  component?: string;
  stackTrace?: string;
  memoryGrowth?: number;
  suggestions: string[];
}

export interface MemoryStats {
  currentUsage: number;
  peakUsage: number;
  averageUsage: number;
  growthRate: number; // MB per minute
  leaksDetected: MemoryLeak[];
  totalSnapshots: number;
  monitoringDuration: number; // minutes
}

class MemoryLeakDetector {
  private snapshots: MemorySnapshot[] = [];
  private detectedLeaks: MemoryLeak[] = [];
  private monitoringInterval: NodeJS.Timeout | null = null;
  private startTime: number = Date.now();
  
  // Registry for tracking cleanup functions
  private cleanupRegistry = new Map<string, (() => void)[]>();
  private activeTimers = new Set<NodeJS.Timeout | number>();
  private activeIntervals = new Set<NodeJS.Timeout | number>();
  private activeObservers = new Set<IntersectionObserver | MutationObserver | ResizeObserver>();
  private activeEventListeners = new Map<EventTarget, Array<{
    event: string;
    listener: EventListener;
    options?: boolean | AddEventListenerOptions;
  }>>();
  
  private readonly MEMORY_GROWTH_THRESHOLD = 10; // MB per minute
  private readonly SNAPSHOT_INTERVAL = 30000; // 30 seconds
  private readonly MAX_SNAPSHOTS = 100;
  
  constructor() {
    this.setupMemoryMonitoring();
    this.setupGlobalCleanupTracking();
  }
  
  /**
   * Start memory leak monitoring
   */
  startMonitoring(): void {
    if (this.monitoringInterval) return;
    
    logger.info('Memory leak monitoring started');
    
    this.monitoringInterval = setInterval(() => {
      this.takeMemorySnapshot();
      this.analyzeMemoryTrends();
    }, this.SNAPSHOT_INTERVAL);
    
    // Initial snapshot
    this.takeMemorySnapshot();
  }
  
  /**
   * Stop memory leak monitoring
   */
  stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
      logger.info('Memory leak monitoring stopped');
    }
  }
  
  /**
   * Register cleanup function for component
   */
  registerCleanup(componentId: string, cleanup: () => void): void {
    if (!this.cleanupRegistry.has(componentId)) {
      this.cleanupRegistry.set(componentId, []);
    }
    this.cleanupRegistry.get(componentId)!.push(cleanup);
  }
  
  /**
   * Execute cleanup for component
   */
  executeCleanup(componentId: string): void {
    const cleanupFunctions = this.cleanupRegistry.get(componentId);
    if (cleanupFunctions) {
      cleanupFunctions.forEach(cleanup => {
        try {
          cleanup();
        } catch (error) {
          logger.error('Cleanup function failed', { componentId, error });
        }
      });
      this.cleanupRegistry.delete(componentId);
    }
  }
  
  /**
   * Track timer creation
   */
  trackTimer(timer: NodeJS.Timeout | number, type: 'timeout' | 'interval' = 'timeout'): void {
    if (type === 'timeout') {
      this.activeTimers.add(timer);
    } else {
      this.activeIntervals.add(timer);
    }
  }
  
  /**
   * Track observer creation
   */
  trackObserver(observer: IntersectionObserver | MutationObserver | ResizeObserver): void {
    this.activeObservers.add(observer);
  }
  
  /**
   * Track event listener
   */
  trackEventListener(
    target: EventTarget, 
    event: string, 
    listener: EventListener,
    options?: boolean | AddEventListenerOptions
  ): void {
    if (!this.activeEventListeners.has(target)) {
      this.activeEventListeners.set(target, []);
    }
    this.activeEventListeners.get(target)!.push({ event, listener, options });
  }
  
  /**
   * Clean up tracked timer
   */
  cleanupTimer(timer: NodeJS.Timeout | number): void {
    if (this.activeTimers.has(timer)) {
      clearTimeout(timer as NodeJS.Timeout);
      this.activeTimers.delete(timer);
    }
    if (this.activeIntervals.has(timer)) {
      clearInterval(timer as NodeJS.Timeout);
      this.activeIntervals.delete(timer);
    }
  }
  
  /**
   * Clean up tracked observer
   */
  cleanupObserver(observer: IntersectionObserver | MutationObserver | ResizeObserver): void {
    if (this.activeObservers.has(observer)) {
      observer.disconnect();
      this.activeObservers.delete(observer);
    }
  }
  
  /**
   * Clean up tracked event listener
   */
  cleanupEventListener(target: EventTarget, event: string, listener: EventListener): void {
    const listeners = this.activeEventListeners.get(target);
    if (listeners) {
      const index = listeners.findIndex(l => l.event === event && l.listener === listener);
      if (index > -1) {
        const listenerInfo = listeners[index];
        target.removeEventListener(event, listener, listenerInfo.options);
        listeners.splice(index, 1);
        
        if (listeners.length === 0) {
          this.activeEventListeners.delete(target);
        }
      }
    }
  }
  
  /**
   * Emergency cleanup - clear all tracked resources
   */
  emergencyCleanup(): void {
    logger.warn('Executing emergency memory cleanup');
    
    // Clear all timers
    this.activeTimers.forEach(timer => clearTimeout(timer as NodeJS.Timeout));
    this.activeIntervals.forEach(interval => clearInterval(interval as NodeJS.Timeout));
    
    // Disconnect all observers
    this.activeObservers.forEach(observer => observer.disconnect());
    
    // Remove all event listeners
    this.activeEventListeners.forEach((listeners, target) => {
      listeners.forEach(({ event, listener, options }) => {
        target.removeEventListener(event, listener, options);
      });
    });
    
    // Clear registries
    this.activeTimers.clear();
    this.activeIntervals.clear();
    this.activeObservers.clear();
    this.activeEventListeners.clear();
    
    // Execute all registered cleanup functions
    this.cleanupRegistry.forEach((cleanupFunctions, componentId) => {
      cleanupFunctions.forEach(cleanup => {
        try {
          cleanup();
        } catch (error) {
          logger.error('Emergency cleanup failed', { componentId, error });
        }
      });
    });
    this.cleanupRegistry.clear();
    
    // Force garbage collection if available
    if (window.gc) {
      window.gc();
    }
  }
  
  /**
   * Get current memory statistics
   */
  getMemoryStats(): MemoryStats {
    const now = Date.now();
    const monitoringDuration = (now - this.startTime) / 60000; // minutes
    
    if (this.snapshots.length === 0) {
      return {
        currentUsage: 0,
        peakUsage: 0,
        averageUsage: 0,
        growthRate: 0,
        leaksDetected: [...this.detectedLeaks],
        totalSnapshots: 0,
        monitoringDuration,
      };
    }
    
    const currentSnapshot = this.snapshots[this.snapshots.length - 1];
    const usages = this.snapshots.map(s => s.usedJSHeapSize / 1024 / 1024);
    
    return {
      currentUsage: currentSnapshot.usedJSHeapSize / 1024 / 1024,
      peakUsage: Math.max(...usages),
      averageUsage: usages.reduce((sum, usage) => sum + usage, 0) / usages.length,
      growthRate: this.calculateGrowthRate(),
      leaksDetected: [...this.detectedLeaks],
      totalSnapshots: this.snapshots.length,
      monitoringDuration,
    };
  }
  
  /**
   * Take memory snapshot
   */
  private takeMemorySnapshot(): void {
    if (!('memory' in performance)) return;
    
    const memory = (performance as any).memory;
    const snapshot: MemorySnapshot = {
      timestamp: Date.now(),
      usedJSHeapSize: memory.usedJSHeapSize,
      totalJSHeapSize: memory.totalJSHeapSize,
      jsHeapSizeLimit: memory.jsHeapSizeLimit,
      nodeCount: document.querySelectorAll('*').length,
      listenerCount: this.getActiveListenerCount(),
      timerCount: this.activeTimers.size + this.activeIntervals.size,
      observerCount: this.activeObservers.size,
    };
    
    this.snapshots.push(snapshot);
    
    // Maintain snapshot limit
    if (this.snapshots.length > this.MAX_SNAPSHOTS) {
      this.snapshots.shift();
    }
    
    logger.debug('Memory snapshot taken', {
      memoryMB: (snapshot.usedJSHeapSize / 1024 / 1024).toFixed(2),
      nodeCount: snapshot.nodeCount,
      activeTimers: snapshot.timerCount,
      activeObservers: snapshot.observerCount,
    });
  }
  
  /**
   * Analyze memory trends for leaks
   */
  private analyzeMemoryTrends(): void {
    if (this.snapshots.length < 3) return;
    
    const growthRate = this.calculateGrowthRate();
    
    // Check for excessive memory growth
    if (growthRate > this.MEMORY_GROWTH_THRESHOLD) {
      this.reportLeak({
        type: 'memory-growth',
        severity: growthRate > 50 ? 'critical' : growthRate > 25 ? 'high' : 'medium',
        description: `Excessive memory growth detected: ${growthRate.toFixed(2)} MB/min`,
        memoryGrowth: growthRate,
        suggestions: [
          'Check for objects held in closures',
          'Verify event listeners are properly removed',
          'Ensure timers and intervals are cleared',
          'Look for circular references in data structures',
        ],
      });
    }
    
    // Check for DOM node accumulation
    const nodeGrowth = this.calculateNodeGrowth();
    if (nodeGrowth > 100) { // More than 100 nodes per minute
      this.reportLeak({
        type: 'dom-nodes',
        severity: nodeGrowth > 500 ? 'high' : 'medium',
        description: `DOM nodes growing rapidly: ${nodeGrowth.toFixed(0)} nodes/min`,
        suggestions: [
          'Check for components that create DOM nodes without cleanup',
          'Verify virtual scrolling implementation',
          'Look for memory leaks in third-party libraries',
        ],
      });
    }
    
    // Check for resource accumulation
    this.checkResourceAccumulation();
  }
  
  /**
   * Check for resource accumulation
   */
  private checkResourceAccumulation(): void {
    const currentSnapshot = this.snapshots[this.snapshots.length - 1];
    
    // Check timer accumulation
    if (currentSnapshot.timerCount > 20) {
      this.reportLeak({
        type: 'timer',
        severity: currentSnapshot.timerCount > 50 ? 'high' : 'medium',
        description: `High number of active timers: ${currentSnapshot.timerCount}`,
        suggestions: [
          'Audit setTimeout/setInterval usage',
          'Ensure timers are cleared in component cleanup',
          'Use useMemoryCleanup hook consistently',
        ],
      });
    }
    
    // Check observer accumulation
    if (currentSnapshot.observerCount > 10) {
      this.reportLeak({
        type: 'observer',
        severity: currentSnapshot.observerCount > 25 ? 'high' : 'medium',
        description: `High number of active observers: ${currentSnapshot.observerCount}`,
        suggestions: [
          'Ensure observers are disconnected in cleanup',
          'Consider observer pooling for similar use cases',
          'Check IntersectionObserver usage patterns',
        ],
      });
    }
  }
  
  /**
   * Calculate memory growth rate (MB per minute)
   */
  private calculateGrowthRate(): number {
    if (this.snapshots.length < 2) return 0;
    
    const recent = this.snapshots.slice(-5); // Last 5 snapshots
    if (recent.length < 2) return 0;
    
    const firstSnapshot = recent[0];
    const lastSnapshot = recent[recent.length - 1];
    
    const memoryGrowthMB = (lastSnapshot.usedJSHeapSize - firstSnapshot.usedJSHeapSize) / 1024 / 1024;
    const timeGrowthMinutes = (lastSnapshot.timestamp - firstSnapshot.timestamp) / 60000;
    
    return timeGrowthMinutes > 0 ? memoryGrowthMB / timeGrowthMinutes : 0;
  }
  
  /**
   * Calculate DOM node growth rate
   */
  private calculateNodeGrowth(): number {
    if (this.snapshots.length < 2) return 0;
    
    const recent = this.snapshots.slice(-3); // Last 3 snapshots
    if (recent.length < 2) return 0;
    
    const firstSnapshot = recent[0];
    const lastSnapshot = recent[recent.length - 1];
    
    const nodeGrowth = lastSnapshot.nodeCount - firstSnapshot.nodeCount;
    const timeGrowthMinutes = (lastSnapshot.timestamp - firstSnapshot.timestamp) / 60000;
    
    return timeGrowthMinutes > 0 ? nodeGrowth / timeGrowthMinutes : 0;
  }
  
  /**
   * Get active listener count
   */
  private getActiveListenerCount(): number {
    let count = 0;
    this.activeEventListeners.forEach(listeners => {
      count += listeners.length;
    });
    return count;
  }
  
  /**
   * Report detected memory leak
   */
  private reportLeak(leak: Omit<MemoryLeak, 'id' | 'detectedAt' | 'stackTrace'>): void {
    const fullLeak: MemoryLeak = {
      ...leak,
      id: `leak_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      detectedAt: Date.now(),
      stackTrace: new Error().stack,
    };
    
    this.detectedLeaks.push(fullLeak);
    
    // Keep only recent leaks
    if (this.detectedLeaks.length > 50) {
      this.detectedLeaks.shift();
    }
    
    logger.warn('Memory leak detected', fullLeak);
    
    // Trigger emergency cleanup for critical leaks
    if (fullLeak.severity === 'critical') {
      setTimeout(() => this.emergencyCleanup(), 1000);
    }
  }
  
  /**
   * Setup global cleanup tracking
   */
  private setupGlobalCleanupTracking(): void {
    // Override setTimeout to track timers
    const originalSetTimeout = window.setTimeout;
    window.setTimeout = (handler: TimerHandler, timeout?: number, ...args: any[]) => {
      const timer = originalSetTimeout(handler, timeout, ...args);
      this.trackTimer(timer, 'timeout');
      return timer;
    };
    
    // Override setInterval to track intervals
    const originalSetInterval = window.setInterval;
    window.setInterval = (handler: TimerHandler, timeout?: number, ...args: any[]) => {
      const timer = originalSetInterval(handler, timeout, ...args);
      this.trackTimer(timer, 'interval');
      return timer;
    };
  }
  
  /**
   * Setup memory monitoring with performance observers
   */
  private setupMemoryMonitoring(): void {
    // Monitor for memory pressure
    if ('memory' in performance && 'onmemory' in window) {
      (window as any).addEventListener('memory', (event: any) => {
        if (event.memoryPressure === 'high') {
          logger.warn('High memory pressure detected, executing cleanup');
          this.emergencyCleanup();
        }
      });
    }
    
    // Monitor for page visibility changes
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        // Page is hidden, good time for cleanup
        this.executePeriodicCleanup();
      }
    });
  }
  
  /**
   * Execute periodic cleanup
   */
  private executePeriodicCleanup(): void {
    // Clear completed timers
    const completedTimers = Array.from(this.activeTimers).filter(timer => {
      // Timer is completed if it's no longer active
      return typeof timer === 'number' && timer <= 0;
    });
    
    completedTimers.forEach(timer => this.activeTimers.delete(timer));
    
    logger.debug('Periodic cleanup executed', {
      clearedTimers: completedTimers.length,
      activeTimers: this.activeTimers.size,
      activeObservers: this.activeObservers.size,
      activeListeners: this.getActiveListenerCount(),
    });
  }
}

// Singleton instance
export const memoryLeakDetector = new MemoryLeakDetector();

// Auto-start monitoring in development
if (process.env.NODE_ENV === 'development') {
  memoryLeakDetector.startMonitoring();
}

export default MemoryLeakDetector;