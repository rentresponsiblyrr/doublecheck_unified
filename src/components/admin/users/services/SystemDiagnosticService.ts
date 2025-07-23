/**
 * System Diagnostic Service - Enterprise Grade
 *
 * Handles system health checks and diagnostics for user management
 */

import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/utils/logger";
import { SystemDiagnostic } from "../types";
import type { MutableRefObject } from "react";

export class SystemDiagnosticService {
  constructor(private mountedRef: MutableRefObject<boolean>) {}

  /**
   * Run comprehensive system diagnostics
   */
  async runDiagnostics(): Promise<SystemDiagnostic> {
    if (!this.mountedRef.current) {
      throw new Error("Component unmounted");
    }

    try {
      const diagnosticResults: SystemDiagnostic = {
        usersTableExists: false,
        authEnabled: false,
        rlsEnabled: false,
        hasPermissions: false,
        lastChecked: new Date(),
      };

      // Test users table access
      try {
        const { error } = await supabase.from("users").select("id").limit(1);
        diagnosticResults.usersTableExists = !error;
        diagnosticResults.hasPermissions = !error;
      } catch (e) {
        diagnosticResults.usersTableExists = false;
        logger.warn(
          "Users table access failed",
          e,
          "SYSTEM_DIAGNOSTIC_SERVICE",
        );
      }

      // Test auth functionality
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        diagnosticResults.authEnabled = !!user;
      } catch (e) {
        diagnosticResults.authEnabled = false;
        logger.warn("Auth check failed", e, "SYSTEM_DIAGNOSTIC_SERVICE");
      }

      // Test RLS (Row Level Security)
      try {
        const { error } = await supabase.rpc("get_user_role");
        diagnosticResults.rlsEnabled = !error;
      } catch (e) {
        // RLS function might not exist - this is optional
        diagnosticResults.rlsEnabled = false;
      }

      logger.info(
        "System diagnostics completed",
        diagnosticResults,
        "SYSTEM_DIAGNOSTIC_SERVICE",
      );
      return diagnosticResults;
    } catch (error) {
      logger.error(
        "System diagnostics failed:",
        error,
        "SYSTEM_DIAGNOSTIC_SERVICE",
      );
      throw error;
    }
  }

  /**
   * Test database connectivity
   */
  async testDatabaseConnection(): Promise<boolean> {
    try {
      const { error } = await supabase.from("users").select("count").limit(0);
      return !error;
    } catch (e) {
      return false;
    }
  }

  /**
   * Get system health score
   */
  calculateHealthScore(diagnostic: SystemDiagnostic): number {
    let score = 0;
    let total = 0;

    // Each check contributes to the health score
    if (diagnostic.usersTableExists) score += 25;
    total += 25;

    if (diagnostic.authEnabled) score += 30;
    total += 30;

    if (diagnostic.hasPermissions) score += 25;
    total += 25;

    if (diagnostic.rlsEnabled) score += 20;
    total += 20;

    return total > 0 ? Math.round((score / total) * 100) : 0;
  }

  /**
   * Get system recommendations based on diagnostics
   */
  getRecommendations(diagnostic: SystemDiagnostic): string[] {
    const recommendations: string[] = [];

    if (!diagnostic.usersTableExists) {
      recommendations.push(
        "Users table is not accessible - check database configuration",
      );
    }

    if (!diagnostic.authEnabled) {
      recommendations.push(
        "Authentication is not working - verify Supabase auth setup",
      );
    }

    if (!diagnostic.hasPermissions) {
      recommendations.push(
        "Insufficient permissions - check user role and RLS policies",
      );
    }

    if (!diagnostic.rlsEnabled) {
      recommendations.push(
        "Consider enabling Row Level Security for enhanced data protection",
      );
    }

    return recommendations;
  }
}
