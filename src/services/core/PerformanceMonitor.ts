/**
 * PERFORMANCE MONITOR - PHASE 2 PERFORMANCE EXCELLENCE
 * 
 * Elite-level performance monitoring system that tracks, analyzes, and optimizes
 * all database operations to achieve <200ms response times and >60% cache hit rates.
 * 
 * MONITORING CAPABILITIES:
 * - Real-time query performance tracking
 * - Cache hit rate analysis and optimization
 * - Slow query detection and alerting  
 * - Memory usage and optimization recommendations
 * - Mobile performance profiling
 * 
 * @author STR Certified Engineering Team
 * @phase Phase 2 - Query Standardization & Architectural Excellence
 */

import { logger } from '@/utils/logger';

// ========================================
// PERFORMANCE METRICS TYPES
// ========================================

export interface QueryMetrics {
  queryId: string;
  service: string;
  operation: string;
  startTime: number;
  endTime: number;
  duration: number;
  fromCache: boolean;
  cacheKey?: string;
  queryCount: number;
  dataSize: number;
  success: boolean;
  errorCode?: string;
  userAgent?: string;
  connectionType?: string;
}

export interface ServiceMetrics {
  serviceName: string;
  totalQueries: number;
  totalDuration: number;
  averageDuration: number;
  cacheHitRate: number;
  errorRate: number;
  slowQueryCount: number;
  memoryUsage: number;
  lastUpdated: Date;
}

export interface PerformanceReport {
  summary: {
    totalQueries: number;
    averageResponseTime: number;
    cacheHitRate: number;
    errorRate: number;
    slowQueryPercentage: number;
  };
  services: ServiceMetrics[];
  slowQueries: QueryMetrics[];
  recommendations: PerformanceRecommendation[];
  trends: {
    responseTimesByHour: Array<{ hour: number; avgTime: number }>;
    cacheHitsByHour: Array<{ hour: number; hitRate: number }>;
    errorsByHour: Array<{ hour: number; errorRate: number }>;
  };
}

export interface PerformanceRecommendation {
  type: 'cache' | 'query' | 'index' | 'memory' | 'network';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  expectedImprovement: string;
  implementation: string;
}

// ========================================
// PERFORMANCE THRESHOLDS
// ========================================

const PERFORMANCE_THRESHOLDS = {
  SLOW_QUERY_MS: 200,           // Queries >200ms are considered slow
  VERY_SLOW_QUERY_MS: 1000,     // Queries >1s are critical
  MIN_CACHE_HIT_RATE: 60,       // Minimum acceptable cache hit rate (%)
  MAX_ERROR_RATE: 1,            // Maximum acceptable error rate (%)
  MAX_MEMORY_MB: 100,           // Maximum memory usage per service (MB)
  ALERT_THRESHOLD_MS: 500,      // Alert if average response time exceeds this
} as const;

// ========================================
// PERFORMANCE MONITOR CLASS
// ========================================

/**
 * PerformanceMonitor - Production-grade performance tracking and optimization
 * 
 * Tracks all database operations and provides real-time performance insights,
 * automatic optimization recommendations, and proactive alerting for issues.
 */
export class PerformanceMonitor {
  private metrics: QueryMetrics[] = [];
  private serviceStats = new Map<string, ServiceMetrics>();
  private readonly MAX_METRICS = 10000; // Keep last 10k queries in memory
  private reportTimer?: NodeJS.Timeout;

  constructor() {
    this.startPeriodicReporting();
    this.registerNetworkObserver();
  }

  // ========================================
  // METRICS COLLECTION
  // ========================================

  /**
   * Track query performance - called by UnifiedServiceLayer
   */
  trackQuery(metrics: Omit<QueryMetrics, 'queryId' | 'duration' | 'dataSize' | 'userAgent' | 'connectionType'>): void {
    const queryMetrics: QueryMetrics = {
      queryId: this.generateQueryId(),
      duration: metrics.endTime - metrics.startTime,
      dataSize: this.estimateDataSize(metrics),
      userAgent: this.getUserAgent(),
      connectionType: this.getConnectionType(),
      ...metrics,
    };

    // Add to metrics collection
    this.metrics.push(queryMetrics);
    
    // Enforce memory limits
    if (this.metrics.length > this.MAX_METRICS) {
      this.metrics.shift();
    }

    // Update service statistics
    this.updateServiceStats(queryMetrics);

    // Check for performance issues
    this.checkPerformanceThresholds(queryMetrics);

    // Log performance data
    if (queryMetrics.duration > PERFORMANCE_THRESHOLDS.SLOW_QUERY_MS) {
      logger.warn('Slow query detected', {
        queryId: queryMetrics.queryId,
        service: queryMetrics.service,
        operation: queryMetrics.operation,
        duration: queryMetrics.duration,
        fromCache: queryMetrics.fromCache,
      });
    }
  }

