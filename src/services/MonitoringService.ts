/**
 * MONITORING SERVICE - ENTERPRISE EXCELLENCE
 *
 * Comprehensive monitoring and metrics collection:
 * - Service performance tracking
 * - Error rate monitoring
 * - Resource usage metrics
 * - Health status aggregation
 * - Real-time alerting capabilities
 *
 * @author STR Certified Engineering Team
 * @version 2.0.0 - Service Layer Excellence
 */

import { logger } from "@/utils/logger";

// Metric types
export interface OperationMetrics {
  name: string;
  totalCalls: number;
  successfulCalls: number;
  failedCalls: number;
  averageLatency: number;
  minLatency: number;
  maxLatency: number;
  lastCall: Date;
  errorRate: number;
}

export interface ServiceMetrics {
  serviceName: string;
  startTime: Date;
  uptime: number;
  operations: Map<string, OperationMetrics>;
  errorRate: number;
  totalRequests: number;
  successfulRequests: number;
  averageResponseTime: number;
}

export interface SystemHealthMetrics {
  services: Map<string, ServiceMetrics>;
  overallHealth: "healthy" | "degraded" | "unhealthy";
  totalErrors: number;
  activeServices: number;
  lastUpdated: Date;
}

// Alert configuration
interface AlertConfig {
  errorRateThreshold: number;
  latencyThreshold: number;
  healthCheckInterval: number;
  enableAlerts: boolean;
}

/**
 * Metrics Collector for individual services
 */
export class MetricsCollector {
  private serviceName: string;
  private startTime: Date;
  private operations = new Map<string, OperationMetrics>();
  private requestCounts = { total: 0, successful: 0, failed: 0 };
  private latencies: number[] = [];
  private readonly maxLatencyHistory = 1000; // Keep last 1000 latencies

  constructor(serviceName: string) {
    this.serviceName = serviceName;
    this.startTime = new Date();
  }

  /**
   * Record an operation with its performance metrics
   */
  recordOperation(
    operationName: string,
    latency: number,
    success: boolean,
  ): void {
    this.requestCounts.total++;
    if (success) {
      this.requestCounts.successful++;
    } else {
      this.requestCounts.failed++;
    }

    // Track latencies with rolling window
    this.latencies.push(latency);
    if (this.latencies.length > this.maxLatencyHistory) {
      this.latencies.shift();
    }

    // Update operation-specific metrics
    let opMetrics = this.operations.get(operationName);
    if (!opMetrics) {
      opMetrics = {
        name: operationName,
        totalCalls: 0,
        successfulCalls: 0,
        failedCalls: 0,
        averageLatency: 0,
        minLatency: latency,
        maxLatency: latency,
        lastCall: new Date(),
        errorRate: 0,
      };
      this.operations.set(operationName, opMetrics);
    }

    // Update operation metrics
    opMetrics.totalCalls++;
    if (success) {
      opMetrics.successfulCalls++;
    } else {
      opMetrics.failedCalls++;
    }

    opMetrics.minLatency = Math.min(opMetrics.minLatency, latency);
    opMetrics.maxLatency = Math.max(opMetrics.maxLatency, latency);
    opMetrics.lastCall = new Date();
    opMetrics.errorRate = opMetrics.failedCalls / opMetrics.totalCalls;

    // Calculate rolling average latency
    const totalLatency = Array.from(this.operations.values()).reduce(
      (sum, op) => sum + op.averageLatency * op.totalCalls,
      0,
    );
    const totalOps = Array.from(this.operations.values()).reduce(
      (sum, op) => sum + op.totalCalls,
      0,
    );

    opMetrics.averageLatency = totalOps > 0 ? totalLatency / totalOps : latency;
  }

  /**
   * Get current service metrics snapshot
   */
  getSnapshot(): ServiceMetrics {
    const now = new Date();
    const uptime = now.getTime() - this.startTime.getTime();
    const errorRate =
      this.requestCounts.total > 0
        ? this.requestCounts.failed / this.requestCounts.total
        : 0;

    const averageResponseTime =
      this.latencies.length > 0
        ? this.latencies.reduce((sum, lat) => sum + lat, 0) /
          this.latencies.length
        : 0;

    return {
      serviceName: this.serviceName,
      startTime: this.startTime,
      uptime,
      operations: new Map(this.operations),
      errorRate,
      totalRequests: this.requestCounts.total,
      successfulRequests: this.requestCounts.successful,
      averageResponseTime,
    };
  }

  /**
   * Get error rate for the service
   */
  getErrorRate(): number {
    return this.requestCounts.total > 0
      ? this.requestCounts.failed / this.requestCounts.total
      : 0;
  }

  /**
   * Reset metrics (useful for testing)
   */
  reset(): void {
    this.operations.clear();
    this.requestCounts = { total: 0, successful: 0, failed: 0 };
    this.latencies = [];
    this.startTime = new Date();
  }
}

/**
 * Central Monitoring Service
 */
export class MonitoringService {
  private static instance: MonitoringService;
  private services = new Map<string, MetricsCollector>();
  private alertConfig: AlertConfig;
  private healthCheckTimer: NodeJS.Timeout | null = null;

  private constructor() {
    this.alertConfig = {
      errorRateThreshold: 0.05, // 5% error rate threshold
      latencyThreshold: 1000, // 1 second latency threshold
      healthCheckInterval: 30000, // 30 seconds
      enableAlerts: true,
    };

    this.startHealthMonitoring();
  }

  public static getInstance(): MonitoringService {
    if (!MonitoringService.instance) {
      MonitoringService.instance = new MonitoringService();
    }
    return MonitoringService.instance;
  }

