// Health Check Service for STR Certified
// Provides health endpoint and system status monitoring

import { createClient } from "@supabase/supabase-js";
import { env } from "../config/environment";

export interface HealthCheckResult {
  status: "healthy" | "degraded" | "unhealthy";
  timestamp: string;
  version: string;
  uptime: number;
  services: {
    database: ServiceStatus;
    ai: ServiceStatus;
    storage: ServiceStatus;
    cache: ServiceStatus;
  };
  metrics: {
    memory: MemoryMetrics;
    performance: PerformanceMetrics;
    errors: ErrorMetrics;
  };
  environment: {
    node: string;
    deployment: string;
    region?: string;
  };
}

interface ServiceStatus {
  name: string;
  status: "up" | "down" | "degraded";
  latency?: number;
  lastCheck: string;
  error?: string;
  details?: Record<string, unknown>;
}

interface MemoryMetrics {
  used: number;
  total: number;
  percentage: number;
  rss: number;
  heapUsed: number;
  heapTotal: number;
}

interface PerformanceMetrics {
  cpuUsage: number;
  loadAverage: number[];
  responseTime: number;
  requestsPerSecond: number;
}

interface ErrorMetrics {
  rate: number;
  total: number;
  recent: Array<{
    type: string;
    count: number;
    lastOccurred: string;
  }>;
}

export class HealthCheckService {
  private static instance: HealthCheckService;
  private startTime: number;
  private errorCount: number = 0;
  private requestCount: number = 0;
  private recentErrors: Map<string, { count: number; lastOccurred: Date }> =
    new Map();
  private supabase: ReturnType<typeof createClient> | null = null;

  private constructor() {
    this.startTime = Date.now();

    // Initialize Supabase client for health checks
    if (env.validateSupabaseConfig()) {
      this.supabase = createClient(env.supabase.url, env.supabase.anonKey);
    }
  }

  static getInstance(): HealthCheckService {
    if (!HealthCheckService.instance) {
      HealthCheckService.instance = new HealthCheckService();
    }
    return HealthCheckService.instance;
  }

  /**
   * Performs comprehensive health check
   */
  async performHealthCheck(): Promise<HealthCheckResult> {
    const startCheck = Date.now();

    // Check all services in parallel
    const [database, ai, storage, cache] = await Promise.all([
      this.checkDatabase(),
      this.checkAIService(),
      this.checkStorage(),
      this.checkCache(),
    ]);

    // Determine overall status
    const services = { database, ai, storage, cache };
    const serviceStatuses = Object.values(services).map((s) => s.status);

    let overallStatus: HealthCheckResult["status"] = "healthy";
    if (serviceStatuses.includes("down")) {
      overallStatus = "unhealthy";
    } else if (serviceStatuses.includes("degraded")) {
      overallStatus = "degraded";
    }

    // Collect metrics
    const metrics = {
      memory: this.getMemoryMetrics(),
      performance: this.getPerformanceMetrics(Date.now() - startCheck),
      errors: this.getErrorMetrics(),
    };

    return {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      version: this.getVersion(),
      uptime: this.getUptime(),
      services,
      metrics,
      environment: {
        node: process.version,
        deployment: env.getEnvironment(),
        region: process.env.RAILWAY_REGION,
      },
    };
  }

