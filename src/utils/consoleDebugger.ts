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
      errors: []
    };

    // REMOVED: console.log('🔍 Starting quick database check...');

    // Check critical tables
    const tablesToCheck = ['properties', 'inspections', 'logs', 'checklist_items', 'static_safety_items', 'profiles'];
    
    for (const table of tablesToCheck) {
      try {
        const { error } = await supabase
          .from(table)
          .select('*')
          .limit(1)
          .maybeSingle();

        result.tables[table] = !error;
        
        if (error) {
          // REMOVED: console.log(`❌ ${table}: ${error.message}`);
          result.errors.push(`${table}: ${error.message}`);
        } else {
          // REMOVED: console.log(`✅ ${table}: accessible`);
        }
      } catch (err) {
        result.tables[table] = false;
        const errorMsg = err instanceof Error ? err.message : 'Unknown error';
        // REMOVED: console.log(`❌ ${table}: ${errorMsg}`);
        result.errors.push(`${table}: ${errorMsg}`);
      }
    }

    // Test inspection status values
    // REMOVED: console.log('🧪 Testing inspection status values...');
    const statusesToTest = ['draft', 'in_progress', 'pending_review'];
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      // REMOVED: console.log('❌ No authenticated user - cannot test status values');
      result.errors.push('No authenticated user');
    } else {
      for (const status of statusesToTest) {
        try {
          const { data, error } = await supabase
            .from('inspections')
            .insert({
              property_id: 'test-property-id',
              inspector_id: user.id,
              status: status,
              start_time: new Date().toISOString(),
              completed: false
            })
            .select('id')
            .single();

          if (!error && data) {
            // REMOVED: console.log(`✅ Status '${status}' works`);
            result.validStatuses.push(status);
            
            // Clean up test record
            await supabase.from('inspections').delete().eq('id', data.id);
          } else {
            // REMOVED: console.log(`❌ Status '${status}' failed:`, error?.message);
          }
        } catch (err) {
          // REMOVED: console.log(`❌ Status '${status}' error:`, err);
        }
      }
    }

    // REMOVED: console.log('📊 Database check complete:', result);
    return result;
  }

  /**
   * Add debugging to window object for easy access
   */
  static addToWindow() {
    if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
      (window as any).debugDB = {
        check: this.quickDatabaseCheck,
        tables: async () => {
          const result = await this.quickDatabaseCheck();
          console.table(result.tables);
          return result.tables;
        },
        statuses: async () => {
          const result = await this.quickDatabaseCheck();
          // REMOVED: console.log('Valid statuses:', result.validStatuses);
          return result.validStatuses;
        }
      };
      
      // REMOVED: console.log('🛠️ Debug tools added to window.debugDB');
      // REMOVED: console.log('Usage: window.debugDB.check(), window.debugDB.tables(), window.debugDB.statuses()');
    }
  }

  /**
   * Log critical information about the current state
   */
  static logCurrentState() {
    if (process.env.NODE_ENV === 'development') {
      // REMOVED: console.log('🌟 STR Certified Debug Info:');
      // REMOVED: console.log('- URL:', window.location.href);
      // REMOVED: console.log('- Mode:', import.meta.env.MODE);
      // REMOVED: console.log('- Timestamp:', new Date().toISOString());
      // REMOVED: console.log('- User Agent:', navigator.userAgent);
      
      // Check if user is authenticated
      supabase.auth.getUser().then(({ data: { user }, error }) => {
        if (error) {
          // REMOVED: console.log('❌ Auth Error:', error.message);
        } else if (user) {
          // REMOVED: console.log('✅ User authenticated:', user.email);
        } else {
          // REMOVED: console.log('⚠️ No user authenticated');
        }
      });
    }
  }
}

// Auto-initialize in development
if (process.env.NODE_ENV === 'development') {
  ConsoleDebugger.addToWindow();
  ConsoleDebugger.logCurrentState();
}