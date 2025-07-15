/**
 * Database type overrides to fix mismatches between generated types and actual schema
 * This file provides corrected types that match the actual database structure
 */

import { Database } from '@/integrations/supabase/types';

// Override the inspections table to use correct property_id type
export interface InspectionsTableOverride {
  Row: Omit<Database['public']['Tables']['inspections']['Row'], 'property_id'> & {
    property_id: number; // Database uses INTEGER, not string
  };
  Insert: Omit<Database['public']['Tables']['inspections']['Insert'], 'property_id'> & {
    property_id: number; // Database uses INTEGER, not string
  };
  Update: Omit<Database['public']['Tables']['inspections']['Update'], 'property_id'> & {
    property_id?: number; // Database uses INTEGER, not string
  };
}

// Override the properties table to clarify ID type
export interface PropertiesTableOverride {
  Row: Omit<Database['public']['Tables']['properties']['Row'], 'id'> & {
    id: number; // Database uses INTEGER primary key
  };
  Insert: Omit<Database['public']['Tables']['properties']['Insert'], 'id'> & {
    id?: number; // Database uses INTEGER primary key
  };
  Update: Omit<Database['public']['Tables']['properties']['Update'], 'id'> & {
    id?: number; // Database uses INTEGER primary key
  };
}

// Add missing RPC functions that exist in the database
export interface DatabaseFunctionsOverride {
  create_inspection_secure: {
    Args: {
      p_property_id: number;
      p_inspector_id: string;
    };
    Returns: string; // Returns inspection UUID
  };
  create_inspection_for_current_user: {
    Args: {
      p_property_id: number;
    };
    Returns: string; // Returns inspection UUID
  };
  debug_inspection_creation: {
    Args: {
      property_id_param: string;
    };
    Returns: {
      step: string;
      status: string;
      message: string;
      details: any;
    }[];
  };
  verify_inspection_creation_fix: {
    Args: {};
    Returns: {
      component: string;
      status: string;
      count: number;
    }[];
  };
}

// Create a corrected database interface
export interface CorrectedDatabase {
  public: {
    Tables: Omit<Database['public']['Tables'], 'inspections' | 'properties'> & {
      inspections: InspectionsTableOverride;
      properties: PropertiesTableOverride;
    };
    Functions: Database['public']['Functions'] & DatabaseFunctionsOverride;
  };
}

// Helper types for common operations
export type InspectionInsert = CorrectedDatabase['public']['Tables']['inspections']['Insert'];
export type InspectionRow = CorrectedDatabase['public']['Tables']['inspections']['Row'];
export type PropertyRow = CorrectedDatabase['public']['Tables']['properties']['Row'];

// Type guards for ID validation
export function isPropertyId(id: unknown): id is number {
  return typeof id === 'number' && !isNaN(id) && id > 0;
}

export function isInspectionId(id: unknown): id is string {
  return typeof id === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);
}

export function isUserId(id: unknown): id is string {
  return typeof id === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);
}