// AI Metrics Collection System for STR Certified
// Tracks performance, accuracy, costs, and usage patterns

export class AIMetricsCollector {
  private metrics: MetricsStore;
  private apiUsageTracker: APIUsageTracker;
  private performanceMonitor: PerformanceMonitor;
  private accuracyTracker: AccuracyTracker;
  private costCalculator: CostCalculator;
  private intervalIds: Set<NodeJS.Timeout> = new Set();
  private isDestroyed: boolean = false;

  constructor() {
    this.metrics = new MetricsStore();
    this.apiUsageTracker = new APIUsageTracker();
    this.performanceMonitor = new PerformanceMonitor();
    this.accuracyTracker = new AccuracyTracker();
    this.costCalculator = new CostCalculator();
  }

  /**
   * Cleanup method to prevent memory leaks
   */
  destroy(): void {
    this.isDestroyed = true;
    this.intervalIds.forEach((id) => clearInterval(id));
    this.intervalIds.clear();
  }

  /**
   * Tracks AI prediction accuracy by comparing predictions with ground truth
   */
  async trackPredictionAccuracy(
    prediction: PredictionResult,
    groundTruth?: GroundTruth,
    feedback?: UserFeedback,
  ): Promise<void> {
    const timestamp = new Date();

    // Calculate accuracy metrics
    const accuracy = groundTruth
      ? this.calculateAccuracy(prediction, groundTruth)
      : undefined;

    // Track the prediction
    const metric: AccuracyMetric = {
      id: `accuracy_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp,
      predictionId: prediction.id,
      modelVersion: prediction.modelVersion,
      category: prediction.category,
      confidence: prediction.confidence,
      accuracy,
      isCorrect: accuracy ? accuracy >= 0.8 : undefined,
      feedback: feedback
        ? {
            rating: feedback.rating,
            wasHelpful: feedback.wasHelpful,
            correctedValue: feedback.correctedValue,
          }
        : undefined,
      metadata: {
        processingTime: prediction.processingTime,
        inputSize: prediction.inputSize,
        features: prediction.features,
      },
    };

    // Store metric
    await this.metrics.store("accuracy", metric);

    // Update accuracy tracker
    this.accuracyTracker.addMetric(metric);

    // Check for accuracy degradation
    const recentAccuracy = await this.accuracyTracker.getRecentAccuracy();
    if (recentAccuracy < 0.7) {
      await this.triggerAlert("accuracy_degradation", {
        currentAccuracy: recentAccuracy,
        threshold: 0.7,
        category: prediction.category,
      });
    }
  }

  /**
   * Measures response times for AI operations
   */
  async measureResponseTimes(
    operation: AIOperation,
    duration: number,
    metadata?: OperationMetadata,
  ): Promise<void> {
    const timestamp = new Date();

    const responseMetric: ResponseTimeMetric = {
      id: `response_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp,
      operation: operation.type,
      duration,
      success: operation.success,
      error: operation.error,
      metadata: {
        ...metadata,
        modelUsed: operation.modelUsed,
        inputTokens: operation.inputTokens,
        outputTokens: operation.outputTokens,
        cached: operation.cached || false,
      },
    };

    // Store metric
    await this.metrics.store("response_time", responseMetric);

    // Update performance monitor
    this.performanceMonitor.recordResponseTime(responseMetric);

    // Check for performance issues
    if (duration > this.getThreshold(operation.type)) {
      await this.triggerAlert("slow_response", {
        operation: operation.type,
        duration,
        threshold: this.getThreshold(operation.type),
      });
    }

    // Track percentiles
    const p95 = await this.performanceMonitor.getPercentile(95);
    const p99 = await this.performanceMonitor.getPercentile(99);

    await this.metrics.store("percentiles", {
      timestamp,
      p50: await this.performanceMonitor.getPercentile(50),
      p95,
      p99,
      operation: operation.type,
    });
  }