  /**
   * Track cache performance
   */
  trackCacheOperation(
    service: string,
    operation: 'hit' | 'miss' | 'set' | 'invalidate',
    key: string,
    duration: number
  ): void {
    const cacheMetrics = {
      service,
      operation,
      key,
      duration,
      timestamp: Date.now(),
    };

    logger.debug('Cache operation', cacheMetrics);
  }

  // ========================================
  // PERFORMANCE ANALYSIS
  // ========================================

  /**
   * Generate comprehensive performance report
   */
  generateReport(): PerformanceReport {
    const now = Date.now();
    const last24Hours = this.metrics.filter(m => now - m.endTime < 24 * 60 * 60 * 1000);
    
    if (last24Hours.length === 0) {
      return this.getEmptyReport();
    }

    const summary = this.calculateSummary(last24Hours);
    const services = Array.from(this.serviceStats.values());
    const slowQueries = this.getSlowQueries(last24Hours);
    const recommendations = this.generateRecommendations(last24Hours, services);
    const trends = this.calculateTrends(last24Hours);

    return {
      summary,
      services,
      slowQueries,
      recommendations,
      trends,
    };
  }

  /**
   * Get real-time performance metrics
   */
  getRealTimeMetrics(): {
    currentRequests: number;
    averageResponseTime: number;
    cacheHitRate: number;
    errorRate: number;
    memoryUsage: number;
  } {
    const recentMetrics = this.getRecentMetrics(60 * 1000); // Last minute
    
    return {
      currentRequests: recentMetrics.length,
      averageResponseTime: this.calculateAverageResponseTime(recentMetrics),
      cacheHitRate: this.calculateCacheHitRate(recentMetrics),
      errorRate: this.calculateErrorRate(recentMetrics),
      memoryUsage: this.estimateMemoryUsage(),
    };
  }

  /**
   * Get service-specific performance metrics
   */
  getServiceMetrics(serviceName: string): ServiceMetrics | null {
    return this.serviceStats.get(serviceName) || null;
  }

  // ========================================
  // OPTIMIZATION RECOMMENDATIONS
  // ========================================

  private generateRecommendations(
    metrics: QueryMetrics[],
    services: ServiceMetrics[]
  ): PerformanceRecommendation[] {
    const recommendations: PerformanceRecommendation[] = [];

    // Cache optimization recommendations
    const lowCacheServices = services.filter(s => s.cacheHitRate < PERFORMANCE_THRESHOLDS.MIN_CACHE_HIT_RATE);
    lowCacheServices.forEach(service => {
      recommendations.push({
        type: 'cache',
        priority: 'high',
        title: `Improve ${service.serviceName} cache hit rate`,
        description: `Cache hit rate is ${service.cacheHitRate.toFixed(1)}%, below target of ${PERFORMANCE_THRESHOLDS.MIN_CACHE_HIT_RATE}%`,
        expectedImprovement: `Reduce response time by 40-60% for cached operations`,
        implementation: `Increase cache TTL, add pre-loading strategies, or implement smarter invalidation`,
      });
    });

    // Slow query recommendations
    const slowQueryServices = services.filter(s => s.averageDuration > PERFORMANCE_THRESHOLDS.SLOW_QUERY_MS);
    slowQueryServices.forEach(service => {
      recommendations.push({
        type: 'query',
        priority: 'high',
        title: `Optimize ${service.serviceName} query performance`,
        description: `Average response time is ${service.averageDuration.toFixed(1)}ms, above target of ${PERFORMANCE_THRESHOLDS.SLOW_QUERY_MS}ms`,
        expectedImprovement: `Reduce response time by 30-50%`,
        implementation: `Add database indexes, optimize join patterns, or implement query batching`,
      });
    });

    // Memory usage recommendations
    const highMemoryServices = services.filter(s => s.memoryUsage > PERFORMANCE_THRESHOLDS.MAX_MEMORY_MB);
    highMemoryServices.forEach(service => {
      recommendations.push({
        type: 'memory',
        priority: 'medium',
        title: `Reduce ${service.serviceName} memory usage`,
        description: `Memory usage is ${service.memoryUsage}MB, above target of ${PERFORMANCE_THRESHOLDS.MAX_MEMORY_MB}MB`,
        expectedImprovement: `Improve mobile performance and reduce crashes`,
        implementation: `Implement pagination, reduce cache size, or optimize data structures`,
      });
    });

    // Network optimization for mobile
    const mobileQueries = metrics.filter(m => this.isMobileRequest(m));
    if (mobileQueries.length > 0) {
      const avgMobileTime = this.calculateAverageResponseTime(mobileQueries);
      if (avgMobileTime > PERFORMANCE_THRESHOLDS.SLOW_QUERY_MS * 1.5) {
        recommendations.push({
          type: 'network',
          priority: 'high',
          title: 'Optimize for mobile performance',
          description: `Mobile response time is ${avgMobileTime.toFixed(1)}ms, which may impact user experience`,
          expectedImprovement: `Improve mobile user experience and reduce bounce rate`,
          implementation: `Implement request batching, reduce payload size, or add offline capabilities`,
        });
      }
    }

    return recommendations.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }

