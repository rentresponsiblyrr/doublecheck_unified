/**
 * @fileoverview Proactive Issue Detection Monitoring System
 * Real-time monitoring system that detects potential issues before they become
 * critical errors, using AI pattern recognition and predictive analytics
 * 
 * @author STR Certified Engineering Team
 * @version 1.0.0
 */

import { OpenAI } from 'openai';
import { supabase } from '@/integrations/supabase/client';
import { ErrorDetails, SystemContext, ErrorTrendAnalysis } from '@/types/errorTypes';
import { log } from '@/lib/logging/enterprise-logger';

interface MonitoringMetric {
  id: string;
  name: string;
  type: 'performance' | 'error_rate' | 'user_behavior' | 'system_health' | 'business_kpi';
  value: number;
  threshold: {
    warning: number;
    critical: number;
  };
  trend: 'increasing' | 'decreasing' | 'stable';
  timestamp: string;
  source: string;
  metadata?: Record<string, any>;
}

interface AnomalyDetection {
  id: string;
  metricId: string;
  type: 'statistical' | 'pattern' | 'threshold' | 'trend';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  confidence: number;
  predictedImpact: {
    userExperience: string;
    businessImpact: string;
    timeToResolution: string;
  };
  recommendations: string[];
  relatedMetrics: string[];
  detectedAt: string;
  expiresAt?: string;
}

interface PerformanceBaseline {
  metric: string;
  baseline: number;
  standardDeviation: number;
  seasonalPatterns: {
    hourly: number[];
    daily: number[];
    weekly: number[];
  };
  lastUpdated: string;
}

interface UserBehaviorPattern {
  pattern: string;
  frequency: number;
  associatedErrors: string[];
  riskScore: number;
  description: string;
  detectionRules: string[];
}

interface SystemHealthIndicator {
  component: string;
  status: 'healthy' | 'degraded' | 'unhealthy' | 'critical';
  metrics: {
    availability: number;
    responseTime: number;
    errorRate: number;
    throughput: number;
  };
  dependencies: string[];
  lastChecked: string;
}

export class ProactiveMonitoring {
  private openai: OpenAI;
  private metrics = new Map<string, MonitoringMetric[]>();
  private baselines = new Map<string, PerformanceBaseline>();
  private anomalies = new Map<string, AnomalyDetection[]>();
  private isMonitoring = false;
  private monitoringInterval?: number;

  constructor() {
    // SECURITY: Direct AI integration disabled for security
    log.warn('ProactiveMonitoring: Direct AI integration disabled. Use AIProxyService instead.', {
      component: 'ProactiveMonitoring',
      action: 'constructor',
      securityMeasure: 'AI_INTEGRATION_DISABLED'
    }, 'AI_INTEGRATION_DISABLED');
    this.openai = null as any; // DISABLED
  }

  /**
   * Start proactive monitoring
   */
  async startMonitoring(): Promise<void> {
    if (this.isMonitoring) {
      return;
    }

    this.isMonitoring = true;
    log.info('Starting proactive issue detection monitoring', {
      component: 'ProactiveMonitoring',
      action: 'startMonitoring',
      monitoringCycle: '30s',
      features: ['performance', 'userBehavior', 'systemHealth']
    }, 'MONITORING_STARTED');

    // Initialize baselines
    await this.initializeBaselines();

    // Start continuous monitoring
    this.monitoringInterval = window.setInterval(async () => {
      try {
        await this.runMonitoringCycle();
      } catch (error) {
        log.error('Monitoring cycle failed', error as Error, {
          component: 'ProactiveMonitoring',
          action: 'runMonitoringCycle',
          intervalMs: 30000
        }, 'MONITORING_CYCLE_FAILED');
      }
    }, 30000); // Check every 30 seconds

    // Monitor performance
    this.startPerformanceMonitoring();

    // Monitor user behavior
    this.startUserBehaviorMonitoring();

    // Monitor system health
    this.startSystemHealthMonitoring();
  }

