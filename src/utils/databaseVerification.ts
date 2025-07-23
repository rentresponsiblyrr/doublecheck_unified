/**
 * Database Verification Utility
 * Checks what tables and structures actually exist in the database
 */

import { supabase } from "@/integrations/supabase/client";

export interface TableInfo {
  name: string;
  exists: boolean;
  error?: string;
  sampleRow?: Record<string, unknown>;
  columns?: string[];
}

export interface DatabaseStatus {
  tables: TableInfo[];
  validStatusValues: string[];
  inspectionConstraints: Record<string, unknown>;
  recommendations: string[];
}

export class DatabaseVerification {
  /**
   * Check if specific tables exist and are accessible
   */
  static async verifyTables(): Promise<TableInfo[]> {
    const tablesToCheck = [
      "properties",
      "inspections",
      "logs",
      "static_safety_items",
      "users",
      "media",
    ];

    const results: TableInfo[] = [];

    for (const tableName of tablesToCheck) {
      try {
        // Try to query the table
        const { data, error } = await supabase
          .from(tableName)
          .select("*")
          .limit(1)
          .maybeSingle();

        if (error) {
          results.push({
            name: tableName,
            exists: false,
            error: error.message,
          });
        } else {
          // Get column information
          const columns = data ? Object.keys(data) : [];

          results.push({
            name: tableName,
            exists: true,
            sampleRow: data,
            columns,
          });
        }
      } catch (err) {
        results.push({
          name: tableName,
          exists: false,
          error: err instanceof Error ? err.message : "Unknown error",
        });
      }
    }

    return results;
  }

  /**
   * Test which status values work for inspections
   */
  static async testValidStatusValues(): Promise<string[]> {
    const statusesToTest = [
      "draft",
      "in_progress",
      "completed",
      "pending_review",
      "in_review",
      "approved",
      "rejected",
      "needs_revision",
      "cancelled",
    ];

    const validStatuses: string[] = [];

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return validStatuses;
    }

    // Test each status by attempting a minimal insert (then rolling back)
    for (const status of statusesToTest) {
      try {
        // Create a test inspection
        const { data, error } = await supabase
          .from("inspections")
          .insert({
            property_id: "test-property-id",
            inspector_id: user.id,
            status: status,
            start_time: new Date().toISOString(),
            completed: false,
          })
          .select("id")
          .single();

        if (!error && data) {
          validStatuses.push(status);

          // Clean up the test record
          await supabase.from("inspections").delete().eq("id", data.id);
        } else {
        }
      } catch (err) {}
    }

    return validStatuses;
  }

  /**
   * Run comprehensive database verification
   */
  static async runFullVerification(): Promise<DatabaseStatus> {
    const tables = await this.verifyTables();
    const validStatusValues = await this.testValidStatusValues();

    // Generate recommendations based on findings
    const recommendations: string[] = [];

    // Check for missing critical tables
    const missingTables = tables.filter((t) => !t.exists);
    if (missingTables.length > 0) {
      recommendations.push(
        `Missing tables detected: ${missingTables.map((t) => t.name).join(", ")}`,
      );
    }

    // Check for logs vs checklist_items issue
    const logsTable = tables.find((t) => t.name === "logs");
    const checklistTable = tables.find((t) => t.name === "checklist_items");

    if (!logsTable?.exists && checklistTable?.exists) {
      recommendations.push(
        'Use "checklist_items" table instead of "logs" for checklist data',
      );
    } else if (logsTable?.exists && !checklistTable?.exists) {
      recommendations.push(
        'Use "logs" table for checklist data (preferred production schema)',
      );
    } else if (!logsTable?.exists && !checklistTable?.exists) {
      recommendations.push(
        "CRITICAL: No checklist table found - database may need setup",
      );
    }

    // Status recommendations
    if (validStatusValues.length === 0) {
      recommendations.push(
        "CRITICAL: No valid status values found - check database constraints",
      );
    } else if (
      !validStatusValues.includes("draft") &&
      !validStatusValues.includes("in_progress")
    ) {
      recommendations.push("Use alternative status values for new inspections");
    }

    return {
      tables,
      validStatusValues,
      inspectionConstraints: {}, // Could be expanded
      recommendations,
    };
  }

  /**
   * Quick health check for critical tables
   */
  static async quickHealthCheck(): Promise<boolean> {
    try {
      // Check if we can access core tables
      const criticalTables = ["properties", "inspections", "users"];

      for (const table of criticalTables) {
        const { error } = await supabase
          .from(table)
          .select("*")
          .limit(1)
          .maybeSingle();

        if (error) {
          return false;
        }
      }

      // Check if user is authenticated
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        return false;
      }

      return true;
    } catch (error) {
      return false;
    }
  }
}

// Export convenience function
export const verifyDatabase = DatabaseVerification.runFullVerification;
