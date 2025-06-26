
import { supabase } from "@/integrations/supabase/client";
import { debugLogger } from "@/utils/debugLogger";

export const useDebugDatabaseTester = (inspectionId: string) => {
  const runDatabaseTests = async () => {
    try {
      debugLogger.info('DebugDatabaseTester', 'Running database tests');
      
      // Test data access
      const { data: accessTest, error: accessError } = await supabase.rpc('debug_data_access');
      
      // Get recent debug logs
      const recentLogs = debugLogger.getRecentLogs(20);
      
      // Test specific inspection query
      const { data: inspectionTest, error: inspectionError } = await supabase
        .from('inspections')
        .select('*')
        .eq('id', inspectionId)
        .single();

      const debugInfo = {
        timestamp: new Date().toISOString(),
        accessTest: accessError ? { error: accessError } : accessTest,
        inspectionTest: inspectionError ? { error: inspectionError } : inspectionTest,
        recentLogs: recentLogs.slice(-10),
        auth: {
          user: (await supabase.auth.getUser()).data.user?.id,
          session: !!(await supabase.auth.getSession()).data.session
        }
      };

      debugLogger.info('DebugDatabaseTester', 'Database tests completed', {
        accessTestSuccess: !accessError,
        inspectionTestSuccess: !inspectionError
      });

      return debugInfo;
    } catch (error) {
      debugLogger.error('DebugDatabaseTester', 'Database tests failed', error);
      return {
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  };

  return { runDatabaseTests };
};