  // ========================================
  // ALERTING SYSTEM
  // ========================================

  private checkPerformanceThresholds(metrics: QueryMetrics): void {
    // Critical slow query alert
    if (metrics.duration > PERFORMANCE_THRESHOLDS.VERY_SLOW_QUERY_MS) {
      this.sendAlert('critical', 'Very slow query detected', {
        queryId: metrics.queryId,
        service: metrics.service,
        operation: metrics.operation,
        duration: metrics.duration,
      });
    }

    // Check service-level thresholds
    const serviceMetrics = this.serviceStats.get(metrics.service);
    if (serviceMetrics) {
      // Average response time alert
      if (serviceMetrics.averageDuration > PERFORMANCE_THRESHOLDS.ALERT_THRESHOLD_MS) {
        this.sendAlert('warning', `${metrics.service} average response time exceeded threshold`, {
          service: metrics.service,
          averageDuration: serviceMetrics.averageDuration,
          threshold: PERFORMANCE_THRESHOLDS.ALERT_THRESHOLD_MS,
        });
      }

      // Cache hit rate alert
      if (serviceMetrics.cacheHitRate < PERFORMANCE_THRESHOLDS.MIN_CACHE_HIT_RATE) {
        this.sendAlert('warning', `${metrics.service} cache hit rate below threshold`, {
          service: metrics.service,
          cacheHitRate: serviceMetrics.cacheHitRate,
          threshold: PERFORMANCE_THRESHOLDS.MIN_CACHE_HIT_RATE,
        });
      }
    }
  }

  private sendAlert(level: 'critical' | 'warning' | 'info', message: string, data: any): void {
    const alert = {
      level,
      message,
      data,
      timestamp: new Date().toISOString(),
      service: 'PerformanceMonitor',
    };

    // Log alert
    if (level === 'critical') {
      logger.error(message, alert);
    } else if (level === 'warning') {
      logger.warn(message, alert);
    } else {
      logger.info(message, alert);
    }

    // Could integrate with external alerting systems here
    // e.g., Slack, PagerDuty, email notifications
  }

  // ========================================
  // UTILITY METHODS
  // ========================================

