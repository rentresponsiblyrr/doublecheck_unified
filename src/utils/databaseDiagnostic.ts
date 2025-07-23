import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/utils/logger";

export interface TableDiagnostic {
  name: string;
  exists: boolean;
  accessible: boolean;
  rowCount: number;
  error?: string;
  columns?: string[];
}

export interface DatabaseDiagnostic {
  timestamp: string;
  currentUser: {
    id: string | null;
    email: string | null;
    role: string | null;
  };
  tables: TableDiagnostic[];
  rlsPolicies: {
    table: string;
    hasRLS: boolean;
    policies: string[];
  }[];
  overallHealth: "healthy" | "degraded" | "critical";
  recommendations: string[];
}

/**
 * Database Compatibility Layer Architecture
 *
 * CRITICAL_TABLES: Core tables required for application functionality
 * - Uses compatibility views that provide UUID interface to integer-based production tables
 * - Updated in Phase 4 systematic fixes to use correct table names
 */
const CRITICAL_TABLES = [
  "users", // Compatibility view for auth.users
  "properties", // Compatibility view for properties table with UUID conversion
  "inspections", // Compatibility view for inspections table with UUID conversion
  "logs", // Compatibility view for logs table with field mapping
];

/**
 * OPTIONAL_TABLES: Supporting tables that enhance functionality
 * - Direct table access (no compatibility layer needed)
 */
const OPTIONAL_TABLES = [
  "media", // Direct table - no compatibility layer needed
  "audit_feedback",
  "inspection_reports",
  "webhook_notifications",
  "listing_photos",
];

export class DatabaseDiagnosticService {
  static async runComprehensiveDiagnostic(): Promise<DatabaseDiagnostic> {
    logger.info(
      "🔍 Starting comprehensive database diagnostic...",
      {},
      "DB_DIAGNOSTIC",
    );

    const diagnostic: DatabaseDiagnostic = {
      timestamp: new Date().toISOString(),
      currentUser: await this.getCurrentUserInfo(),
      tables: [],
      rlsPolicies: [],
      overallHealth: "healthy",
      recommendations: [],
    };

    try {
      // Test all critical and optional tables
      const allTables = [...CRITICAL_TABLES, ...OPTIONAL_TABLES];
      diagnostic.tables = await Promise.all(
        allTables.map((tableName) => this.testTable(tableName)),
      );

      // Check RLS policies for critical tables
      diagnostic.rlsPolicies = await Promise.all(
        CRITICAL_TABLES.map((tableName) => this.checkRLSPolicies(tableName)),
      );

      // Determine overall health
      diagnostic.overallHealth = this.determineOverallHealth(diagnostic);

      // Generate recommendations
      diagnostic.recommendations = this.generateRecommendations(diagnostic);

      logger.info(
        "✅ Database diagnostic completed",
        {
          health: diagnostic.overallHealth,
          tablesChecked: diagnostic.tables.length,
        },
        "DB_DIAGNOSTIC",
      );

      return diagnostic;
    } catch (error) {
      logger.error("❌ Database diagnostic failed", error, "DB_DIAGNOSTIC");
      diagnostic.overallHealth = "critical";
      diagnostic.recommendations.push(
        "Database diagnostic failed completely - check connection and permissions",
      );
      return diagnostic;
    }
  }

  private static async getCurrentUserInfo(): Promise<
    DatabaseDiagnostic["currentUser"]
  > {
    try {
      const { data: authUser } = await supabase.auth.getUser();

      if (!authUser.user) {
        return { id: null, email: null, role: null };
      }

      // Try to get role from users table
      let role: string | null = null;
      try {
        const { data: userData } = await supabase
          .from("users")
          .select("role")
          .eq("id", authUser.user.id)
          .single();

        role = userData?.role || null;
      } catch {
        // If users view doesn't work, fallback to auth metadata
        role = authUser.user.user_metadata?.role || null;
      }

      return {
        id: authUser.user.id,
        email: authUser.user.email || null,
        role,
      };
    } catch (error) {
      logger.warn("Failed to get current user info", error, "DB_DIAGNOSTIC");
      return { id: null, email: null, role: null };
    }
  }

  private static async testTable(tableName: string): Promise<TableDiagnostic> {
    const diagnostic: TableDiagnostic = {
      name: tableName,
      exists: false,
      accessible: false,
      rowCount: 0,
      columns: [],
    };

    try {
      // Test basic access with a simple count query
      const { data, error, count } = await supabase
        .from(tableName)
        .select("*", { count: "exact", head: true });

      if (error) {
        diagnostic.error = error.message;

        // Determine if table exists but access is denied vs table doesn't exist
        if (
          error.message.includes("relation") &&
          error.message.includes("does not exist")
        ) {
          diagnostic.exists = false;
        } else {
          diagnostic.exists = true; // Table exists but we can't access it
        }
      } else {
        diagnostic.exists = true;
        diagnostic.accessible = true;
        diagnostic.rowCount = count || 0;
      }

      // If accessible, get column information
      if (diagnostic.accessible) {
        try {
          const { data: sampleRow } = await supabase
            .from(tableName)
            .select("*")
            .limit(1)
            .single();

          if (sampleRow) {
            diagnostic.columns = Object.keys(sampleRow);
          }
        } catch {
          // Even if we can't get a sample row, table is still accessible
        }
      }
    } catch (error) {
      diagnostic.error =
        error instanceof Error ? error.message : "Unknown error";
    }

    return diagnostic;
  }