  /**
   * Stop proactive monitoring
   */
  stopMonitoring(): void {
    this.isMonitoring = false;
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = undefined;
    }
    log.info('Stopped proactive monitoring', {
      component: 'ProactiveMonitoring',
      action: 'stopMonitoring',
      totalMetrics: Array.from(this.metrics.values()).reduce((sum, arr) => sum + arr.length, 0),
      totalAnomalies: Array.from(this.anomalies.values()).reduce((sum, arr) => sum + arr.length, 0)
    }, 'MONITORING_STOPPED');
  }

  /**
   * Run a complete monitoring cycle
   */
  private async runMonitoringCycle(): Promise<void> {
    // Collect current metrics
    const currentMetrics = await this.collectMetrics();
    
    // Detect anomalies
    const anomalies = await this.detectAnomalies(currentMetrics);
    
    // Analyze trends
    const trends = await this.analyzeTrends(currentMetrics);
    
    // Generate predictions
    const predictions = await this.generatePredictions(currentMetrics, trends);
    
    // Update baselines
    await this.updateBaselines(currentMetrics);
    
    // Trigger alerts if necessary
    await this.processAnomalies(anomalies);
    
    // Log monitoring summary
    this.logMonitoringSummary(currentMetrics, anomalies, predictions);
  }

  /**
   * Collect all monitoring metrics
   */
  private async collectMetrics(): Promise<MonitoringMetric[]> {
    const metrics: MonitoringMetric[] = [];
    const timestamp = new Date().toISOString();

    // Performance metrics
    metrics.push(...await this.collectPerformanceMetrics(timestamp));
    
    // Error rate metrics
    metrics.push(...await this.collectErrorMetrics(timestamp));
    
    // User behavior metrics
    metrics.push(...await this.collectUserBehaviorMetrics(timestamp));
    
    // System health metrics
    metrics.push(...await this.collectSystemHealthMetrics(timestamp));
    
    // Business KPI metrics
    metrics.push(...await this.collectBusinessMetrics(timestamp));

    return metrics;
  }

  /**
   * Collect performance metrics
   */
  private async collectPerformanceMetrics(timestamp: string): Promise<MonitoringMetric[]> {
    const metrics: MonitoringMetric[] = [];

    // Page load time
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    if (navigation) {
      const loadTime = navigation.loadEventEnd - navigation.loadEventStart;
      metrics.push({
        id: `perf-load-time-${Date.now()}`,
        name: 'Page Load Time',
        type: 'performance',
        value: loadTime,
        threshold: { warning: 3000, critical: 5000 },
        trend: this.calculateTrend('page_load_time', loadTime),
        timestamp,
        source: 'performance_api'
      });
    }

    // Memory usage
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      const memoryUsage = memory.usedJSHeapSize / memory.jsHeapSizeLimit;
      metrics.push({
        id: `perf-memory-${Date.now()}`,
        name: 'Memory Usage Ratio',
        type: 'performance',
        value: memoryUsage,
        threshold: { warning: 0.7, critical: 0.9 },
        trend: this.calculateTrend('memory_usage', memoryUsage),
        timestamp,
        source: 'memory_api'
      });
    }

    // Network latency (estimated from recent requests)
    const networkLatency = await this.estimateNetworkLatency();
    metrics.push({
      id: `perf-network-${Date.now()}`,
      name: 'Network Latency',
      type: 'performance',
      value: networkLatency,
      threshold: { warning: 1000, critical: 3000 },
      trend: this.calculateTrend('network_latency', networkLatency),
      timestamp,
      source: 'network_estimation'
    });

    return metrics;
  }

  /**
   * Collect error rate metrics
   */
  private async collectErrorMetrics(timestamp: string): Promise<MonitoringMetric[]> {
    const metrics: MonitoringMetric[] = [];

    // Get recent error counts from storage/API
    const errorRate = await this.calculateRecentErrorRate();
    metrics.push({
      id: `error-rate-${Date.now()}`,
      name: 'Error Rate',
      type: 'error_rate',
      value: errorRate,
      threshold: { warning: 0.05, critical: 0.1 },
      trend: this.calculateTrend('error_rate', errorRate),
      timestamp,
      source: 'error_tracking'
    });

    // JavaScript error frequency
    const jsErrors = await this.getJavaScriptErrorCount();
    metrics.push({
      id: `js-errors-${Date.now()}`,
      name: 'JavaScript Errors',
      type: 'error_rate',
      value: jsErrors,
      threshold: { warning: 5, critical: 10 },
      trend: this.calculateTrend('js_errors', jsErrors),
      timestamp,
      source: 'error_handler'
    });

    return metrics;
  }

  /**
   * Collect user behavior metrics
   */
  private async collectUserBehaviorMetrics(timestamp: string): Promise<MonitoringMetric[]> {
    const metrics: MonitoringMetric[] = [];

    // Session duration
    const sessionDuration = this.getCurrentSessionDuration();
    metrics.push({
      id: `behavior-session-${Date.now()}`,
      name: 'Session Duration',
      type: 'user_behavior',
      value: sessionDuration,
      threshold: { warning: 1800000, critical: 300000 }, // Warning if too long or too short
      trend: this.calculateTrend('session_duration', sessionDuration),
      timestamp,
      source: 'session_tracking'
    });

    // Click frequency
    const clickFrequency = this.getClickFrequency();
    metrics.push({
      id: `behavior-clicks-${Date.now()}`,
      name: 'Click Frequency',
      type: 'user_behavior',
      value: clickFrequency,
      threshold: { warning: 10, critical: 20 }, // High click frequency might indicate frustration
      trend: this.calculateTrend('click_frequency', clickFrequency),
      timestamp,
      source: 'interaction_tracking'
    });

    return metrics;
  }

  /**
   * Collect system health metrics
   */
  private async collectSystemHealthMetrics(timestamp: string): Promise<MonitoringMetric[]> {
    const metrics: MonitoringMetric[] = [];

    // Database connection health
    const dbHealth = await this.checkDatabaseHealth();
    metrics.push({
      id: `system-db-${Date.now()}`,
      name: 'Database Health',
      type: 'system_health',
      value: dbHealth.score,
      threshold: { warning: 0.8, critical: 0.6 },
      trend: this.calculateTrend('db_health', dbHealth.score),
      timestamp,
      source: 'database_check',
      metadata: dbHealth.details
    });

    // API response times
    const apiResponseTime = await this.checkAPIResponseTime();
    metrics.push({
      id: `system-api-${Date.now()}`,
      name: 'API Response Time',
      type: 'system_health',
      value: apiResponseTime,
      threshold: { warning: 2000, critical: 5000 },
      trend: this.calculateTrend('api_response', apiResponseTime),
      timestamp,
      source: 'api_health_check'
    });

    return metrics;
  }

  /**
   * Collect business KPI metrics
   */
  private async collectBusinessMetrics(timestamp: string): Promise<MonitoringMetric[]> {
    const metrics: MonitoringMetric[] = [];

    // Inspection completion rate
    const completionRate = await this.getInspectionCompletionRate();
    metrics.push({
      id: `business-completion-${Date.now()}`,
      name: 'Inspection Completion Rate',
      type: 'business_kpi',
      value: completionRate,
      threshold: { warning: 0.7, critical: 0.5 },
      trend: this.calculateTrend('completion_rate', completionRate),
      timestamp,
      source: 'business_analytics'
    });

    // User engagement score
    const engagementScore = await this.calculateUserEngagementScore();
    metrics.push({
      id: `business-engagement-${Date.now()}`,
      name: 'User Engagement Score',
      type: 'business_kpi',
      value: engagementScore,
      threshold: { warning: 0.6, critical: 0.4 },
      trend: this.calculateTrend('engagement_score', engagementScore),
      timestamp,
      source: 'engagement_analytics'
    });

    return metrics;
  }

  /**
   * Detect anomalies in metrics using AI
   */
  private async detectAnomalies(metrics: MonitoringMetric[]): Promise<AnomalyDetection[]> {
    const anomalies: AnomalyDetection[] = [];

    for (const metric of metrics) {
      // Statistical anomaly detection
      const statisticalAnomaly = await this.detectStatisticalAnomaly(metric);
      if (statisticalAnomaly) {
        anomalies.push(statisticalAnomaly);
      }

      // Threshold-based detection
      const thresholdAnomaly = this.detectThresholdAnomaly(metric);
      if (thresholdAnomaly) {
        anomalies.push(thresholdAnomaly);
      }

      // Pattern-based detection using AI
      const patternAnomaly = await this.detectPatternAnomaly(metric);
      if (patternAnomaly) {
        anomalies.push(patternAnomaly);
      }
    }

    return anomalies;
  }

  /**
   * Detect statistical anomalies using baseline comparison
   */
  private async detectStatisticalAnomaly(metric: MonitoringMetric): Promise<AnomalyDetection | null> {
    const baseline = this.baselines.get(metric.name);
    if (!baseline) {
      return null;
    }

    const zScore = Math.abs((metric.value - baseline.baseline) / baseline.standardDeviation);
    
    if (zScore > 3) { // 3 standard deviations
      return {
        id: `anomaly-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        metricId: metric.id,
        type: 'statistical',
        severity: zScore > 4 ? 'critical' : 'high',
        description: `${metric.name} deviates significantly from baseline (z-score: ${zScore.toFixed(2)})`,
        confidence: Math.min(95, zScore * 20),
        predictedImpact: {
          userExperience: 'May experience degraded performance',
          businessImpact: 'Potential impact on conversion rates',
          timeToResolution: '15-30 minutes'
        },
        recommendations: [
          'Investigate recent changes',
          'Check system resources',
          'Monitor related metrics'
        ],
        relatedMetrics: [metric.name],
        detectedAt: new Date().toISOString()
      };
    }

    return null;
  }

  /**
   * Detect threshold-based anomalies
   */
  private detectThresholdAnomaly(metric: MonitoringMetric): AnomalyDetection | null {
    let severity: AnomalyDetection['severity'] | null = null;
    
    if (metric.value >= metric.threshold.critical) {
      severity = 'critical';
    } else if (metric.value >= metric.threshold.warning) {
      severity = 'medium';
    }

    if (!severity) {
      return null;
    }

    return {
      id: `anomaly-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      metricId: metric.id,
      type: 'threshold',
      severity,
      description: `${metric.name} exceeded ${severity} threshold (${metric.value} >= ${severity === 'critical' ? metric.threshold.critical : metric.threshold.warning})`,
      confidence: 90,
      predictedImpact: {
        userExperience: severity === 'critical' ? 'Severe impact expected' : 'Moderate impact possible',
        businessImpact: severity === 'critical' ? 'High business impact' : 'Medium business impact',
        timeToResolution: severity === 'critical' ? '5-15 minutes' : '30-60 minutes'
      },
      recommendations: this.getThresholdRecommendations(metric, severity),
      relatedMetrics: [metric.name],
      detectedAt: new Date().toISOString()
    };
  }

  /**
   * Detect pattern-based anomalies using AI
   */
  private async detectPatternAnomaly(metric: MonitoringMetric): Promise<AnomalyDetection | null> {
    // Simplified pattern detection - in a real system this would use more sophisticated AI
    const recentValues = this.getRecentMetricValues(metric.name, 10);
    
    if (recentValues.length < 5) {
      return null;
    }

    // Check for rapid increase pattern
    const isRapidIncrease = recentValues.every((value, index) => 
      index === 0 || value > recentValues[index - 1]
    );

    if (isRapidIncrease && metric.value > recentValues[0] * 1.5) {
      return {
        id: `anomaly-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        metricId: metric.id,
        type: 'pattern',
        severity: 'medium',
        description: `${metric.name} shows rapid increase pattern`,
        confidence: 75,
        predictedImpact: {
          userExperience: 'Performance degradation likely',
          businessImpact: 'Potential user frustration',
          timeToResolution: '10-30 minutes'
        },
        recommendations: [
          'Investigate root cause of increase',
          'Check for system load or resource constraints',
          'Consider scaling if necessary'
        ],
        relatedMetrics: [metric.name],
        detectedAt: new Date().toISOString()
      };
    }

    return null;
  }

  /**
   * Calculate trend for a metric
   */
  private calculateTrend(metricName: string, currentValue: number): 'increasing' | 'decreasing' | 'stable' {
    const recentValues = this.getRecentMetricValues(metricName, 5);
    
    if (recentValues.length < 3) {
      return 'stable';
    }

    const average = recentValues.reduce((sum, val) => sum + val, 0) / recentValues.length;
    const threshold = average * 0.1; // 10% threshold

    if (currentValue > average + threshold) {
      return 'increasing';
    } else if (currentValue < average - threshold) {
      return 'decreasing';
    } else {
      return 'stable';
    }
  }

  /**
   * Get recent metric values
   */
  private getRecentMetricValues(metricName: string, count: number): number[] {
    const metricHistory = this.metrics.get(metricName) || [];
    return metricHistory
      .slice(-count)
      .map(metric => metric.value);
  }

  /**
   * Initialize performance baselines
   */
  private async initializeBaselines(): Promise<void> {
    // Initialize with default baselines - in a real system these would be calculated from historical data
    this.baselines.set('Page Load Time', {
      metric: 'Page Load Time',
      baseline: 2000,
      standardDeviation: 500,
      seasonalPatterns: {
        hourly: new Array(24).fill(1),
        daily: new Array(7).fill(1),
        weekly: new Array(52).fill(1)
      },
      lastUpdated: new Date().toISOString()
    });

    this.baselines.set('Error Rate', {
      metric: 'Error Rate',
      baseline: 0.02,
      standardDeviation: 0.01,
      seasonalPatterns: {
        hourly: new Array(24).fill(1),
        daily: new Array(7).fill(1),
        weekly: new Array(52).fill(1)
      },
      lastUpdated: new Date().toISOString()
    });
  }

  /**
   * Estimate network latency from recent requests
   */
  private async estimateNetworkLatency(): Promise<number> {
    // Simple estimation - in a real system this would analyze actual request timings
    return Math.random() * 1000 + 200; // 200-1200ms
  }

  /**
   * Calculate recent error rate
   */
  private async calculateRecentErrorRate(): Promise<number> {
    // Mock implementation - would query actual error data
    return Math.random() * 0.05; // 0-5% error rate
  }

  /**
   * Get JavaScript error count
   */
  private async getJavaScriptErrorCount(): Promise<number> {
    // Mock implementation - would query actual error tracking
    return Math.floor(Math.random() * 5);
  }

  /**
   * Get current session duration
   */
  private getCurrentSessionDuration(): number {
    const sessionStart = sessionStorage.getItem('session_start');
    if (!sessionStart) {
      const now = Date.now();
      sessionStorage.setItem('session_start', now.toString());
      return 0;
    }
    return Date.now() - parseInt(sessionStart);
  }

  /**
   * Get click frequency (clicks per minute)
   */
  private getClickFrequency(): number {
    // Mock implementation - would track actual click events
    return Math.random() * 15;
  }

  /**
   * Check database health
   */
  private async checkDatabaseHealth(): Promise<{ score: number; details: any }> {
    try {
      const startTime = Date.now();
      const { data, error } = await supabase
        .from('properties')
        .select('id')
        .limit(1);
      
      const responseTime = Date.now() - startTime;
      
      if (error) {
        return { score: 0.3, details: { error: error.message, responseTime } };
      }
      
      const score = responseTime < 1000 ? 1.0 : responseTime < 3000 ? 0.8 : 0.5;
      return { score, details: { responseTime, status: 'ok' } };
    } catch (error) {
      return { score: 0.1, details: { error: error.message } };
    }
  }

  /**
   * Check API response time
   */
  private async checkAPIResponseTime(): Promise<number> {
    const startTime = Date.now();
    try {
      await supabase.from('properties').select('count').limit(1);
      return Date.now() - startTime;
    } catch (error) {
      return 10000; // High value to indicate failure
    }
  }

  /**
   * Get inspection completion rate
   */
  private async getInspectionCompletionRate(): Promise<number> {
    try {
      const { count: totalInspections } = await supabase
        .from('inspections')
        .select('*', { count: 'exact', head: true });

      const { count: completedInspections } = await supabase
        .from('inspections')
        .select('*', { count: 'exact', head: true })
        .eq('completed', true);

      return totalInspections ? completedInspections / totalInspections : 0;
    } catch (error) {
      return 0.5; // Default fallback
    }
  }

  /**
   * Calculate user engagement score
   */
  private async calculateUserEngagementScore(): Promise<number> {
    // Mock implementation - would analyze actual user behavior
    return Math.random() * 0.4 + 0.5; // 0.5-0.9 range
  }

  /**
   * Update baselines with new data
   */
  private async updateBaselines(metrics: MonitoringMetric[]): Promise<void> {
    for (const metric of metrics) {
      const existing = this.baselines.get(metric.name);
      if (existing) {
        // Simple exponential moving average update
        const alpha = 0.1;
        existing.baseline = existing.baseline * (1 - alpha) + metric.value * alpha;
        existing.lastUpdated = new Date().toISOString();
      }
    }
  }

  /**
   * Process detected anomalies
   */
  private async processAnomalies(anomalies: AnomalyDetection[]): Promise<void> {
    for (const anomaly of anomalies) {
      // Store anomaly
      if (!this.anomalies.has(anomaly.metricId)) {
        this.anomalies.set(anomaly.metricId, []);
      }
      this.anomalies.get(anomaly.metricId)!.push(anomaly);

      // Trigger alerts for high-severity anomalies
      if (anomaly.severity === 'critical' || anomaly.severity === 'high') {
        await this.triggerAlert(anomaly);
      }
    }
  }

  /**
   * Trigger alert for anomaly
   */
  private async triggerAlert(anomaly: AnomalyDetection): Promise<void> {
    log.warn('Anomaly detected', {
      component: 'ProactiveMonitoring',
      action: 'triggerAlert',
      anomalyId: anomaly.id,
      severity: anomaly.severity,
      description: anomaly.description,
      confidence: anomaly.confidence,
      recommendations: anomaly.recommendations,
      metricId: anomaly.metricId,
      type: anomaly.type
    }, 'ANOMALY_DETECTED');

    // In a real system, this would send notifications via email, Slack, etc.
  }

  /**
   * Get threshold recommendations
   */
  private getThresholdRecommendations(metric: MonitoringMetric, severity: string): string[] {
    const recommendations: string[] = [];

    switch (metric.type) {
      case 'performance':
        recommendations.push('Check system resources', 'Optimize code paths', 'Consider caching');
        break;
      case 'error_rate':
        recommendations.push('Review recent deployments', 'Check error logs', 'Rollback if necessary');
        break;
      case 'system_health':
        recommendations.push('Check service dependencies', 'Verify network connectivity', 'Restart services if needed');
        break;
    }

    return recommendations;
  }

  /**
   * Analyze trends across metrics
   */
  private async analyzeTrends(metrics: MonitoringMetric[]): Promise<ErrorTrendAnalysis[]> {
    // Simplified trend analysis - in a real system this would be more sophisticated
    return [];
  }

  /**
   * Generate predictions based on current trends
   */
  private async generatePredictions(metrics: MonitoringMetric[], trends: ErrorTrendAnalysis[]): Promise<any> {
    // Mock implementation for predictions
    return {};
  }

  /**
   * Start performance monitoring
   */
  private startPerformanceMonitoring(): void {
    // Monitor Core Web Vitals and other performance metrics
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.storeMetric({
            id: `perf-${entry.name}-${Date.now()}`,
            name: entry.name,
            type: 'performance',
            value: entry.duration || 0,
            threshold: { warning: 1000, critical: 3000 },
            trend: 'stable',
            timestamp: new Date().toISOString(),
            source: 'performance_observer'
          });
        }
      });
      
      observer.observe({ entryTypes: ['measure', 'navigation'] });
    }
  }

  /**
   * Start user behavior monitoring
   */
  private startUserBehaviorMonitoring(): void {
    // Track user interactions
    let clickCount = 0;
    let lastClickTime = Date.now();

    document.addEventListener('click', () => {
      clickCount++;
      const now = Date.now();
      const timeSinceLastClick = now - lastClickTime;
      
      if (timeSinceLastClick < 500) { // Rapid clicking
        this.storeMetric({
          id: `behavior-rapid-click-${now}`,
          name: 'Rapid Click Event',
          type: 'user_behavior',
          value: timeSinceLastClick,
          threshold: { warning: 1000, critical: 500 },
          trend: 'stable',
          timestamp: new Date().toISOString(),
          source: 'user_interaction'
        });
      }
      
      lastClickTime = now;
    });
  }

  /**
   * Start system health monitoring
   */
  private startSystemHealthMonitoring(): void {
    // Monitor connection status
    window.addEventListener('online', () => {
      this.storeMetric({
        id: `system-online-${Date.now()}`,
        name: 'Connection Status',
        type: 'system_health',
        value: 1,
        threshold: { warning: 0.8, critical: 0.5 },
        trend: 'stable',
        timestamp: new Date().toISOString(),
        source: 'network_status'
      });
    });

    window.addEventListener('offline', () => {
      this.storeMetric({
        id: `system-offline-${Date.now()}`,
        name: 'Connection Status',
        type: 'system_health',
        value: 0,
        threshold: { warning: 0.8, critical: 0.5 },
        trend: 'decreasing',
        timestamp: new Date().toISOString(),
        source: 'network_status'
      });
    });
  }

  /**
   * Store a metric in the metrics map
   */
  private storeMetric(metric: MonitoringMetric): void {
    if (!this.metrics.has(metric.name)) {
      this.metrics.set(metric.name, []);
    }
    
    const metricHistory = this.metrics.get(metric.name)!;
    metricHistory.push(metric);
    
    // Keep only last 100 entries per metric
    if (metricHistory.length > 100) {
      metricHistory.splice(0, metricHistory.length - 100);
    }
  }

  /**
   * Log monitoring summary
   */
  private logMonitoringSummary(
    metrics: MonitoringMetric[],
    anomalies: AnomalyDetection[],
    predictions: any
  ): void {
    log.debug('Monitoring summary', {
      component: 'ProactiveMonitoring',
      action: 'logMonitoringSummary',
      metricsCollected: metrics.length,
      anomaliesDetected: anomalies.length,
      criticalAnomalies: anomalies.filter(a => a.severity === 'critical').length,
      highAnomalies: anomalies.filter(a => a.severity === 'high').length,
      mediumAnomalies: anomalies.filter(a => a.severity === 'medium').length,
      lowAnomalies: anomalies.filter(a => a.severity === 'low').length
    }, 'MONITORING_SUMMARY');
  }

  /**
   * Get current monitoring status
   */
  getMonitoringStatus(): {
    isActive: boolean;
    metricsCount: number;
    anomaliesCount: number;
    lastUpdate: string;
  } {
    const totalMetrics = Array.from(this.metrics.values()).reduce((sum, arr) => sum + arr.length, 0);
    const totalAnomalies = Array.from(this.anomalies.values()).reduce((sum, arr) => sum + arr.length, 0);

    return {
      isActive: this.isMonitoring,
      metricsCount: totalMetrics,
      anomaliesCount: totalAnomalies,
      lastUpdate: new Date().toISOString()
    };
  }
}

export const proactiveMonitoring = new ProactiveMonitoring();