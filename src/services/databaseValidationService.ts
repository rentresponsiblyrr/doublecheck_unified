/**
 * Database validation service to ensure all operations use correct types and handle missing functions gracefully
 */

import { supabase } from '@/integrations/supabase/client';
import { IdConverter, IdConversionError } from '@/utils/idConverter';

export class DatabaseValidationService {
  /**
   * Test if an RPC function exists and is callable
   */
  static async testRpcFunction(functionName: string, args: Record<string, any> = {}): Promise<{
    exists: boolean;
    error?: string;
  }> {
    try {
      const result = await supabase.rpc(functionName as any, args);
      return { exists: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      // Check if error indicates function doesn't exist
      if (errorMessage.includes('function') && errorMessage.includes('does not exist')) {
        return { exists: false, error: 'Function does not exist' };
      }
      
      // Other errors might indicate the function exists but had parameter issues
      return { exists: true, error: errorMessage };
    }
  }

  /**
   * Test if a table exists and is accessible
   */
  static async testTableAccess(tableName: string): Promise<{
    accessible: boolean;
    error?: string;
  }> {
    try {
      const { error } = await supabase
        .from(tableName)
        .select('*')
        .limit(1)
        .maybeSingle();

      if (error) {
        return { accessible: false, error: error.message };
      }

      return { accessible: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return { accessible: false, error: errorMessage };
    }
  }

  /**
   * Validate inspection creation prerequisites
   */
  static async validateInspectionCreationSetup(): Promise<{
    canCreateInspections: boolean;
    issues: string[];
    recommendations: string[];
  }> {
    const issues: string[] = [];
    const recommendations: string[] = [];

    // Test RPC function - now using create_inspection_compatibility
    const rpcTest = await this.testRpcFunction('create_inspection_compatibility', {
      p_property_id: '00000000-0000-4000-8000-000000000000', // Use UUID for property ID
      p_inspector_id: '00000000-0000-4000-8000-000000000000'
    });

    if (!rpcTest.exists) {
      issues.push('create_inspection_compatibility RPC function does not exist');
      recommendations.push('Create the RPC function in the database or rely on direct inserts');
    }

    // Test tables
    const inspectionsTest = await this.testTableAccess('inspections');
    if (!inspectionsTest.accessible) {
      issues.push(`Inspections table not accessible: ${inspectionsTest.error}`);
    }

    const checklistTest = await this.testTableAccess('checklist');
    if (!checklistTest.accessible) {
      issues.push(`Checklist table not accessible: ${checklistTest.error}`);
    }

    const auditTest = await this.testTableAccess('checklist_operations_audit');
    if (!auditTest.accessible) {
      issues.push(`Checklist operations audit table not accessible: ${auditTest.error}`);
      recommendations.push('Create checklist_operations_audit table for proper error tracking');
    }

    return {
      canCreateInspections: issues.length === 0,
      issues,
      recommendations
    };
  }

  /**
   * Safe inspection creation with fallbacks
   */
  static async createInspectionSafely(
    propertyId: string,
    inspectorId: string
  ): Promise<{
    success: boolean;
    inspectionId?: string;
    method?: 'rpc' | 'direct';
    error?: string;
  }> {
    try {
      // Use property ID as UUID string
      const propertyIdUuid = IdConverter.property.toDatabase(propertyId);

      // Try RPC function first
      try {
        const { data, error } = await supabase.rpc('create_inspection_compatibility', {
          p_property_id: propertyIdUuid,
          p_inspector_id: inspectorId
        });

        if (error) {
          throw new Error(`RPC failed: ${error.message}`);
        }

        if (!data) {
          throw new Error('RPC returned no data');
        }

        return {
          success: true,
          inspectionId: data,
          method: 'rpc'
        };

      } catch (rpcError) {
        console.log('🔧 RPC function failed, using direct insert:', rpcError);

        // Fallback to direct insert
        const { data, error } = await supabase
          .from('inspections')
          .insert({
            property_id: propertyIdUuid,
            inspector_id: inspectorId,
            start_time: new Date().toISOString(),
            completed: false,
            status: 'draft'
          })
          .select('id')
          .single();

        if (error) {
          throw new Error(`Direct insert failed: ${error.message}`);
        }

        if (!data?.id) {
          throw new Error('Direct insert returned no ID');
        }

        return {
          success: true,
          inspectionId: data.id,
          method: 'direct'
        };
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * Validate database schema expectations vs reality
   */
  static async validateDatabaseSchema(): Promise<{
    valid: boolean;
    mismatches: Array<{
      table: string;
      field: string;
      expected: string;
      actual: string;
    }>;
  }> {
    const mismatches: Array<{
      table: string;
      field: string;
      expected: string;
      actual: string;
    }> = [];

    // This was a previous assumption - database actually uses UUIDs correctly
    // mismatches.push({
    //   table: 'inspections',
    //   field: 'property_id',
    //   expected: 'string (UUID)',
    //   actual: 'integer'
    // });

    // Test for the status constraint issue we just found
    try {
      const { error } = await supabase
        .from('inspections')
        .insert({
          property_id: '00000000-0000-4000-8000-999999999999', // Use a non-existent property UUID
          inspector_id: '00000000-0000-4000-8000-000000000000',
          start_time: new Date().toISOString(),
          completed: false,
          status: 'rejected' // Test the status that was causing issues
        })
        .select('id');

      // We expect this to fail due to property_id, but not due to status constraint
      if (error && error.code === '23514') {
        mismatches.push({
          table: 'inspections',
          field: 'status',
          expected: 'includes rejected status',
          actual: 'constraint missing rejected status'
        });
      }
    } catch (error) {
      // Ignore test errors - we're just checking constraints
    }

    return {
      valid: mismatches.length === 0,
      mismatches
    };
  }

  /**
   * Health check for all database operations
   */
  static async performHealthCheck(): Promise<{
    healthy: boolean;
    checks: Array<{
      name: string;
      status: 'pass' | 'fail' | 'warning';
      message: string;
    }>;
  }> {
    const checks: Array<{
      name: string;
      status: 'pass' | 'fail' | 'warning';
      message: string;
    }> = [];

    // Test authentication
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error || !user) {
        checks.push({
          name: 'Authentication',
          status: 'fail',
          message: 'User not authenticated'
        });
      } else {
        checks.push({
          name: 'Authentication',
          status: 'pass',
          message: `Authenticated as ${user.email}`
        });
      }
    } catch (error) {
      checks.push({
        name: 'Authentication',
        status: 'fail',
        message: `Auth error: ${error}`
      });
    }

    // Test basic table access
    const tables = ['properties', 'inspections', 'checklist'];
    for (const table of tables) {
      const test = await this.testTableAccess(table);
      checks.push({
        name: `Table: ${table}`,
        status: test.accessible ? 'pass' : 'fail',
        message: test.error || 'Accessible'
      });
    }

    // Test RPC functions
    const functions = ['create_inspection_compatibility', 'get_properties_with_inspections'];
    for (const func of functions) {
      const test = await this.testRpcFunction(func);
      checks.push({
        name: `Function: ${func}`,
        status: test.exists ? 'pass' : 'warning',
        message: test.error || 'Available'
      });
    }

    const failureCount = checks.filter(c => c.status === 'fail').length;
    
    return {
      healthy: failureCount === 0,
      checks
    };
  }
}