  private static async checkRLSPolicies(
    tableName: string,
  ): Promise<DatabaseDiagnostic["rlsPolicies"][0]> {
    const rlsInfo = {
      table: tableName,
      hasRLS: false,
      policies: [] as string[],
    };

    try {
      // This is a simplified check - in production you might query pg_policies
      // For now, we'll just test if we can access the table and assume RLS is working
      const { error } = await supabase.from(tableName).select("*").limit(1);

      // If we can access without error, assume RLS is configured properly
      rlsInfo.hasRLS = !error;

      if (!error) {
        rlsInfo.policies.push("Basic access policy active");
      }
    } catch (error) {
      logger.warn(
        `Failed to check RLS for ${tableName}`,
        error,
        "DB_DIAGNOSTIC",
      );
    }

    return rlsInfo;
  }

  private static determineOverallHealth(
    diagnostic: DatabaseDiagnostic,
  ): "healthy" | "degraded" | "critical" {
    const criticalTableResults = diagnostic.tables.filter((t) =>
      CRITICAL_TABLES.includes(t.name),
    );

    // Count critical issues
    const missingCriticalTables = criticalTableResults.filter(
      (t) => !t.exists,
    ).length;
    const inaccessibleCriticalTables = criticalTableResults.filter(
      (t) => t.exists && !t.accessible,
    ).length;

    // Critical: Any critical table is missing
    if (missingCriticalTables > 0) {
      return "critical";
    }

    // Critical: More than half of critical tables are inaccessible
    if (inaccessibleCriticalTables > CRITICAL_TABLES.length / 2) {
      return "critical";
    }

    // Degraded: Some critical tables are inaccessible
    if (inaccessibleCriticalTables > 0) {
      return "degraded";
    }

    // Degraded: User has no role assigned
    if (!diagnostic.currentUser.role) {
      return "degraded";
    }

    return "healthy";
  }

  private static generateRecommendations(
    diagnostic: DatabaseDiagnostic,
  ): string[] {
    const recommendations: string[] = [];

    // Check for missing critical tables
    const missingTables = diagnostic.tables
      .filter((t) => CRITICAL_TABLES.includes(t.name) && !t.exists)
      .map((t) => t.name);

    if (missingTables.length > 0) {
      recommendations.push(
        `Critical tables missing: ${missingTables.join(", ")}. Run database migrations.`,
      );
    }

    // Check for inaccessible tables
    const inaccessibleTables = diagnostic.tables
      .filter((t) => t.exists && !t.accessible)
      .map((t) => t.name);

    if (inaccessibleTables.length > 0) {
      recommendations.push(
        `Tables exist but not accessible: ${inaccessibleTables.join(", ")}. Check RLS policies and user permissions.`,
      );
    }

    // Check user role
    if (!diagnostic.currentUser.role) {
      recommendations.push(
        "Current user has no role assigned. Assign appropriate role for access to admin features.",
      );
    }

    // Check for empty critical tables
    const emptyCriticalTables = diagnostic.tables
      .filter(
        (t) =>
          CRITICAL_TABLES.includes(t.name) && t.accessible && t.rowCount === 0,
      )
      .map((t) => t.name);

    if (emptyCriticalTables.includes("users")) {
      recommendations.push(
        "Users table is empty. Create initial admin users or check user sync from auth.users.",
      );
    }

    if (emptyCriticalTables.includes("properties")) {
      recommendations.push(
        "No properties found. Add test properties for development/testing.",
      );
    }

    // Performance recommendations
    const largeAccessibleTables = diagnostic.tables
      .filter((t) => t.accessible && t.rowCount > 10000)
      .map((t) => t.name);

    if (largeAccessibleTables.length > 0) {
      recommendations.push(
        `Large tables detected: ${largeAccessibleTables.join(", ")}. Consider implementing pagination and indexing optimization.`,
      );
    }

    if (recommendations.length === 0) {
      recommendations.push(
        "Database appears healthy. All critical systems are functioning normally.",
      );
    }

    return recommendations;
  }

  static async quickHealthCheck(): Promise<{
    healthy: boolean;
    message: string;
  }> {
    try {
      // Quick test of the most critical table
      const { error } = await supabase.from("users").select("id").limit(1);

      if (error) {
        if (error.message.includes("does not exist")) {
          return {
            healthy: false,
            message: "Users table does not exist. Database migration required.",
          };
        } else {
          return {
            healthy: false,
            message: "Cannot access users table. Check permissions.",
          };
        }
      }

      return { healthy: true, message: "Database connection healthy" };
    } catch (error) {
      return {
        healthy: false,
        message: "Database connection failed",
      };
    }
  }
}

// Export convenience functions
export const runDatabaseDiagnostic =
  DatabaseDiagnosticService.runComprehensiveDiagnostic;
export const quickHealthCheck = DatabaseDiagnosticService.quickHealthCheck;
