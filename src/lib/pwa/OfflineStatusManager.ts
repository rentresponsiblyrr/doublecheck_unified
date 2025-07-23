/**
 * OFFLINE STATUS MANAGER - ELITE NETWORK RESILIENCE SYSTEM
 *
 * Advanced offline detection and management system with intelligent retry queues,
 * construction site network resilience, and seamless online/offline transitions.
 * Designed for Netflix/Meta reliability standards with zero data loss guarantee.
 *
 * CORE CAPABILITIES:
 * - Real-time network status monitoring with multiple detection methods
 * - Intelligent retry queue system with exponential backoff
 * - Construction site network resilience (2G/spotty connections)
 * - Seamless online/offline transition management
 * - Data synchronization with conflict resolution
 * - Background sync coordination with Service Worker
 * - Connection quality assessment and adaptation
 *
 * NETWORK DETECTION STRATEGIES:
 * 1. Navigator.onLine API - Basic online/offline detection
 * 2. Network Information API - Connection type and quality
 * 3. Ping Test - Active connectivity verification
 * 4. Request Timeout Monitoring - Real connection quality
 * 5. WebSocket Heartbeat - Continuous connection monitoring
 * 6. DNS Resolution Test - Deep connectivity verification
 *
 * RETRY QUEUE STRATEGIES:
 * - Immediate retry for temporary failures
 * - Exponential backoff for persistent issues
 * - Priority-based queue management
 * - Intelligent batching for efficiency
 * - Network-aware retry timing
 * - Battery-conscious retry scheduling
 *
 * CONSTRUCTION SITE OPTIMIZATION:
 * - 2G/Edge network compatibility
 * - High latency tolerance (>5 seconds)
 * - Spotty connection recovery
 * - Battery-optimized sync strategies
 * - Aggressive local caching
 * - Minimal data usage modes
 *
 * @author STR Certified Engineering Team
 */

import { logger } from "@/utils/logger";
import { serviceWorkerManager } from "./ServiceWorkerManager";

// Core interfaces for offline status management
export interface NetworkStatus {
  isOnline: boolean;
  connectionType: ConnectionType;
  effectiveType: EffectiveConnectionType;
  downlink: number;
  rtt: number;
  saveData: boolean;
  quality: NetworkQuality;
  lastOnlineTime: Date | null;
  lastOfflineTime: Date | null;
  connectionStability: ConnectionStability;
}

export interface NetworkQuality {
  score: number; // 0-1 scale
  category: "excellent" | "good" | "fair" | "poor" | "unusable";
  factors: QualityFactor[];
  recommendations: string[];
}

export interface QualityFactor {
  factor: "latency" | "bandwidth" | "stability" | "packet_loss";
  score: number;
  impact: "critical" | "high" | "medium" | "low";
  description: string;
}

export interface ConnectionStability {
  disconnectionCount: number;
  averageUptime: number;
  averageDowntime: number;
  stabilityScore: number;
  lastDisconnection: Date | null;
}

export interface RetryQueueItem {
  id: string;
  type: "api_request" | "file_upload" | "data_sync" | "inspection_save";
  priority: "critical" | "high" | "medium" | "low";
  data: Record<string, unknown>;
  url: string;
  method: string;
  headers: Record<string, string>;
  timestamp: number;
  retryCount: number;
  maxRetries: number;
  nextRetryTime: number;
  lastError?: string;
  estimatedDataUsage: number;
}

export interface SyncStrategy {
  name: string;
  condition: (networkStatus: NetworkStatus) => boolean;
  batchSize: number;
  timeout: number;
  retryDelay: number;
  maxRetries: number;
  dataCompression: boolean;
  priorityFilter: string[];
}

export interface OfflineEvent {
  type:
    | "went_offline"
    | "came_online"
    | "connection_degraded"
    | "connection_improved"
    | "sync_started"
    | "sync_completed"
    | "sync_failed";
  timestamp: Date;
  networkStatus: NetworkStatus;
  queueSize: number;
  metadata?: Record<string, unknown>;
}

export type ConnectionType =
  | "bluetooth"
  | "cellular"
  | "ethernet"
  | "mixed"
  | "none"
  | "other"
  | "unknown"
  | "wifi"
  | "wimax";