  /**
   * Monitors API usage including costs and rate limits
   */
  async monitorAPIUsage(
    apiCall: APICall,
    response: APIResponse,
  ): Promise<void> {
    const timestamp = new Date();

    // Calculate cost
    const cost = this.costCalculator.calculate(apiCall, response);

    // Track usage
    const usageMetric: APIUsageMetric = {
      id: `api_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp,
      endpoint: apiCall.endpoint,
      model: apiCall.model,
      inputTokens: apiCall.inputTokens || 0,
      outputTokens: response.outputTokens || 0,
      totalTokens: (apiCall.inputTokens || 0) + (response.outputTokens || 0),
      cost,
      duration: response.duration,
      statusCode: response.statusCode,
      rateLimitInfo: response.headers
        ? {
            remaining: parseInt(
              response.headers["x-ratelimit-remaining"] || "0",
            ),
            limit: parseInt(response.headers["x-ratelimit-limit"] || "0"),
            reset: new Date(
              response.headers["x-ratelimit-reset"] || Date.now(),
            ),
          }
        : undefined,
      error: response.error,
    };

    // Store metric
    await this.metrics.store("api_usage", usageMetric);

    // Update trackers
    this.apiUsageTracker.recordUsage(usageMetric);

    // Check rate limits
    if (usageMetric.rateLimitInfo) {
      const { remaining, limit } = usageMetric.rateLimitInfo;
      const usagePercent = ((limit - remaining) / limit) * 100;

      if (usagePercent > 80) {
        await this.triggerAlert("rate_limit_warning", {
          endpoint: apiCall.endpoint,
          remaining,
          limit,
          usagePercent,
        });
      }
    }

    // Check costs
    const dailyCost = await this.apiUsageTracker.getDailyCost();
    const monthlyCost = await this.apiUsageTracker.getMonthlyCost();

    if (dailyCost > 100) {
      // $100 daily limit
      await this.triggerAlert("cost_threshold_daily", {
        cost: dailyCost,
        threshold: 100,
      });
    }

    if (monthlyCost > 2000) {
      // $2000 monthly limit
      await this.triggerAlert("cost_threshold_monthly", {
        cost: monthlyCost,
        threshold: 2000,
      });
    }
  }

  /**
   * Generates comprehensive performance report
   */
  async generatePerformanceReport(
    startDate: Date,
    endDate: Date,
    options: ReportOptions = {},
  ): Promise<PerformanceReport> {
    // Gather all metrics
    const accuracyMetrics = await this.metrics.query(
      "accuracy",
      startDate,
      endDate,
    );
    const responseMetrics = await this.metrics.query(
      "response_time",
      startDate,
      endDate,
    );
    const apiUsageMetrics = await this.metrics.query(
      "api_usage",
      startDate,
      endDate,
    );

    // Calculate summary statistics
    const summary = {
      accuracy: this.calculateAccuracySummary(accuracyMetrics),
      performance: this.calculatePerformanceSummary(responseMetrics),
      usage: this.calculateUsageSummary(apiUsageMetrics),
      costs: this.calculateCostSummary(apiUsageMetrics),
    };

    // Identify trends
    const trends = {
      accuracyTrend: this.analyzeTrend(accuracyMetrics, "accuracy"),
      performanceTrend: this.analyzeTrend(responseMetrics, "duration"),
      costTrend: this.analyzeTrend(apiUsageMetrics, "cost"),
    };

    // Generate recommendations
    const recommendations = this.generateRecommendations(summary, trends);

    // Benchmark against targets
    const benchmarks = this.evaluateBenchmarks(summary);

    // Create report
    const report: PerformanceReport = {
      id: `report_${Date.now()}`,
      generatedAt: new Date(),
      period: { start: startDate, end: endDate },
      summary,
      trends,
      recommendations,
      benchmarks,
      details: {
        accuracy: {
          byCategory: this.groupByCategory(accuracyMetrics),
          byModel: this.groupByModel(accuracyMetrics),
          errorAnalysis: this.analyzeErrors(accuracyMetrics),
        },
        performance: {
          byOperation: this.groupByOperation(responseMetrics),
          percentiles: await this.performanceMonitor.getPercentiles(),
          slowestOperations: this.findSlowestOperations(responseMetrics),
        },
        usage: {
          byEndpoint: this.groupByEndpoint(apiUsageMetrics),
          byModel: this.groupByModel(apiUsageMetrics),
          rateLimitStatus: this.analyzeRateLimits(apiUsageMetrics),
        },
        costs: {
          byModel: this.calculateCostsByModel(apiUsageMetrics),
          byDay: this.calculateDailyCosts(apiUsageMetrics),
          projections: this.projectFutureCosts(apiUsageMetrics),
        },
      },
      alerts: await this.getActiveAlerts(),
    };

    // Store report
    await this.metrics.store("reports", report);

    return report;
  }

  /**
   * Gets real-time metrics for dashboard
   */
  async getRealTimeMetrics(): Promise<RealTimeMetrics> {
    const now = new Date();
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);

    const recentAccuracy = await this.accuracyTracker.getRecentAccuracy();
    const avgResponseTime =
      await this.performanceMonitor.getAverageResponseTime(fiveMinutesAgo);
    const currentCost = await this.apiUsageTracker.getHourlyCost();
    const apiHealth = await this.checkAPIHealth();

    return {
      timestamp: now,
      accuracy: {
        current: recentAccuracy,
        trend: await this.accuracyTracker.getTrend(),
        byCategory: await this.accuracyTracker.getByCategory(),
      },
      performance: {
        avgResponseTime,
        p95ResponseTime: await this.performanceMonitor.getPercentile(95),
        slowOperations: await this.performanceMonitor.getSlowOperations(),
        errorRate: await this.performanceMonitor.getErrorRate(),
      },
      usage: {
        requestsPerMinute: await this.apiUsageTracker.getRequestRate(),
        tokensPerMinute: await this.apiUsageTracker.getTokenRate(),
        costPerHour: currentCost,
        remainingQuota: await this.apiUsageTracker.getRemainingQuota(),
      },
      health: apiHealth,
      alerts: await this.getActiveAlerts(),
    };
  }

  /**
   * Sets up automated monitoring with proper cleanup
   */
  async setupAutomatedMonitoring(): Promise<void> {
    if (this.isDestroyed) return;

    // Monitor accuracy every 5 minutes
    const accuracyInterval = setInterval(
      async () => {
        if (this.isDestroyed) return;
        try {
          const accuracy = await this.accuracyTracker.getRecentAccuracy();
          if (accuracy < 0.75) {
            await this.triggerAlert("low_accuracy", { accuracy });
          }
        } catch (error) {}
      },
      5 * 60 * 1000,
    );
    this.intervalIds.add(accuracyInterval);

    // Monitor costs every hour
    const costInterval = setInterval(
      async () => {
        if (this.isDestroyed) return;
        try {
          const hourlyCost = await this.apiUsageTracker.getHourlyCost();
          if (hourlyCost > 10) {
            // $10/hour threshold
            await this.triggerAlert("high_hourly_cost", { cost: hourlyCost });
          }
        } catch (error) {}
      },
      60 * 60 * 1000,
    );
    this.intervalIds.add(costInterval);

    // Monitor performance every minute
    const performanceInterval = setInterval(async () => {
      if (this.isDestroyed) return;
      try {
        const p95 = await this.performanceMonitor.getPercentile(95);
        if (p95 > 5000) {
          // 5 second threshold
          await this.triggerAlert("slow_p95_response", { p95 });
        }
      } catch (error) {}
    }, 60 * 1000);
    this.intervalIds.add(performanceInterval);
  }

  // Private helper methods

  private calculateAccuracy(
    prediction: PredictionResult,
    groundTruth: GroundTruth,
  ): number {
    if (prediction.category === "object_detection") {
      return this.calculateIOUAccuracy(prediction.value, groundTruth.value);
    } else if (prediction.category === "classification") {
      return prediction.value === groundTruth.value ? 1 : 0;
    } else if (prediction.category === "measurement") {
      return (
        1 - Math.abs(prediction.value - groundTruth.value) / groundTruth.value
      );
    }
    return 0;
  }

  private calculateIOUAccuracy(
    predicted: DetectionBox,
    actual: DetectionBox,
  ): number {
    // Intersection over Union calculation for object detection
    // Simplified implementation
    return 0.85; // Mock value
  }

  private getThreshold(operationType: string): number {
    const thresholds: Record<string, number> = {
      image_analysis: 3000,
      text_generation: 2000,
      embedding: 500,
      classification: 1000,
      object_detection: 4000,
    };
    return thresholds[operationType] || 2000;
  }

  private async triggerAlert(type: string, data: AlertData): Promise<void> {
    const alert: Alert = {
      id: `alert_${Date.now()}`,
      type,
      severity: this.getAlertSeverity(type),
      timestamp: new Date(),
      data,
      status: "active",
    };

    await this.metrics.store("alerts", alert);

    // In production, would send notifications
  }

  private getAlertSeverity(
    type: string,
  ): "low" | "medium" | "high" | "critical" {
    const severities: Record<string, Alert["severity"]> = {
      accuracy_degradation: "high",
      slow_response: "medium",
      rate_limit_warning: "high",
      cost_threshold_daily: "critical",
      cost_threshold_monthly: "high",
      low_accuracy: "high",
      high_hourly_cost: "medium",
      slow_p95_response: "medium",
    };
    return severities[type] || "medium";
  }

  private calculateAccuracySummary(metrics: AccuracyMetric[]): AccuracySummary {
    const accuracies = metrics
      .filter((m) => m.accuracy !== undefined)
      .map((m) => m.accuracy!);
    return {
      average: accuracies.reduce((a, b) => a + b, 0) / accuracies.length,
      min: Math.min(...accuracies),
      max: Math.max(...accuracies),
      count: metrics.length,
      correctPredictions: metrics.filter((m) => m.isCorrect).length,
    };
  }

  private calculatePerformanceSummary(
    metrics: ResponseTimeMetric[],
  ): PerformanceSummary {
    const durations = metrics.map((m) => m.duration);
    return {
      average: durations.reduce((a, b) => a + b, 0) / durations.length,
      min: Math.min(...durations),
      max: Math.max(...durations),
      p50: this.calculatePercentile(durations, 50),
      p95: this.calculatePercentile(durations, 95),
      p99: this.calculatePercentile(durations, 99),
      errorRate: metrics.filter((m) => !m.success).length / metrics.length,
    };
  }

  private calculateUsageSummary(metrics: APIUsageMetric[]): UsageSummary {
    return {
      totalRequests: metrics.length,
      totalTokens: metrics.reduce((sum, m) => sum + m.totalTokens, 0),
      totalCost: metrics.reduce((sum, m) => sum + m.cost, 0),
      averageTokensPerRequest:
        metrics.reduce((sum, m) => sum + m.totalTokens, 0) / metrics.length,
      rateLimitHits: metrics.filter((m) => m.rateLimitInfo?.remaining === 0)
        .length,
    };
  }

  private calculateCostSummary(metrics: APIUsageMetric[]): CostSummary {
    const costs = metrics.map((m) => m.cost);
    const costsByModel = this.calculateCostsByModel(metrics);

    return {
      total: costs.reduce((a, b) => a + b, 0),
      average: costs.reduce((a, b) => a + b, 0) / costs.length,
      byModel: costsByModel,
      projectedMonthly: this.projectMonthlyCost(metrics),
    };
  }

  private analyzeTrend(metrics: TrendableMetric[], field: string): Trend {
    if (metrics.length < 2) {
      return { direction: "stable", change: 0, confidence: 0 };
    }

    // Simple linear regression
    const values = metrics.map((m) => m[field]).filter((v) => v !== undefined);
    const n = values.length;
    const sumX = values.reduce((_, __, i) => _ + i, 0);
    const sumY = values.reduce((a, b) => a + b, 0);
    const sumXY = values.reduce((sum, y, i) => sum + i * y, 0);
    const sumX2 = values.reduce((_, __, i) => _ + i * i, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const change = slope * n;

    return {
      direction:
        slope > 0.01 ? "improving" : slope < -0.01 ? "declining" : "stable",
      change: Math.abs(change),
      confidence: Math.min(0.95, n / 100), // Confidence based on sample size
    };
  }

  private generateRecommendations(
    summary: MetricsSummary,
    trends: TrendAnalysis,
  ): Recommendation[] {
    const recommendations: Recommendation[] = [];

    // Accuracy recommendations
    if (summary.accuracy.average < 0.8) {
      recommendations.push({
        type: "model_improvement",
        priority: "high",
        title: "Low Accuracy Detected",
        description: `Average accuracy is ${(summary.accuracy.average * 100).toFixed(1)}%, below target of 80%`,
        actions: [
          "Review and expand training data",
          "Consider fine-tuning the model",
          "Analyze error patterns for specific categories",
        ],
      });
    }

    // Performance recommendations
    if (summary.performance.p95 > 3000) {
      recommendations.push({
        type: "performance_optimization",
        priority: "medium",
        title: "Slow Response Times",
        description: `95th percentile response time is ${summary.performance.p95}ms`,
        actions: [
          "Enable response caching",
          "Optimize image sizes before processing",
          "Consider using faster model variants",
        ],
      });
    }

    // Cost recommendations
    if (summary.costs.projectedMonthly > 1500) {
      recommendations.push({
        type: "cost_optimization",
        priority: "high",
        title: "High Projected Costs",
        description: `Projected monthly cost is $${summary.costs.projectedMonthly.toFixed(2)}`,
        actions: [
          "Implement aggressive caching",
          "Use smaller models where appropriate",
          "Batch similar requests together",
        ],
      });
    }

    return recommendations;
  }

  private evaluateBenchmarks(summary: MetricsSummary): BenchmarkResult[] {
    const benchmarks: BenchmarkConfig[] = [
      {
        name: "Accuracy Target",
        target: 0.85,
        actual: summary.accuracy.average,
        unit: "%",
        multiplier: 100,
      },
      {
        name: "Response Time (p95)",
        target: 2000,
        actual: summary.performance.p95,
        unit: "ms",
      },
      {
        name: "Error Rate",
        target: 0.01,
        actual: summary.performance.errorRate,
        unit: "%",
        multiplier: 100,
      },
      {
        name: "Daily Cost",
        target: 50,
        actual: summary.costs.total,
        unit: "$",
      },
    ];

    return benchmarks.map((b) => ({
      name: b.name,
      target: b.target,
      actual: b.actual,
      unit: b.unit,
      status: b.actual <= b.target ? "pass" : "fail",
      variance: ((b.actual - b.target) / b.target) * 100,
      displayValue: b.multiplier
        ? (b.actual * b.multiplier).toFixed(1)
        : b.actual.toFixed(2),
    }));
  }

  private calculatePercentile(values: number[], percentile: number): number {
    if (values.length === 0) return 0;

    const sorted = [...values].sort((a, b) => a - b);
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;
    return sorted[Math.max(0, index)];
  }

  private groupByCategory(
    metrics: AccuracyMetric[],
  ): Record<string, AccuracySummary> {
    const groups: Record<string, AccuracyMetric[]> = {};

    metrics.forEach((m) => {
      if (!groups[m.category]) groups[m.category] = [];
      groups[m.category].push(m);
    });

    return Object.entries(groups).reduce(
      (acc, [category, metrics]) => {
        acc[category] = this.calculateAccuracySummary(metrics);
        return acc;
      },
      {} as Record<string, AccuracySummary>,
    );
  }

  private groupByModel(
    metrics: ModelableMetric[],
  ): Record<string, ModelableMetric[]> {
    const groups: Record<string, ModelableMetric[]> = {};

    metrics.forEach((m) => {
      const model = m.modelVersion || m.model || "unknown";
      if (!groups[model]) groups[model] = [];
      groups[model].push(m);
    });

    return groups;
  }

  private groupByOperation(
    metrics: ResponseTimeMetric[],
  ): Record<string, PerformanceSummary> {
    const groups: Record<string, ResponseTimeMetric[]> = {};

    metrics.forEach((m) => {
      if (!groups[m.operation]) groups[m.operation] = [];
      groups[m.operation].push(m);
    });

    return Object.entries(groups).reduce(
      (acc, [operation, metrics]) => {
        acc[operation] = this.calculatePerformanceSummary(metrics);
        return acc;
      },
      {} as Record<string, PerformanceSummary>,
    );
  }

  private groupByEndpoint(
    metrics: APIUsageMetric[],
  ): Record<string, UsageSummary> {
    const groups: Record<string, APIUsageMetric[]> = {};

    metrics.forEach((m) => {
      if (!groups[m.endpoint]) groups[m.endpoint] = [];
      groups[m.endpoint].push(m);
    });

    return Object.entries(groups).reduce(
      (acc, [endpoint, metrics]) => {
        acc[endpoint] = this.calculateUsageSummary(metrics);
        return acc;
      },
      {} as Record<string, UsageSummary>,
    );
  }

  private analyzeErrors(metrics: AccuracyMetric[]): ErrorAnalysis {
    const errors = metrics.filter((m) => !m.isCorrect);
    const errorsByCategory: Record<string, number> = {};

    errors.forEach((e) => {
      errorsByCategory[e.category] = (errorsByCategory[e.category] || 0) + 1;
    });

    return {
      totalErrors: errors.length,
      errorRate: errors.length / metrics.length,
      byCategory: errorsByCategory,
      commonPatterns: this.findCommonErrorPatterns(errors),
    };
  }

  private findCommonErrorPatterns(errors: AccuracyMetric[]): string[] {
    // Simplified pattern detection
    const patterns: string[] = [];

    const lowConfidenceErrors = errors.filter((e) => e.confidence < 0.5);
    if (lowConfidenceErrors.length > errors.length * 0.3) {
      patterns.push("High error rate for low-confidence predictions");
    }

    return patterns;
  }

  private findSlowestOperations(
    metrics: ResponseTimeMetric[],
  ): SlowOperation[] {
    return metrics
      .sort((a, b) => b.duration - a.duration)
      .slice(0, 10)
      .map((m) => ({
        operation: m.operation,
        duration: m.duration,
        timestamp: m.timestamp,
        metadata: m.metadata,
      }));
  }

  private analyzeRateLimits(metrics: APIUsageMetric[]): RateLimitAnalysis {
    const withRateLimits = metrics.filter((m) => m.rateLimitInfo);

    if (withRateLimits.length === 0) {
      return { status: "healthy", utilizationPercent: 0 };
    }

    const latest = withRateLimits[withRateLimits.length - 1];
    const { remaining, limit } = latest.rateLimitInfo!;
    const utilizationPercent = ((limit - remaining) / limit) * 100;

    return {
      status: utilizationPercent > 80 ? "warning" : "healthy",
      utilizationPercent,
      remaining,
      limit,
      resetAt: latest.rateLimitInfo!.reset,
    };
  }

  private calculateCostsByModel(
    metrics: APIUsageMetric[],
  ): Record<string, number> {
    const costs: Record<string, number> = {};

    metrics.forEach((m) => {
      costs[m.model] = (costs[m.model] || 0) + m.cost;
    });

    return costs;
  }

  private calculateDailyCosts(metrics: APIUsageMetric[]): DailyCost[] {
    const dailyCosts: Record<string, number> = {};

    metrics.forEach((m) => {
      const date = m.timestamp.toISOString().split("T")[0];
      dailyCosts[date] = (dailyCosts[date] || 0) + m.cost;
    });

    return Object.entries(dailyCosts).map(([date, cost]) => ({ date, cost }));
  }

  private projectFutureCosts(metrics: APIUsageMetric[]): CostProjection {
    const recentDays = 7;
    const now = Date.now();
    const recentMetrics = metrics.filter(
      (m) => now - m.timestamp.getTime() < recentDays * 24 * 60 * 60 * 1000,
    );

    const dailyAverage =
      recentMetrics.reduce((sum, m) => sum + m.cost, 0) / recentDays;

    return {
      daily: dailyAverage,
      weekly: dailyAverage * 7,
      monthly: dailyAverage * 30,
      confidence: Math.min(0.9, recentMetrics.length / 100),
    };
  }

  private projectMonthlyCost(metrics: APIUsageMetric[]): number {
    return this.projectFutureCosts(metrics).monthly;
  }

  private async checkAPIHealth(): Promise<APIHealth> {
    // Check various health indicators
    const endpoints = ["openai", "anthropic", "custom"];
    const health: APIHealth = {
      status: "healthy",
      endpoints: {},
    };

    for (const endpoint of endpoints) {
      // Mock health check
      health.endpoints[endpoint] = {
        status: "operational",
        latency: Math.random() * 100 + 50,
        lastChecked: new Date(),
      };
    }

    return health;
  }

  private async getActiveAlerts(): Promise<Alert[]> {
    const alerts = await this.metrics.query(
      "alerts",
      new Date(Date.now() - 24 * 60 * 60 * 1000),
      new Date(),
    );

    return alerts.filter((a: Alert) => a.status === "active");
  }
}

// Supporting classes

class MetricsStore {
  private data: Map<string, StorableMetric[]> = new Map();

  async store(type: string, metric: StorableMetric): Promise<void> {
    if (!this.data.has(type)) {
      this.data.set(type, []);
    }
    this.data.get(type)!.push(metric);

    // In production, would persist to database
  }

  async query(type: string, start: Date, end: Date): Promise<StorableMetric[]> {
    const metrics = this.data.get(type) || [];
    return metrics.filter((m) => m.timestamp >= start && m.timestamp <= end);
  }
}

class APIUsageTracker {
  private recentUsage: APIUsageMetric[] = [];

  recordUsage(metric: APIUsageMetric): void {
    this.recentUsage.push(metric);
    // Keep only last 1000 entries
    if (this.recentUsage.length > 1000) {
      this.recentUsage.shift();
    }
  }

  async getDailyCost(): Promise<number> {
    const dayAgo = Date.now() - 24 * 60 * 60 * 1000;
    return this.recentUsage
      .filter((m) => m.timestamp.getTime() > dayAgo)
      .reduce((sum, m) => sum + m.cost, 0);
  }

  async getMonthlyCost(): Promise<number> {
    const monthAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
    return this.recentUsage
      .filter((m) => m.timestamp.getTime() > monthAgo)
      .reduce((sum, m) => sum + m.cost, 0);
  }

  async getHourlyCost(): Promise<number> {
    const hourAgo = Date.now() - 60 * 60 * 1000;
    return this.recentUsage
      .filter((m) => m.timestamp.getTime() > hourAgo)
      .reduce((sum, m) => sum + m.cost, 0);
  }

  async getRequestRate(): Promise<number> {
    const minuteAgo = Date.now() - 60 * 1000;
    const recentRequests = this.recentUsage.filter(
      (m) => m.timestamp.getTime() > minuteAgo,
    );
    return recentRequests.length;
  }

  async getTokenRate(): Promise<number> {
    const minuteAgo = Date.now() - 60 * 1000;
    return this.recentUsage
      .filter((m) => m.timestamp.getTime() > minuteAgo)
      .reduce((sum, m) => sum + m.totalTokens, 0);
  }

  async getRemainingQuota(): Promise<RemainingQuota> {
    const latest = this.recentUsage[this.recentUsage.length - 1];
    if (!latest?.rateLimitInfo) {
      return { requests: -1, tokens: -1 };
    }

    return {
      requests: latest.rateLimitInfo.remaining,
      tokens: -1, // Would need token limit info
    };
  }
}

class PerformanceMonitor {
  private responseTimes: ResponseTimeMetric[] = [];

  recordResponseTime(metric: ResponseTimeMetric): void {
    this.responseTimes.push(metric);
    // Keep only last 1000 entries
    if (this.responseTimes.length > 1000) {
      this.responseTimes.shift();
    }
  }

  async getAverageResponseTime(since: Date): Promise<number> {
    const recent = this.responseTimes.filter((m) => m.timestamp > since);
    if (recent.length === 0) return 0;
    return recent.reduce((sum, m) => sum + m.duration, 0) / recent.length;
  }

  async getPercentile(percentile: number): Promise<number> {
    if (this.responseTimes.length === 0) return 0;

    const durations = this.responseTimes
      .map((m) => m.duration)
      .sort((a, b) => a - b);
    const index = Math.ceil((percentile / 100) * durations.length) - 1;
    return durations[Math.max(0, index)];
  }

  async getPercentiles(): Promise<Record<string, number>> {
    return {
      p50: await this.getPercentile(50),
      p75: await this.getPercentile(75),
      p90: await this.getPercentile(90),
      p95: await this.getPercentile(95),
      p99: await this.getPercentile(99),
    };
  }

  async getSlowOperations(): Promise<string[]> {
    const threshold = await this.getPercentile(90);
    return [
      ...new Set(
        this.responseTimes
          .filter((m) => m.duration > threshold)
          .map((m) => m.operation),
      ),
    ];
  }

  async getErrorRate(): Promise<number> {
    if (this.responseTimes.length === 0) return 0;
    const errors = this.responseTimes.filter((m) => !m.success).length;
    return errors / this.responseTimes.length;
  }
}

class AccuracyTracker {
  private accuracyMetrics: AccuracyMetric[] = [];

  addMetric(metric: AccuracyMetric): void {
    this.accuracyMetrics.push(metric);
    // Keep only last 1000 entries
    if (this.accuracyMetrics.length > 1000) {
      this.accuracyMetrics.shift();
    }
  }

  async getRecentAccuracy(): Promise<number> {
    const recent = this.accuracyMetrics.slice(-100);
    const withAccuracy = recent.filter((m) => m.accuracy !== undefined);
    if (withAccuracy.length === 0) return 0;
    return (
      withAccuracy.reduce((sum, m) => sum + m.accuracy!, 0) /
      withAccuracy.length
    );
  }

  async getTrend(): Promise<"improving" | "declining" | "stable"> {
    if (this.accuracyMetrics.length < 20) return "stable";

    const firstHalf = this.accuracyMetrics.slice(
      0,
      this.accuracyMetrics.length / 2,
    );
    const secondHalf = this.accuracyMetrics.slice(
      this.accuracyMetrics.length / 2,
    );

    const firstAvg = this.calculateAverage(firstHalf);
    const secondAvg = this.calculateAverage(secondHalf);

    const diff = secondAvg - firstAvg;
    if (diff > 0.05) return "improving";
    if (diff < -0.05) return "declining";
    return "stable";
  }

  async getByCategory(): Promise<Record<string, number>> {
    const byCategory: Record<string, AccuracyMetric[]> = {};

    this.accuracyMetrics.forEach((m) => {
      if (!byCategory[m.category]) byCategory[m.category] = [];
      byCategory[m.category].push(m);
    });

    const result: Record<string, number> = {};
    for (const [category, metrics] of Object.entries(byCategory)) {
      result[category] = this.calculateAverage(metrics);
    }

    return result;
  }

  private calculateAverage(metrics: AccuracyMetric[]): number {
    const withAccuracy = metrics.filter((m) => m.accuracy !== undefined);
    if (withAccuracy.length === 0) return 0;
    return (
      withAccuracy.reduce((sum, m) => sum + m.accuracy!, 0) /
      withAccuracy.length
    );
  }
}

class CostCalculator {
  private pricing: Record<string, PricingModel> = {
    "gpt-4-vision": {
      input: 0.01 / 1000, // $0.01 per 1K tokens
      output: 0.03 / 1000, // $0.03 per 1K tokens
      image: 0.00765, // Per image
    },
    "gpt-3.5-turbo": {
      input: 0.0005 / 1000,
      output: 0.0015 / 1000,
    },
    "text-embedding-ada-002": {
      input: 0.0001 / 1000,
    },
  };

  calculate(apiCall: APICall, response: APIResponse): number {
    const pricing = this.pricing[apiCall.model];
    if (!pricing) return 0;

    let cost = 0;

    if (apiCall.inputTokens && pricing.input) {
      cost += apiCall.inputTokens * pricing.input;
    }

    if (response.outputTokens && pricing.output) {
      cost += response.outputTokens * pricing.output;
    }

    if (apiCall.images && pricing.image) {
      cost += apiCall.images * pricing.image;
    }

    return cost;
  }
}

// Additional Types for Type Safety

type PredictionValue =
  | string
  | number
  | boolean
  | DetectionBox
  | ClassificationResult
  | MeasurementResult;

interface DetectionBox {
  x: number;
  y: number;
  width: number;
  height: number;
  confidence: number;
}

interface ClassificationResult {
  class: string;
  confidence: number;
}

interface MeasurementResult {
  value: number;
  unit: string;
  confidence: number;
}

interface AlertData {
  [key: string]: string | number | boolean | Date | undefined;
}

interface TrendableMetric {
  timestamp: Date;
  [field: string]: Date | string | number | boolean | undefined;
}

interface ModelableMetric {
  modelVersion?: string;
  model?: string;
  timestamp: Date;
  [key: string]: unknown;
}

interface MetricsSummary {
  accuracy: AccuracySummary;
  performance: PerformanceSummary;
  usage: UsageSummary;
  costs: CostSummary;
}

interface TrendAnalysis {
  accuracyTrend: Trend;
  performanceTrend: Trend;
  costTrend: Trend;
}

interface DetailedMetadata {
  processingTime?: number;
  inputSize?: number;
  features?: string[];
  modelUsed?: string;
  inputTokens?: number;
  outputTokens?: number;
  cached?: boolean;
  [key: string]: unknown;
}

interface ReportSummary {
  accuracy: AccuracySummary;
  performance: PerformanceSummary;
  usage: UsageSummary;
  costs: CostSummary;
}

interface ReportTrends {
  accuracyTrend: Trend;
  performanceTrend: Trend;
  costTrend: Trend;
}

interface ReportDetails {
  accuracy: {
    byCategory: Record<string, AccuracySummary>;
    byModel: Record<string, ModelableMetric[]>;
    errorAnalysis: ErrorAnalysis;
  };
  performance: {
    byOperation: Record<string, PerformanceSummary>;
    percentiles: Record<string, number>;
    slowestOperations: SlowOperation[];
  };
  usage: {
    byEndpoint: Record<string, UsageSummary>;
    byModel: Record<string, ModelableMetric[]>;
    rateLimitStatus: RateLimitAnalysis;
  };
  costs: {
    byModel: Record<string, number>;
    byDay: DailyCost[];
    projections: CostProjection;
  };
}

type StorableMetric =
  | AccuracyMetric
  | ResponseTimeMetric
  | APIUsageMetric
  | PerformanceReport
  | Alert
  | Record<string, unknown>;

// Types

interface PredictionResult {
  id: string;
  modelVersion: string;
  category: string;
  confidence: number;
  value: PredictionValue;
  processingTime: number;
  inputSize: number;
  features: string[];
}

interface GroundTruth {
  value: PredictionValue;
  source: string;
}

interface UserFeedback {
  rating: number;
  wasHelpful: boolean;
  correctedValue?: PredictionValue;
}

interface AIOperation {
  type: string;
  success: boolean;
  error?: string;
  modelUsed: string;
  inputTokens?: number;
  outputTokens?: number;
  cached?: boolean;
}

interface OperationMetadata extends DetailedMetadata {
  [key: string]: unknown;
}

interface APICall {
  endpoint: string;
  model: string;
  inputTokens?: number;
  images?: number;
}

interface APIResponse {
  outputTokens?: number;
  duration: number;
  statusCode: number;
  headers?: Record<string, string>;
  error?: string;
}

interface AccuracyMetric {
  id: string;
  timestamp: Date;
  predictionId: string;
  modelVersion: string;
  category: string;
  confidence: number;
  accuracy?: number;
  isCorrect?: boolean;
  feedback?: {
    rating: number;
    wasHelpful: boolean;
    correctedValue?: PredictionValue;
  };
  metadata: DetailedMetadata;
}

interface ResponseTimeMetric {
  id: string;
  timestamp: Date;
  operation: string;
  duration: number;
  success: boolean;
  error?: string;
  metadata: DetailedMetadata;
}

interface APIUsageMetric {
  id: string;
  timestamp: Date;
  endpoint: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  cost: number;
  duration: number;
  statusCode: number;
  rateLimitInfo?: {
    remaining: number;
    limit: number;
    reset: Date;
  };
  error?: string;
}

interface ReportOptions {
  includeDetails?: boolean;
  format?: "json" | "html" | "pdf";
}

interface PerformanceReport {
  id: string;
  generatedAt: Date;
  period: { start: Date; end: Date };
  summary: ReportSummary;
  trends: ReportTrends;
  recommendations: Recommendation[];
  benchmarks: BenchmarkResult[];
  details: ReportDetails;
  alerts: Alert[];
}

interface Recommendation {
  type: string;
  priority: "low" | "medium" | "high";
  title: string;
  description: string;
  actions: string[];
}

interface BenchmarkConfig {
  name: string;
  target: number;
  actual: number;
  unit: string;
  multiplier?: number;
}

interface BenchmarkResult {
  name: string;
  target: number;
  actual: number;
  unit: string;
  status: "pass" | "fail";
  variance: number;
  displayValue: string;
}

interface Alert {
  id: string;
  type: string;
  severity: "low" | "medium" | "high" | "critical";
  timestamp: Date;
  data: AlertData;
  status: "active" | "resolved";
}

interface RealTimeMetrics {
  timestamp: Date;
  accuracy: {
    current: number;
    trend: "improving" | "declining" | "stable";
    byCategory: Record<string, number>;
  };
  performance: {
    avgResponseTime: number;
    p95ResponseTime: number;
    slowOperations: string[];
    errorRate: number;
  };
  usage: {
    requestsPerMinute: number;
    tokensPerMinute: number;
    costPerHour: number;
    remainingQuota: RemainingQuota;
  };
  health: APIHealth;
  alerts: Alert[];
}

interface RemainingQuota {
  requests: number;
  tokens: number;
}

interface APIHealth {
  status: "healthy" | "degraded" | "down";
  endpoints: Record<
    string,
    {
      status: "operational" | "degraded" | "down";
      latency: number;
      lastChecked: Date;
    }
  >;
}

interface AccuracySummary {
  average: number;
  min: number;
  max: number;
  count: number;
  correctPredictions: number;
}

interface PerformanceSummary {
  average: number;
  min: number;
  max: number;
  p50: number;
  p95: number;
  p99: number;
  errorRate: number;
}

interface UsageSummary {
  totalRequests: number;
  totalTokens: number;
  totalCost: number;
  averageTokensPerRequest: number;
  rateLimitHits: number;
}

interface CostSummary {
  total: number;
  average: number;
  byModel: Record<string, number>;
  projectedMonthly: number;
}

interface Trend {
  direction: "improving" | "declining" | "stable";
  change: number;
  confidence: number;
}

interface ErrorAnalysis {
  totalErrors: number;
  errorRate: number;
  byCategory: Record<string, number>;
  commonPatterns: string[];
}

interface SlowOperation {
  operation: string;
  duration: number;
  timestamp: Date;
  metadata: DetailedMetadata;
}

interface RateLimitAnalysis {
  status: "healthy" | "warning" | "critical";
  utilizationPercent: number;
  remaining?: number;
  limit?: number;
  resetAt?: Date;
}

interface DailyCost {
  date: string;
  cost: number;
}

interface CostProjection {
  daily: number;
  weekly: number;
  monthly: number;
  confidence: number;
}

interface PricingModel {
  input?: number;
  output?: number;
  image?: number;
}

// Export factory function
export const createAIMetricsCollector = (): AIMetricsCollector => {
  return new AIMetricsCollector();
};