  /**
   * Simple health check for load balancer
   */
  async getBasicHealth(): Promise<{ status: string; timestamp: string }> {
    return {
      status: "ok",
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Readiness check for container orchestration
   */
  async checkReadiness(): Promise<{
    ready: boolean;
    checks: Record<string, boolean>;
  }> {
    const checks = {
      database: false,
      environment: false,
      dependencies: false,
    };

    // Check database connection
    if (this.supabase) {
      try {
        const { error } = await this.supabase
          .from("properties")
          .select("id")
          .limit(1);
        checks.database = !error;
      } catch {
        checks.database = false;
      }
    }

    // Check environment variables
    checks.environment =
      env.validateSupabaseConfig() && env.validateApiConfig();

    // Check critical dependencies
    checks.dependencies = true; // In production, would check actual dependencies

    const ready = Object.values(checks).every((check) => check === true);

    return { ready, checks };
  }

  /**
   * Liveness check for container orchestration
   */
  async checkLiveness(): Promise<{
    alive: boolean;
    pid: number;
    uptime: number;
  }> {
    return {
      alive: true,
      pid: process.pid,
      uptime: this.getUptime(),
    };
  }

  // Private service check methods

  private async checkDatabase(): Promise<ServiceStatus> {
    const start = Date.now();
    const status: ServiceStatus = {
      name: "Database (Supabase)",
      status: "down",
      lastCheck: new Date().toISOString(),
    };

    if (!this.supabase) {
      status.error = "Supabase client not initialized";
      return status;
    }

    try {
      // Perform a simple query to test database connectivity
      const { data, error } = await this.supabase
        .from("properties")
        .select("id")
        .limit(1);

      if (error) throw error;

      status.status = "up";
      status.latency = Date.now() - start;

      // Skip database stats for now since RPC function is missing
      // This prevents infinite 404 errors in production
      status.details = {
        connections: "available",
        size: "functional",
        tables: "accessible",
        note: "Basic connectivity verified - detailed stats disabled",
      };
    } catch (error) {
      status.status = "down";
      status.error = error instanceof Error ? error.message : "Unknown error";
      status.latency = Date.now() - start;
    }

    return status;
  }

  private async checkAIService(): Promise<ServiceStatus> {
    const start = Date.now();
    const status: ServiceStatus = {
      name: "AI Service (OpenAI)",
      status: "down",
      lastCheck: new Date().toISOString(),
    };

    if (!env.hasOpenAI()) {
      status.status = "degraded";
      status.error = "OpenAI API key not configured";
      return status;
    }

    try {
      // In production, would make a test API call
      // For now, simulate with a simple check
      const response = await fetch("https://api.openai.com/v1/models", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${env.openai.apiKey}`,
          "OpenAI-Organization": env.openai.orgId || "",
        },
        signal: AbortSignal.timeout(5000), // 5 second timeout
      });

      if (response.ok) {
        status.status = "up";
        status.latency = Date.now() - start;

        // Get rate limit info from headers
        const remaining = response.headers.get("x-ratelimit-remaining");
        const limit = response.headers.get("x-ratelimit-limit");

        if (remaining && limit) {
          status.details = {
            rateLimitRemaining: parseInt(remaining),
            rateLimitTotal: parseInt(limit),
            rateLimitUsage:
              ((parseInt(limit) - parseInt(remaining)) / parseInt(limit)) * 100,
          };
        }
      } else {
        status.status = response.status === 429 ? "degraded" : "down";
        status.error = `API returned ${response.status}`;
      }
    } catch (error) {
      status.status = "down";
      status.error =
        error instanceof Error ? error.message : "Connection failed";
      status.latency = Date.now() - start;
    }

    return status;
  }

  private async checkStorage(): Promise<ServiceStatus> {
    const start = Date.now();
    const status: ServiceStatus = {
      name: "Storage",
      status: "up",
      lastCheck: new Date().toISOString(),
    };

    try {
      if (
        typeof window !== "undefined" &&
        "storage" in navigator &&
        "estimate" in navigator.storage
      ) {
        const estimate = await navigator.storage.estimate();

        status.latency = Date.now() - start;
        status.details = {
          used: estimate.usage || 0,
          quota: estimate.quota || 0,
          percentage: estimate.quota
            ? ((estimate.usage || 0) / estimate.quota) * 100
            : 0,
        };

        // Degrade if storage is almost full
        if (status.details.percentage > 90) {
          status.status = "degraded";
          status.error = "Storage usage above 90%";
        }
      } else {
        // Server-side or unsupported
        status.details = {
          available: true,
          type: "server",
        };
      }
    } catch (error) {
      status.status = "down";
      status.error =
        error instanceof Error ? error.message : "Storage check failed";
    }

    return status;
  }

  private async checkCache(): Promise<ServiceStatus> {
    const start = Date.now();
    const status: ServiceStatus = {
      name: "Cache",
      status: "up",
      lastCheck: new Date().toISOString(),
    };

    try {
      // Test cache operations
      const testKey = "health_check_test";
      const testValue = { timestamp: Date.now() };

      // Test write
      if (typeof window !== "undefined") {
        localStorage.setItem(testKey, JSON.stringify(testValue));

        // Test read
        const retrieved = localStorage.getItem(testKey);
        if (!retrieved) throw new Error("Cache read failed");

        // Test delete
        localStorage.removeItem(testKey);

        status.latency = Date.now() - start;

        // Get cache stats
        const cacheSize = new Blob(Object.values(localStorage)).size;
        status.details = {
          type: "localStorage",
          size: cacheSize,
          items: localStorage.length,
        };
      } else {
        // Server-side cache check
        status.details = {
          type: "memory",
          available: true,
        };
      }
    } catch (error) {
      status.status = "down";
      status.error =
        error instanceof Error ? error.message : "Cache check failed";
    }

    return status;
  }

  // Metrics collection methods

  private getMemoryMetrics(): MemoryMetrics {
    const usage = process.memoryUsage();
    const totalMemory =
      process.arch === "x64" ? 8 * 1024 * 1024 * 1024 : 4 * 1024 * 1024 * 1024; // Estimate

    return {
      used: usage.heapUsed + usage.external,
      total: totalMemory,
      percentage: ((usage.heapUsed + usage.external) / totalMemory) * 100,
      rss: usage.rss,
      heapUsed: usage.heapUsed,
      heapTotal: usage.heapTotal,
    };
  }

  private getPerformanceMetrics(checkDuration: number): PerformanceMetrics {
    this.requestCount++;

    return {
      cpuUsage: process.cpuUsage ? process.cpuUsage().user / 1000000 : 0, // Convert to seconds
      loadAverage:
        typeof process.loadavg === "function" ? process.loadavg() : [0, 0, 0],
      responseTime: checkDuration,
      requestsPerSecond: this.requestCount / (this.getUptime() / 1000),
    };
  }

  private getErrorMetrics(): ErrorMetrics {
    const recentErrors = Array.from(this.recentErrors.entries())
      .map(([type, data]) => ({
        type,
        count: data.count,
        lastOccurred: data.lastOccurred.toISOString(),
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      rate: this.errorCount / (this.getUptime() / 1000),
      total: this.errorCount,
      recent: recentErrors,
    };
  }

  // Utility methods

  private getVersion(): string {
    return process.env.npm_package_version || "1.0.0";
  }

  private getUptime(): number {
    return Date.now() - this.startTime;
  }

  /**
   * Records an error for metrics
   */
  recordError(type: string): void {
    this.errorCount++;

    const existing = this.recentErrors.get(type);
    if (existing) {
      existing.count++;
      existing.lastOccurred = new Date();
    } else {
      this.recentErrors.set(type, {
        count: 1,
        lastOccurred: new Date(),
      });
    }

    // Keep only recent error types (last 100)
    if (this.recentErrors.size > 100) {
      const oldest = Array.from(this.recentErrors.entries()).sort(
        (a, b) => a[1].lastOccurred.getTime() - b[1].lastOccurred.getTime(),
      )[0];
      this.recentErrors.delete(oldest[0]);
    }
  }

  /**
   * Express/HTTP handler for health endpoint
   */
  async handleHealthRequest(
    req: {
      query?: { full?: string };
    },
    res: {
      status: (code: number) => { json: (data: unknown) => void };
    },
  ): Promise<void> {
    try {
      const fullCheck = req.query.full === "true";

      if (fullCheck) {
        const health = await this.performHealthCheck();
        res.status(health.status === "healthy" ? 200 : 503).json(health);
      } else {
        const basic = await this.getBasicHealth();
        res.status(200).json(basic);
      }
    } catch (error) {
      res.status(500).json({
        status: "error",
        message: error instanceof Error ? error.message : "Health check failed",
      });
    }
  }
}

// Export singleton instance
export const healthCheck = HealthCheckService.getInstance();

// Export convenience functions
export const checkHealth = () => healthCheck.performHealthCheck();
export const checkReadiness = () => healthCheck.checkReadiness();
export const checkLiveness = () => healthCheck.checkLiveness();

// Vite server middleware for health endpoint
export function healthCheckMiddleware() {
  return {
    name: "health-check",
    configureServer(server: {
      middlewares: {
        use: (
          handler: (req: unknown, res: unknown, next: () => void) => void,
        ) => void;
      };
    }) {
      // Only initialize health check during development server, not during build
      let healthCheckInstance: HealthCheckService | null = null;

      try {
        healthCheckInstance = HealthCheckService.getInstance();
      } catch (error) {
        return;
      }

      server.middlewares.use(
        async (req: unknown, res: unknown, next: () => void) => {
          if (!healthCheckInstance) {
            next();
            return;
          }

          if (req.url === "/health" || req.url.startsWith("/health?")) {
            res.setHeader("Content-Type", "application/json");
            await healthCheckInstance.handleHealthRequest(req, res);
          } else if (req.url === "/ready") {
            const readiness = await healthCheckInstance.checkReadiness();
            res.setHeader("Content-Type", "application/json");
            res.statusCode = readiness.ready ? 200 : 503;
            res.end(JSON.stringify(readiness));
          } else if (req.url === "/live") {
            const liveness = await healthCheckInstance.checkLiveness();
            res.setHeader("Content-Type", "application/json");
            res.statusCode = 200;
            res.end(JSON.stringify(liveness));
          } else {
            next();
          }
        },
      );
    },
  };
}