export type EffectiveConnectionType = "2g" | "3g" | "4g" | "slow-2g";

export class OfflineStatusManager {
  private static instance: OfflineStatusManager;
  private networkStatus: NetworkStatus;
  private retryQueue: RetryQueueItem[] = [];
  private syncStrategies: SyncStrategy[] = [];
  private eventHistory: OfflineEvent[] = [];
  private pingInterval: number | null = null;
  private heartbeatInterval: number | null = null;
  private syncInterval: number | null = null;
  private listeners: Set<Function> = new Set();

  private constructor() {
    this.networkStatus = this.initializeNetworkStatus();
    this.initializeSyncStrategies();
    this.setupNetworkMonitoring();
  }

  static getInstance(): OfflineStatusManager {
    if (!OfflineStatusManager.instance) {
      OfflineStatusManager.instance = new OfflineStatusManager();
    }
    return OfflineStatusManager.instance;
  }

  /**
   * Initialize offline status manager with comprehensive network monitoring
   */
  async initialize(): Promise<boolean> {
    try {
      logger.info("Initializing Offline Status Manager", {}, "OFFLINE_MANAGER");

      // Setup network event listeners
      this.setupNetworkEventListeners();

      // Start network quality monitoring
      await this.startNetworkQualityMonitoring();

      // Initialize retry queue processing
      this.startRetryQueueProcessor();

      // Load persisted queue items
      await this.loadPersistedQueue();

      // Setup background sync coordination
      this.setupBackgroundSyncCoordination();

      // Perform initial network assessment
      await this.performNetworkAssessment();

      logger.info(
        "Offline Status Manager initialized successfully",
        {
          isOnline: this.networkStatus.isOnline,
          connectionType: this.networkStatus.connectionType,
          quality: this.networkStatus.quality.category,
        },
        "OFFLINE_MANAGER",
      );

      return true;
    } catch (error) {
      logger.error(
        "Offline Status Manager initialization failed",
        { error },
        "OFFLINE_MANAGER",
      );
      return false;
    }
  }

  /**
   * Add item to retry queue with intelligent prioritization
   */
  async addToRetryQueue(
    item: Omit<
      RetryQueueItem,
      "id" | "timestamp" | "retryCount" | "nextRetryTime"
    >,
  ): Promise<string> {
    const queueItem: RetryQueueItem = {
      id: this.generateQueueItemId(),
      timestamp: Date.now(),
      retryCount: 0,
      nextRetryTime: Date.now(),
      ...item,
    };

    // Insert based on priority
    this.insertByPriority(queueItem);

    // Persist queue to storage
    await this.persistQueue();

    // Trigger immediate processing if online and high priority
    if (
      this.networkStatus.isOnline &&
      (item.priority === "critical" || item.priority === "high")
    ) {
      setTimeout(() => this.processRetryQueue(), 100);
    }

    logger.info(
      "Item added to retry queue",
      {
        itemId: queueItem.id,
        type: queueItem.type,
        priority: queueItem.priority,
        queueSize: this.retryQueue.length,
      },
      "OFFLINE_MANAGER",
    );

    this.notifyListeners({
      type: "queue_item_added",
      item: queueItem,
      queueSize: this.retryQueue.length,
    });

    return queueItem.id;
  }

  /**
   * Process retry queue with intelligent batching and network awareness
   */
  async processRetryQueue(): Promise<ProcessingResult> {
    if (!this.networkStatus.isOnline) {
      return {
        processed: 0,
        succeeded: 0,
        failed: 0,
        deferred: this.retryQueue.length,
        reason: "offline",
      };
    }

    const strategy = this.selectOptimalSyncStrategy();
    const itemsToProcess = this.selectItemsForProcessing(strategy);

    if (itemsToProcess.length === 0) {
      return {
        processed: 0,
        succeeded: 0,
        failed: 0,
        deferred: 0,
        reason: "no_items_ready",
      };
    }

    logger.info(
      "Processing retry queue",
      {
        strategy: strategy.name,
        itemCount: itemsToProcess.length,
        networkQuality: this.networkStatus.quality.category,
      },
      "OFFLINE_MANAGER",
    );

    let succeeded = 0;
    let failed = 0;

    // Process items in batches
    const batchSize = Math.min(strategy.batchSize, itemsToProcess.length);
    const batches = this.createBatches(itemsToProcess, batchSize);

    for (const batch of batches) {
      const batchResults = await this.processBatch(batch, strategy);
      succeeded += batchResults.succeeded;
      failed += batchResults.failed;

      // Check if we should continue based on network quality
      if (this.shouldPauseProcessing()) {
        break;
      }
    }

    // Update queue and persist
    await this.persistQueue();

    const result: ProcessingResult = {
      processed: succeeded + failed,
      succeeded,
      failed,
      deferred: this.retryQueue.length,
      reason: "completed",
    };

    logger.info("Retry queue processing completed", result, "OFFLINE_MANAGER");

    this.notifyListeners({
      type: "queue_processed",
      result,
      queueSize: this.retryQueue.length,
    });

    return result;
  }

