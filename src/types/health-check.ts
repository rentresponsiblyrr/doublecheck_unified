/**
 * Health Check Types
 * Extracted from ProductionHealthCheck.tsx
 */

export interface HealthCheckResult {
  name: string;
  status: "pass" | "fail" | "warning" | "running";
  message: string;
  details?: string;
  error?: string;
}

export interface HealthCheckReport {
  overall: "healthy" | "degraded" | "critical";
  passedChecks: number;
  totalChecks: number;
  categories: {
    database: HealthCheckResult[];
    auth: HealthCheckResult[];
    services: HealthCheckResult[];
    workflows: HealthCheckResult[];
  };
  timestamp: string;
}
