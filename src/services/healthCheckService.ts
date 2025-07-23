/**
 * Health Check Service
 * Extracted business logic from ProductionHealthCheck.tsx
 */

import { supabase } from "../lib/supabase";
import { productionDb } from "./productionDatabaseService";
import type {
  HealthCheckReport,
  HealthCheckResult,
} from "../types/health-check";
import { log } from "../lib/utils/logger";

class HealthCheckService {
  async runCompleteHealthCheck(): Promise<HealthCheckReport> {
    const startTime = Date.now();
    const timestamp = new Date().toISOString();

    const [databaseResults, authResults, serviceResults, workflowResults] =
      await Promise.allSettled([
        this.checkDatabase(),
        this.checkAuthentication(),
        this.checkServices(),
        this.checkWorkflows(),
      ]);

    const categories = {
      database: this.extractResults(databaseResults),
      auth: this.extractResults(authResults),
      services: this.extractResults(serviceResults),
      workflows: this.extractResults(workflowResults),
    };

    const allResults = Object.values(categories).flat();
    const passedChecks = allResults.filter((r) => r.status === "pass").length;
    const totalChecks = allResults.length;
    const failedChecks = allResults.filter((r) => r.status === "fail").length;

    const overall =
      failedChecks > 0
        ? "critical"
        : passedChecks < totalChecks
          ? "degraded"
          : "healthy";

    const duration = Date.now() - startTime;
    log("info", "Health check completed", {
      duration,
      overall,
      passedChecks,
      totalChecks,
    });

    return {
      overall,
      passedChecks,
      totalChecks,
      categories,
      timestamp,
    };
  }

  private extractResults(
    settledResult: PromiseSettledResult<HealthCheckResult[]>,
  ): HealthCheckResult[] {
    if (settledResult.status === "fulfilled") {
      return settledResult.value;
    } else {
      return [
        {
          name: "System Check",
          status: "fail",
          message: "Check failed to execute",
          error: settledResult.reason?.message || "Unknown error",
        },
      ];
    }
  }

  private async checkDatabase(): Promise<HealthCheckResult[]> {
    const results: HealthCheckResult[] = [];

    // Database Connection
    try {
      const { data, error } = await supabase
        .from("users")
        .select("count", { count: "exact", head: true });
      if (error) throw error;

      results.push({
        name: "Database Connection",
        status: "pass",
        message: "Successfully connected to Supabase",
        details: `Response time: ${Date.now()}ms`,
      });
    } catch (error) {
      results.push({
        name: "Database Connection",
        status: "fail",
        message: "Failed to connect to database",
        error: error.message,
      });
    }

    // Table Access
    const tables = [
      "profiles",
      "properties",
      "inspections",
      "logs",
      "static_safety_items",
    ];
    for (const table of tables) {
      try {
        const { error } = await supabase.from(table).select("*").limit(1);
        if (error) throw error;

        results.push({
          name: `${table} Table Access`,
          status: "pass",
          message: `Successfully accessed ${table} table`,
        });
      } catch (error) {
        results.push({
          name: `${table} Table Access`,
          status: "fail",
          message: `Failed to access ${table} table`,
          error: error.message,
        });
      }
    }

    return results;
  }

  private async checkAuthentication(): Promise<HealthCheckResult[]> {
    const results: HealthCheckResult[] = [];

    try {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      if (session) {
        results.push({
          name: "User Authentication",
          status: "pass",
          message: "User is authenticated",
          details: `User ID: ${session.user.id}`,
        });
      } else {
        results.push({
          name: "User Authentication",
          status: "warning",
          message: "No active session found",
        });
      }
    } catch (error) {
      results.push({
        name: "User Authentication",
        status: "fail",
        message: "Authentication check failed",
        error: error.message,
      });
    }

    return results;
  }

  private async checkServices(): Promise<HealthCheckResult[]> {
    const results: HealthCheckResult[] = [];

    // Production Database Service
    try {
      await productionDb.testConnection();
      results.push({
        name: "Production Database Service",
        status: "pass",
        message: "Service is operational",
      });
    } catch (error) {
      results.push({
        name: "Production Database Service",
        status: "fail",
        message: "Service check failed",
        error: error.message,
      });
    }

    return results;
  }

  private async checkWorkflows(): Promise<HealthCheckResult[]> {
    const results: HealthCheckResult[] = [];

    // Property Selection Workflow
    try {
      const { data, error } = await supabase.rpc(
        "get_properties_with_inspections",
      );
      if (error) throw error;

      results.push({
        name: "Property Selection Workflow",
        status: "pass",
        message: "Property data retrieval working",
        details: `Found ${data?.length || 0} properties`,
      });
    } catch (error) {
      results.push({
        name: "Property Selection Workflow",
        status: "fail",
        message: "Property workflow failed",
        error: error.message,
      });
    }

    return results;
  }
}

export const healthCheckService = new HealthCheckService();