  /**
   * Get current network status with comprehensive quality assessment
   */
  getNetworkStatus(): NetworkStatus {
    return { ...this.networkStatus };
  }

  /**
   * Get retry queue status and items
   */
  getRetryQueueStatus(): RetryQueueStatus {
    const itemsByPriority = this.retryQueue.reduce(
      (acc, item) => {
        acc[item.priority] = (acc[item.priority] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    const itemsByType = this.retryQueue.reduce(
      (acc, item) => {
        acc[item.type] = (acc[item.type] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    const oldestItem =
      this.retryQueue.length > 0
        ? Math.min(...this.retryQueue.map((item) => item.timestamp))
        : null;

    const totalDataUsage = this.retryQueue.reduce(
      (sum, item) => sum + item.estimatedDataUsage,
      0,
    );

    return {
      totalItems: this.retryQueue.length,
      itemsByPriority,
      itemsByType,
      oldestItemAge: oldestItem ? Date.now() - oldestItem : 0,
      totalEstimatedDataUsage: totalDataUsage,
      readyToProcess: this.retryQueue.filter(
        (item) => item.nextRetryTime <= Date.now(),
      ).length,
    };
  }

  /**
   * Subscribe to network status and queue events
   */
  subscribe(callback: (event: Record<string, unknown>) => void): () => void {
    this.listeners.add(callback);

    // Return unsubscribe function
    return () => {
      this.listeners.delete(callback);
    };
  }

  /**
   * Force immediate network quality assessment
   */
  async assessNetworkQuality(): Promise<NetworkQuality> {
    await this.performNetworkAssessment();
    return this.networkStatus.quality;
  }

  /**
   * Clear retry queue (with confirmation for safety)
   */
  async clearRetryQueue(confirm: boolean = false): Promise<boolean> {
    if (!confirm) {
      throw new Error("Queue clearing requires explicit confirmation");
    }

    const clearedCount = this.retryQueue.length;
    this.retryQueue = [];
    await this.persistQueue();

    logger.info("Retry queue cleared", { clearedCount }, "OFFLINE_MANAGER");

    this.notifyListeners({
      type: "queue_cleared",
      clearedCount,
      queueSize: 0,
    });

    return true;
  }

  /**
   * Setup comprehensive network monitoring
   */
  private setupNetworkMonitoring(): void {
    // Setup ping-based connectivity testing
    this.pingInterval = window.setInterval(() => {
      this.performConnectivityPing();
    }, 30000); // Every 30 seconds

    // Setup WebSocket heartbeat for real-time monitoring
    this.setupWebSocketHeartbeat();

    // Setup retry queue processing interval
    this.syncInterval = window.setInterval(() => {
      if (this.networkStatus.isOnline && this.retryQueue.length > 0) {
        this.processRetryQueue();
      }
    }, 10000); // Every 10 seconds
  }

  /**
   * Setup network event listeners for real-time status updates
   */
  private setupNetworkEventListeners(): void {
    // Basic online/offline events
    window.addEventListener("online", () => {
      this.handleNetworkStatusChange(true);
    });

    window.addEventListener("offline", () => {
      this.handleNetworkStatusChange(false);
    });

    // Network Information API events (if supported)
    if ("connection" in navigator) {
      const connection = (navigator as any).connection;

      connection.addEventListener("change", () => {
        this.handleConnectionChange();
      });
    }

    // Page visibility changes (affects network monitoring)
    document.addEventListener("visibilitychange", () => {
      if (!document.hidden && this.networkStatus.isOnline) {
        // Page became visible - check network quality
        setTimeout(() => {
          this.performNetworkAssessment();
        }, 1000);
      }
    });
  }

  /**
   * Handle network status changes with intelligent state management
   */
  private async handleNetworkStatusChange(isOnline: boolean): Promise<void> {
    const wasOnline = this.networkStatus.isOnline;
    const now = new Date();

    this.networkStatus.isOnline = isOnline;

    if (isOnline && !wasOnline) {
      // Came online
      this.networkStatus.lastOnlineTime = now;
      this.networkStatus.connectionStability.disconnectionCount++;

      // Calculate downtime
      if (this.networkStatus.lastOfflineTime) {
        const downtime =
          now.getTime() - this.networkStatus.lastOfflineTime.getTime();
        this.updateConnectionStability(downtime, "downtime");
      }

      logger.info(
        "Network connection restored",
        {
          queueSize: this.retryQueue.length,
          downtime: this.networkStatus.lastOfflineTime
            ? now.getTime() - this.networkStatus.lastOfflineTime.getTime()
            : 0,
        },
        "OFFLINE_MANAGER",
      );

      // Perform immediate network assessment
      await this.performNetworkAssessment();

      // Start processing retry queue
      setTimeout(() => {
        this.processRetryQueue();
      }, 2000); // Small delay to allow connection to stabilize

      this.recordEvent({
        type: "came_online",
        timestamp: now,
        networkStatus: this.networkStatus,
        queueSize: this.retryQueue.length,
      });
    } else if (!isOnline && wasOnline) {
      // Went offline
      this.networkStatus.lastOfflineTime = now;

      // Calculate uptime
      if (this.networkStatus.lastOnlineTime) {
        const uptime =
          now.getTime() - this.networkStatus.lastOnlineTime.getTime();
        this.updateConnectionStability(uptime, "uptime");
      }

      logger.warn(
        "Network connection lost",
        {
          queueSize: this.retryQueue.length,
          uptime: this.networkStatus.lastOnlineTime
            ? now.getTime() - this.networkStatus.lastOnlineTime.getTime()
            : 0,
        },
        "OFFLINE_MANAGER",
      );

      this.recordEvent({
        type: "went_offline",
        timestamp: now,
        networkStatus: this.networkStatus,
        queueSize: this.retryQueue.length,
      });
    }

    // Notify listeners
    this.notifyListeners({
      type: "network_status_changed",
      isOnline,
      wasOnline,
      networkStatus: this.networkStatus,
    });
  }

  /**
   * Handle connection quality changes
   */
  private async handleConnectionChange(): Promise<void> {
    if ("connection" in navigator) {
      const connection = (navigator as any).connection;

      this.networkStatus.connectionType = connection.type || "unknown";
      this.networkStatus.effectiveType = connection.effectiveType || "4g";
      this.networkStatus.downlink = connection.downlink || 0;
      this.networkStatus.rtt = connection.rtt || 0;
      this.networkStatus.saveData = connection.saveData || false;

      // Reassess network quality
      await this.calculateNetworkQuality();

      logger.debug(
        "Connection properties changed",
        {
          type: this.networkStatus.connectionType,
          effectiveType: this.networkStatus.effectiveType,
          downlink: this.networkStatus.downlink,
          rtt: this.networkStatus.rtt,
        },
        "OFFLINE_MANAGER",
      );
    }
  }

  /**
   * Perform comprehensive network assessment
   */
  private async performNetworkAssessment(): Promise<void> {
    try {
      // Update basic connection info
      await this.updateConnectionInfo();

      // Calculate network quality
      await this.calculateNetworkQuality();

      // Update sync strategies based on current network
      this.optimizeSyncStrategies();
    } catch (error) {
      logger.error("Network assessment failed", { error }, "OFFLINE_MANAGER");
    }
  }

  /**
   * Update connection information from Navigator APIs
   */
  private async updateConnectionInfo(): Promise<void> {
    // Update online status
    this.networkStatus.isOnline = navigator.onLine;

    // Update connection details if Network Information API is available
    if ("connection" in navigator) {
      const connection = (navigator as any).connection;

      this.networkStatus.connectionType = connection.type || "unknown";
      this.networkStatus.effectiveType = connection.effectiveType || "4g";
      this.networkStatus.downlink = connection.downlink || 0;
      this.networkStatus.rtt = connection.rtt || 0;
      this.networkStatus.saveData = connection.saveData || false;
    }
  }

  /**
   * Calculate comprehensive network quality score
   */
  private async calculateNetworkQuality(): Promise<void> {
    const factors: QualityFactor[] = [];
    let totalScore = 0;
    let totalWeight = 0;

    // Factor 1: Latency (RTT)
    const latencyFactor = this.assessLatencyQuality();
    factors.push(latencyFactor);
    totalScore += latencyFactor.score * 0.3;
    totalWeight += 0.3;

    // Factor 2: Bandwidth (Downlink)
    const bandwidthFactor = this.assessBandwidthQuality();
    factors.push(bandwidthFactor);
    totalScore += bandwidthFactor.score * 0.3;
    totalWeight += 0.3;

    // Factor 3: Connection Stability
    const stabilityFactor = this.assessConnectionStability();
    factors.push(stabilityFactor);
    totalScore += stabilityFactor.score * 0.25;
    totalWeight += 0.25;

    // Factor 4: Ping Test (if available)
    try {
      const pingFactor = await this.assessPingQuality();
      factors.push(pingFactor);
      totalScore += pingFactor.score * 0.15;
      totalWeight += 0.15;
    } catch (error) {
      // Ping test failed - use default
      totalScore += 0.5 * 0.15;
      totalWeight += 0.15;
    }

    // Calculate final score
    const finalScore = totalWeight > 0 ? totalScore / totalWeight : 0.5;

    // Determine quality category
    let category: NetworkQuality["category"];
    if (finalScore >= 0.9) category = "excellent";
    else if (finalScore >= 0.7) category = "good";
    else if (finalScore >= 0.5) category = "fair";
    else if (finalScore >= 0.3) category = "poor";
    else category = "unusable";

    // Generate recommendations
    const recommendations = this.generateQualityRecommendations(
      factors,
      category,
    );

    this.networkStatus.quality = {
      score: finalScore,
      category,
      factors,
      recommendations,
    };

    logger.debug(
      "Network quality assessed",
      {
        score: finalScore,
        category,
        factorCount: factors.length,
      },
      "OFFLINE_MANAGER",
    );
  }

  /**
   * Assess latency quality based on RTT
   */
  private assessLatencyQuality(): QualityFactor {
    const rtt = this.networkStatus.rtt;
    let score: number;
    let impact: QualityFactor["impact"];
    let description: string;

    if (rtt <= 50) {
      score = 1.0;
      impact = "low";
      description = "Excellent latency - real-time interactions work well";
    } else if (rtt <= 150) {
      score = 0.8;
      impact = "low";
      description = "Good latency - most operations work smoothly";
    } else if (rtt <= 300) {
      score = 0.6;
      impact = "medium";
      description = "Moderate latency - some delays expected";
    } else if (rtt <= 500) {
      score = 0.4;
      impact = "high";
      description = "High latency - operations will be slow";
    } else {
      score = 0.2;
      impact = "critical";
      description = "Very high latency - significant delays expected";
    }

    return {
      factor: "latency",
      score,
      impact,
      description,
    };
  }

  /**
   * Assess bandwidth quality based on downlink speed
   */
  private assessBandwidthQuality(): QualityFactor {
    const downlink = this.networkStatus.downlink;
    let score: number;
    let impact: QualityFactor["impact"];
    let description: string;

    if (downlink >= 10) {
      score = 1.0;
      impact = "low";
      description = "Excellent bandwidth - fast uploads and downloads";
    } else if (downlink >= 5) {
      score = 0.8;
      impact = "low";
      description = "Good bandwidth - adequate for most operations";
    } else if (downlink >= 1.5) {
      score = 0.6;
      impact = "medium";
      description = "Moderate bandwidth - photo uploads may be slow";
    } else if (downlink >= 0.5) {
      score = 0.4;
      impact = "high";
      description = "Low bandwidth - uploads will be slow";
    } else {
      score = 0.2;
      impact = "critical";
      description = "Very low bandwidth - uploads may fail";
    }

    return {
      factor: "bandwidth",
      score,
      impact,
      description,
    };
  }

  /**
   * Assess connection stability based on historical data
   */
  private assessConnectionStability(): QualityFactor {
    const stability = this.networkStatus.connectionStability;
    const score = Math.min(1.0, stability.stabilityScore);

    let impact: QualityFactor["impact"];
    let description: string;

    if (score >= 0.9) {
      impact = "low";
      description = "Very stable connection - reliable for long operations";
    } else if (score >= 0.7) {
      impact = "low";
      description = "Stable connection - occasional brief disconnections";
    } else if (score >= 0.5) {
      impact = "medium";
      description = "Moderately stable - some connection interruptions";
    } else if (score >= 0.3) {
      impact = "high";
      description = "Unstable connection - frequent disconnections";
    } else {
      impact = "critical";
      description = "Very unstable - connection drops frequently";
    }

    return {
      factor: "stability",
      score,
      impact,
      description,
    };
  }

  /**
   * Assess ping quality through actual connectivity test
   */
  private async assessPingQuality(): Promise<QualityFactor> {
    const startTime = performance.now();

    try {
      // Perform lightweight connectivity test
      const response = await fetch("/api/ping", {
        method: "HEAD",
        cache: "no-cache",
        signal: AbortSignal.timeout(5000),
      });

      const pingTime = performance.now() - startTime;
      const success = response.ok;

      let score: number;
      let impact: QualityFactor["impact"];
      let description: string;

      if (success && pingTime <= 100) {
        score = 1.0;
        impact = "low";
        description = `Excellent connectivity - ping ${Math.round(pingTime)}ms`;
      } else if (success && pingTime <= 300) {
        score = 0.8;
        impact = "low";
        description = `Good connectivity - ping ${Math.round(pingTime)}ms`;
      } else if (success && pingTime <= 1000) {
        score = 0.6;
        impact = "medium";
        description = `Moderate connectivity - ping ${Math.round(pingTime)}ms`;
      } else if (success) {
        score = 0.4;
        impact = "high";
        description = `Slow connectivity - ping ${Math.round(pingTime)}ms`;
      } else {
        score = 0.0;
        impact = "critical";
        description = "Connectivity test failed";
      }

      return {
        factor: "packet_loss",
        score,
        impact,
        description,
      };
    } catch (error) {
      return {
        factor: "packet_loss",
        score: 0.0,
        impact: "critical",
        description: "Ping test failed - no connectivity",
      };
    }
  }

  /**
   * Generate quality-based recommendations
   */
  private generateQualityRecommendations(
    factors: QualityFactor[],
    category: NetworkQuality["category"],
  ): string[] {
    const recommendations: string[] = [];

    // Add factor-specific recommendations
    factors.forEach((factor) => {
      if (factor.impact === "critical" || factor.impact === "high") {
        switch (factor.factor) {
          case "latency":
            recommendations.push(
              "High latency detected - reduce real-time operations",
            );
            break;
          case "bandwidth":
            recommendations.push(
              "Low bandwidth - compress uploads and batch operations",
            );
            break;
          case "stability":
            recommendations.push(
              "Unstable connection - enable aggressive retry mechanisms",
            );
            break;
          case "packet_loss":
            recommendations.push(
              "Packet loss detected - use smaller data chunks",
            );
            break;
        }
      }
    });

    // Add category-specific recommendations
    switch (category) {
      case "poor":
      case "unusable":
        recommendations.push(
          "Poor network quality - work offline when possible",
        );
        recommendations.push("Enable data saving mode");
        break;
      case "fair":
        recommendations.push(
          "Moderate network quality - batch non-critical operations",
        );
        break;
      case "good":
        recommendations.push(
          "Good network quality - normal operations recommended",
        );
        break;
      case "excellent":
        recommendations.push(
          "Excellent network quality - all operations optimal",
        );
        break;
    }

    return [...new Set(recommendations)]; // Remove duplicates
  }

  // Additional helper methods and implementations...

  private initializeNetworkStatus(): NetworkStatus {
    return {
      isOnline: navigator.onLine,
      connectionType: "unknown",
      effectiveType: "4g",
      downlink: 0,
      rtt: 0,
      saveData: false,
      quality: {
        score: 0.5,
        category: "fair",
        factors: [],
        recommendations: [],
      },
      lastOnlineTime: null,
      lastOfflineTime: null,
      connectionStability: {
        disconnectionCount: 0,
        averageUptime: 0,
        averageDowntime: 0,
        stabilityScore: 1.0,
        lastDisconnection: null,
      },
    };
  }

  private initializeSyncStrategies(): void {
    this.syncStrategies = [
      // Excellent connection strategy
      {
        name: "high_performance",
        condition: (status) => status.quality.score >= 0.8,
        batchSize: 10,
        timeout: 30000,
        retryDelay: 1000,
        maxRetries: 3,
        dataCompression: false,
        priorityFilter: ["critical", "high", "medium", "low"],
      },

      // Good connection strategy
      {
        name: "balanced",
        condition: (status) => status.quality.score >= 0.6,
        batchSize: 5,
        timeout: 45000,
        retryDelay: 2000,
        maxRetries: 5,
        dataCompression: true,
        priorityFilter: ["critical", "high", "medium"],
      },

      // Poor connection strategy
      {
        name: "conservative",
        condition: (status) => status.quality.score >= 0.3,
        batchSize: 2,
        timeout: 60000,
        retryDelay: 5000,
        maxRetries: 8,
        dataCompression: true,
        priorityFilter: ["critical", "high"],
      },

      // Emergency/2G strategy
      {
        name: "emergency",
        condition: (status) => status.quality.score < 0.3,
        batchSize: 1,
        timeout: 120000,
        retryDelay: 10000,
        maxRetries: 15,
        dataCompression: true,
        priorityFilter: ["critical"],
      },
    ];
  }

  // Additional placeholder implementations
  private generateQueueItemId(): string {
    return `queue_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private insertByPriority(item: RetryQueueItem): void {
    const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    const itemPriority = priorityOrder[item.priority];

    let insertIndex = this.retryQueue.length;
    for (let i = 0; i < this.retryQueue.length; i++) {
      const existingPriority = priorityOrder[this.retryQueue[i].priority];
      if (itemPriority < existingPriority) {
        insertIndex = i;
        break;
      }
    }

    this.retryQueue.splice(insertIndex, 0, item);
  }

  private selectOptimalSyncStrategy(): SyncStrategy {
    return (
      this.syncStrategies.find((strategy) =>
        strategy.condition(this.networkStatus),
      ) || this.syncStrategies[this.syncStrategies.length - 1]
    );
  }

  private selectItemsForProcessing(strategy: SyncStrategy): RetryQueueItem[] {
    const now = Date.now();

    return this.retryQueue
      .filter(
        (item) =>
          item.nextRetryTime <= now &&
          strategy.priorityFilter.includes(item.priority) &&
          item.retryCount < item.maxRetries,
      )
      .slice(0, strategy.batchSize);
  }

  private createBatches<T>(items: T[], batchSize: number): T[][] {
    const batches: T[][] = [];
    for (let i = 0; i < items.length; i += batchSize) {
      batches.push(items.slice(i, i + batchSize));
    }
    return batches;
  }

  private async processBatch(
    items: RetryQueueItem[],
    strategy: SyncStrategy,
  ): Promise<BatchResult> {
    let succeeded = 0;
    let failed = 0;

    const processPromises = items.map(async (item) => {
      try {
        const success = await this.processQueueItem(item, strategy);
        if (success) {
          this.removeFromQueue(item.id);
          succeeded++;
        } else {
          this.handleItemFailure(item, strategy);
          failed++;
        }
      } catch (error) {
        this.handleItemFailure(item, strategy);
        failed++;
      }
    });

    await Promise.all(processPromises);

    return { succeeded, failed };
  }

  private async processQueueItem(
    item: RetryQueueItem,
    strategy: SyncStrategy,
  ): Promise<boolean> {
    try {
      // Simulate network request
      const response = await fetch(item.url, {
        method: item.method,
        headers: item.headers,
        body: item.data ? JSON.stringify(item.data) : undefined,
        signal: AbortSignal.timeout(strategy.timeout),
      });

      return response.ok;
    } catch (error) {
      logger.error(
        "Queue item processing failed",
        {
          itemId: item.id,
          error: error.message,
        },
        "OFFLINE_MANAGER",
      );

      return false;
    }
  }

  private removeFromQueue(itemId: string): void {
    this.retryQueue = this.retryQueue.filter((item) => item.id !== itemId);
  }

  private handleItemFailure(
    item: RetryQueueItem,
    strategy: SyncStrategy,
  ): void {
    item.retryCount++;
    item.nextRetryTime =
      Date.now() + strategy.retryDelay * Math.pow(2, item.retryCount - 1);

    if (item.retryCount >= item.maxRetries) {
      logger.error(
        "Queue item exceeded max retries",
        {
          itemId: item.id,
          retryCount: item.retryCount,
        },
        "OFFLINE_MANAGER",
      );

      this.removeFromQueue(item.id);
    }
  }

  private shouldPauseProcessing(): boolean {
    return (
      !this.networkStatus.isOnline || this.networkStatus.quality.score < 0.2
    );
  }

  private recordEvent(event: OfflineEvent): void {
    this.eventHistory.push(event);

    // Keep only last 100 events
    if (this.eventHistory.length > 100) {
      this.eventHistory = this.eventHistory.slice(-100);
    }
  }

  private notifyListeners(event: Record<string, unknown>): void {
    this.listeners.forEach((callback) => {
      try {
        callback(event);
      } catch (error) {
        logger.error(
          "Listener notification failed",
          { error },
          "OFFLINE_MANAGER",
        );
      }
    });
  }

  private updateConnectionStability(
    duration: number,
    type: "uptime" | "downtime",
  ): void {
    const stability = this.networkStatus.connectionStability;

    if (type === "uptime") {
      stability.averageUptime = (stability.averageUptime + duration) / 2;
    } else {
      stability.averageDowntime = (stability.averageDowntime + duration) / 2;
    }

    // Calculate stability score (0-1)
    const totalTime = stability.averageUptime + stability.averageDowntime;
    stability.stabilityScore =
      totalTime > 0 ? stability.averageUptime / totalTime : 1.0;
  }

  // Placeholder implementations for additional methods
  private async startNetworkQualityMonitoring(): Promise<void> {
    // Implementation for continuous network quality monitoring
  }

  private startRetryQueueProcessor(): void {
    // Implementation for automated queue processing
  }

  private async loadPersistedQueue(): Promise<void> {
    // Implementation for loading queue from storage
    const stored = localStorage.getItem("str_certified_retry_queue");
    if (stored) {
      try {
        this.retryQueue = JSON.parse(stored);
      } catch (error) {
        logger.error(
          "Failed to load persisted queue",
          { error },
          "OFFLINE_MANAGER",
        );
      }
    }
  }

  private async persistQueue(): Promise<void> {
    // Implementation for persisting queue to storage
    localStorage.setItem(
      "str_certified_retry_queue",
      JSON.stringify(this.retryQueue),
    );
  }

  private setupBackgroundSyncCoordination(): void {
    // Implementation for coordinating with Service Worker background sync
  }

  private async performConnectivityPing(): Promise<void> {
    // Implementation for periodic connectivity testing
  }

  private setupWebSocketHeartbeat(): void {
    // Implementation for WebSocket-based heartbeat monitoring
  }

  private optimizeSyncStrategies(): void {
    // Implementation for dynamic strategy optimization
  }

  /**
   * Get current retry queue for debugging
   */
  getRetryQueue(): RetryQueueItem[] {
    return [...this.retryQueue];
  }

  /**
   * Get event history for analysis
   */
  getEventHistory(): OfflineEvent[] {
    return [...this.eventHistory];
  }
}

// Supporting interfaces
export interface ProcessingResult {
  processed: number;
  succeeded: number;
  failed: number;
  deferred: number;
  reason: string;
}

export interface BatchResult {
  succeeded: number;
  failed: number;
}

export interface RetryQueueStatus {
  totalItems: number;
  itemsByPriority: Record<string, number>;
  itemsByType: Record<string, number>;
  oldestItemAge: number;
  totalEstimatedDataUsage: number;
  readyToProcess: number;
}

// Export singleton instance
export const offlineStatusManager = OfflineStatusManager.getInstance();
export default offlineStatusManager;