  private updateServiceStats(queryMetrics: QueryMetrics): void {
    const serviceName = queryMetrics.service;
    const existing = this.serviceStats.get(serviceName);

    if (existing) {
      // Update existing stats
      const newTotal = existing.totalQueries + 1;
      const newTotalDuration = existing.totalDuration + queryMetrics.duration;
      const newErrorCount = existing.errorRate * existing.totalQueries + (queryMetrics.success ? 0 : 1);

      this.serviceStats.set(serviceName, {
        ...existing,
        totalQueries: newTotal,
        totalDuration: newTotalDuration,
        averageDuration: newTotalDuration / newTotal,
        errorRate: (newErrorCount / newTotal) * 100,
        slowQueryCount: existing.slowQueryCount + (queryMetrics.duration > PERFORMANCE_THRESHOLDS.SLOW_QUERY_MS ? 1 : 0),
        lastUpdated: new Date(),
      });
    } else {
      // Create new stats
      this.serviceStats.set(serviceName, {
        serviceName,
        totalQueries: 1,
        totalDuration: queryMetrics.duration,
        averageDuration: queryMetrics.duration,
        cacheHitRate: queryMetrics.fromCache ? 100 : 0,
        errorRate: queryMetrics.success ? 0 : 100,
        slowQueryCount: queryMetrics.duration > PERFORMANCE_THRESHOLDS.SLOW_QUERY_MS ? 1 : 0,
        memoryUsage: this.estimateServiceMemoryUsage(serviceName),
        lastUpdated: new Date(),
      });
    }

    // Update cache hit rate
    const recentQueries = this.metrics.filter(m => 
      m.service === serviceName && 
      Date.now() - m.endTime < 60 * 60 * 1000 // Last hour
    );
    if (recentQueries.length > 0) {
      const cacheHits = recentQueries.filter(m => m.fromCache).length;
      const hitRate = (cacheHits / recentQueries.length) * 100;
      const stats = this.serviceStats.get(serviceName);
      if (stats) {
        stats.cacheHitRate = hitRate;
      }
    }
  }

  private calculateSummary(metrics: QueryMetrics[]) {
    const totalQueries = metrics.length;
    const successfulQueries = metrics.filter(m => m.success);
    const cachedQueries = metrics.filter(m => m.fromCache);
    const slowQueries = metrics.filter(m => m.duration > PERFORMANCE_THRESHOLDS.SLOW_QUERY_MS);

    return {
      totalQueries,
      averageResponseTime: totalQueries > 0 ? 
        metrics.reduce((sum, m) => sum + m.duration, 0) / totalQueries : 0,
      cacheHitRate: totalQueries > 0 ? (cachedQueries.length / totalQueries) * 100 : 0,
      errorRate: totalQueries > 0 ? ((totalQueries - successfulQueries.length) / totalQueries) * 100 : 0,
      slowQueryPercentage: totalQueries > 0 ? (slowQueries.length / totalQueries) * 100 : 0,
    };
  }

  private getSlowQueries(metrics: QueryMetrics[]): QueryMetrics[] {
    return metrics
      .filter(m => m.duration > PERFORMANCE_THRESHOLDS.SLOW_QUERY_MS)
      .sort((a, b) => b.duration - a.duration)
      .slice(0, 20); // Top 20 slowest queries
  }

  private calculateTrends(metrics: QueryMetrics[]) {
    const now = Date.now();
    const hours = Array.from({ length: 24 }, (_, i) => i);

    const responseTimesByHour = hours.map(hour => {
      const hourStart = now - (hour + 1) * 60 * 60 * 1000;
      const hourEnd = now - hour * 60 * 60 * 1000;
      const hourMetrics = metrics.filter(m => m.endTime >= hourStart && m.endTime < hourEnd);
      
      return {
        hour: 23 - hour,
        avgTime: hourMetrics.length > 0 ? 
          hourMetrics.reduce((sum, m) => sum + m.duration, 0) / hourMetrics.length : 0,
      };
    });

    const cacheHitsByHour = hours.map(hour => {
      const hourStart = now - (hour + 1) * 60 * 60 * 1000;
      const hourEnd = now - hour * 60 * 60 * 1000;
      const hourMetrics = metrics.filter(m => m.endTime >= hourStart && m.endTime < hourEnd);
      const cacheHits = hourMetrics.filter(m => m.fromCache).length;
      
      return {
        hour: 23 - hour,
        hitRate: hourMetrics.length > 0 ? (cacheHits / hourMetrics.length) * 100 : 0,
      };
    });

    const errorsByHour = hours.map(hour => {
      const hourStart = now - (hour + 1) * 60 * 60 * 1000;
      const hourEnd = now - hour * 60 * 60 * 1000;
      const hourMetrics = metrics.filter(m => m.endTime >= hourStart && m.endTime < hourEnd);
      const errors = hourMetrics.filter(m => !m.success).length;
      
      return {
        hour: 23 - hour,
        errorRate: hourMetrics.length > 0 ? (errors / hourMetrics.length) * 100 : 0,
      };
    });

    return {
      responseTimesByHour,
      cacheHitsByHour,
      errorsByHour,
    };
  }

