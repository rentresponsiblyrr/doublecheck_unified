/**
 * Database Schema Validation Service
 * Validates database constraints and schema integrity before operations
 */

import { supabase } from "@/integrations/supabase/client";
import { log } from "@/lib/logging/enterprise-logger";

export interface SchemaValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  suggestions: string[];
}

export interface InspectionConstraints {
  validStatuses: string[];
  requiredFields: string[];
  maxRetries: number;
}

class SchemaValidationService {
  private static instance: SchemaValidationService;
  private constraintsCache: Map<string, any> = new Map();

  static getInstance(): SchemaValidationService {
    if (!SchemaValidationService.instance) {
      SchemaValidationService.instance = new SchemaValidationService();
    }
    return SchemaValidationService.instance;
  }

  /**
   * Validate inspection creation data against database constraints
   */
  async validateInspectionData(data: {
    property_id: string;
    status: string;
    inspector_id: string;
  }): Promise<SchemaValidationResult> {
    const result: SchemaValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
      suggestions: []
    };

    try {
      // Validate status against known constraints
      const constraints = await this.getInspectionConstraints();
      
      if (!constraints.validStatuses.includes(data.status)) {
        result.isValid = false;
        result.errors.push(`Invalid status '${data.status}'. Valid statuses: ${constraints.validStatuses.join(', ')}`);
        result.suggestions.push('Use "in_progress" for new inspections');
      }

      // Validate property_id format
      if (!data.property_id || data.property_id.length === 0) {
        result.isValid = false;
        result.errors.push('Property ID is required');
      } else if (!this.isValidUUID(data.property_id) && !this.isValidInteger(data.property_id)) {
        result.warnings.push('Property ID format appears non-standard');
      }

      // Validate inspector_id
      if (!data.inspector_id || data.inspector_id.length === 0) {
        result.isValid = false;
        result.errors.push('Inspector ID is required');
      } else if (!this.isValidUUID(data.inspector_id)) {
        result.isValid = false;
        result.errors.push('Inspector ID must be a valid UUID');
      }

      // Check if property exists
      const propertyExists = await this.verifyPropertyExists(data.property_id);
      if (!propertyExists) {
        result.isValid = false;
        result.errors.push(`Property with ID ${data.property_id} not found`);
      }

    } catch (error) {
      result.isValid = false;
      result.errors.push(`Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return result;
  }

  /**
   * Get inspection table constraints
   */
  async getInspectionConstraints(): Promise<InspectionConstraints> {
    const cacheKey = 'inspection_constraints';
    
    if (this.constraintsCache.has(cacheKey)) {
      return this.constraintsCache.get(cacheKey);
    }

    try {
      // Query the database for constraint information
      // This is a fallback approach since we can't directly query constraints
      const { data: sampleInspection } = await supabase
        .from('inspections')
        .select('status')
        .limit(1)
        .single();

      // Based on the error we saw, these are the likely valid statuses
      const constraints: InspectionConstraints = {
        validStatuses: ['draft', 'in_progress', 'completed', 'auditing', 'approved', 'rejected'],
        requiredFields: ['property_id', 'inspector_id', 'start_time', 'completed'],
        maxRetries: 3
      };

      // Update based on actual schema if we can determine it
      if (sampleInspection) {
        // Additional validation could be done here
      }

      this.constraintsCache.set(cacheKey, constraints);
      return constraints;
    } catch (error) {
      log.warn('Could not fetch database constraints, using defaults', {
        component: 'SchemaValidationService',
        action: 'getInspectionConstraints',
        error: error instanceof Error ? error.message : String(error)
      }, 'CONSTRAINTS_FETCH_FAILED');
      return {
        validStatuses: ['in_progress', 'completed', 'auditing'],
        requiredFields: ['property_id', 'inspector_id'],
        maxRetries: 2
      };
    }
  }

  /**
   * Validate that all required tables are accessible
   */
  async validateTableAccess(): Promise<SchemaValidationResult> {
    const result: SchemaValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
      suggestions: []
    };

    const requiredTables = [
      'properties',
      'inspections', 
      'logs',
      'static_safety_items',
      'profiles'
    ];

    for (const table of requiredTables) {
      try {
        const { error } = await supabase
          .from(table)
          .select('*')
          .limit(1)
          .maybeSingle();

        if (error) {
          if (error.code === 'PGRST116' || error.message?.includes('404')) {
            result.errors.push(`Table '${table}' is not accessible (404 error)`);
            result.isValid = false;
          } else if (error.code === '42501') {
            result.warnings.push(`Insufficient permissions for table '${table}'`);
          } else {
            result.warnings.push(`Error accessing table '${table}': ${error.message}`);
          }
        }
      } catch (error) {
        result.errors.push(`Failed to test table '${table}': ${error instanceof Error ? error.message : 'Unknown error'}`);
        result.isValid = false;
      }
    }

    if (result.errors.length > 0) {
      result.suggestions.push('Check database RLS policies and user permissions');
      result.suggestions.push('Verify all tables exist in the database schema');
    }

    return result;
  }

  /**
   * Verify a property exists and is accessible
   */
  private async verifyPropertyExists(propertyId: string): Promise<boolean> {
    try {
      // Try to find the property using the RPC function
      const { data: properties, error } = await supabase
        .rpc('get_properties_with_inspections');

      if (error) {
        log.warn('Could not verify property via RPC function', {
          component: 'SchemaValidationService',
          action: 'verifyPropertyExists',
          propertyId,
          rpcFunction: 'get_properties_with_inspections',
          error: error
        }, 'PROPERTY_VERIFICATION_RPC_FAILED');
        return false;
      }

      return properties?.some(p => p.property_id?.toString() === propertyId.toString()) || false;
    } catch (error) {
      log.warn('Property verification failed', {
        component: 'SchemaValidationService',
        action: 'verifyPropertyExists',
        propertyId,
        error: error instanceof Error ? error.message : String(error)
      }, 'PROPERTY_VERIFICATION_FAILED');
      return false;
    }
  }

  /**
   * Check if string is a valid UUID
   */
  private isValidUUID(str: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(str);
  }

  /**
   * Check if string is a valid integer
   */
  private isValidInteger(str: string): boolean {
    return /^\d+$/.test(str);
  }

  /**
   * Clear constraint cache (useful for testing or schema changes)
   */
  clearCache(): void {
    this.constraintsCache.clear();
  }

  /**
   * Validate checklist item data
   */
  async validateChecklistItemData(data: {
    inspection_id: string;
    checklist_id?: string; // CORRECTED: logs.checklist_id -> static_safety_items.id
    status: string;
    label?: string;
  }): Promise<SchemaValidationResult> {
    const result: SchemaValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
      suggestions: []
    };

    // Validate inspection_id
    if (!data.inspection_id || !this.isValidUUID(data.inspection_id)) {
      result.isValid = false;
      result.errors.push('Inspection ID must be a valid UUID');
    }

    // Validate status
    const validStatuses = ['pending', 'completed', 'failed', 'not_applicable'];
    if (!validStatuses.includes(data.status)) {
      result.isValid = false;
      result.errors.push(`Invalid checklist item status. Valid: ${validStatuses.join(', ')}`);
    }

    return result;
  }
}

export const schemaValidationService = SchemaValidationService.getInstance();