  /**
   * Register a service for monitoring
   */
  registerService(serviceName: string): MetricsCollector {
    if (this.services.has(serviceName)) {
      return this.services.get(serviceName)!;
    }

    const collector = new MetricsCollector(serviceName);
    this.services.set(serviceName, collector);

    logger.info("Service registered for monitoring", { serviceName });
    return collector;
  }

  /**
   * Get metrics for a specific service
   */
  getServiceMetrics(serviceName: string): ServiceMetrics | null {
    const collector = this.services.get(serviceName);
    return collector ? collector.getSnapshot() : null;
  }

  /**
   * Get system-wide health metrics
   */
  getSystemHealth(): SystemHealthMetrics {
    const serviceMetrics = new Map<string, ServiceMetrics>();
    let totalErrors = 0;
    let overallErrorRate = 0;
    let totalRequests = 0;

    for (const [name, collector] of this.services) {
      const metrics = collector.getSnapshot();
      serviceMetrics.set(name, metrics);
      totalErrors += metrics.totalRequests - metrics.successfulRequests;
      totalRequests += metrics.totalRequests;
    }

    overallErrorRate = totalRequests > 0 ? totalErrors / totalRequests : 0;

    // Determine overall health
    let overallHealth: "healthy" | "degraded" | "unhealthy" = "healthy";
    if (overallErrorRate > 0.1) {
      overallHealth = "unhealthy";
    } else if (overallErrorRate > 0.05) {
      overallHealth = "degraded";
    }

    return {
      services: serviceMetrics,
      overallHealth,
      totalErrors,
      activeServices: this.services.size,
      lastUpdated: new Date(),
    };
  }

  /**
   * Check for alert conditions
   */
  private checkAlertConditions(): void {
    if (!this.alertConfig.enableAlerts) {
      return;
    }

    for (const [serviceName, collector] of this.services) {
      const metrics = collector.getSnapshot();

      // Check error rate
      if (metrics.errorRate > this.alertConfig.errorRateThreshold) {
        this.triggerAlert("HIGH_ERROR_RATE", {
          serviceName,
          errorRate: metrics.errorRate,
          threshold: this.alertConfig.errorRateThreshold,
        });
      }

      // Check latency
      if (metrics.averageResponseTime > this.alertConfig.latencyThreshold) {
        this.triggerAlert("HIGH_LATENCY", {
          serviceName,
          latency: metrics.averageResponseTime,
          threshold: this.alertConfig.latencyThreshold,
        });
      }
    }
  }

  /**
   * Trigger an alert (can be extended to send notifications)
   */
  private triggerAlert(
    alertType: string,
    context: Record<string, unknown>,
  ): void {
    logger.warn("Service alert triggered", {
      alertType,
      ...context,
      timestamp: new Date().toISOString(),
    });

    // In production, this could send notifications to:
    // - Slack channels
    // - Email alerts
    // - PagerDuty
    // - Custom webhooks
  }

  /**
   * Start health monitoring
   */
  private startHealthMonitoring(): void {
    this.healthCheckTimer = setInterval(() => {
      try {
        this.checkAlertConditions();

        // Log system health periodically
        const health = this.getSystemHealth();
        if (health.overallHealth !== "healthy") {
          logger.warn("System health degraded", {
            health: health.overallHealth,
            totalErrors: health.totalErrors,
            activeServices: health.activeServices,
          });
        }
      } catch (error) {
        logger.error("Health check failed", error);
      }
    }, this.alertConfig.healthCheckInterval);
  }

  /**
   * Update alert configuration
   */
  updateAlertConfig(config: Partial<AlertConfig>): void {
    this.alertConfig = { ...this.alertConfig, ...config };
    logger.info("Alert configuration updated", this.alertConfig);
  }

  /**
   * Get performance report for all services
   */
  getPerformanceReport(): string {
    const health = this.getSystemHealth();
    let report = `\n=== STR Certified Service Performance Report ===\n`;
    report += `Overall Health: ${health.overallHealth.toUpperCase()}\n`;
    report += `Active Services: ${health.activeServices}\n`;
    report += `Total Errors: ${health.totalErrors}\n`;
    report += `Last Updated: ${health.lastUpdated.toISOString()}\n\n`;

    for (const [name, metrics] of health.services) {
      report += `Service: ${name}\n`;
      report += `  Uptime: ${Math.round(metrics.uptime / 1000)}s\n`;
      report += `  Requests: ${metrics.totalRequests} (${metrics.successfulRequests} successful)\n`;
      report += `  Error Rate: ${(metrics.errorRate * 100).toFixed(2)}%\n`;
      report += `  Avg Response Time: ${metrics.averageResponseTime.toFixed(2)}ms\n`;

      if (metrics.operations.size > 0) {
        report += `  Top Operations:\n`;
        const sortedOps = Array.from(metrics.operations.values())
          .sort((a, b) => b.totalCalls - a.totalCalls)
          .slice(0, 3);

        for (const op of sortedOps) {
          report += `    ${op.name}: ${op.totalCalls} calls, ${op.averageLatency.toFixed(2)}ms avg\n`;
        }
      }
      report += `\n`;
    }

    return report;
  }

  /**
   * Shutdown monitoring service
   */
  async shutdown(): Promise<void> {
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer);
      this.healthCheckTimer = null;
    }

    logger.info("MonitoringService shutdown completed");
  }
}

// Export singleton instance
export const monitoringService = MonitoringService.getInstance();

// Helper function to get a service metrics collector
export function getServiceMetrics(serviceName: string): MetricsCollector {
  return monitoringService.registerService(serviceName);
}