  private getRecentMetrics(timeWindow: number): QueryMetrics[] {
    const now = Date.now();
    return this.metrics.filter(m => now - m.endTime <= timeWindow);
  }

  private calculateAverageResponseTime(metrics: QueryMetrics[]): number {
    if (metrics.length === 0) return 0;
    return metrics.reduce((sum, m) => sum + m.duration, 0) / metrics.length;
  }

  private calculateCacheHitRate(metrics: QueryMetrics[]): number {
    if (metrics.length === 0) return 0;
    const hits = metrics.filter(m => m.fromCache).length;
    return (hits / metrics.length) * 100;
  }

  private calculateErrorRate(metrics: QueryMetrics[]): number {
    if (metrics.length === 0) return 0;
    const errors = metrics.filter(m => !m.success).length;
    return (errors / metrics.length) * 100;
  }

  private estimateMemoryUsage(): number {
    // Estimate memory usage in MB
    const metricsSize = this.metrics.length * 500; // Rough estimate per metric
    const serviceStatsSize = this.serviceStats.size * 200; // Rough estimate per service
    return Math.round((metricsSize + serviceStatsSize) / (1024 * 1024) * 100) / 100;
  }

  private estimateServiceMemoryUsage(serviceName: string): number {
    // Simple estimation - would be more sophisticated in production
    const serviceMetrics = this.metrics.filter(m => m.service === serviceName);
    return Math.round(serviceMetrics.length * 0.1); // 0.1 MB per query estimate
  }

  private estimateDataSize(metrics: any): number {
    // Rough estimation of data size - would be more precise in production
    return 1024; // 1KB default estimate
  }

  private generateQueryId(): string {
    return `query_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  }

  private getUserAgent(): string {
    return typeof navigator !== 'undefined' ? navigator.userAgent : 'Server';
  }

  private getConnectionType(): string {
    if (typeof navigator !== 'undefined' && 'connection' in navigator) {
      const connection = (navigator as any).connection;
      return connection?.effectiveType || 'unknown';
    }
    return 'unknown';
  }

  private isMobileRequest(metrics: QueryMetrics): boolean {
    return metrics.userAgent?.includes('Mobile') || 
           metrics.connectionType === '3g' || 
           metrics.connectionType === '2g';
  }

  private getEmptyReport(): PerformanceReport {
    return {
      summary: {
        totalQueries: 0,
        averageResponseTime: 0,
        cacheHitRate: 0,
        errorRate: 0,
        slowQueryPercentage: 0,
      },
      services: [],
      slowQueries: [],
      recommendations: [],
      trends: {
        responseTimesByHour: [],
        cacheHitsByHour: [],
        errorsByHour: [],
      },
    };
  }

  private startPeriodicReporting(): void {
    // Generate performance reports every 5 minutes
    this.reportTimer = setInterval(() => {
      const report = this.generateReport();
      
      // Log summary metrics
      logger.info('Performance Report', {
        summary: report.summary,
        servicesCount: report.services.length,
        recommendationsCount: report.recommendations.length,
      });

      // Alert on performance issues
      if (report.summary.averageResponseTime > PERFORMANCE_THRESHOLDS.SLOW_QUERY_MS) {
        this.sendAlert('warning', 'System-wide performance degradation detected', {
          averageResponseTime: report.summary.averageResponseTime,
          cacheHitRate: report.summary.cacheHitRate,
        });
      }
    }, 5 * 60 * 1000); // Every 5 minutes
  }

  private registerNetworkObserver(): void {
    // Monitor network connection changes for mobile optimization
    if (typeof navigator !== 'undefined' && 'connection' in navigator) {
      const connection = (navigator as any).connection;
      connection?.addEventListener('change', () => {
        logger.info('Network connection changed', {
          effectiveType: connection.effectiveType,
          downlink: connection.downlink,
          rtt: connection.rtt,
        });
      });
    }
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    if (this.reportTimer) {
      clearInterval(this.reportTimer);
    }
    this.metrics.length = 0;
    this.serviceStats.clear();
    logger.info('PerformanceMonitor destroyed');
  }
}

// ========================================
// SINGLETON EXPORT
// ========================================

/**
 * Global performance monitor instance
 */
export const performanceMonitor = new PerformanceMonitor();