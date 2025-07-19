/**
 * Database type corrections and missing RPC function definitions
 * This file adds missing RPC functions and utility types for the database
 * Note: Generated types from Supabase are correct - properties use UUIDs, not integers
 */

import { Database } from '@/integrations/supabase/types';

// Add missing RPC functions that exist in the database
export interface DatabaseFunctionsOverride {
  create_inspection_compatibility: {
    Args: {
      p_property_id: string; // UUID property ID (corrected from previous integer assumption)
      p_inspector_id: string; // UUID inspector ID
    };
    Returns: string; // Returns inspection UUID
  };
  create_inspection_for_current_user: {
    Args: {
      p_property_id: string; // UUID property ID (corrected from previous integer assumption)
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

// Create enhanced database interface with additional RPC functions
export interface EnhancedDatabase {
  public: {
    Tables: Database['public']['Tables']; // Use generated types - they are correct
    Functions: Database['public']['Functions'] & DatabaseFunctionsOverride;
  };
}

// Helper types for common operations (using correct UUID types)
export type InspectionInsert = Database['public']['Tables']['inspections']['Insert'];
export type InspectionRow = Database['public']['Tables']['inspections']['Row'];
export type PropertyRow = Database['public']['Tables']['properties']['Row'];
export type InspectionChecklistItemRow = Database['public']['Tables']['logs']['Row'];
export type InspectionChecklistItemInsert = Database['public']['Tables']['logs']['Insert'];
export type StaticSafetyItemRow = Database['public']['Tables']['static_safety_items']['Row'];

// Type guards for ID validation (corrected to match actual database schema)
export function isPropertyId(id: unknown): id is string {
  return typeof id === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);
}

export function isInspectionId(id: unknown): id is string {
  return typeof id === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);
}

export function isUserId(id: unknown): id is string {
  return typeof id === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);
}