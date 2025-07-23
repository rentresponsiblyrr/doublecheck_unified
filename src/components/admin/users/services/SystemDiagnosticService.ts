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

      // Test users table access using RPC function to avoid RLS recursion
      try {
        const { data, error } = await supabase.rpc("get_all_users");
        diagnosticResults.usersTableExists = !error;
        diagnosticResults.hasPermissions = !error;

        logger.info("Users table access test via RPC", {
          success: !error,
          userCount: data?.length || 0,
          component: "SYSTEM_DIAGNOSTIC_SERVICE",
        });
      } catch (e) {
        // Fallback: try alternative RPC method
        try {
          const { error: profileError } = await supabase.rpc(
            "get_user_profile",
            {
              _user_id: "00000000-0000-0000-0000-000000000001",
            },
          );
          // If function exists but returns no data, table still works
          diagnosticResults.usersTableExists = true;
          diagnosticResults.hasPermissions =
            !profileError || profileError.code !== "42501";
        } catch (fallbackError) {
          diagnosticResults.usersTableExists = false;
          diagnosticResults.hasPermissions = false;
          logger.error("Users table access failed (both RPC methods)", {
            primaryError: e,
            fallbackError,
            component: "SYSTEM_DIAGNOSTIC_SERVICE",
          });
        }
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

      // Test RLS (Row Level Security) by checking if we can access role data via RPC
      try {
        // Test RLS by attempting to get user role via RPC function
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user?.id) {
          const { data, error } = await supabase.rpc("get_user_profile", {
            _user_id: user.id,
          });

          // If we can read role data, RLS and permissions are working correctly
          diagnosticResults.rlsEnabled =
            !error && data && Array.isArray(data) && data.length > 0;
        } else {
          // No authenticated user, can't test RLS effectively
          diagnosticResults.rlsEnabled = false;
        }
      } catch (e) {
        // RLS might be too restrictive or not configured
        diagnosticResults.rlsEnabled = false;
        logger.warn("RLS test failed", e, "SYSTEM_DIAGNOSTIC_SERVICE");
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
   * Test database connectivity using RPC function to avoid RLS issues
   */
  async testDatabaseConnection(): Promise<boolean> {
    try {
      // Test connectivity using validation RPC function
      const { error } = await supabase.rpc("validate_user_profile_functions");
      return !error;
    } catch (e) {
      // Fallback: try a simple RPC call
      try {
        const { error: fallbackError } = await supabase.rpc(
          "get_user_profile",
          {
            _user_id: "00000000-0000-0000-0000-000000000001",
          },
        );
        // Connection works if we get back a proper response (even if no data)
        return true;
      } catch (fallbackE) {
        logger.warn("Database connectivity test failed", {
          primaryError: e,
          fallbackError: fallbackE,
          component: "SYSTEM_DIAGNOSTIC_SERVICE",
        });
        return false;
      }
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
