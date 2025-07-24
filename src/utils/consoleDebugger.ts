/**
 * Simple Console Debugging Utilities
 * Safe debugging tools that don't rely on complex components
 */

import { supabase } from "@/integrations/supabase/client";

interface QuickDebugResult {
  timestamp: string;
  tables: { [tableName: string]: boolean };
  validStatuses: string[];
  errors: string[];
}

export class ConsoleDebugger {
  /**
   * Quick database status check that logs to console
   */
  static async quickDatabaseCheck(): Promise<QuickDebugResult> {
    const result: QuickDebugResult = {
      timestamp: new Date().toISOString(),
      tables: {},
      validStatuses: [],
      errors: [],
    };

    // Check critical tables
    const tablesToCheck = [
      "properties",
      "inspections",
      "checklist_items", // Fixed: was "logs"
      "static_safety_items",
      "users",
    ];

    for (const table of tablesToCheck) {
      try {
        const { error } = await supabase
          .from(table)
          .select("*")
          .limit(1)
          .maybeSingle();

        result.tables[table] = !error;

        if (error) {
          result.errors.push(`${table}: ${error.message}`);
        } else {
        }
      } catch (err) {
        result.tables[table] = false;
        const errorMsg = err instanceof Error ? err.message : "Unknown error";
        result.errors.push(`${table}: ${errorMsg}`);
      }
    }

    // Test inspection status values
    const statusesToTest = ["draft", "in_progress", "pending_review"];

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      result.errors.push("No authenticated user");
    } else {
      for (const status of statusesToTest) {
        try {
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
            result.validStatuses.push(status);

            // Clean up test record
            await supabase.from("inspections").delete().eq("id", data.id);
          } else {
          }
        } catch (err) {}
      }
    }

    return result;
  }

  /**
   * Add debugging to window object for easy access
   */
  static addToWindow() {
    if (
      typeof window !== "undefined" &&
      process.env.NODE_ENV === "development"
    ) {
      (window as any).debugDB = {
        check: this.quickDatabaseCheck,
        tables: async () => {
          const result = await this.quickDatabaseCheck();
          return result.tables;
        },
        statuses: async () => {
          const result = await this.quickDatabaseCheck();
          return result.validStatuses;
        },
      };
    }
  }

  /**
   * Log critical information about the current state
   */
  static logCurrentState() {
    if (process.env.NODE_ENV === "development") {
      // Check if user is authenticated
      supabase.auth.getUser().then(({ data: { user }, error }) => {
        if (error) {
        } else if (user) {
        } else {
        }
      });
    }
  }
}

// Auto-initialize in development
if (process.env.NODE_ENV === "development") {
  ConsoleDebugger.addToWindow();
  ConsoleDebugger.logCurrentState();
}
