/**
 * Professional Performance Monitoring Types
 * Real-time system performance tracking and alerting
 */

export interface SystemMetrics {
  timestamp: string;
  cpu: {
    usage: number;
    cores: number;
    temperature?: number;
  };
  memory: {
    used: number;
    total: number;
    available: number;
    percentage: number;
  };
  network: {
    downloadSpeed: number;
    uploadSpeed: number;
    latency: number;
    packetLoss: number;
  };
  storage: {
    used: number;
    total: number;
    available: number;
    percentage: number;
  };
}

export interface ApplicationMetrics {
  timestamp: string;
  performance: {
    renderTime: number;
    loadTime: number;
    interactionTime: number;
    bundleSize: number;
  };
  errors: {
    errorRate: number;
    errorCount: number;
    criticalErrors: number;
    recoveredErrors: number;
  };
  userExperience: {
    sessionDuration: number;
    pageViews: number;
    bounceRate: number;
    satisfactionScore: number;
  };
  ai: {
    predictionLatency: number;
    accuracyScore: number;
    tokensUsed: number;
    costPerRequest: number;
  };
}

export interface DatabaseMetrics {
  timestamp: string;
  connections: {
    active: number;
    idle: number;
    total: number;
    maxConnections: number;
  };
  queries: {
    averageResponseTime: number;
    slowQueries: number;
    failedQueries: number;
    queriesPerSecond: number;
  };
  storage: {
    sizeGB: number;
    growthRate: number;
    indexEfficiency: number;
    cacheHitRatio: number;
  };
  health: {
    isOnline: boolean;
    lastBackup: string;
    replicationLag: number;
    diskUsage: number;
  };
}

export interface AlertRule {
  id: string;
  name: string;
  description: string;
  metric: string;
  condition: "greater_than" | "less_than" | "equals" | "not_equals";
  threshold: number;
  severity: "low" | "medium" | "high" | "critical";
  isActive: boolean;
  channels: ("email" | "slack" | "webhook")[];
  cooldownMinutes: number;
  lastTriggered?: string;
}

export interface PerformanceAlert {
  id: string;
  ruleId: string;
  severity: "low" | "medium" | "high" | "critical";
  title: string;
  message: string;
  timestamp: string;
  isResolved: boolean;
  resolvedAt?: string;
  affectedSystems: string[];
  metadata: Record<string, unknown>;
}

export interface PerformanceTrend {
  metric: string;
  timeRange: {
    start: string;
    end: string;
  };
  dataPoints: Array<{
    timestamp: string;
    value: number;
  }>;
  trend: "improving" | "declining" | "stable";
  changePercentage: number;
  forecast?: Array<{
    timestamp: string;
    predicted: number;
    confidence: number;
  }>;
}

export interface SystemHealthScore {
  overall: number;
  components: {
    frontend: number;
    backend: number;
    database: number;
    ai: number;
    infrastructure: number;
  };
  factors: Array<{
    name: string;
    score: number;
    weight: number;
    impact: string;
  }>;
  recommendations: Array<{
    priority: "high" | "medium" | "low";
    action: string;
    expectedImprovement: number;
  }>;
}

export interface MonitoringDashboardConfig {
  id: string;
  name: string;
  layout: {
    widgets: Array<{
      id: string;
      type: "chart" | "metric" | "alert" | "health" | "table";
      position: { x: number; y: number; width: number; height: number };
      config: Record<string, unknown>;
    }>;
  };
  refreshIntervalMs: number;
  alertRules: string[];
  isPublic: boolean;
  owner: string;
}
